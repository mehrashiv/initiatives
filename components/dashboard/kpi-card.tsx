import { TrendingDown, TrendingUp } from "lucide-react";
import type { KpiData } from "@/components/dashboard/mock-data";

interface KpiCardProps {
  kpi: KpiData;
}

export function KpiCard({ kpi }: KpiCardProps) {
  const { label, value, delta, goodDirection, trend, caption } = kpi;
  const isGood = delta ? delta.direction === goodDirection : false;

  return (
    <div className="min-w-45 flex-1 rounded-lg border border-border bg-surface p-4.5 shadow-xs">
      <div className="text-sm font-med text-text-secondary">{label}</div>
      <div className="mt-2 flex items-baseline gap-2">
        <span className="text-2xl font-semi leading-tight tracking-tight text-text-primary">{value}</span>
        {delta && (
          <span
            className={`inline-flex items-center gap-0.5 text-[13px] font-semi ${
              isGood ? "text-success-dark" : "text-danger-cta"
            }`}
          >
            {delta.direction === "up" ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
            {delta.display}
          </span>
        )}
        {trend && <span className="text-[13px] font-semi text-text-faint">{trend}</span>}
      </div>
      <div className="mt-1 text-xs text-text-faint">{caption}</div>
    </div>
  );
}
