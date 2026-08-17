"use client";

import { useState } from "react";
import { Check, ChevronDown, Search } from "lucide-react";
import { getInitials } from "@/lib/dates";

interface OwnerOption {
  id: string;
  name: string;
}

interface OwnerPickerProps {
  value: string;
  options: OwnerOption[];
  currentUserId: string;
  onChange: (id: string) => void;
}

export function OwnerPicker({ value, options, currentUserId, onChange }: OwnerPickerProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const nameFor = (id: string) => options.find((o) => o.id === id)?.name ?? "?";
  const currentOption = options.find((o) => o.id === currentUserId);
  const suggested = [
    ...(currentOption ? [currentOption] : []),
    ...options.filter((o) => o.id !== currentUserId),
  ].slice(0, 4);
  const filtered = options.filter((o) => o.name.toLowerCase().includes(query.toLowerCase()));

  const select = (id: string) => {
    onChange(id);
    setOpen(false);
    setQuery("");
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-2.25 rounded-sm border border-border bg-surface px-2.75 py-1.75 text-left"
      >
        <span className="flex h-[24px] w-[24px] flex-none items-center justify-center rounded-full bg-accent-lightest text-[10px] font-bold text-accent">
          {getInitials(nameFor(value))}
        </span>
        <span className="text-sm font-med text-text-primary">{nameFor(value)}</span>
        <ChevronDown size={16} className="ml-auto text-text-faint" />
      </button>

      {open && (
        <>
          <div onClick={() => setOpen(false)} className="fixed inset-0 z-62" />
          <div className="absolute top-[calc(100%+6px)] right-0 left-0 z-63 flex max-h-75 flex-col rounded-md border border-border bg-surface p-2.25 shadow-lg">
            <div className="mb-2.25 flex flex-none items-center gap-2 rounded-sm border border-border px-2.5 py-1.75">
              <Search size={15} className="text-text-faint" />
              <input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search people"
                className="min-w-0 flex-1 border-none bg-transparent text-[13.5px] text-text-primary outline-none"
              />
            </div>

            {!query && (
              <>
                <div className="mb-1.75 px-0.5 text-[10.5px] font-bold uppercase tracking-wide text-text-faint">
                  Suggested
                </div>
                <div className="mb-2.5 flex flex-none flex-wrap gap-1.5">
                  {suggested.map((option) => {
                    const on = value === option.id;
                    return (
                      <button
                        key={option.id}
                        type="button"
                        onClick={() => select(option.id)}
                        className={`inline-flex items-center gap-1.75 rounded-pill border py-1 pr-2.75 pl-1.25 text-xs font-semi ${
                          on ? "border-accent bg-accent-lightest text-accent" : "border-border bg-surface text-text-secondary"
                        }`}
                      >
                        <span
                          className={`flex h-[20px] w-[20px] items-center justify-center rounded-full text-[9px] font-bold ${
                            on ? "bg-accent text-white" : "bg-accent-lightest text-accent"
                          }`}
                        >
                          {getInitials(option.name)}
                        </span>
                        {option.id === currentUserId ? `${option.name} (me)` : option.name}
                      </button>
                    );
                  })}
                </div>
                <div className="mb-2 h-px flex-none bg-border" />
              </>
            )}

            <div className="-mx-0.75 overflow-y-auto">
              {filtered.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => select(option.id)}
                  className={`flex w-full items-center gap-2.5 rounded-sm px-2.25 py-1.75 text-left text-[13.5px] text-text-primary hover:bg-surface-subtle ${
                    value === option.id ? "bg-accent-lightest" : ""
                  }`}
                >
                  <span className="flex h-[24px] w-[24px] flex-none items-center justify-center rounded-full bg-accent-lightest text-[10px] font-bold text-accent">
                    {getInitials(option.name)}
                  </span>
                  <span className="flex-1">{option.id === currentUserId ? `${option.name} (me)` : option.name}</span>
                  {value === option.id && <Check size={16} className="text-accent" />}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
