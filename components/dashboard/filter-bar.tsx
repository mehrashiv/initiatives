"use client";

import { BarChart3, Calendar, Users } from "lucide-react";
import { FilterDropdown, type FilterDropdownOption } from "@/components/dashboard/filter-dropdown";

export interface LensPreset {
  label: string;
  active: boolean;
  apply: () => void;
}

const VS_PREVIOUS_OPTIONS: FilterDropdownOption[] = [
  { id: "previous", label: "vs previous" },
  { id: "none", label: "No comparison" },
];

interface FilterBarProps {
  quarterOptions: FilterDropdownOption[];
  quarter: string;
  onQuarterChange: (id: string) => void;
  vsPrevious: string;
  onVsPreviousChange: (id: string) => void;
  initiativeOptions: FilterDropdownOption[];
  initiativeFilter: string;
  onInitiativeFilterChange: (id: string) => void;
  ownerOptions: FilterDropdownOption[];
  ownerFilter: string;
  onOwnerFilterChange: (id: string) => void;
  categories: string[];
  activeCategory: string | null;
  onCategoryChange: (category: string | null) => void;
  lenses: LensPreset[];
}

export function FilterBar({
  quarterOptions,
  quarter,
  onQuarterChange,
  vsPrevious,
  onVsPreviousChange,
  initiativeOptions,
  initiativeFilter,
  onInitiativeFilterChange,
  ownerOptions,
  ownerFilter,
  onOwnerFilterChange,
  categories,
  activeCategory,
  onCategoryChange,
  lenses,
}: FilterBarProps) {
  return (
    <div className="rounded-lg border border-border bg-surface p-5 shadow-xs">
      <div className="flex flex-wrap gap-3">
        <FilterDropdown icon={<Calendar size={16} />} value={quarter} options={quarterOptions} onChange={onQuarterChange} />
        <FilterDropdown icon={<BarChart3 size={16} />} value={vsPrevious} options={VS_PREVIOUS_OPTIONS} onChange={onVsPreviousChange} />
        <FilterDropdown value={initiativeFilter} options={initiativeOptions} onChange={onInitiativeFilterChange} />
        <FilterDropdown icon={<Users size={16} />} value={ownerFilter} options={ownerOptions} onChange={onOwnerFilterChange} />
      </div>

      <div className="mt-4 border-t border-border pt-4" />

      <div className="flex flex-wrap items-center gap-2.5">
        <span className="text-[11px] font-bold uppercase tracking-wide text-text-faint">Category</span>
        {categories.map((category) => {
          const active = activeCategory === category;
          return (
            <button
              key={category}
              type="button"
              onClick={() => onCategoryChange(active ? null : category)}
              className={`rounded-pill border px-3.5 py-2 text-[13.5px] font-semi transition-colors duration-(--duration-base) ${
                active ? "border-accent bg-accent text-white" : "border-border bg-surface text-text-secondary"
              }`}
            >
              {category}
            </button>
          );
        })}

        <span className="ml-auto text-[11px] font-bold uppercase tracking-wide text-text-faint">Lenses</span>
        {lenses.map((lens) => (
          <button
            key={lens.label}
            type="button"
            onClick={lens.apply}
            className={`rounded-pill border px-3.5 py-2 text-[13.5px] font-semi transition-colors duration-(--duration-base) ${
              lens.active ? "border-accent bg-accent text-white" : "border-border bg-surface text-text-secondary"
            }`}
          >
            {lens.label}
          </button>
        ))}
      </div>
    </div>
  );
}
