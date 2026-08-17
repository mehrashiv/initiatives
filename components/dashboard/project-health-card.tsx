"use client";

import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts";
import { EmptyState } from "@/components/shared/empty-state";
import type { ProjectHealthData } from "@/components/dashboard/mock-data";

interface ProjectHealthCardProps {
  data: ProjectHealthData;
}

export function ProjectHealthCard({ data }: ProjectHealthCardProps) {
  const { activeProjectsTotal, onTrackPct, completionPct, segments } = data;
  const chartData = segments.map((s) => ({ name: s.label, value: s.count, color: s.color }));

  if (activeProjectsTotal === 0) {
    return (
      <div className="rounded-lg border border-border bg-surface p-5.5 shadow-xs">
        <h3 className="mb-4.5 text-base font-semi text-text-primary">Project health</h3>
        <EmptyState description="No active projects match this filter." />
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border bg-surface p-5.5 shadow-xs">
      <div className="mb-4.5 flex items-baseline justify-between">
        <h3 className="text-base font-semi text-text-primary">Project health</h3>
        <span className="text-[12.5px] text-text-faint">{activeProjectsTotal} active projects</span>
      </div>

      <div className="flex flex-wrap items-center gap-6">
        <div className="relative h-32 w-32 flex-none">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                dataKey="value"
                nameKey="name"
                innerRadius={46}
                outerRadius={64}
                startAngle={90}
                endAngle={-270}
                stroke="none"
              >
                {chartData.map((entry) => (
                  <Cell key={entry.name} fill={entry.color} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-semi tracking-tight text-text-primary">{onTrackPct}%</span>
            <span className="mt-0.75 text-[10.5px] text-text-faint">on track</span>
          </div>
        </div>

        <div className="flex min-w-37.5 flex-1 flex-col gap-2.75">
          {segments.map((s) => (
            <div key={s.key} className="flex items-center gap-2.5">
              <span className="h-2.75 w-2.75 flex-none rounded-xs" style={{ background: s.color }} />
              <span className="flex-1 text-[13.5px] font-semi text-text-primary">{s.label}</span>
              <span className="text-[13.5px] font-semi text-text-primary">{s.count}</span>
              <span className="w-9.5 text-right text-xs text-text-faint">{s.pct}%</span>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-5 border-t border-border pt-4">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-[13px] font-med text-text-secondary">Aggregate completion</span>
          <span className="text-[13px] font-semi text-text-primary">{completionPct}%</span>
        </div>
        <div className="h-2 overflow-hidden rounded-pill bg-surface-inset">
          <div className="h-full rounded-pill bg-accent-bright" style={{ width: `${completionPct}%` }} />
        </div>
      </div>
    </div>
  );
}
