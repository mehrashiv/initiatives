import { EmptyState } from "@/components/shared/empty-state";
import type { LookingAheadForward } from "@/components/dashboard/mock-data";

interface ComingDueCardProps {
  data: LookingAheadForward;
}

export function ComingDueCard({ data }: ComingDueCardProps) {
  const { b30, b60, b90, items } = data;
  const buckets = [
    { label: "next 30 days", value: b30 },
    { label: "next 60 days", value: b60 },
    { label: "next 90 days", value: b90 },
  ];

  return (
    <div className="rounded-lg border border-border bg-surface p-5.5 shadow-xs">
      <h3 className="mb-4 text-base font-semi text-text-primary">Coming due</h3>

      <div className="mb-5 flex gap-2.5">
        {buckets.map((b) => (
          <div key={b.label} className="flex-1 rounded-md bg-surface-subtle py-3.5 text-center">
            <div className="text-2xl leading-none font-semi text-text-primary">{b.value}</div>
            <div className="mt-1.25 text-[11px] text-text-faint">{b.label}</div>
          </div>
        ))}
      </div>

      {items.length > 0 ? (
        <div className="flex flex-col">
          {items.map((item) => (
            <div key={item.name} className="flex items-center gap-3 border-t border-surface-inset py-2.75 first:border-t-0">
              <div className="min-w-0 flex-1">
                <div className="truncate text-[13.5px] font-semi text-text-primary">{item.name}</div>
                <div className="mt-0.5 text-xs text-text-faint">{item.sub}</div>
              </div>
              <div className="flex-none text-right">
                <div className="text-[13px] font-semi" style={{ color: item.tone }}>
                  {item.dateLabel}
                </div>
                <div className="mt-0.5 text-[11px] text-text-faint">in {item.days}d</div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState description="No upcoming tasks match this filter." />
      )}
    </div>
  );
}
