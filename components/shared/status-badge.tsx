import type { InitiativeStatus, ProjectStatus, TaskStatus } from "@/types";

type Status = TaskStatus | InitiativeStatus | ProjectStatus;

interface StatusBadgeProps {
  status: Status;
}

const TONE: Record<Status, { bg: string; fg: string; label: string }> = {
  to_do: { bg: "bg-surface-subtle", fg: "text-text-secondary", label: "To Do" },
  in_progress: { bg: "bg-accent-light", fg: "text-accent", label: "In Progress" },
  blocked: { bg: "bg-danger-light", fg: "text-danger-cta", label: "Blocked" },
  delayed: { bg: "bg-warning-light", fg: "text-warning", label: "Delayed" },
  done: { bg: "bg-success-light", fg: "text-success-dark", label: "Done" },
  active: { bg: "bg-success-light", fg: "text-success-dark", label: "Active" },
  inactive: { bg: "bg-surface-subtle", fg: "text-text-secondary", label: "Inactive" },
};

export function StatusBadge({ status }: StatusBadgeProps) {
  const tone = TONE[status];
  return (
    <span
      className={`inline-flex items-center whitespace-nowrap rounded-pill px-2.25 py-0.5 text-xs font-med ${tone.bg} ${tone.fg}`}
    >
      {tone.label}
    </span>
  );
}
