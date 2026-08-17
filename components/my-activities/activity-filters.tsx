"use client";

import { Search } from "lucide-react";
import posthog from "posthog-js";

export type FilterKey = "all" | "overdue" | "today" | "week" | "blocked" | "followup";

interface ChipDef {
  key: FilterKey;
  label: string;
  dotClassName: string;
}

const CHIP_DEFS: ChipDef[] = [
  { key: "all", label: "All open", dotClassName: "bg-text-faint" },
  { key: "overdue", label: "Overdue", dotClassName: "bg-danger-cta" },
  { key: "today", label: "Due today", dotClassName: "bg-warning" },
  { key: "week", label: "This week", dotClassName: "bg-accent" },
  { key: "blocked", label: "Blocked / at risk", dotClassName: "bg-danger-cta" },
  { key: "followup", label: "Follow-up", dotClassName: "bg-warning" },
];

interface ActivityFiltersProps {
  activeKey: FilterKey;
  counts: Record<FilterKey, number>;
  search: string;
  onSelect: (key: FilterKey) => void;
  onSearchChange: (value: string) => void;
}

export function ActivityFilters({ activeKey, counts, search, onSelect, onSearchChange }: ActivityFiltersProps) {
  return (
    <div className="mb-4.5 flex flex-wrap items-center gap-2.5">
      {CHIP_DEFS.map((chip) => {
        const active = activeKey === chip.key;
        return (
          <button
            key={chip.key}
            type="button"
            onClick={() => {
              if (chip.key !== activeKey) {
                posthog.capture("activity_filter_selected", { filter: chip.key, label: chip.label });
              }
              onSelect(chip.key);
            }}
            className={`inline-flex items-center gap-2 rounded-pill border px-3.25 py-2 text-[13.5px] font-semi transition-colors duration-(--duration-base) ${
              active ? "border-accent bg-accent text-white" : "border-border bg-surface text-text-secondary"
            }`}
          >
            <span className={`h-1.75 w-1.75 rounded-full ${chip.dotClassName}`} />
            {chip.label}
            <span
              className={`inline-flex min-w-[20px] items-center justify-center rounded-pill px-1.5 py-0.5 text-[11.5px] font-bold ${
                active ? "bg-white/22 text-white" : "bg-surface-inset text-text-secondary"
              }`}
            >
              {counts[chip.key]}
            </span>
          </button>
        );
      })}
      <div className="ml-auto flex w-67.5 max-w-full items-center gap-2 rounded-pill border border-border bg-surface px-3.5 py-2">
        <Search size={16} className="text-text-faint" />
        <input
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search task, initiative, owner"
          className="w-full border-none bg-transparent text-[13.5px] text-text-primary outline-none"
        />
      </div>
    </div>
  );
}
