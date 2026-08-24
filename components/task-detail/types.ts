import type { ActivityKind, Attachment, TaskStatus } from "@/types";

// A file picked in the compose area, already uploaded to storage (real key/url)
// but not yet attached to a posted note. previewUrl is a local object URL from
// the original File, for an instant compose-time thumbnail — never persisted.
export interface PendingAttachment extends Attachment {
  previewUrl?: string;
}

export interface TimelineEntry {
  id: string;
  kind: ActivityKind;
  whoId: string;
  whoName: string;
  text: string;
  edited: boolean;
  pinned: boolean;
  attachments: Attachment[];
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
