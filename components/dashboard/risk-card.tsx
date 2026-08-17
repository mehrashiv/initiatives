import type { RiskItem } from "@/components/dashboard/mock-data";

const TONE_CLASSES = {
  danger: "bg-danger-light text-danger-cta",
  warning: "bg-warning-light text-warning",
} as const;

interface RiskCardProps {
  title: string;
  count: number;
  tone: keyof typeof TONE_CLASSES;
  dotColor: string;
  items: RiskItem[];
  emptyMessage?: string;
  footer?: { label: string; value: number };
}

export function RiskCard({ title, count, tone, dotColor, items, emptyMessage, footer }: RiskCardProps) {
  return (
    <div className="rounded-lg border border-border bg-surface p-5 shadow-xs">
      <div className="mb-4 flex items-center gap-2.25">
        <h3 className="text-[15px] font-semi text-text-primary">{title}</h3>
        <span
          className={`inline-flex h-5.25 min-w-5.5 items-center justify-center rounded-pill px-1.75 text-xs font-bold ${TONE_CLASSES[tone]}`}
        >
          {count}
        </span>
      </div>

      {items.length > 0 ? (
        <div className="flex flex-col gap-3">
          {items.map((item) => (
            <div key={item.name} className="flex items-start gap-2.5">
              <span className="mt-1.5 h-1.5 w-1.5 flex-none rounded-full" style={{ background: dotColor }} />
              <div className="min-w-0 flex-1">
                <div className="text-[13.5px] font-semi text-text-primary">{item.name}</div>
                <div className="mt-0.5 text-xs text-text-faint">{item.sub}</div>
              </div>
              <span className={`rounded-pill px-2.25 py-0.75 text-[11.5px] font-semi whitespace-nowrap ${TONE_CLASSES[tone]}`}>
                {item.tag}
              </span>
            </div>
          ))}
        </div>
      ) : (
        emptyMessage && <p className="text-[13px] text-text-secondary">{emptyMessage}</p>
      )}

      {footer && (
        <div className="mt-4 flex items-center justify-between border-t border-border pt-3.5">
          <span className="text-[13px] text-text-secondary">{footer.label}</span>
          <span className="text-lg font-semi text-danger-cta">{footer.value}</span>
        </div>
      )}
    </div>
  );
}
