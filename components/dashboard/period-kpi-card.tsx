import { TrendingDown, TrendingUp } from "lucide-react";
import type { PeriodKpiData } from "@/components/dashboard/mock-data";

interface PeriodKpiCardProps {
  kpi: PeriodKpiData;
}

export function PeriodKpiCard({ kpi }: PeriodKpiCardProps) {
  const { label, value, delta, goodDirection } = kpi;
  const isGood = delta ? delta.direction === goodDirection : false;

  return (
    <div className="min-w-45 flex-1 rounded-lg border border-border bg-surface p-5.5 shadow-xs">
      <div className="text-[12.5px] font-med text-text-secondary">{label}</div>
      <div className="mt-2.5 flex items-baseline justify-between gap-2">
        <span className="text-[32px] leading-none font-semi tracking-tight text-text-primary">{value}</span>
        {delta && (
          <span
            className={`inline-flex items-center gap-0.5 rounded-pill px-2.25 py-1 text-[12.5px] font-semi whitespace-nowrap ${
              isGood ? "bg-success-light text-success-dark" : "bg-danger-light text-danger-cta"
            }`}
          >
            {delta.direction === "up" ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
            {delta.display}
          </span>
        )}
      </div>
    </div>
  );
}
