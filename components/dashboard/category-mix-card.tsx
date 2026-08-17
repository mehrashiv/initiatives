import { EmptyState } from "@/components/shared/empty-state";
import type { CategoryMixItem } from "@/components/dashboard/mock-data";

interface CategoryMixCardProps {
  items: CategoryMixItem[];
}

export function CategoryMixCard({ items }: CategoryMixCardProps) {
  if (items.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-surface p-5.5 shadow-xs">
        <h3 className="mb-4.5 text-base font-semi text-text-primary">Active tasks by category</h3>
        <EmptyState description="No active tasks match this filter." />
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border bg-surface p-5.5 shadow-xs">
      <h3 className="mb-4.5 text-base font-semi text-text-primary">Active tasks by category</h3>
      <div className="flex flex-col gap-3.75">
        {items.map((item) => (
          <div key={item.label}>
            <div className="mb-1.5 flex items-center justify-between">
              <span className="text-[13px] font-semi text-text-primary">{item.label}</span>
              <span className="text-[12.5px] text-text-secondary">
                {item.count} · {item.pct}%
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-pill bg-surface-inset">
              <div className="h-full rounded-pill" style={{ width: `${item.pct}%`, background: item.color }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
