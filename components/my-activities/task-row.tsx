"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Flag, MessageCircle, AlertCircle, Clock } from "lucide-react";
import posthog from "posthog-js";
import { formatShortDate, getInitials } from "@/lib/dates";
import { StatusBadge } from "@/components/shared/status-badge";
import { timingFor, staleLabel } from "./task-helpers";
import type { ActivityTask } from "./types";

interface TaskRowProps {
  task: ActivityTask;
  today: Date;
  showOwner: boolean;
  borderClassName: string;
  onMarkDone: (id: string) => void;
  onToggleFollowUp: (id: string) => void;
  onAddNote: (id: string, text: string) => Promise<boolean>;
}

export function TaskRow({
  task,
  today,
  showOwner,
  borderClassName,
  onMarkDone,
  onToggleFollowUp,
  onAddNote,
}: TaskRowProps) {
  const router = useRouter();
  const timing = timingFor(task, today);
  const stale = staleLabel(task, today);
  const [noteOpen, setNoteOpen] = useState(false);
  const [noteText, setNoteText] = useState("");
  const [noteSaving, setNoteSaving] = useState(false);

  const handleSaveNote = async () => {
    const text = noteText.trim();
    if (!text) return;
    setNoteSaving(true);
    const ok = await onAddNote(task.id, text);
    setNoteSaving(false);
    if (ok) {
      setNoteText("");
      setNoteOpen(false);
    }
  };

  return (
    <div className={`border-b border-l-[3px] border-border ${borderClassName}`}>
      <div
        onClick={() => {
          posthog.capture("task_clicked", {
            task_id: task.id,
            task_name: task.name,
            status: task.status,
            initiative: task.initiativeName,
            project: task.projectName,
          });
          router.push(`/tasks/${task.id}`);
        }}
        className="flex cursor-pointer items-center gap-4 py-3.75 pl-4.25 pr-[20px] transition-colors duration-(--duration-base) hover:bg-surface-subtle"
      >
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2.25">
          <span className="text-[14.5px] font-semi text-text-primary">{task.name}</span>
          {task.followUp && <Flag size={14} className="fill-warning text-warning" />}
        </div>
        <div className="mt-1.25 flex flex-wrap items-center gap-2">
          <span className="text-xs text-text-faint">
            {task.initiativeName} · {task.projectName}
          </span>
          <StatusBadge status={task.status} />
          {task.blockedReason && (
            <span className="inline-flex items-center gap-1.25 text-xs font-semi text-danger-cta">
              <AlertCircle size={12} />
              Blocked · {task.blockedReason}
            </span>
          )}
          {stale && (
            <span className="inline-flex items-center gap-1.25 text-xs font-semi text-warning">
              <Clock size={12} />
              {stale}
            </span>
          )}
          {task.newNoteCount > 0 && (
            <span className="inline-flex items-center gap-1.25 text-xs font-semi text-accent">
              <MessageCircle size={12} />
              {task.newNoteCount} new {task.newNoteCount > 1 ? "notes" : "note"}
            </span>
          )}
        </div>
      </div>

      <div className="w-35 flex-none">
        <div className="flex items-center gap-2.25">
          <div className="h-1.5 flex-1 overflow-hidden rounded-pill bg-surface-inset">
            <div
              className="h-full rounded-pill [background:var(--gradient-cta)]"
              style={{ width: `${task.progress}%` }}
            />
          </div>
          <span className="min-w-[32px] text-right text-xs tabular-nums text-text-secondary">{task.progress}%</span>
        </div>
      </div>

      <div className="flex w-30 flex-none flex-col gap-1">
        <span className="text-sm font-med text-text-primary">{formatShortDate(task.endDate)}</span>
        <span className={`inline-flex w-fit items-center whitespace-nowrap rounded-pill px-2.25 py-0.5 text-xs font-semi ${timing.className}`}>
          {timing.text}
        </span>
      </div>

      {showOwner && (
        <div className="flex w-32.5 flex-none items-center gap-2 text-[13px] text-text-secondary">
          <span className="flex h-[26px] w-[26px] flex-none items-center justify-center rounded-full bg-accent-lightest text-[10.5px] font-bold text-accent">
            {getInitials(task.ownerName)}
          </span>
          <span className="overflow-hidden truncate whitespace-nowrap">{task.ownerName}</span>
        </div>
      )}

      <div className="flex flex-none items-center gap-1">
        <button
          type="button"
          title="Mark done"
          onClick={(e) => {
            e.stopPropagation();
            onMarkDone(task.id);
          }}
          className="flex h-[32px] w-[32px] items-center justify-center rounded-sm border border-border bg-surface text-text-faint hover:border-success-light hover:bg-success-light hover:text-success-dark"
        >
          <Check size={16} />
        </button>
        <button
          type="button"
          title="Flag for follow-up"
          onClick={(e) => {
            e.stopPropagation();
            onToggleFollowUp(task.id);
          }}
          className={`flex h-[32px] w-[32px] items-center justify-center rounded-sm border ${
            task.followUp
              ? "border-warning-light bg-warning-light text-warning"
              : "border-border bg-surface text-text-faint hover:border-warning-light hover:bg-warning-light hover:text-warning"
          }`}
        >
          <Flag size={16} />
        </button>
        <button
          type="button"
          title="Add note"
          onClick={(e) => {
            e.stopPropagation();
            setNoteOpen((v) => !v);
          }}
          className={`flex h-[32px] w-[32px] items-center justify-center rounded-sm border ${
            noteOpen
              ? "border-accent-lightest bg-accent-lightest text-accent"
              : "border-border bg-surface text-text-faint hover:border-accent-lightest hover:bg-accent-lightest hover:text-accent"
          }`}
        >
          <MessageCircle size={16} />
        </button>
      </div>
      </div>

      {noteOpen && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="border-t border-border bg-surface-subtle px-4.25 py-3"
        >
          <textarea
            autoFocus
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            placeholder="Add a quick note…"
            rows={2}
            className="w-full rounded-md border border-border bg-surface px-3 py-2.5 text-sm leading-body text-text-primary"
          />
          <div className="mt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => {
                setNoteText("");
                setNoteOpen(false);
              }}
              className="rounded-pill border border-border bg-surface px-3.5 py-1.5 text-xs font-semi text-text-secondary"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSaveNote}
              disabled={!noteText.trim() || noteSaving}
              className="rounded-pill bg-text-primary px-4 py-1.5 text-xs font-semi text-white disabled:opacity-40"
            >
              Save
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
