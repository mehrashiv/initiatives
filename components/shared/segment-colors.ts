export type ProgressSegmentKey = "done" | "in_progress" | "blocked" | "delayed" | "to_do";

export interface ProgressSegment {
  key: ProgressSegmentKey;
  pct: number;
  color: string;
}

export const SEGMENT_COLORS: Record<ProgressSegmentKey, string> = {
  done: "var(--color-success-dark)",
  in_progress: "var(--color-accent-bright)",
  blocked: "var(--color-danger-cta)",
  delayed: "var(--color-warning)",
  to_do: "var(--color-border)",
};
