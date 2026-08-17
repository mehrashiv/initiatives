import { dayDiff } from "@/lib/dates";
import type { ProjectOption } from "@/components/shared/new-task-modal";
import type { TaskStatus } from "@/types";
import type { ActivityTask } from "./types";

export interface ActivityTaskRow {
  id: string;
  project_id: string;
  name: string;
  status: TaskStatus;
  end_date: string | null;
  progress: number;
  blocker_owner: string | null;
  flagged: boolean;
  owner: string;
  updated_at: string;
}

export function activityTaskFromRow(
  row: ActivityTaskRow,
  projectOptionById: Map<string, ProjectOption>,
  profileNameById: Map<string, string>,
): ActivityTask | null {
  const project = projectOptionById.get(row.project_id);
  if (!project) return null;

  const updatedAt = new Date(row.updated_at);

  return {
    id: row.id,
    name: row.name,
    status: row.status,
    initiativeName: project.initiativeName,
    projectName: project.name,
    ownerId: row.owner,
    ownerName: profileNameById.get(row.owner) ?? "Unassigned",
    endDate: row.end_date ? new Date(`${row.end_date.slice(0, 10)}T00:00:00`) : updatedAt,
    completedDate: row.status === "done" ? updatedAt : null,
    updatedAt,
    progress: row.progress,
    followUp: row.flagged,
    blockedReason: row.blocker_owner || null,
    newNoteCount: 0,
  };
}

export type Bucket = "overdue" | "today" | "week" | "upcoming";

export const BUCKET_TITLE: Record<Bucket, string> = {
  overdue: "Overdue",
  today: "Due today",
  week: "Due this week",
  upcoming: "Upcoming",
};

export const BUCKET_DOT_CLASS: Record<Bucket, string> = {
  overdue: "bg-danger-cta",
  today: "bg-warning",
  week: "bg-accent",
  upcoming: "bg-border-strong",
};

export const BUCKET_BORDER_CLASS: Record<Bucket, string> = {
  overdue: "border-l-danger-cta",
  today: "border-l-warning",
  week: "border-l-accent",
  upcoming: "border-l-border-strong",
};

export function endOfWeek(today: Date): Date {
  const eow = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  eow.setDate(eow.getDate() + ((7 - eow.getDay()) % 7));
  return eow;
}

export function bucketFor(task: ActivityTask, today: Date, eow: Date): Bucket {
  const diff = dayDiff(task.endDate, today);
  if (diff < 0) return "overdue";
  if (diff === 0) return "today";
  if (dayDiff(task.endDate, eow) <= 0) return "week";
  return "upcoming";
}

export interface TimingInfo {
  text: string;
  className: string;
}

export function timingFor(task: ActivityTask, today: Date): TimingInfo {
  const diff = dayDiff(task.endDate, today);
  if (diff < 0) {
    return {
      text: `${-diff} ${-diff === 1 ? "day" : "days"} overdue`,
      className: "bg-danger-light text-danger-cta",
    };
  }
  if (diff === 0) {
    return { text: "Due today", className: "bg-warning-light text-warning" };
  }
  if (diff === 1) {
    return { text: "Due tomorrow", className: "bg-surface-inset text-text-secondary" };
  }
  return { text: `in ${diff} days`, className: "bg-surface-inset text-text-secondary" };
}

export function staleLabel(task: ActivityTask, today: Date): string | null {
  if (task.status !== "in_progress") return null;
  const days = dayDiff(today, task.updatedAt);
  return days >= 7 ? `No movement ${days}d` : null;
}

export function accentKeyFor(task: ActivityTask, bucket: Bucket): Bucket {
  if (bucket === "overdue" || task.status === "blocked" || task.status === "delayed") return "overdue";
  return bucket;
}
