"use client";

import { useState } from "react";
import { AlertTriangle, ChevronDown, X } from "lucide-react";
import { OwnerPicker } from "@/components/shared/owner-picker";
import type { ProjectStatus } from "@/types";
import type { ProjectFormValues } from "./types";

interface ProjectDrawerProps {
  mode: "create" | "edit";
  initialValues: ProjectFormValues;
  initiatives: { id: string; name: string }[];
  people: { id: string; name: string }[];
  currentUserId: string;
  similarNames: string[];
  onClose: () => void;
  onSave: (values: ProjectFormValues) => Promise<void>;
}

const NAME_MAX = 80;

export function ProjectDrawer({
  mode,
  initialValues,
  initiatives,
  people,
  currentUserId,
  similarNames,
  onClose,
  onSave,
}: ProjectDrawerProps) {
  const [values, setValues] = useState<ProjectFormValues>(initialValues);
  const [saving, setSaving] = useState(false);

  const nameTrim = values.name.trim();
  const similar =
    mode === "create" && nameTrim.length >= 2
      ? similarNames
          .filter((n) => {
            const a = n.toLowerCase();
            const b = nameTrim.toLowerCase();
            return a.includes(b) || b.includes(a);
          })
          .slice(0, 3)
      : [];

  const handleSave = async () => {
    if (!nameTrim || !values.initiativeId) return;
    setSaving(true);
    try {
      await onSave({ ...values, name: nameTrim, description: values.description.trim() });
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div onClick={onClose} className="fixed inset-0 z-60 bg-text-primary/34" />
      <aside className="fixed top-0 right-0 bottom-0 z-61 flex w-[468px] max-w-[92vw] flex-col bg-surface shadow-lg">
        <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-5">
          <h3 className="text-lg font-bold text-text-primary">{mode === "edit" ? "Edit project" : "New project"}</h3>
          <button
            type="button"
            onClick={onClose}
            className="flex h-[32px] w-[32px] flex-none items-center justify-center rounded-sm border border-border text-text-secondary"
          >
            <X size={17} />
          </button>
        </div>

        <div className="flex flex-1 flex-col gap-5 overflow-y-auto px-5.5 py-5.5">
          <div>
            <label className="mb-2 block text-[11px] font-bold uppercase tracking-wide text-text-faint">
              Initiative <span className="text-danger-cta">*</span>
            </label>
            <div className="relative">
              <select
                value={values.initiativeId}
                onChange={(e) => setValues((v) => ({ ...v, initiativeId: e.target.value }))}
                className="w-full appearance-none rounded-sm border border-border bg-surface px-3 py-2.5 text-sm text-text-primary"
              >
                <option value="">Select an initiative…</option>
                {initiatives.map((it) => (
                  <option key={it.id} value={it.id}>
                    {it.name}
                  </option>
                ))}
              </select>
              <ChevronDown size={16} className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-text-faint" />
            </div>
            <div className="mt-1.5 text-[11.5px] leading-body text-text-faint">
              A project must belong to one initiative. Tasks are then added under this project.
            </div>
          </div>

          <div>
            <div className="mb-1.75 flex items-baseline justify-between">
              <label className="text-[11px] font-bold uppercase tracking-wide text-text-faint">
                Name <span className="text-danger-cta">*</span>
              </label>
              <span className="text-[11px] tabular-nums text-text-faint">
                {values.name.length}/{NAME_MAX}
              </span>
            </div>
            <input
              value={values.name}
              maxLength={NAME_MAX}
              onChange={(e) => setValues((v) => ({ ...v, name: e.target.value }))}
              placeholder="e.g. Q3 2026 QPR"
              className="w-full rounded-sm border border-border px-3 py-2.5 text-[14.5px] font-med text-text-primary"
            />
            {similar.length > 0 && (
              <div className="mt-2 flex items-start gap-1.75 rounded-sm bg-warning-light px-2.75 py-2">
                <AlertTriangle size={14} className="mt-0.5 flex-none text-warning" />
                <div className="text-xs leading-body text-warning">
                  Similar already exists: <strong className="font-semi">{similar.join(", ")}</strong>
                </div>
              </div>
            )}
          </div>

          <div>
            <label className="mb-1.75 block text-[11px] font-bold uppercase tracking-wide text-text-faint">Description</label>
            <textarea
              value={values.description}
              onChange={(e) => setValues((v) => ({ ...v, description: e.target.value }))}
              rows={3}
              placeholder="What this project delivers."
              className="w-full resize-y rounded-md border border-border px-3.25 py-2.75 text-sm leading-body text-text-primary"
            />
          </div>

          <div>
            <label className="mb-2 block text-[11px] font-bold uppercase tracking-wide text-text-faint">Status</label>
            <div className="inline-flex gap-1.5">
              {(["active", "inactive"] as ProjectStatus[]).map((s) => {
                const on = values.status === s;
                return (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setValues((v) => ({ ...v, status: s }))}
                    className={`rounded-pill border px-5 py-2 text-[13px] font-semi ${
                      on
                        ? s === "active"
                          ? "border-accent bg-accent text-white"
                          : "border-text-secondary bg-text-secondary text-white"
                        : "border-border bg-surface text-text-secondary"
                    }`}
                  >
                    {s === "active" ? "Active" : "Inactive"}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="mb-2 block text-[11px] font-bold uppercase tracking-wide text-text-faint">Owner</label>
            <OwnerPicker
              value={values.ownerId}
              options={people}
              currentUserId={currentUserId}
              onChange={(id) => setValues((v) => ({ ...v, ownerId: id }))}
            />
          </div>
        </div>

        <div className="flex justify-end gap-2.5 border-t border-border px-5.5 py-3.5">
          <button
            type="button"
            onClick={onClose}
            className="rounded-pill border border-border bg-surface px-4.5 py-2.5 text-sm font-semi text-text-secondary"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={!nameTrim || !values.initiativeId || saving}
            className="rounded-pill bg-text-primary px-[22px] py-2.5 text-sm font-semi text-white disabled:opacity-50"
          >
            {saving ? "Saving…" : mode === "edit" ? "Save changes" : "Create project"}
          </button>
        </div>
      </aside>
    </>
  );
}
