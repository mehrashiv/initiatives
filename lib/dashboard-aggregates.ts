import { computeRollup } from "@/lib/rollups";
import type { InitiativeStatus, ProjectStatus, TaskStatus } from "@/types";
import type {
  CategoryMixItem,
  CompareRow,
  KpiData,
  KpiDelta,
  LookingAheadForward,
  OnTimePoint,
  PeriodKpiData,
  ProjectHealthData,
  RiskData,
  TeamMember,
  VelocityBar,
} from "@/components/dashboard/mock-data";
import type { DateBucket } from "@/lib/dates";
import { dayDiff, formatShortDate, getInitials, parseDateOnly, startOfDay } from "@/lib/dates";

export interface RawInitiativeRow {
  id: string;
  name: string;
  category: string | null;
  status: InitiativeStatus;
  owner: string;
  created_at: string;
}

export interface RawProjectRow {
  id: string;
  initiative_id: string;
  name: string;
  status: ProjectStatus;
  owner: string;
  created_at: string;
}

export interface RawTaskRow {
  id: string;
  project_id: string;
  name: string;
  status: TaskStatus;
  progress: number;
  end_date: string | null;
  delivery_date: string | null;
  blocker_owner: string | null;
  owner: string;
  created_at: string;
  updated_at: string;
}

export interface RawActivityRow {
  task_id: string;
  created_at: string;
}

export interface DashboardFilters {
  initiativeId: string; // "all" or a specific initiative id
  ownerId: string; // "all" or a specific profile id
  category: string | null;
}

export interface PeriodWindow {
  start: Date;
  end: Date; // exclusive
}

function makeDelta(diff: number, goodDirection: "up" | "down"): { delta: KpiDelta | null; goodDirection: "up" | "down" } {
  if (diff === 0) return { delta: null, goodDirection };
  return {
    delta: { display: diff > 0 ? `+${diff}` : `${diff}`, direction: diff > 0 ? "up" : "down" },
    goodDirection,
  };
}

function countActiveAtOrBefore(rows: { status: string; created_at: string }[], asOf: Date): number {
  return rows.filter((r) => r.status === "active" && new Date(r.created_at) <= asOf).length;
}

function countOverdueAsOf(tasks: RawTaskRow[], asOf: Date): number {
  return tasks.filter(
    (t) =>
      new Date(t.created_at) <= asOf &&
      t.end_date &&
      new Date(t.end_date) < asOf &&
      (t.status !== "done" || new Date(t.updated_at) >= asOf),
  ).length;
}

// Category/initiative-id cascade down to projects/tasks; owner is checked
// independently at each entity's own owner column, never inherited — same
// cascade rule computeRightNowKpis established (Feature 28).
export function matchDashboardScope(
  initiatives: RawInitiativeRow[],
  projects: RawProjectRow[],
  tasks: RawTaskRow[],
  filters: DashboardFilters,
) {
  const categoryMatch = (i: RawInitiativeRow) => (filters.category ? i.category === filters.category : true);
  const initiativeIdMatch = (i: RawInitiativeRow) => (filters.initiativeId !== "all" ? i.id === filters.initiativeId : true);
  const ownerMatch = (ownerId: string) => (filters.ownerId !== "all" ? ownerId === filters.ownerId : true);

  const cascadeInitiativeIds = new Set(initiatives.filter((i) => categoryMatch(i) && initiativeIdMatch(i)).map((i) => i.id));
  const cascadeProjects = projects.filter((p) => cascadeInitiativeIds.has(p.initiative_id));
  const cascadeProjectIds = new Set(cascadeProjects.map((p) => p.id));

  return {
    initiatives: initiatives.filter((i) => categoryMatch(i) && initiativeIdMatch(i) && ownerMatch(i.owner)),
    projects: cascadeProjects.filter((p) => ownerMatch(p.owner)),
    tasks: tasks.filter((t) => cascadeProjectIds.has(t.project_id) && ownerMatch(t.owner)),
  };
}

// "Last touched" per task: the later of its own updated_at and its most
// recent activity row. tasks.updated_at alone misses notes — adding a note
// doesn't touch the task row, so a project being actively discussed could
// otherwise read as stalled.
function lastActivityByTaskId(tasks: RawTaskRow[], activities: RawActivityRow[]): Map<string, Date> {
  const map = new Map<string, Date>();
  for (const t of tasks) map.set(t.id, new Date(t.updated_at));
  for (const a of activities) {
    const candidate = new Date(a.created_at);
    const existing = map.get(a.task_id);
    if (!existing || candidate > existing) map.set(a.task_id, candidate);
  }
  return map;
}

export function computeRightNowKpis(
  initiatives: RawInitiativeRow[],
  projects: RawProjectRow[],
  tasks: RawTaskRow[],
  filters: DashboardFilters,
  periodStart: Date,
  today: Date,
): KpiData[] {
  const categoryMatch = (i: RawInitiativeRow) => (filters.category ? i.category === filters.category : true);
  const initiativeIdMatch = (i: RawInitiativeRow) => (filters.initiativeId !== "all" ? i.id === filters.initiativeId : true);
  const ownerMatch = (ownerId: string) => (filters.ownerId !== "all" ? ownerId === filters.ownerId : true);

  // Category/initiative-id cascade down to projects/tasks; owner is checked
  // independently at each entity's own owner column, never inherited.
  const cascadeInitiativeIds = new Set(initiatives.filter((i) => categoryMatch(i) && initiativeIdMatch(i)).map((i) => i.id));
  const cascadeProjects = projects.filter((p) => cascadeInitiativeIds.has(p.initiative_id));
  const cascadeProjectIds = new Set(cascadeProjects.map((p) => p.id));

  const matchedInitiatives = initiatives.filter((i) => categoryMatch(i) && initiativeIdMatch(i) && ownerMatch(i.owner));
  const matchedProjects = cascadeProjects.filter((p) => ownerMatch(p.owner));
  const matchedTasks = tasks.filter((t) => cascadeProjectIds.has(t.project_id) && ownerMatch(t.owner));

  // Active initiatives
  const activeInitiativesNow = matchedInitiatives.filter((i) => i.status === "active").length;
  const activeInitiativesBaseline = countActiveAtOrBefore(matchedInitiatives, periodStart);
  const activeFilteredInitiatives = matchedInitiatives.filter((i) => i.status === "active");
  const onTrackCount = activeFilteredInitiatives.filter((i) => {
    const itsProjectIds = projects.filter((p) => p.initiative_id === i.id).map((p) => p.id);
    return computeRollup(itsProjectIds, tasks, today).atRiskCount === 0;
  }).length;
  const onTrackPct = activeFilteredInitiatives.length === 0 ? 0 : Math.round((onTrackCount / activeFilteredInitiatives.length) * 100);

  // Active projects
  const activeProjectsNow = matchedProjects.filter((p) => p.status === "active").length;
  const activeProjectsBaseline = countActiveAtOrBefore(matchedProjects, periodStart);
  const activeProjectsWithTasks = matchedProjects.filter(
    (p) => p.status === "active" && tasks.some((t) => t.project_id === p.id),
  ).length;

  // Portfolio completion % + At risk (task-level), via the existing rollup helper
  const rollup = computeRollup(Array.from(cascadeProjectIds), matchedTasks, today);

  // Overdue tasks — real bidirectional delta from static columns only (no activity-log parsing)
  const overdueNow = matchedTasks.filter((t) => t.status !== "done" && t.end_date && new Date(t.end_date) < today).length;
  const overdueBaseline = countOverdueAsOf(matchedTasks, periodStart);

  // Blocked tasks
  const blockedNow = matchedTasks.filter((t) => t.status === "blocked").length;

  const activeInitiativesDelta = makeDelta(activeInitiativesNow - activeInitiativesBaseline, "up");
  const activeProjectsDelta = makeDelta(activeProjectsNow - activeProjectsBaseline, "up");
  const overdueDelta = makeDelta(overdueNow - overdueBaseline, "down");

  return [
    {
      id: "active-initiatives",
      label: "Active initiatives",
      value: String(activeInitiativesNow),
      delta: activeInitiativesDelta.delta,
      goodDirection: activeInitiativesDelta.goodDirection,
      caption: `${onTrackPct}% on track`,
    },
    {
      id: "active-projects",
      label: "Active projects",
      value: String(activeProjectsNow),
      delta: activeProjectsDelta.delta,
      goodDirection: activeProjectsDelta.goodDirection,
      caption: `${activeProjectsWithTasks} with live tasks`,
    },
    {
      id: "portfolio-completion",
      label: "Portfolio completion",
      value: `${rollup.progressPct}%`,
      delta: null,
      goodDirection: "up",
      caption: "avg across projects",
    },
    {
      id: "at-risk",
      label: "At risk",
      value: String(rollup.atRiskCount),
      delta: null,
      goodDirection: "down",
      caption: "blocked, delayed, or overdue",
    },
    {
      id: "overdue-tasks",
      label: "Overdue tasks",
      value: String(overdueNow),
      delta: overdueDelta.delta,
      goodDirection: overdueDelta.goodDirection,
      caption: "past end date",
    },
    {
      id: "blocked-tasks",
      label: "Blocked tasks",
      value: String(blockedNow),
      delta: null,
      goodDirection: "down",
      trend: "→ 0",
      caption: "awaiting unblock",
    },
  ];
}

// ---------- Project health (On track / Delayed / Stalled / Done) ----------
// Shared bucket reused by the Project health donut and the Risk & red flags
// cards — resolves the "delayed/stalled project" definition left open by
// Feature 28 (which kept "At risk" task-level instead).

export type ProjectHealthBucket = "on_track" | "delayed" | "stalled" | "done";

export interface ProjectHealthInfo {
  projectId: string;
  projectName: string;
  initiativeName: string;
  bucket: ProjectHealthBucket;
  completionPct: number;
  daysLate: number; // 0 if no overdue task
  blockedCount: number; // tasks with status blocked/delayed
  daysStalled: number; // days since last touched (activities or updated_at)
}

export function computeProjectHealthList(
  projects: RawProjectRow[],
  tasks: RawTaskRow[],
  activities: RawActivityRow[],
  initiatives: RawInitiativeRow[],
  today: Date,
): ProjectHealthInfo[] {
  const initiativeNameById = new Map(initiatives.map((i) => [i.id, i.name]));
  const lastTouched = lastActivityByTaskId(tasks, activities);
  const result: ProjectHealthInfo[] = [];

  for (const p of projects) {
    const pTasks = tasks.filter((t) => t.project_id === p.id);
    if (pTasks.length === 0) continue;

    const allDone = pTasks.every((t) => t.status === "done");
    const overdueTasks = pTasks.filter((t) => t.status !== "done" && t.end_date && new Date(t.end_date) < today);
    const riskyTasks = pTasks.filter((t) => t.status === "blocked" || t.status === "delayed");
    const lastTouchedAt = pTasks.reduce((max, t) => {
      const d = lastTouched.get(t.id) ?? new Date(t.updated_at);
      return d > max ? d : max;
    }, new Date(0));
    const daysStalled = dayDiff(today, lastTouchedAt);

    let bucket: ProjectHealthBucket;
    if (allDone) bucket = "done";
    else if (overdueTasks.length > 0 || riskyTasks.length > 0) bucket = "delayed";
    else if (daysStalled > 30) bucket = "stalled";
    else bucket = "on_track";

    const daysLate = overdueTasks.length ? Math.max(...overdueTasks.map((t) => dayDiff(today, parseDateOnly(t.end_date!)))) : 0;

    result.push({
      projectId: p.id,
      projectName: p.name,
      initiativeName: initiativeNameById.get(p.initiative_id) ?? "—",
      bucket,
      completionPct: Math.round(pTasks.reduce((sum, t) => sum + t.progress, 0) / pTasks.length),
      daysLate,
      blockedCount: riskyTasks.length,
      daysStalled,
    });
  }

  return result;
}

const HEALTH_ORDER: ProjectHealthBucket[] = ["on_track", "delayed", "stalled", "done"];
const HEALTH_LABELS: Record<ProjectHealthBucket, string> = {
  on_track: "On track",
  delayed: "Delayed",
  stalled: "Stalled",
  done: "Done",
};
const HEALTH_COLORS: Record<ProjectHealthBucket, string> = {
  on_track: "var(--color-success-dark)",
  delayed: "var(--color-danger-cta)",
  stalled: "var(--color-warning)",
  done: "var(--color-accent)",
};

export function computeProjectHealthSummary(list: ProjectHealthInfo[]): ProjectHealthData {
  const total = list.length;
  const counts: Record<ProjectHealthBucket, number> = { on_track: 0, delayed: 0, stalled: 0, done: 0 };
  for (const p of list) counts[p.bucket] += 1;

  const segments = HEALTH_ORDER.map((key) => ({
    key,
    label: HEALTH_LABELS[key],
    count: counts[key],
    pct: total === 0 ? 0 : Math.round((counts[key] / total) * 100),
    color: HEALTH_COLORS[key],
  })).filter((s) => s.count > 0);

  return {
    activeProjectsTotal: total,
    onTrackPct: total === 0 ? 0 : Math.round(((counts.on_track + counts.done) / total) * 100),
    completionPct: total === 0 ? 0 : Math.round(list.reduce((sum, p) => sum + p.completionPct, 0) / total),
    segments,
  };
}

// ---------- Risk & red flags ----------

export function computeRiskData(healthList: ProjectHealthInfo[], tasks: RawTaskRow[], today: Date): RiskData {
  const delayed = healthList
    .filter((p) => p.bucket === "delayed")
    .sort((a, b) => b.daysLate - a.daysLate)
    .map((p) => ({
      name: p.projectName,
      sub: `${p.initiativeName} · ${p.completionPct}% complete`,
      tag: p.daysLate > 0 ? `${p.daysLate}d late` : `${p.blockedCount} blocked`,
    }));

  const stalled = healthList
    .filter((p) => p.bucket === "stalled")
    .sort((a, b) => b.daysStalled - a.daysStalled)
    .map((p) => ({ name: p.projectName, sub: p.initiativeName, tag: `${p.daysStalled}d quiet` }));

  const blockers = tasks
    .filter((t) => t.status === "blocked")
    .slice()
    .sort((a, b) => new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime())
    .map((t) => {
      const days = dayDiff(today, new Date(t.updated_at));
      return { name: t.name, sub: t.blocker_owner ? `Blocked · ${t.blocker_owner}` : "Blocked", tag: `${days}d` };
    });

  const overdueCount = tasks.filter((t) => t.status !== "done" && t.end_date && new Date(t.end_date) < today).length;

  return {
    delayedCount: delayed.length,
    delayed,
    stalled,
    blockedCount: blockers.length,
    blockers,
    overdueCount,
  };
}

// ---------- Effort allocation (category mix) ----------

const MIX_COLOR_PALETTE = [
  "var(--color-accent)",
  "var(--color-success-dark)",
  "var(--color-violet)",
  "var(--color-sky)",
  "var(--color-warning)",
];

export function computeCategoryMix(tasks: RawTaskRow[], projects: RawProjectRow[], initiatives: RawInitiativeRow[]): CategoryMixItem[] {
  const initiativeIdByProjectId = new Map(projects.map((p) => [p.id, p.initiative_id]));
  const categoryByInitiativeId = new Map(initiatives.map((i) => [i.id, i.category ?? "Uncategorized"]));

  const activeTasks = tasks.filter((t) => t.status !== "done");
  const counts = new Map<string, number>();
  for (const t of activeTasks) {
    const initiativeId = initiativeIdByProjectId.get(t.project_id);
    const category = (initiativeId && categoryByInitiativeId.get(initiativeId)) || "Uncategorized";
    counts.set(category, (counts.get(category) ?? 0) + 1);
  }

  const total = activeTasks.length || 1;
  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([label, count], i) => ({
      label,
      count,
      pct: Math.round((count / total) * 100),
      color: MIX_COLOR_PALETTE[i % MIX_COLOR_PALETTE.length],
    }));
}

// ---------- Team performance ----------

export function computeTeamPerformance(tasks: RawTaskRow[], people: { id: string; name: string }[], today: Date): TeamMember[] {
  const nameById = new Map(people.map((p) => [p.id, p.name]));
  const ownerIds = Array.from(new Set(tasks.map((t) => t.owner)));

  const raw = ownerIds.map((ownerId) => {
    const mine = tasks.filter((t) => t.owner === ownerId);
    const active = mine.filter((t) => t.status !== "done");
    const done = mine.filter((t) => t.status === "done");
    const overdue = active.filter((t) => t.end_date && new Date(t.end_date) < today).length;
    const blocked = mine.filter((t) => t.status === "blocked").length;
    const eligible = done.filter((t) => t.end_date);
    const onTimeCount = eligible.filter((t) => startOfDay(new Date(t.updated_at)) <= parseDateOnly(t.end_date!)).length;
    const onTimePct = eligible.length === 0 ? null : Math.round((onTimeCount / eligible.length) * 100);
    return { ownerId, name: nameById.get(ownerId) ?? "Unknown", active: active.length, done: done.length, overdue, blocked, onTimePct };
  });

  const maxLoad = Math.max(1, ...raw.map((r) => r.active));

  return raw
    .sort((a, b) => b.active - a.active)
    .map((r) => {
      const overloaded = maxLoad > 2 && r.active === maxLoad;
      const lightLoad = !overloaded && r.active <= 2;
      return {
        name: r.name,
        initials: getInitials(r.name),
        flag: overloaded ? "Overloaded" : lightLoad ? "Light load" : null,
        flagTone: overloaded ? "danger" : "warning",
        active: r.active,
        loadPct: Math.round((r.active / maxLoad) * 100),
        loadColor: overloaded ? "var(--color-danger-cta)" : lightLoad ? "var(--color-success-dark)" : "var(--color-accent-bright)",
        done: r.done,
        overdue: r.overdue,
        blocked: r.blocked,
        onTime: r.onTimePct === null ? "—" : `${r.onTimePct}%`,
        onTimeColor:
          r.onTimePct === null
            ? "var(--color-text-faint)"
            : r.onTimePct >= 80
              ? "var(--color-success-dark)"
              : r.onTimePct >= 50
                ? "var(--color-warning)"
                : "var(--color-danger-cta)",
      };
    });
}

// ---------- Looking ahead (Coming due) ----------
// Task end_date only — neither projects nor initiatives have a real date
// column, so there's no "project end date"/"initiative target" to read from.

export function computeLookingAhead(
  tasks: RawTaskRow[],
  projects: RawProjectRow[],
  initiatives: RawInitiativeRow[],
  people: { id: string; name: string }[],
  today: Date,
): LookingAheadForward {
  const initiativeIdByProjectId = new Map(projects.map((p) => [p.id, p.initiative_id]));
  const initiativeNameById = new Map(initiatives.map((i) => [i.id, i.name]));
  const nameById = new Map(people.map((p) => [p.id, p.name]));

  const daysUntil = (t: RawTaskRow) => dayDiff(parseDateOnly(t.end_date!), today);

  const upcoming = tasks
    .filter((t) => t.status !== "done" && t.end_date && parseDateOnly(t.end_date) >= startOfDay(today))
    .sort((a, b) => parseDateOnly(a.end_date!).getTime() - parseDateOnly(b.end_date!).getTime());

  const within = (n: number) => upcoming.filter((t) => daysUntil(t) <= n).length;

  const items = upcoming.slice(0, 6).map((t) => {
    const d = daysUntil(t);
    const initiativeId = initiativeIdByProjectId.get(t.project_id);
    const initiativeName = (initiativeId && initiativeNameById.get(initiativeId)) || "—";
    const ownerName = nameById.get(t.owner) ?? "Unknown";
    return {
      name: t.name,
      sub: `${initiativeName} · ${ownerName}`,
      dateLabel: formatShortDate(parseDateOnly(t.end_date!)),
      tone: d <= 2 ? "var(--color-danger-cta)" : d <= 7 ? "var(--color-warning)" : "var(--color-text-secondary)",
      days: d,
    };
  });

  return { b30: within(30), b60: within(60), b90: within(90), items };
}

// ---------- In period (velocity, on-time trend, period KPIs, comparison) ----------

function computePeriodMetrics(tasks: RawTaskRow[], projects: RawProjectRow[], window: PeriodWindow) {
  const inWindow = (iso: string) => {
    const d = new Date(iso);
    return d >= window.start && d < window.end;
  };

  const completed = tasks.filter((t) => t.status === "done" && inWindow(t.updated_at));
  const created = tasks.filter((t) => inWindow(t.created_at));

  const completedWithDueDate = completed.filter((t) => t.end_date);
  const onTimeCount = completedWithDueDate.filter((t) => startOfDay(new Date(t.updated_at)) <= parseDateOnly(t.end_date!)).length;
  const onTimePct = completedWithDueDate.length === 0 ? null : Math.round((onTimeCount / completedWithDueDate.length) * 100);

  const avgCycle =
    completed.length === 0
      ? null
      : completed.reduce((sum, t) => sum + (new Date(t.updated_at).getTime() - new Date(t.created_at).getTime()), 0) /
        completed.length /
        86_400_000;

  const slipEligible = completed.filter((t) => t.delivery_date && t.end_date);
  const avgSlip =
    slipEligible.length === 0
      ? null
      : slipEligible.reduce((sum, t) => sum + dayDiff(parseDateOnly(t.delivery_date!), parseDateOnly(t.end_date!)), 0) / slipEligible.length;

  const projectsDelivered = projects.filter((p) => {
    const pTasks = tasks.filter((t) => t.project_id === p.id);
    if (pTasks.length === 0 || !pTasks.every((t) => t.status === "done")) return false;
    const completedAt = Math.max(...pTasks.map((t) => new Date(t.updated_at).getTime()));
    return completedAt >= window.start.getTime() && completedAt < window.end.getTime();
  }).length;

  return {
    completed: completed.length,
    created: created.length,
    netFlow: created.length - completed.length,
    onTimePct,
    projectsDelivered,
    avgCycle,
    avgSlip,
  };
}

export function computePeriodKpis(tasks: RawTaskRow[], projects: RawProjectRow[], currentWindow: PeriodWindow, prevWindow: PeriodWindow): PeriodKpiData[] {
  const cur = computePeriodMetrics(tasks, projects, currentWindow);
  const prev = computePeriodMetrics(tasks, projects, prevWindow);

  const intDelta = (c: number, p: number): KpiDelta | null => {
    const diff = c - p;
    return diff === 0 ? null : { display: diff > 0 ? `+${diff}` : `${diff}`, direction: diff > 0 ? "up" : "down" };
  };
  const pctDelta = (c: number | null, p: number | null): KpiDelta | null => {
    if (c === null || p === null) return null;
    const diff = c - p;
    return diff === 0 ? null : { display: `${diff > 0 ? "+" : ""}${diff} pts`, direction: diff > 0 ? "up" : "down" };
  };
  const dayDelta = (c: number | null, p: number | null): KpiDelta | null => {
    if (c === null || p === null) return null;
    const diff = c - p;
    if (Math.abs(diff) < 0.05) return null;
    return { display: `${diff > 0 ? "+" : "−"}${Math.abs(diff).toFixed(1)}d`, direction: diff > 0 ? "up" : "down" };
  };

  return [
    {
      id: "tasks-completed",
      label: "Tasks completed",
      value: String(cur.completed),
      delta: intDelta(cur.completed, prev.completed),
      goodDirection: "up",
    },
    {
      id: "net-flow",
      label: "Net flow (created − completed)",
      value: cur.netFlow > 0 ? `+${cur.netFlow}` : String(cur.netFlow),
      delta: intDelta(cur.netFlow, prev.netFlow),
      goodDirection: "down",
    },
    {
      id: "on-time-delivery",
      label: "On-time delivery",
      value: cur.onTimePct === null ? "—" : `${cur.onTimePct}%`,
      delta: pctDelta(cur.onTimePct, prev.onTimePct),
      goodDirection: "up",
    },
    {
      id: "projects-delivered",
      label: "Projects delivered",
      value: String(cur.projectsDelivered),
      delta: intDelta(cur.projectsDelivered, prev.projectsDelivered),
      goodDirection: "up",
    },
    {
      id: "avg-cycle-time",
      label: "Avg cycle time",
      value: cur.avgCycle === null ? "—" : `${cur.avgCycle.toFixed(1)}d`,
      delta: dayDelta(cur.avgCycle, prev.avgCycle),
      goodDirection: "down",
    },
    {
      id: "avg-slip",
      label: "Avg slip",
      value: cur.avgSlip === null ? "—" : `${cur.avgSlip.toFixed(1)}d`,
      delta: dayDelta(cur.avgSlip, prev.avgSlip),
      goodDirection: "down",
    },
  ];
}

export function computeVelocityBars(tasks: RawTaskRow[], buckets: DateBucket[]): VelocityBar[] {
  return buckets.map((b) => ({
    label: b.label,
    completed: tasks.filter((t) => t.status === "done" && new Date(t.updated_at) >= b.start && new Date(t.updated_at) < b.end).length,
    started: tasks.filter((t) => new Date(t.created_at) >= b.start && new Date(t.created_at) < b.end).length,
  }));
}

export function computeOnTimeTrend(tasks: RawTaskRow[], buckets: DateBucket[]): OnTimePoint[] {
  return buckets.map((b) => {
    const completed = tasks.filter(
      (t) => t.status === "done" && t.end_date && new Date(t.updated_at) >= b.start && new Date(t.updated_at) < b.end,
    );
    if (completed.length === 0) return { label: b.label, value: 0 };
    const onTime = completed.filter((t) => startOfDay(new Date(t.updated_at)) <= parseDateOnly(t.end_date!)).length;
    return { label: b.label, value: Math.round((onTime / completed.length) * 100) };
  });
}

// "Portfolio completion" and "Blocked tasks" ship with no prev/delta here too
// — same ruling as Feature 28's Right Now KPIs (no reliable historical
// reconstruction without activity-log text parsing). Every other row reuses
// the same baseline approximations Feature 28 already established.
export function computePeriodComparisonRows(
  initiatives: RawInitiativeRow[],
  projects: RawProjectRow[],
  tasks: RawTaskRow[],
  currentWindow: PeriodWindow,
  prevWindow: PeriodWindow,
  today: Date,
): CompareRow[] {
  const cur = computePeriodMetrics(tasks, projects, currentWindow);
  const prev = computePeriodMetrics(tasks, projects, prevWindow);

  const activeInitiativesNow = initiatives.filter((i) => i.status === "active").length;
  const activeInitiativesPrev = countActiveAtOrBefore(initiatives, prevWindow.end);
  const activeProjectsNow = projects.filter((p) => p.status === "active").length;
  const activeProjectsPrev = countActiveAtOrBefore(projects, prevWindow.end);
  const overdueNow = tasks.filter((t) => t.status !== "done" && t.end_date && new Date(t.end_date) < today).length;
  const overduePrev = countOverdueAsOf(tasks, prevWindow.end);
  const rollupNow = computeRollup(projects.map((p) => p.id), tasks, today);

  const NEUTRAL = "var(--color-text-faint)";
  const GOOD = "var(--color-success-dark)";
  const BAD = "var(--color-danger-cta)";
  const signed = (n: number) => (n > 0 ? `+${n}` : `${n}`);
  const directionalColor = (diff: number, goodUp: boolean) => (diff === 0 ? NEUTRAL : (goodUp ? diff > 0 : diff < 0) ? GOOD : BAD);

  return [
    {
      metric: "Tasks completed",
      cur: String(cur.completed),
      prev: String(prev.completed),
      delta: signed(cur.completed - prev.completed),
      color: directionalColor(cur.completed - prev.completed, true),
    },
    {
      metric: "Tasks created",
      cur: String(cur.created),
      prev: String(prev.created),
      delta: signed(cur.created - prev.created),
      color: NEUTRAL,
    },
    {
      metric: "On-time delivery",
      cur: cur.onTimePct === null ? "—" : `${cur.onTimePct}%`,
      prev: prev.onTimePct === null ? "—" : `${prev.onTimePct}%`,
      delta: cur.onTimePct === null || prev.onTimePct === null ? "—" : `${signed(cur.onTimePct - prev.onTimePct)} pts`,
      color: cur.onTimePct === null || prev.onTimePct === null ? NEUTRAL : directionalColor(cur.onTimePct - prev.onTimePct, true),
    },
    {
      metric: "Active initiatives",
      cur: String(activeInitiativesNow),
      prev: String(activeInitiativesPrev),
      delta: signed(activeInitiativesNow - activeInitiativesPrev),
      color: NEUTRAL,
    },
    {
      metric: "Active projects",
      cur: String(activeProjectsNow),
      prev: String(activeProjectsPrev),
      delta: signed(activeProjectsNow - activeProjectsPrev),
      color: NEUTRAL,
    },
    {
      metric: "Overdue tasks",
      cur: String(overdueNow),
      prev: String(overduePrev),
      delta: signed(overdueNow - overduePrev),
      color: directionalColor(overdueNow - overduePrev, false),
    },
    {
      metric: "Blocked tasks",
      cur: String(tasks.filter((t) => t.status === "blocked").length),
      prev: "—",
      delta: "—",
      color: NEUTRAL,
    },
    {
      metric: "Avg cycle time",
      cur: cur.avgCycle === null ? "—" : `${cur.avgCycle.toFixed(1)}d`,
      prev: prev.avgCycle === null ? "—" : `${prev.avgCycle.toFixed(1)}d`,
      delta:
        cur.avgCycle === null || prev.avgCycle === null
          ? "—"
          : `${cur.avgCycle - prev.avgCycle >= 0 ? "+" : "−"}${Math.abs(cur.avgCycle - prev.avgCycle).toFixed(1)}d`,
      color: cur.avgCycle === null || prev.avgCycle === null ? NEUTRAL : directionalColor(cur.avgCycle - prev.avgCycle, false),
    },
    {
      metric: "Portfolio completion",
      cur: `${rollupNow.progressPct}%`,
      prev: "—",
      delta: "—",
      color: NEUTRAL,
    },
  ];
}
