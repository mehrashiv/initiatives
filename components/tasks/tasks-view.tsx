"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronDown, Kanban, GanttChart as GanttChartIcon, Plus } from "lucide-react";
import posthog from "posthog-js";
import { PageContainer } from "@/components/shared/page-container";
import { EmptyState } from "@/components/shared/empty-state";
import { Toast } from "@/components/shared/toast";
import { NewTaskModal, type NewTaskFormValues, type ProjectOption } from "@/components/shared/new-task-modal";
import { updateTaskStatus, createTask } from "@/actions/tasks";
import { insforge } from "@/lib/insforge-client";
import { useViewAs } from "@/components/layout/view-as-context";
import { KanbanBoard } from "./kanban-board";
import { GanttChart } from "./gantt-chart";
import { boardTaskFromRow, type ProfileOption, type TaskChangedPayload } from "./task-helpers";
import type { BoardTask } from "./types";
import type { TaskStatus } from "@/types";

type TaskView = "kanban" | "gantt";

const TABS: { key: TaskView; label: string; icon: typeof Kanban }[] = [
  { key: "kanban", label: "Kanban", icon: Kanban },
  { key: "gantt", label: "Gantt", icon: GanttChartIcon },
];

interface TasksViewProps {
  initialTasks: BoardTask[];
  projectOptions: ProjectOption[];
  activeProjectOptions: ProjectOption[];
  profiles: ProfileOption[];
  currentUserId: string;
  currentUserName: string;
}

export function TasksView({
  initialTasks,
  projectOptions,
  activeProjectOptions,
  profiles,
  currentUserId,
  currentUserName,
}: TasksViewProps) {
  const [tasks, setTasks] = useState<BoardTask[]>(initialTasks);
  const [view, setView] = useState<TaskView>("kanban");
  const [projectFilter, setProjectFilter] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [toast, setToast] = useState<{ message: string; tone: "success" | "error" } | null>(null);
  const { viewAsRole } = useViewAs();

  const today = useMemo(() => new Date(), []);

  const scopedTasks = useMemo(
    () => (viewAsRole === "admin" ? tasks : tasks.filter((t) => t.ownerId === currentUserId)),
    [tasks, viewAsRole, currentUserId],
  );

  const filteredTasks = useMemo(
    () => (projectFilter ? scopedTasks.filter((t) => t.projectId === projectFilter) : scopedTasks),
    [scopedTasks, projectFilter],
  );

  const projectOptionById = useMemo(() => new Map(projectOptions.map((p) => [p.id, p])), [projectOptions]);
  const profileNameById = useMemo(() => new Map(profiles.map((p) => [p.id, p.name])), [profiles]);

  useEffect(() => {
    let retried = false;

    function handleTaskChanged(payload: TaskChangedPayload) {
      const boardTask = boardTaskFromRow(payload, projectOptionById, profileNameById);
      if (!boardTask) return;
      setTasks((prev) =>
        prev.some((t) => t.id === boardTask.id)
          ? prev.map((t) => (t.id === boardTask.id ? boardTask : t))
          : [boardTask, ...prev],
      );
    }

    function handleRealtimeError(error: { channel?: string; code: string; message: string }) {
      console.error("Kanban realtime error", error);
    }

    async function subscribe() {
      try {
        await insforge.realtime.connect();
        const response = await insforge.realtime.subscribe("tasks");
        if (!response.ok) throw new Error(response.error.message);
      } catch (err) {
        console.error("Kanban realtime subscribe failed", err);
        if (!retried) {
          retried = true;
          subscribe();
        }
      }
    }

    insforge.realtime.on<TaskChangedPayload>("task_changed", handleTaskChanged);
    insforge.realtime.on("error", handleRealtimeError);
    subscribe();

    return () => {
      insforge.realtime.off<TaskChangedPayload>("task_changed", handleTaskChanged);
      insforge.realtime.off("error", handleRealtimeError);
      insforge.realtime.unsubscribe("tasks");
      insforge.realtime.disconnect();
    };
  }, [projectOptionById, profileNameById]);

  const showToast = (message: string, tone: "success" | "error" = "success") => {
    setToast({ message, tone });
    setTimeout(() => setToast(null), tone === "error" ? 4500 : 2600);
  };

  const handleDropTask = (taskId: string, status: TaskStatus) => {
    const current = tasks.find((t) => t.id === taskId);
    if (!current || current.status === status) return;
    const fromStatus = current.status;

    setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, status } : t)));

    const revert = () => setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, status: fromStatus } : t)));

    updateTaskStatus({ taskId, fromStatus, toStatus: status })
      .then((result) => {
        if (!result.ok) {
          revert();
          showToast(result.error, "error");
        }
      })
      .catch(() => {
        revert();
        showToast("Failed to update task status.", "error");
      });
  };

  const handleCreateTask = (values: NewTaskFormValues) => {
    const project = activeProjectOptions.find((p) => p.id === values.projectId);
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
        const ownerName = profiles.find((p) => p.id === values.ownerId)?.name ?? currentUserName;
        const newTask: BoardTask = {
          id: result.taskId,
          name: values.name.trim(),
          status: values.status,
          projectId: project.id,
          projectName: project.name,
          initiativeName: project.initiativeName,
          ownerId: values.ownerId,
          ownerName,
          startDate: new Date(`${values.startDate}T00:00:00`),
          endDate: new Date(`${values.endDate}T00:00:00`),
          deliveryDate: null,
          progress: 0,
          followUp: false,
          blockedReason: null,
        };
        // Guards against the Kanban realtime echo for this same INSERT landing
        // before this .then() does — same idempotent-merge precedent as
        // handleTaskChanged below, just applied to the locally-initiated insert too.
        setTasks((prev) => (prev.some((t) => t.id === newTask.id) ? prev : [newTask, ...prev]));
        setModalOpen(false);
        showToast("Task created");
      })
      .catch(() => {
        showToast("Failed to create task.", "error");
      });
  };

  return (
    <PageContainer>
      <div className="mb-5.5 flex flex-wrap items-end justify-between gap-5">
        <div>
          <h1 className="mb-1.25 text-2xl font-semi tracking-tight text-text-primary">Tasks</h1>
          <p className="text-base text-text-secondary">
            {scopedTasks.length} {scopedTasks.length === 1 ? "task" : "tasks"} across your projects
          </p>
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

      <div className="mb-5 flex flex-wrap items-center gap-3.5">
        <div className="flex items-center gap-2.25">
          <span className="text-xs font-semi text-text-faint">Project</span>
          <div className="relative">
            <select
              value={projectFilter}
              onChange={(e) => setProjectFilter(e.target.value)}
              className="min-w-50 cursor-pointer appearance-none rounded-pill border border-border bg-surface px-3.5 py-2.25 pr-9 text-[13.5px] font-semi text-text-primary"
            >
              <option value="">All projects</option>
              {projectOptions.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
            <ChevronDown
              size={16}
              className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-text-faint"
            />
          </div>
        </div>

        <div className="ml-auto inline-flex gap-[3px] rounded-pill bg-surface-inset p-[3px]">
          {TABS.map((tab) => {
            const active = view === tab.key;
            const Icon = tab.icon;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setView(tab.key)}
                className={`inline-flex items-center gap-[7px] rounded-pill px-[15px] py-[7px] text-[13px] font-semi ${
                  active ? "bg-surface text-accent shadow-xs" : "bg-transparent text-text-secondary"
                }`}
              >
                <Icon size={15} />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {filteredTasks.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border bg-surface py-14 text-center">
          <EmptyState title="No tasks here" description="No tasks for this project filter yet." />
        </div>
      ) : view === "kanban" ? (
        <KanbanBoard tasks={filteredTasks} today={today} onDropTask={handleDropTask} />
      ) : (
        <GanttChart tasks={filteredTasks} today={today} />
      )}

      <NewTaskModal
        open={modalOpen}
        projectOptions={activeProjectOptions}
        ownerOptions={profiles}
        currentUserId={currentUserId}
        onClose={() => setModalOpen(false)}
        onCreate={handleCreateTask}
      />

      {toast && <Toast message={toast.message} tone={toast.tone} />}
    </PageContainer>
  );
}
