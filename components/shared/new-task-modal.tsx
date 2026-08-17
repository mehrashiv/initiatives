"use client";

import { useState } from "react";
import { ChevronDown, Info, X, AlertCircle } from "lucide-react";
import { OwnerPicker } from "@/components/shared/owner-picker";

export interface ProjectOption {
  id: string;
  name: string;
  initiativeName: string;
}

export interface OwnerOption {
  id: string;
  name: string;
}

export type NewTaskStatus = "to_do" | "in_progress" | "blocked";

export interface NewTaskFormValues {
  name: string;
  description: string;
  projectId: string;
  ownerId: string;
  startDate: string;
  endDate: string;
  status: NewTaskStatus;
}

interface NewTaskModalProps {
  open: boolean;
  projectOptions: ProjectOption[];
  ownerOptions: OwnerOption[];
  currentUserId: string;
  onClose: () => void;
  onCreate: (values: NewTaskFormValues) => void;
}

function todayInputValue(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function emptyForm(currentUserId: string): NewTaskFormValues {
  return {
    name: "",
    description: "",
    projectId: "",
    ownerId: currentUserId,
    startDate: todayInputValue(),
    endDate: "",
    status: "to_do",
  };
}

const STATUS_OPTIONS: { value: NewTaskStatus; label: string }[] = [
  { value: "to_do", label: "To Do" },
  { value: "in_progress", label: "In Progress" },
  { value: "blocked", label: "Blocked" },
];

export function NewTaskModal({
  open,
  projectOptions,
  ownerOptions,
  currentUserId,
  onClose,
  onCreate,
}: NewTaskModalProps) {
  const [form, setForm] = useState<NewTaskFormValues>(() => emptyForm(currentUserId));

  if (!open) return null;

  const selectedProject = projectOptions.find((p) => p.id === form.projectId);
  const isValid = form.name.trim().length > 0 && form.projectId && form.startDate && form.endDate;

  const handleClose = () => {
    setForm(emptyForm(currentUserId));
    onClose();
  };

  const handleSubmit = () => {
    if (!isValid) return;
    onCreate(form);
    setForm(emptyForm(currentUserId));
  };

  return (
    <div
      onClick={handleClose}
      className="fixed inset-0 z-70 flex items-center justify-center bg-text-primary/34 p-5"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-115 max-w-full overflow-hidden rounded-lg bg-surface shadow-lg"
      >
        <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-5">
          <h3 className="text-lg font-bold text-text-primary">New task</h3>
          <button
            type="button"
            onClick={handleClose}
            className="flex h-[32px] w-[32px] flex-none items-center justify-center rounded-sm border border-border text-text-secondary"
          >
            <X size={16} />
          </button>
        </div>

        <div className="flex flex-col gap-4 px-5 py-5">
          <div>
            <label className="mb-1.5 block text-[11.5px] font-bold uppercase tracking-wide text-text-faint">
              Task name <span className="text-danger-cta">*</span>
            </label>
            <input
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="e.g. Record onboarding walkthrough"
              className="w-full rounded-sm border border-border px-3 py-2.5 text-sm text-text-primary"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-[11.5px] font-bold uppercase tracking-wide text-text-faint">
              Description
            </label>
            <textarea
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              rows={2}
              placeholder="Optional — you can add or edit this later"
              className="w-full rounded-md border border-border px-3 py-2.5 text-sm leading-body text-text-primary"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-[11.5px] font-bold uppercase tracking-wide text-text-faint">
              Project <span className="text-danger-cta">*</span>
            </label>
            <div className="relative">
              <select
                value={form.projectId}
                onChange={(e) => setForm((f) => ({ ...f, projectId: e.target.value }))}
                className="w-full cursor-pointer appearance-none rounded-sm border border-border bg-surface px-3 py-2.5 pr-9.5 text-sm text-text-primary"
              >
                <option value="">Select a project…</option>
                {projectOptions.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
              <ChevronDown
                size={16}
                className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-text-faint"
              />
            </div>
            {selectedProject && (
              <div className="mt-2 inline-flex items-center gap-1.5 text-xs text-text-secondary">
                <span className="text-[11px] font-semi uppercase tracking-wide text-text-faint">Initiative</span>
                <span className="inline-flex items-center gap-1 rounded-pill bg-accent-lightest px-2.5 py-0.5 text-xs font-semi text-accent">
                  {selectedProject.initiativeName}
                </span>
              </div>
            )}
            {projectOptions.length === 0 && (
              <div className="mt-2 flex items-start gap-1.75 rounded-sm bg-warning-light px-2.75 py-2 text-xs leading-body text-warning">
                <AlertCircle size={14} className="mt-0.5 flex-none" />
                No active projects yet — create a project first, then add tasks to it.
              </div>
            )}
          </div>

          <div>
            <label className="mb-1.5 block text-[11.5px] font-bold uppercase tracking-wide text-text-faint">
              Owner
            </label>
            <OwnerPicker
              value={form.ownerId}
              options={ownerOptions}
              currentUserId={currentUserId}
              onChange={(id) => setForm((f) => ({ ...f, ownerId: id }))}
            />
          </div>

          <div className="flex gap-3.5">
            <div className="flex-1">
              <label className="mb-1.5 block text-[11.5px] font-bold uppercase tracking-wide text-text-faint">
                Start date <span className="text-danger-cta">*</span>
              </label>
              <input
                type="date"
                value={form.startDate}
                onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))}
                className="w-full rounded-sm border border-border px-3 py-2.25 text-sm text-text-primary"
              />
            </div>
            <div className="flex-1">
              <label className="mb-1.5 block text-[11.5px] font-bold uppercase tracking-wide text-text-faint">
                End date <span className="text-danger-cta">*</span>
              </label>
              <input
                type="date"
                value={form.endDate}
                onChange={(e) => setForm((f) => ({ ...f, endDate: e.target.value }))}
                className="w-full rounded-sm border border-border px-3 py-2.25 text-sm text-text-primary"
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-[11.5px] font-bold uppercase tracking-wide text-text-faint">
              Status
            </label>
            <select
              value={form.status}
              onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as NewTaskStatus }))}
              className="w-full cursor-pointer rounded-sm border border-border bg-surface px-3 py-2.5 text-sm text-text-primary"
            >
              {STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-start gap-2.25 rounded-sm bg-surface-subtle px-3.25 py-2.75 text-xs leading-body text-text-secondary">
            <Info size={15} className="mt-0.5 flex-none text-accent" />
            <span>
              Progress starts at 0% and the created &amp; updated dates are set automatically. Edit anything later
              from the task.
            </span>
          </div>
        </div>

        <div className="flex justify-end gap-2.5 border-t border-border px-5 py-4">
          <button
            type="button"
            onClick={handleClose}
            className="rounded-pill border border-border bg-surface px-4.5 py-2.5 text-sm font-semi text-text-secondary"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!isValid}
            className="rounded-pill bg-text-primary px-[20px] py-2.5 text-sm font-semi text-white disabled:opacity-40"
          >
            Create task
          </button>
        </div>
      </div>
    </div>
  );
}
