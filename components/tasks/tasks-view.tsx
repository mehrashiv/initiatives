"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Kanban, GanttChart as GanttChartIcon, Plus } from "lucide-react";
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
import { FilterMultiSelect, FilterSelect, type FilterPickerOption } from "./filter-pickers";
import {
  DEFAULT_TASKS_STATE,
  hasAnyFilter,
  matchesFilters,
  readSavedState,
  sanitizeState,
  serializeState,
  writeSavedState,
  type TaskView,
  type TasksPageState,
} from "./filter-state";
import { STATUS_ACCENT, STATUS_COLUMNS, type BoardTask } from "./types";
import { getInitials } from "@/lib/dates";
import type { TaskStatus } from "@/types";

const TABS: { key: TaskView; label: string; icon: typeof Kanban }[] = [
  { key: "kanban", label: "Kanban", icon: Kanban },
  { key: "gantt", label: "Gantt", icon: GanttChartIcon },
];

interface TasksViewProps {
  initialTasks: BoardTask[];
  projectOptions: ProjectOption[];
  activeProjectOptions: ProjectOption[];
  initiativeOptions: { id: string; name: string }[];
  // project id → initiative id, so the Projects filter can be pruned to the chosen initiative.
  projectInitiativeIds: Record<string, string>;
  profiles: ProfileOption[];
  currentUserId: string;
  currentUserName: string;
  // View and filters parsed from the URL and sanitized on the server.
  initialState: TasksPageState;
  // False on a bare /tasks: hold the filter row and board until saved state is restored.
  hasQuery: boolean;
}

type ToastState = {
  message: string;
  tone: "success" | "error";
  action?: { label: string; onClick: () => void };
};

export function TasksView({
  initialTasks,
  projectOptions,
  activeProjectOptions,
  initiativeOptions,
  projectInitiativeIds,
  profiles,
  currentUserId,
  currentUserName,
  initialState,
  hasQuery,
}: TasksViewProps) {
  const [tasks, setTasks] = useState<BoardTask[]>(initialTasks);
  const [filters, setFilters] = useState<TasksPageState>(initialState);
  const [restored, setRestored] = useState(hasQuery);
  const [modalOpen, setModalOpen] = useState(false);
  const [toast, setToast] = useState<ToastState | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Latest filters for async handlers, so a create that resolves after a filter change checks the current filters.
  const filtersRef = useRef(filters);
  const { viewAsRole } = useViewAs();
  // Only a change signal: a navbar click to bare /tasks while mounted gets the current state written back.
  const searchParamsKey = useSearchParams().toString();
  const { view, initiative: initiativeFilter, projects: projectFilter, owners: ownerFilter, statuses: statusFilter } =
    filters;

  const today = useMemo(() => new Date(), []);

  const scopedTasks = useMemo(
    () => (viewAsRole === "admin" ? tasks : tasks.filter((t) => t.ownerId === currentUserId)),
    [tasks, viewAsRole, currentUserId],
  );

  const filteredTasks = useMemo(
    () => scopedTasks.filter((t) => matchesFilters(t, filters, projectInitiativeIds)),
    [scopedTasks, filters, projectInitiativeIds],
  );

  // Bare /tasks: restore this user's saved state, checked against the current option lists.
  useEffect(() => {
    if (restored) return;
    const saved = readSavedState(currentUserId);
    // localStorage is unreadable during the server render, so this one restore runs after hydration (spec 0001).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setFilters(
      saved
        ? sanitizeState(saved, {
            projectIds: projectOptions.map((p) => p.id),
            initiativeIds: initiativeOptions.map((it) => it.id),
            ownerIds: profiles.map((p) => p.id),
            projectInitiativeIds,
          })
        : DEFAULT_TASKS_STATE,
    );
    setRestored(true);
  }, [restored, currentUserId, projectOptions, initiativeOptions, profiles, projectInitiativeIds]);

  // Mirror state to the URL and saved state. replaceState, not router.replace, so the
  // dynamic page doesn't refetch every task, and no history entry is added per click.
  useEffect(() => {
    if (!restored) return;
    const search = serializeState(filters);
    if (window.location.search !== search) window.history.replaceState(null, "", `/tasks${search}`);
    writeSavedState(currentUserId, filters);
  }, [filters, restored, currentUserId, searchParamsKey]);

  const filterProjectOptions: FilterPickerOption[] = useMemo(
    () =>
      projectOptions
        .filter((p) => !initiativeFilter || projectInitiativeIds[p.id] === initiativeFilter)
        .map((p) => ({ id: p.id, label: p.name, hint: initiativeFilter ? undefined : p.initiativeName })),
    [projectOptions, initiativeFilter, projectInitiativeIds],
  );
  const filterOwnerOptions: FilterPickerOption[] = useMemo(
    () =>
      profiles.map((p) => ({
        id: p.id,
        label: p.name,
        leading: (
          <span className="flex h-5.5 w-5.5 flex-none items-center justify-center rounded-full bg-accent-lightest text-[10px] font-bold text-accent">
            {getInitials(p.name)}
          </span>
        ),
      })),
    [profiles],
  );
  const filterStatusOptions: FilterPickerOption[] = STATUS_COLUMNS.map((c) => ({
    id: c.status,
    label: c.title,
    leading: <span className={`h-2 w-2 flex-none rounded-full ${STATUS_ACCENT[c.status].dot}`} />,
  }));
  const projectCount = (n: number) => `${n} ${n === 1 ? "project" : "projects"}`;
  const filterInitiativeOptions: FilterPickerOption[] = useMemo(
    () =>
      initiativeOptions.map((it) => ({
        id: it.id,
        label: it.name,
        hint: projectCount(projectOptions.filter((p) => projectInitiativeIds[p.id] === it.id).length),
      })),
    [initiativeOptions, projectOptions, projectInitiativeIds],
  );
  const initiativeName = initiativeOptions.find((it) => it.id === initiativeFilter)?.name;
  const anyFilter = hasAnyFilter(filters);

  const handleInitiativeChange = (id: string) => {
    posthog.capture("task_filter_selected", { filter: "initiative", count: id ? 1 : 0 });
    setFilters((prev) => ({
      ...prev,
      initiative: id,
      // Drop selected projects that fall outside the newly chosen initiative.
      projects: id ? prev.projects.filter((pid) => projectInitiativeIds[pid] === id) : prev.projects,
    }));
  };
  const handleListFilterChange = (filter: "projects" | "owners" | "statuses", ids: string[]) => {
    posthog.capture("task_filter_selected", { filter: filter === "statuses" ? "status" : filter, count: ids.length });
    setFilters((prev) => ({ ...prev, [filter]: ids }));
  };
  // Resets the four filters; the Kanban/Gantt view stays.
  const clearFilters = () => {
    posthog.capture("task_filter_selected", { filter: "clear", count: 0 });
    setFilters((prev) => ({ ...DEFAULT_TASKS_STATE, view: prev.view }));
  };

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

  useEffect(() => {
    filtersRef.current = filters;
  }, [filters]);

  useEffect(
    () => () => {
      if (toastTimer.current) clearTimeout(toastTimer.current);
    },
    [],
  );

  const showToast = (message: string, tone: "success" | "error" = "success", action?: ToastState["action"]) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast({ message, tone, action });
    toastTimer.current = setTimeout(() => setToast(null), action ? 6000 : tone === "error" ? 4500 : 2600);
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
        if (matchesFilters(newTask, filtersRef.current, projectInitiativeIds)) {
          showToast("Task created");
        } else {
          showToast("Task created. Hidden by your filters.", "success", {
            label: "Clear filters",
            onClick: () => {
              clearFilters();
              setToast(null);
            },
          });
        }
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
            {!restored
              ? "\u00a0"
              : anyFilter
                ? `Showing ${filteredTasks.length} of ${scopedTasks.length} ${scopedTasks.length === 1 ? "task" : "tasks"}`
                : `${scopedTasks.length} ${scopedTasks.length === 1 ? "task" : "tasks"} across your projects`}
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

      {restored && (
        <div className="mb-5 flex flex-wrap items-center gap-2.5">
          <FilterSelect
            label="Initiative"
            menuTitle="Initiative · pick one"
            allLabel="All initiatives"
            allHint={projectCount(projectOptions.length)}
            value={initiativeFilter}
            options={filterInitiativeOptions}
            onChange={handleInitiativeChange}
          />
          <FilterMultiSelect
            label="Projects"
            menuTitle={initiativeName ? `Projects in ${initiativeName}` : "Projects · pick any"}
            noun="projects"
            values={projectFilter}
            options={filterProjectOptions}
            onChange={(ids) => handleListFilterChange("projects", ids)}
          />
          <FilterMultiSelect
            label="Owners"
            menuTitle="Owners · pick any"
            noun="owners"
            values={ownerFilter}
            options={filterOwnerOptions}
            onChange={(ids) => handleListFilterChange("owners", ids)}
          />
          <FilterMultiSelect
            label="Status"
            menuTitle="Status · pick any"
            noun="statuses"
            values={statusFilter}
            options={filterStatusOptions}
            onChange={(ids) => handleListFilterChange("statuses", ids)}
          />
          {anyFilter && (
            <button type="button" onClick={clearFilters} className="px-1 py-2 text-[13.5px] font-semi text-accent">
              Clear filters
            </button>
          )}

          <div className="ml-auto inline-flex gap-[3px] max-sm:ml-0 rounded-pill bg-surface-inset p-[3px]">
            {TABS.map((tab) => {
              const active = view === tab.key;
              const Icon = tab.icon;
              return (
                <button
                  key={tab.key}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setFilters((prev) => ({ ...prev, view: tab.key }))}
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
      )}

      {!restored ? null : filteredTasks.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border bg-surface py-14 text-center">
          {anyFilter ? (
            <EmptyState
              title="No tasks match these filters"
              description="Try removing a filter or clearing them all."
              action={
                <button
                  type="button"
                  onClick={clearFilters}
                  className="rounded-pill border border-border bg-surface px-4.5 py-2.5 text-sm font-semi text-accent"
                >
                  Clear filters
                </button>
              }
            />
          ) : (
            <EmptyState title="No tasks yet" description="Create a task to get started." />
          )}
        </div>
      ) : view === "kanban" ? (
        <KanbanBoard tasks={filteredTasks} statuses={statusFilter} today={today} onDropTask={handleDropTask} />
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

      {toast && <Toast message={toast.message} tone={toast.tone} action={toast.action} />}
    </PageContainer>
  );
}
