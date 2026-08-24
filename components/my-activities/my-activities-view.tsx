"use client";

import { useMemo, useState } from "react";
import { Plus } from "lucide-react";
import posthog from "posthog-js";
import { dayDiff } from "@/lib/dates";
import { EmptyState } from "@/components/shared/empty-state";
import { PageContainer } from "@/components/shared/page-container";
import { Toast } from "@/components/shared/toast";
import { useViewAs } from "@/components/layout/view-as-context";
import { markTaskDone, toggleTaskFlag, createTask } from "@/actions/tasks";
import { addNote } from "@/actions/activities";
import { ActivityFilters, type FilterKey } from "./activity-filters";
import { TaskGroup } from "./task-group";
import { CompletedTimeline } from "./completed-timeline";
import {
  NewTaskModal,
  type NewTaskFormValues,
  type ProjectOption,
  type OwnerOption,
} from "@/components/shared/new-task-modal";
import { bucketFor, endOfWeek, type Bucket } from "./task-helpers";
import type { ActivityTask } from "./types";

interface MyActivitiesViewProps {
  currentUserId: string;
  currentUserName: string;
  initialTasks: ActivityTask[];
  projectOptions: ProjectOption[];
  ownerOptions: OwnerOption[];
}

const BUCKET_ORDER: Bucket[] = ["overdue", "today", "week", "upcoming"];

const EMPTY_COPY: Record<FilterKey, { title: string; description: string }> = {
  all: { title: "You're all caught up", description: "No open tasks right now. Nice work." },
  overdue: { title: "Nothing overdue", description: "You don't have any past-due tasks." },
  today: { title: "Nothing due today", description: "Your day is clear — check what's coming this week." },
  week: { title: "Nothing due this week", description: "No tasks land between now and Sunday." },
  blocked: { title: "Nothing blocked", description: "No tasks are blocked or at risk." },
  followup: { title: "No follow-ups", description: "You haven't flagged anything to chase." },
};

export function MyActivitiesView({
  currentUserId,
  currentUserName,
  initialTasks,
  projectOptions,
  ownerOptions,
}: MyActivitiesViewProps) {
  const [tasks, setTasks] = useState<ActivityTask[]>(initialTasks);
  const [filter, setFilter] = useState<FilterKey>("all");
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [toast, setToast] = useState<{ message: string; tone: "success" | "error" } | null>(null);
  const { viewAsRole } = useViewAs();
  const showOwner = viewAsRole === "admin";

  const today = useMemo(() => new Date(), []);
  const eow = useMemo(() => endOfWeek(today), [today]);

  const scopedTasks = useMemo(
    () => (viewAsRole === "admin" ? tasks : tasks.filter((t) => t.ownerId === currentUserId)),
    [tasks, viewAsRole, currentUserId],
  );

  const openTasks = useMemo(() => scopedTasks.filter((t) => t.status !== "done"), [scopedTasks]);

  const searched = useMemo(() => {
    if (!search.trim()) return openTasks;
    const q = search.toLowerCase();
    return openTasks.filter(
      (t) =>
        t.name.toLowerCase().includes(q) ||
        t.initiativeName.toLowerCase().includes(q) ||
        t.projectName.toLowerCase().includes(q) ||
        t.ownerName.toLowerCase().includes(q),
    );
  }, [openTasks, search]);

  const counts = useMemo<Record<FilterKey, number>>(
    () => ({
      all: searched.length,
      overdue: searched.filter((t) => bucketFor(t, today, eow) === "overdue").length,
      today: searched.filter((t) => bucketFor(t, today, eow) === "today").length,
      week: searched.filter((t) => bucketFor(t, today, eow) === "week").length,
      blocked: searched.filter((t) => t.status === "blocked" || t.status === "delayed").length,
      followup: searched.filter((t) => t.followUp).length,
    }),
    [searched, today, eow],
  );

  const filtered = useMemo(() => {
    switch (filter) {
      case "overdue":
        return searched.filter((t) => bucketFor(t, today, eow) === "overdue");
      case "today":
        return searched.filter((t) => bucketFor(t, today, eow) === "today");
      case "week":
        return searched.filter((t) => bucketFor(t, today, eow) === "week");
      case "blocked":
        return searched.filter((t) => t.status === "blocked" || t.status === "delayed");
      case "followup":
        return searched.filter((t) => t.followUp);
      default:
        return searched;
    }
  }, [searched, filter, today, eow]);

  const groups = useMemo(() => {
    return BUCKET_ORDER.map((bucket) => ({
      bucket,
      tasks: filtered
        .filter((t) => bucketFor(t, today, eow) === bucket)
        .sort((a, b) => dayDiff(a.endDate, b.endDate) || a.progress - b.progress),
    })).filter((g) => g.tasks.length > 0);
  }, [filtered, today, eow]);

  const completedThisWeek = useMemo(
    () =>
      scopedTasks
        .filter((t) => t.status === "done" && t.completedDate && dayDiff(today, t.completedDate) <= 8)
        .sort((a, b) => (b.completedDate?.getTime() ?? 0) - (a.completedDate?.getTime() ?? 0)),
    [scopedTasks, today],
  );

  const overdueCount = counts.overdue;
  const dueSoonCount = counts.today + counts.week;
  const subtitle =
    overdueCount > 0
      ? `You have ${overdueCount} overdue ${overdueCount === 1 ? "task" : "tasks"} and ${dueSoonCount} due this week.`
      : dueSoonCount > 0
        ? `Nothing overdue — ${dueSoonCount} ${dueSoonCount === 1 ? "task" : "tasks"} due this week.`
        : "Nothing overdue and nothing due this week. All clear.";

  const showToast = (message: string, tone: "success" | "error" = "success") => {
    setToast({ message, tone });
    setTimeout(() => setToast(null), tone === "error" ? 4500 : 2600);
  };

  const handleMarkDone = (id: string) => {
    const previous = tasks.find((t) => t.id === id);
    if (!previous) return;

    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, status: "done", progress: 100, completedDate: today, updatedAt: today } : t)),
    );

    const revert = () => setTasks((prev) => prev.map((t) => (t.id === id ? previous : t)));

    markTaskDone({ taskId: id })
      .then((result) => {
        if (!result.ok) {
          revert();
          showToast(result.error, "error");
        }
      })
      .catch(() => {
        revert();
        showToast("Failed to mark task done.", "error");
      });
  };

  const handleToggleFollowUp = (id: string) => {
    const current = tasks.find((t) => t.id === id);
    if (!current) return;
    const nextFlagged = !current.followUp;

    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, followUp: nextFlagged } : t)));

    const revert = () => setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, followUp: !nextFlagged } : t)));

    toggleTaskFlag({ taskId: id, flagged: nextFlagged })
      .then((result) => {
        if (!result.ok) {
          revert();
          showToast(result.error, "error");
        }
      })
      .catch(() => {
        revert();
        showToast("Failed to update follow-up flag.", "error");
      });
  };

  const handleAddNote = (id: string, text: string): Promise<boolean> =>
    addNote({ taskId: id, text, attachments: [] })
      .then((result) => {
        if (!result.ok) {
          showToast(result.error, "error");
          return false;
        }
        showToast("Note added");
        return true;
      })
      .catch(() => {
        showToast("Failed to add note.", "error");
        return false;
      });

  const handleCreateTask = (values: NewTaskFormValues) => {
    const project = projectOptions.find((p) => p.id === values.projectId);
    if (!project) return;

    createTask({
      name: values.name,
      description: values.description,
      projectId: values.projectId,
      ownerId: values.ownerId,
      startDate: values.startDate,
      endDate: values.endDate,
      status: values.status,
    })
      .then((result) => {
        if (!result.ok) {
          showToast(result.error, "error");
          return;
        }
        const ownerName = ownerOptions.find((o) => o.id === values.ownerId)?.name ?? currentUserName;
        const newTask: ActivityTask = {
          id: result.taskId,
          name: values.name.trim(),
          status: values.status,
          initiativeName: project.initiativeName,
          projectName: project.name,
          ownerId: values.ownerId,
          ownerName,
          endDate: new Date(`${values.endDate}T00:00:00`),
          completedDate: null,
          updatedAt: new Date(result.createdAt),
          progress: 0,
          followUp: false,
          blockedReason: null,
          newNoteCount: 0,
        };
        setTasks((prev) => [newTask, ...prev]);
        setModalOpen(false);
        showToast("Task created");
      })
      .catch(() => {
        showToast("Failed to create task.", "error");
      });
  };

  const emptyCopy = EMPTY_COPY[filter];

  return (
    <PageContainer>
      <div className="mb-5.5 flex flex-wrap items-end justify-between gap-5">
        <div>
          <div className="mb-1.5 text-[13px] font-semi text-accent">My Activities</div>
          <h1 className="mb-1.5 text-2xl font-semi tracking-tight text-text-primary">Hello, {currentUserName.split(" ")[0]}</h1>
          <p className="text-base text-text-secondary">{subtitle}</p>
        </div>
        <button
          type="button"
          onClick={() => {
            posthog.capture("new_task_modal_opened");
            setModalOpen(true);
          }}
          className="inline-flex items-center gap-2.25 rounded-pill px-[20px] py-3 text-sm font-bold text-white shadow-cta-glow [background:var(--gradient-cta)]"
        >
          <Plus size={18} />
          New task
        </button>
      </div>

      <ActivityFilters
        activeKey={filter}
        counts={counts}
        search={search}
        onSelect={setFilter}
        onSearchChange={setSearch}
      />

      <section className="overflow-hidden rounded-lg border border-border bg-surface shadow-xs">
        {groups.length === 0 ? (
          <EmptyState title={emptyCopy.title} description={emptyCopy.description} />
        ) : (
          groups.map((group) => (
            <TaskGroup
              key={group.bucket}
              bucket={group.bucket}
              tasks={group.tasks}
              today={today}
              showOwner={showOwner}
              onMarkDone={handleMarkDone}
              onToggleFollowUp={handleToggleFollowUp}
              onAddNote={handleAddNote}
            />
          ))
        )}
      </section>

      <CompletedTimeline tasks={completedThisWeek} showOwner={showOwner} />

      <NewTaskModal
        open={modalOpen}
        projectOptions={projectOptions}
        ownerOptions={ownerOptions}
        currentUserId={currentUserId}
        onClose={() => setModalOpen(false)}
        onCreate={handleCreateTask}
      />

      {toast && <Toast message={toast.message} tone={toast.tone} />}
    </PageContainer>
  );
}
