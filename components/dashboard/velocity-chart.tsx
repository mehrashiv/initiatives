"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { EmptyState } from "@/components/shared/empty-state";
import type { VelocityBar } from "@/components/dashboard/mock-data";

const GRANULARITY_OPTIONS = ["Week", "Month", "Quarter"] as const;

interface VelocityChartProps {
  data: VelocityBar[];
  granularity: (typeof GRANULARITY_OPTIONS)[number];
  onGranularityChange: (granularity: (typeof GRANULARITY_OPTIONS)[number]) => void;
  hasData: boolean;
}

export function VelocityChart({ data, granularity, onGranularityChange, hasData }: VelocityChartProps) {
  return (
    <div className="rounded-lg border border-border bg-surface p-5.5 shadow-xs">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-base font-semi text-text-primary">Velocity & momentum</h3>
        <div className="inline-flex rounded-sm bg-surface-inset p-0.75">
          {GRANULARITY_OPTIONS.map((option) => {
            const active = granularity === option;
            return (
              <button
                key={option}
                type="button"
                onClick={() => onGranularityChange(option)}
                className={`rounded-xs px-3 py-1.5 text-xs font-semi ${
                  active ? "bg-surface text-text-primary shadow-xs" : "text-text-secondary"
                }`}
              >
                {option}
              </button>
            );
          })}
        </div>
      </div>

      {hasData ? (
        <>
          <div className="mb-4 flex items-center gap-4">
            <span className="inline-flex items-center gap-1.5 text-xs text-text-secondary">
              <span className="h-2.5 w-2.5 rounded-xs bg-accent" />
              Completed
            </span>
            <span className="inline-flex items-center gap-1.5 text-xs text-text-secondary">
              <span className="h-2.5 w-2.5 rounded-xs bg-sky" />
              Started
            </span>
          </div>

          <ResponsiveContainer width="100%" height={170}>
            <BarChart data={data} barGap={3}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 10.5, fill: "var(--color-text-faint)" }} axisLine={false} tickLine={false} />
              <YAxis hide />
              <Tooltip />
              <Bar dataKey="completed" name="Completed" fill="var(--color-accent)" radius={[3, 3, 0, 0]} />
              <Bar dataKey="started" name="Started" fill="var(--color-sky)" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </>
      ) : (
        <EmptyState description="No tasks match this filter in this window." />
      )}
    </div>
  );
}
