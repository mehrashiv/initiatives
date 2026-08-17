import type { TaskStatus } from "@/types";

export interface BoardTask {
  id: string;
  name: string;
  status: TaskStatus;
  projectId: string;
  projectName: string;
  initiativeName: string;
  ownerId: string;
  ownerName: string;
  startDate: Date | null;
  endDate: Date;
  deliveryDate: Date | null;
  progress: number;
  followUp: boolean;
  blockedReason: string | null;
}

export const STATUS_COLUMNS: { status: TaskStatus; title: string }[] = [
  { status: "to_do", title: "To Do" },
  { status: "in_progress", title: "In Progress" },
  { status: "blocked", title: "Blocked" },
  { status: "delayed", title: "Delayed" },
  { status: "done", title: "Done" },
];

interface StatusAccent {
  border: string;
  fill: string;
  dot: string;
}

export const STATUS_ACCENT: Record<TaskStatus, StatusAccent> = {
  to_do: { border: "border-l-text-secondary", fill: "bg-text-secondary", dot: "bg-text-secondary" },
  in_progress: { border: "border-l-accent", fill: "bg-accent", dot: "bg-accent" },
  blocked: { border: "border-l-danger-cta", fill: "bg-danger-cta", dot: "bg-danger-cta" },
  delayed: { border: "border-l-warning", fill: "bg-warning", dot: "bg-warning" },
  done: { border: "border-l-success-dark", fill: "bg-success-dark", dot: "bg-success-dark" },
};

// Gantt rows are colored by computed schedule health, not the raw `status` column —
// "at_risk" covers both Blocked and an undelivered task past its end_date, and
// "delayed" means delivered later than end_date (not merely status === "delayed").
export type GanttBucket = "to_do" | "in_progress" | "at_risk" | "delayed" | "on_time";

interface GanttBucketAccent {
  fill: string;
  dot: string;
  text: string;
}

export const GANTT_BUCKET_ACCENT: Record<GanttBucket, GanttBucketAccent> = {
  to_do: { fill: "bg-text-secondary", dot: "bg-text-secondary", text: "text-text-secondary" },
  in_progress: { fill: "bg-accent", dot: "bg-accent", text: "text-accent" },
  at_risk: { fill: "bg-danger-cta", dot: "bg-danger-cta", text: "text-danger-cta" },
  delayed: { fill: "bg-warning", dot: "bg-warning", text: "text-warning" },
  on_time: { fill: "bg-success-dark", dot: "bg-success-dark", text: "text-success-dark" },
};
