import type { ActivityKind, TaskStatus } from "@/types";

export interface TimelineEntry {
  id: string;
  kind: ActivityKind;
  whoId: string;
  whoName: string;
  text: string;
  edited: boolean;
  pinned: boolean;
  createdAt: Date;
}

interface StatusPillTone {
  border: string;
  bg: string;
  fg: string;
}

export const STATUS_PILL_TONE: Record<TaskStatus, StatusPillTone> = {
  to_do: { border: "border-border-strong", bg: "bg-surface-subtle", fg: "text-text-secondary" },
  in_progress: { border: "border-accent", bg: "bg-accent-light", fg: "text-accent" },
  blocked: { border: "border-danger-cta", bg: "bg-danger-light", fg: "text-danger-cta" },
  delayed: { border: "border-warning", bg: "bg-warning-light", fg: "text-warning" },
  done: { border: "border-success-dark", bg: "bg-success-light", fg: "text-success-dark" },
};
