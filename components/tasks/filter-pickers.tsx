"use client";

import { useState, type ReactNode } from "react";
import { Check, ChevronDown } from "lucide-react";

export interface FilterPickerOption {
  id: string;
  label: string;
  // Optional leading visual (status dot, owner initials) and trailing hint (project's initiative).
  leading?: ReactNode;
  hint?: string;
}

interface TriggerProps {
  label: string;
  summary: string;
  active: boolean;
  count: number;
  open: boolean;
  onClick: () => void;
}

// Pill trigger shared by both pickers: "Label  Summary  [n]  ⌄", tinted accent once a filter is set.
function Trigger({ label, summary, active, count, open, onClick }: TriggerProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-expanded={open}
      className={`flex min-w-44 items-center max-sm:min-w-0 gap-2 rounded-pill border px-3.5 py-2.25 text-left text-[13.5px] font-semi ${
        active ? "border-accent bg-accent-lightest text-accent" : "border-border bg-surface text-text-primary"
      }`}
    >
      <span className={`text-xs font-semi ${active ? "text-accent" : "text-text-faint"}`}>{label}</span>
      <span className="max-w-42 flex-1 truncate">{summary}</span>
      {count > 1 && (
        <span className="rounded-pill bg-accent px-1.75 py-px text-[11px] font-bold text-white">{count}</span>
      )}
      <ChevronDown size={16} className="flex-none text-text-faint" aria-hidden="true" />
    </button>
  );
}

function Menu({ title, action, children }: { title: string; action?: ReactNode; children: ReactNode }) {
  return (
    <div className="absolute top-[calc(100%+6px)] left-0 z-63 max-h-80 min-w-65 overflow-y-auto max-sm:min-w-60 rounded-md border border-border bg-surface p-1.5 shadow-lg">
      <div className="flex items-center justify-between px-2.5 pt-1.5 pb-2 text-[11px] font-bold uppercase tracking-wide text-text-faint">
        <span>{title}</span>
        {action}
      </div>
      {children}
    </div>
  );
}

function OptionBody({ option }: { option: FilterPickerOption }) {
  return (
    <>
      {option.leading}
      <span className="flex-1">{option.label}</span>
      {option.hint && <span className="text-xs text-text-faint">{option.hint}</span>}
    </>
  );
}

interface FilterSelectProps {
  label: string;
  menuTitle: string;
  allLabel: string;
  allHint?: string;
  value: string;
  options: FilterPickerOption[];
  onChange: (id: string) => void;
}

// Single select; "" means no filter.
export function FilterSelect({ label, menuTitle, allLabel, allHint, value, options, onChange }: FilterSelectProps) {
  const [open, setOpen] = useState(false);
  const current = options.find((o) => o.id === value);
  const rows: FilterPickerOption[] = [{ id: "", label: allLabel, hint: allHint }, ...options];

  return (
    <div className="relative">
      <Trigger
        label={label}
        summary={current?.label ?? allLabel}
        active={!!current}
        count={0}
        open={open}
        onClick={() => setOpen((v) => !v)}
      />
      {open && (
        <>
          <div onClick={() => setOpen(false)} className="fixed inset-0 z-62" />
          <Menu title={menuTitle}>
            {rows.map((option) => (
              <button
                key={option.id || "all"}
                type="button"
                onClick={() => {
                  onChange(option.id);
                  setOpen(false);
                }}
                className={`flex w-full items-center gap-2.5 rounded-sm px-2.5 py-1.75 text-left text-[13.5px] text-text-primary hover:bg-surface-subtle ${
                  value === option.id ? "bg-accent-lightest" : ""
                }`}
              >
                <OptionBody option={option} />
                {value === option.id && <Check size={16} className="text-accent" aria-hidden="true" />}
              </button>
            ))}
          </Menu>
        </>
      )}
    </div>
  );
}

interface FilterMultiSelectProps {
  label: string;
  menuTitle: string;
  // Plural noun for the summary: "All projects" / "3 projects".
  noun: string;
  values: string[];
  options: FilterPickerOption[];
  onChange: (ids: string[]) => void;
}

// Multiselect; an empty selection means no filter. Stays open while toggling.
export function FilterMultiSelect({ label, menuTitle, noun, values, options, onChange }: FilterMultiSelectProps) {
  const [open, setOpen] = useState(false);
  const selected = options.filter((o) => values.includes(o.id));
  const summary =
    selected.length === 0 ? `All ${noun}` : selected.length === 1 ? selected[0].label : `${selected.length} ${noun}`;

  const toggle = (id: string) =>
    onChange(values.includes(id) ? values.filter((v) => v !== id) : [...values, id]);

  return (
    <div className="relative">
      <Trigger
        label={label}
        summary={summary}
        active={selected.length > 0}
        count={selected.length}
        open={open}
        onClick={() => setOpen((v) => !v)}
      />
      {open && (
        <>
          <div onClick={() => setOpen(false)} className="fixed inset-0 z-62" />
          <Menu
            title={menuTitle}
            action={
              values.length > 0 && (
                <button
                  type="button"
                  onClick={() => onChange([])}
                  className="text-xs font-semi normal-case tracking-normal text-accent"
                >
                  Clear
                </button>
              )
            }
          >
            {options.length === 0 && <div className="px-2.5 py-2 text-[13px] text-text-faint">Nothing to pick</div>}
            {options.map((option) => {
              const on = values.includes(option.id);
              return (
                <button
                  key={option.id}
                  type="button"
                  role="menuitemcheckbox"
                  aria-checked={on}
                  onClick={() => toggle(option.id)}
                  className={`flex w-full items-center gap-2.5 rounded-sm px-2.5 py-1.75 text-left text-[13.5px] text-text-primary hover:bg-surface-subtle ${
                    on ? "bg-accent-lightest" : ""
                  }`}
                >
                  <span
                    className={`flex h-4 w-4 flex-none items-center justify-center rounded-xs border-[1.5px] ${
                      on ? "border-accent bg-accent" : "border-border-strong bg-surface"
                    }`}
                  >
                    {on && <Check size={11} strokeWidth={3.5} className="text-white" aria-hidden="true" />}
                  </span>
                  <OptionBody option={option} />
                </button>
              );
            })}
          </Menu>
        </>
      )}
    </div>
  );
}
