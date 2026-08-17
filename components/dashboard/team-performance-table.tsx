import { EmptyState } from "@/components/shared/empty-state";
import type { TeamMember } from "@/components/dashboard/mock-data";

const FLAG_TONE_CLASSES = {
  danger: "bg-danger-light text-danger-cta",
  warning: "bg-warning-light text-warning",
} as const;

const COLUMNS = "grid-cols-[2fr_1.4fr_80px_80px_80px_90px]";

interface TeamPerformanceTableProps {
  members: TeamMember[];
}

export function TeamPerformanceTable({ members }: TeamPerformanceTableProps) {
  if (members.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-surface shadow-xs">
        <EmptyState description="No team members have tasks matching this filter." />
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-surface shadow-xs">
      <div className={`grid ${COLUMNS} items-center gap-3 border-b border-border px-6 py-3`}>
        <span className="text-[11px] font-bold tracking-wide text-text-faint uppercase">Member</span>
        <span className="text-[11px] font-bold tracking-wide text-text-faint uppercase">Active load</span>
        <span className="text-center text-[11px] font-bold tracking-wide text-text-faint uppercase">Done</span>
        <span className="text-center text-[11px] font-bold tracking-wide text-text-faint uppercase">Overdue</span>
        <span className="text-center text-[11px] font-bold tracking-wide text-text-faint uppercase">Blocked</span>
        <span className="text-right text-[11px] font-bold tracking-wide text-text-faint uppercase">On-time</span>
      </div>
      {members.map((m) => (
        <div
          key={m.name}
          className={`grid ${COLUMNS} items-center gap-3 border-b border-surface-inset px-6 py-3.5 last:border-b-0`}
        >
          <div className="flex min-w-0 items-center gap-2.75">
            <span className="flex h-8.5 w-8.5 flex-none items-center justify-center rounded-full text-[12.5px] font-bold text-white [background:var(--gradient-logo-mark-linear)]">
              {m.initials}
            </span>
            <div className="min-w-0">
              <div className="truncate text-[13.5px] font-semi text-text-primary">{m.name}</div>
              {m.flag && (
                <span
                  className={`mt-0.75 inline-block rounded-pill px-1.75 py-0.25 text-[10.5px] font-bold ${FLAG_TONE_CLASSES[m.flagTone]}`}
                >
                  {m.flag}
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2.25">
            <div className="h-1.75 flex-1 overflow-hidden rounded-pill bg-surface-inset">
              <div className="h-full rounded-pill" style={{ width: `${m.loadPct}%`, background: m.loadColor }} />
            </div>
            <span className="w-4.5 text-right text-[13px] font-semi text-text-primary">{m.active}</span>
          </div>
          <span className="text-center text-[13.5px] text-text-secondary">{m.done}</span>
          <span className="text-center text-[13.5px] font-semi text-text-secondary">{m.overdue}</span>
          <span className="text-center text-[13.5px] font-semi text-text-secondary">{m.blocked}</span>
          <span className="text-right text-[13.5px] font-semi" style={{ color: m.onTimeColor }}>
            {m.onTime}
          </span>
        </div>
      ))}
    </div>
  );
}
