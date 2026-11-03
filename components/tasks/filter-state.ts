import type { TaskStatus } from "@/types";
import { STATUS_COLUMNS, type BoardTask } from "./types";

// Tasks page view + filters. Lives in the /tasks URL query and in a per-user
// localStorage key (spec 0001). React state in TasksView is the source of truth
// after mount; the URL and storage are only ever written from it.

export type TaskView = "kanban" | "gantt";

export type TasksPageState = {
  view: TaskView;
  initiative: string; // "" = all
  projects: string[]; // [] = all
  owners: string[]; // [] = all
  statuses: TaskStatus[]; // [] = all
};

export const DEFAULT_TASKS_STATE: TasksPageState = {
  view: "kanban",
  initiative: "",
  projects: [],
  owners: [],
  statuses: [],
};

export interface ValidFilterIds {
  projectIds: Iterable<string>;
  initiativeIds: Iterable<string>;
  ownerIds: Iterable<string>;
  // project id → initiative id, for pruning projects outside the chosen initiative.
  projectInitiativeIds: Record<string, string>;
}

type QueryParams = URLSearchParams | Record<string, string | string[] | undefined>;

const QUERY_KEYS = ["view", "initiative", "projects", "owners", "status"] as const;
const VIEWS: readonly TaskView[] = ["kanban", "gantt"];
const STATUSES = new Set<string>(STATUS_COLUMNS.map((c) => c.status));
const STORAGE_VERSION = 1;

function getParam(params: QueryParams, key: string): string | undefined {
  if (params instanceof URLSearchParams) return params.get(key) ?? undefined;
  const value = params[key];
  return Array.isArray(value) ? value[0] : value;
}

const splitList = (value: string | undefined) => (value ? value.split(",").filter(Boolean) : []);

/** Reads the five query keys as raw, unchecked values. `hasQuery` is true when any key is present. */
export function parseTasksQuery(params: QueryParams): { raw: Record<string, unknown>; hasQuery: boolean } {
  const hasQuery = QUERY_KEYS.some((key) => getParam(params, key) !== undefined);
  return {
    hasQuery,
    raw: {
      view: getParam(params, "view"),
      initiative: getParam(params, "initiative"),
      projects: splitList(getParam(params, "projects")),
      owners: splitList(getParam(params, "owners")),
      statuses: splitList(getParam(params, "status")),
    },
  };
}

function keepValid(value: unknown, valid: Set<string>): string[] {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.filter((v): v is string => typeof v === "string" && valid.has(v)))];
}

/** Drops anything unknown: bad view, unknown ids or statuses, and projects outside the chosen initiative. */
export function sanitizeState(raw: unknown, valid: ValidFilterIds): TasksPageState {
  if (!raw || typeof raw !== "object") return DEFAULT_TASKS_STATE;
  const r = raw as Record<string, unknown>;
  const initiativeIds = new Set(valid.initiativeIds);

  const view = VIEWS.includes(r.view as TaskView) ? (r.view as TaskView) : "kanban";
  const initiative = typeof r.initiative === "string" && initiativeIds.has(r.initiative) ? r.initiative : "";
  let projects = keepValid(r.projects, new Set(valid.projectIds));
  if (initiative) projects = projects.filter((id) => valid.projectInitiativeIds[id] === initiative);

  return {
    view,
    initiative,
    projects,
    owners: keepValid(r.owners, new Set(valid.ownerIds)),
    statuses: keepValid(r.statuses, STATUSES) as TaskStatus[],
  };
}

/** `""` for the default state, else `"?view=…&initiative=…&projects=…&owners=…&status=…"` with defaults left out. */
export function serializeState(state: TasksPageState): string {
  const list = (ids: string[]) => ids.map(encodeURIComponent).join(",");
  const parts: string[] = [];
  if (state.view !== "kanban") parts.push(`view=${state.view}`);
  if (state.initiative) parts.push(`initiative=${encodeURIComponent(state.initiative)}`);
  if (state.projects.length) parts.push(`projects=${list(state.projects)}`);
  if (state.owners.length) parts.push(`owners=${list(state.owners)}`);
  if (state.statuses.length) parts.push(`status=${list(state.statuses)}`);
  return parts.length ? `?${parts.join("&")}` : "";
}

export function hasAnyFilter(state: TasksPageState): boolean {
  return !!state.initiative || state.projects.length > 0 || state.owners.length > 0 || state.statuses.length > 0;
}

/** The one visibility rule. Filters combine with AND; values inside one filter combine with OR; empty means "all". */
export function matchesFilters(
  task: Pick<BoardTask, "projectId" | "ownerId" | "status">,
  state: TasksPageState,
  projectInitiativeIds: Record<string, string>,
): boolean {
  return (
    (!state.initiative || projectInitiativeIds[task.projectId] === state.initiative) &&
    (state.projects.length === 0 || state.projects.includes(task.projectId)) &&
    (state.owners.length === 0 || state.owners.includes(task.ownerId)) &&
    (state.statuses.length === 0 || state.statuses.includes(task.status))
  );
}

export const storageKey = (userId: string) => `tasks-page-state:${userId}`;

/** The saved raw state for this user, or null when nothing usable is saved or storage is unavailable. */
export function readSavedState(userId: string): Record<string, unknown> | null {
  try {
    const stored = window.localStorage.getItem(storageKey(userId));
    if (!stored) return null;
    const parsed: unknown = JSON.parse(stored);
    if (!parsed || typeof parsed !== "object") return null;
    const record = parsed as Record<string, unknown>;
    return record.v === STORAGE_VERSION ? record : null;
  } catch {
    return null;
  }
}

export function writeSavedState(userId: string, state: TasksPageState): void {
  try {
    window.localStorage.setItem(storageKey(userId), JSON.stringify({ v: STORAGE_VERSION, ...state }));
  } catch {
    // Private window, blocked storage or a full quota: the URL still carries the state.
  }
}
