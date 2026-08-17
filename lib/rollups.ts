import type { Task } from "@/types";

export interface RollupSegment {
  key: "done" | "in_progress" | "blocked" | "delayed" | "to_do";
  pct: number;
}

export interface Rollup {
  progressPct: number;
  segments: RollupSegment[];
  projectCount: number;
  taskCount: number;
  atRiskCount: number;
}

const SEGMENT_ORDER: RollupSegment["key"][] = ["done", "in_progress", "blocked", "delayed", "to_do"];

// Mirrors components/my-activities/task-helpers.ts's accentKeyFor risk rule,
// re-derived against the raw DB row shape (that function takes a display-shape
// ActivityTask + a precomputed date bucket, not a raw Task row).
export function isTaskAtRisk(task: Pick<Task, "status" | "end_date">, today: Date): boolean {
  if (task.status === "blocked" || task.status === "delayed") return true;
  if (task.status === "done" || !task.end_date) return false;
  return new Date(task.end_date) < today;
}

// blocked/delayed/done are meaningful overrides shown verbatim regardless of
// progress (same precedent as isTaskAtRisk/accentKeyFor). For to_do vs
// in_progress, progress > 0 wins over the literal status string — otherwise a
// task sitting at status='to_do' with real progress entered renders in the
// to_do bucket's deliberately near-invisible track color, contradicting a
// high progressPct with a bar that looks empty.
function segmentBucketFor(task: Pick<Task, "status" | "progress">): RollupSegment["key"] {
  if (task.status === "done" || task.status === "blocked" || task.status === "delayed") return task.status;
  return task.progress > 0 ? "in_progress" : "to_do";
}

export function computeRollup(
  projectIdsForInitiative: string[],
  allTasks: Pick<Task, "project_id" | "status" | "progress" | "end_date">[],
  today: Date,
): Rollup {
  const projectIdSet = new Set(projectIdsForInitiative);
  const tasks = allTasks.filter((t) => projectIdSet.has(t.project_id));
  const taskCount = tasks.length;
  const progressPct = taskCount === 0 ? 0 : Math.round(tasks.reduce((sum, t) => sum + t.progress, 0) / taskCount);

  const counts: Record<RollupSegment["key"], number> = {
    done: 0,
    in_progress: 0,
    blocked: 0,
    delayed: 0,
    to_do: 0,
  };
  for (const t of tasks) counts[segmentBucketFor(t)] += 1;

  const segments = SEGMENT_ORDER.map((key) => ({
    key,
    pct: taskCount === 0 ? 0 : Math.round((counts[key] / taskCount) * 100),
  })).filter((s) => s.pct > 0);

  return {
    progressPct,
    segments,
    projectCount: projectIdsForInitiative.length,
    taskCount,
    atRiskCount: tasks.filter((t) => isTaskAtRisk(t, today)).length,
  };
}
