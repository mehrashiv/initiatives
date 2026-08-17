"use client";

import { useState } from "react";
import { AlertTriangle, Plus, X } from "lucide-react";
import { OwnerPicker } from "@/components/shared/owner-picker";
import type { InitiativeStatus } from "@/types";
import type { InitiativeFormValues } from "./types";

interface InitiativeDrawerProps {
  mode: "create" | "edit";
  initialValues: InitiativeFormValues;
  categories: string[];
  people: { id: string; name: string }[];
  currentUserId: string;
  similarNames: string[];
  onClose: () => void;
  onSave: (values: InitiativeFormValues) => Promise<void>;
}

const NAME_MAX = 80;

export function InitiativeDrawer({
  mode,
  initialValues,
  categories,
  people,
  currentUserId,
  similarNames,
  onClose,
  onSave,
}: InitiativeDrawerProps) {
  const [values, setValues] = useState<InitiativeFormValues>(initialValues);
  const [localCategories, setLocalCategories] = useState(categories);
  const [addingCategory, setAddingCategory] = useState(false);
  const [categoryDraft, setCategoryDraft] = useState("");
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

  const confirmCategory = () => {
    const c = categoryDraft.trim();
    if (!c) return;
    setLocalCategories((prev) => (prev.includes(c) ? prev : [...prev, c]));
    setValues((v) => ({ ...v, category: c }));
    setAddingCategory(false);
    setCategoryDraft("");
  };

  const handleSave = async () => {
    if (!nameTrim) return;
    setSaving(true);
    try {
      await onSave({ ...values, name: nameTrim, goal: values.goal.trim() });
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div onClick={onClose} className="fixed inset-0 z-60 bg-text-primary/34" />
      <aside className="fixed top-0 right-0 bottom-0 z-61 flex w-[468px] max-w-[92vw] flex-col bg-surface shadow-lg">
        <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-5">
          <h3 className="text-lg font-bold text-text-primary">{mode === "edit" ? "Edit initiative" : "New initiative"}</h3>
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
              placeholder="e.g. FY26 Product Roadmap"
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
            <label className="mb-1.75 block text-[11px] font-bold uppercase tracking-wide text-text-faint">Goal</label>
            <textarea
              value={values.goal}
              onChange={(e) => setValues((v) => ({ ...v, goal: e.target.value }))}
              rows={3}
              placeholder={'The outcome you\'re driving — e.g. "Align H2 delivery across the platform org."'}
              className="w-full resize-y rounded-md border border-border px-3.25 py-2.75 text-sm leading-body text-text-primary"
            />
            <div className="mt-1.5 text-[11.5px] leading-body text-text-faint">
              Name is what it&apos;s called; the goal is the outcome. Visible to collaborators.
            </div>
          </div>

          <div>
            <label className="mb-2 block text-[11px] font-bold uppercase tracking-wide text-text-faint">Category</label>
            <div className="flex flex-wrap gap-1.5">
              {localCategories.map((c) => {
                const on = values.category === c;
                return (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setValues((v) => ({ ...v, category: c }))}
                    className={`rounded-pill border px-3.25 py-1.5 text-[12.5px] font-semi ${
                      on ? "border-accent bg-accent-lightest text-accent" : "border-border bg-surface text-text-secondary"
                    }`}
                  >
                    {c}
                  </button>
                );
              })}
              {addingCategory ? (
                <span className="inline-flex items-center gap-1.5 rounded-pill border border-accent py-0.75 pr-1.25 pl-2.75">
                  <input
                    autoFocus
                    value={categoryDraft}
                    onChange={(e) => setCategoryDraft(e.target.value)}
                    placeholder="New category"
                    className="w-27 border-none bg-transparent text-[12.5px] text-text-primary outline-none"
                  />
                  <button
                    type="button"
                    onClick={confirmCategory}
                    className="flex h-[24px] w-[24px] items-center justify-center rounded-full bg-accent text-white"
                  >
                    <Plus size={13} />
                  </button>
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => setAddingCategory(true)}
                  className="inline-flex items-center gap-1.25 rounded-pill border border-dashed border-border px-3 py-1.5 text-[12.5px] font-semi text-text-secondary"
                >
                  <Plus size={13} />
                  New
                </button>
              )}
            </div>
          </div>

          <div>
            <label className="mb-2 block text-[11px] font-bold uppercase tracking-wide text-text-faint">Status</label>
            <div className="inline-flex gap-1.5">
              {(["active", "inactive"] as InitiativeStatus[]).map((s) => {
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
            disabled={!nameTrim || saving}
            className="rounded-pill bg-text-primary px-[22px] py-2.5 text-sm font-semi text-white disabled:opacity-50"
          >
            {saving ? "Saving…" : mode === "edit" ? "Save changes" : "Create initiative"}
          </button>
        </div>
      </aside>
    </>
  );
}
