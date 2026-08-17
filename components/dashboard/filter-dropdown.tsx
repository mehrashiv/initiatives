"use client";

import { useState, type ReactNode } from "react";
import { Check, ChevronDown } from "lucide-react";

export interface FilterDropdownOption {
  id: string;
  label: string;
}

interface FilterDropdownProps {
  icon?: ReactNode;
  value: string;
  options: FilterDropdownOption[];
  onChange: (id: string) => void;
}

export function FilterDropdown({ icon, value, options, onChange }: FilterDropdownProps) {
  const [open, setOpen] = useState(false);
  const current = options.find((o) => o.id === value);

  const select = (id: string) => {
    onChange(id);
    setOpen(false);
  };

  return (
    <div className="relative flex-1">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-2.25 rounded-sm border border-border bg-surface px-3.25 py-2.5 text-left"
      >
        {icon && <span className="flex-none text-accent">{icon}</span>}
        <span className="text-sm font-med text-text-primary">{current?.label ?? "—"}</span>
        <ChevronDown size={16} className="ml-auto flex-none text-text-faint" />
      </button>

      {open && (
        <>
          <div onClick={() => setOpen(false)} className="fixed inset-0 z-62" />
          <div className="absolute top-[calc(100%+6px)] right-0 left-0 z-63 max-h-75 overflow-y-auto rounded-md border border-border bg-surface p-1.5 shadow-lg">
            {options.map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => select(option.id)}
                className={`flex w-full items-center gap-2.5 rounded-sm px-2.5 py-1.75 text-left text-[13.5px] text-text-primary hover:bg-surface-subtle ${
                  value === option.id ? "bg-accent-lightest" : ""
                }`}
              >
                <span className="flex-1">{option.label}</span>
                {value === option.id && <Check size={16} className="text-accent" />}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
