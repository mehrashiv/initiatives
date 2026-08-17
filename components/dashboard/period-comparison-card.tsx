import type { CompareRow } from "@/components/dashboard/mock-data";

const COLUMNS = "grid-cols-[1.6fr_70px_70px_70px]";

interface PeriodComparisonCardProps {
  rows: CompareRow[];
  rangeLabel: string;
  comparisonLabel: string;
}

export function PeriodComparisonCard({ rows, rangeLabel, comparisonLabel }: PeriodComparisonCardProps) {
  return (
    <div className="rounded-lg border border-border bg-surface p-5.5 shadow-xs">
      <h3 className="mb-1 text-base font-semi text-text-primary">Period comparison</h3>
      <p className="mb-4 text-[12.5px] text-text-faint">
        {rangeLabel} vs. {comparisonLabel}
      </p>

      <div className={`grid ${COLUMNS} items-center gap-1.5 border-b border-border pb-2.25`}>
        <span className="text-[11px] font-bold tracking-wide text-text-faint uppercase">Metric</span>
        <span className="text-right text-[11px] font-bold tracking-wide text-text-faint uppercase">Now</span>
        <span className="text-right text-[11px] font-bold tracking-wide text-text-faint uppercase">Prior</span>
        <span className="text-right text-[11px] font-bold tracking-wide text-text-faint uppercase">Δ</span>
      </div>
      {rows.map((row) => (
        <div key={row.metric} className={`grid ${COLUMNS} items-center gap-1.5 border-b border-surface-inset py-2.5 last:border-b-0`}>
          <span className="text-[13px] text-text-primary">{row.metric}</span>
          <span className="text-right text-[13.5px] font-semi text-text-primary">{row.cur}</span>
          <span className="text-right text-[13px] text-text-faint">{row.prev}</span>
          <span className="text-right text-[12.5px] font-semi" style={{ color: row.color }}>
            {row.delta}
          </span>
        </div>
      ))}
    </div>
  );
}
