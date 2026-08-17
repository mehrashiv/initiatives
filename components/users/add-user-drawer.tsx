"use client";

import { useState } from "react";
import { AlertCircle, Eye, EyeOff, X } from "lucide-react";
import type { NewUserFormValues } from "./types";
import type { Role } from "@/types";

interface AddUserDrawerProps {
  open: boolean;
  existingEmails: string[];
  onClose: () => void;
  onCreate: (values: NewUserFormValues) => Promise<void>;
}

const ROLE_OPTIONS: { key: Role; label: string; hint: string }[] = [
  { key: "user", label: "User", hint: "Standard access — sees only their own activity." },
  { key: "admin", label: "Administrator", hint: "Full access — manage users, see all team activity." },
];

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function emptyForm(): NewUserFormValues {
  return { email: "", password: "", role: "user" };
}

export function AddUserDrawer({ open, existingEmails, onClose, onCreate }: AddUserDrawerProps) {
  const [form, setForm] = useState<NewUserFormValues>(emptyForm);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (!open) return null;

  const handleClose = () => {
    setForm(emptyForm());
    setError("");
    setShowPassword(false);
    onClose();
  };

  const handleSubmit = async () => {
    const email = form.email.trim();
    if (!email) return setError("Enter an email address.");
    if (!EMAIL_RE.test(email)) return setError("Enter a valid email address.");
    if (existingEmails.some((e) => e.toLowerCase() === email.toLowerCase())) {
      return setError("A user with this email already exists.");
    }
    if (form.password.length < 8) return setError("Password must be at least 8 characters.");

    setSubmitting(true);
    setError("");
    try {
      await onCreate({ ...form, email });
      setForm(emptyForm());
      setShowPassword(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add user.");
    } finally {
      setSubmitting(false);
    }
  };

  const passwordHint =
    form.password.length === 0 ? "8+ characters" : form.password.length >= 8 ? "Strong enough" : `${form.password.length} / 8`;

  return (
    <>
      <div onClick={handleClose} className="fixed inset-0 z-60 bg-text-primary/34" />
      <aside className="fixed top-0 right-0 bottom-0 z-61 flex w-[468px] max-w-[92vw] flex-col bg-surface shadow-lg">
        <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-5">
          <h3 className="text-lg font-bold text-text-primary">Add user</h3>
          <button
            type="button"
            onClick={handleClose}
            className="flex h-[32px] w-[32px] flex-none items-center justify-center rounded-sm border border-border text-text-secondary"
          >
            <X size={17} />
          </button>
        </div>

        <div className="flex flex-1 flex-col gap-5 overflow-y-auto px-5.5 py-5.5">
          <div>
            <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wide text-text-faint">
              Email <span className="text-danger-cta">*</span>
            </label>
            <input
              value={form.email}
              onChange={(e) => {
                setForm((f) => ({ ...f, email: e.target.value }));
                setError("");
              }}
              type="email"
              autoComplete="off"
              placeholder="name@nilesecure.com"
              className="w-full rounded-sm border border-border px-3 py-2.5 text-sm text-text-primary"
            />
          </div>

          <div>
            <div className="mb-1.5 flex items-baseline justify-between">
              <label className="text-[11px] font-bold uppercase tracking-wide text-text-faint">
                Password <span className="text-danger-cta">*</span>
              </label>
              <span
                className={`text-[11px] tabular-nums ${form.password.length >= 8 ? "text-success-dark" : "text-text-faint"}`}
              >
                {passwordHint}
              </span>
            </div>
            <div className="flex items-center gap-2 rounded-sm border border-border pr-2.5">
              <input
                value={form.password}
                onChange={(e) => {
                  setForm((f) => ({ ...f, password: e.target.value }));
                  setError("");
                }}
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                placeholder="At least 8 characters"
                className="min-w-0 flex-1 border-none bg-transparent px-3 py-2.5 text-sm text-text-primary outline-none"
              />
              <button
                type="button"
                aria-label="Toggle password visibility"
                onClick={() => setShowPassword((v) => !v)}
                className="flex h-[28px] w-[28px] flex-none items-center justify-center text-text-faint"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div>
            <label className="mb-2 block text-[11px] font-bold uppercase tracking-wide text-text-faint">Role</label>
            <div className="flex gap-2">
              {ROLE_OPTIONS.map((option) => {
                const active = form.role === option.key;
                return (
                  <button
                    key={option.key}
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, role: option.key }))}
                    className={`flex-1 rounded-sm border px-3 py-2.5 text-[13.5px] font-semi ${
                      active ? "border-accent bg-accent text-white" : "border-border bg-surface text-text-secondary"
                    }`}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
            <div className="mt-2 text-xs leading-body text-text-faint">
              {ROLE_OPTIONS.find((o) => o.key === form.role)?.hint}
            </div>
          </div>

          {error && (
            <div className="flex items-start gap-2 rounded-sm bg-danger-light px-3 py-2.5 text-xs leading-body text-danger-cta">
              <AlertCircle size={16} className="mt-0.5 flex-none" />
              <span>{error}</span>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2.5 border-t border-border px-5.5 py-3.5">
          <button
            type="button"
            onClick={handleClose}
            className="rounded-sm border border-border bg-surface px-4.5 py-2.5 text-sm font-semi text-text-secondary"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            className="rounded-sm bg-text-primary px-[22px] py-2.5 text-sm font-semi text-white disabled:opacity-40"
          >
            {submitting ? "Adding…" : "Add user"}
          </button>
        </div>
      </aside>
    </>
  );
}
