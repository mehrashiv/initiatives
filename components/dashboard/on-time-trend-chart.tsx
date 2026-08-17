"use client";

import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { EmptyState } from "@/components/shared/empty-state";
import type { OnTimePoint } from "@/components/dashboard/mock-data";

interface OnTimeTrendChartProps {
  data: OnTimePoint[];
  hasData: boolean;
}

export function OnTimeTrendChart({ data, hasData }: OnTimeTrendChartProps) {
  return (
    <div className="rounded-lg border border-border bg-surface p-5.5 shadow-xs">
      <div className="mb-4 flex flex-wrap items-baseline justify-between gap-1">
        <h3 className="text-base font-semi text-text-primary">On-time delivery rate over time</h3>
        <span className="text-[12.5px] text-text-faint">% of tasks completed by their end date</span>
      </div>

      {hasData ? (
        <ResponsiveContainer width="100%" height={150}>
          <AreaChart data={data}>
            <defs>
              <linearGradient id="onTimeGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--color-accent)" stopOpacity={0.16} />
                <stop offset="100%" stopColor="var(--color-accent)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
            <XAxis dataKey="label" tick={{ fontSize: 10.5, fill: "var(--color-text-faint)" }} axisLine={false} tickLine={false} />
            <YAxis hide domain={[0, 100]} />
            <Tooltip />
            <Area
              type="monotone"
              dataKey="value"
              stroke="var(--color-accent-bright)"
              strokeWidth={2.5}
              fill="url(#onTimeGradient)"
              dot={{ r: 3.5, fill: "var(--color-surface)", stroke: "var(--color-accent-bright)", strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      ) : (
        <EmptyState description="No completed tasks match this filter in this window." />
      )}
    </div>
  );
}
