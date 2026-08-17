"use client";

import { useState } from "react";
import {
  AtSign,
  CheckCircle2,
  Flag,
  Paperclip,
  Pencil,
  Pin,
  Plus,
  RefreshCw,
  Trash2,
  TrendingUp,
  UserCog,
} from "lucide-react";
import { formatLongDate, formatRelativeTime, getInitials } from "@/lib/dates";
import type { ActivityKind } from "@/types";
import type { TimelineEntry } from "./types";

const AUTO_EVENT_ICON: Record<Exclude<ActivityKind, "note">, { Icon: typeof Plus; bg: string; fg: string }> = {
  created: { Icon: Plus, bg: "bg-accent-lightest", fg: "text-accent" },
  status: { Icon: RefreshCw, bg: "bg-surface-inset", fg: "text-text-secondary" },
  owner: { Icon: UserCog, bg: "bg-accent-lightest", fg: "text-accent" },
  progress: { Icon: TrendingUp, bg: "bg-accent-lightest", fg: "text-accent" },
  completed: { Icon: CheckCircle2, bg: "bg-success-light", fg: "text-success-dark" },
  flag: { Icon: Flag, bg: "bg-warning-light", fg: "text-warning" },
};

interface ActivityTimelineProps {
  entries: TimelineEntry[];
  currentUserId: string;
  currentUserName: string;
  today: Date;
  onAddNote: (text: string) => void;
  onTogglePin: (id: string) => void;
  onEditNote: (id: string, text: string) => void;
  onDeleteNote: (id: string) => void;
}

export function ActivityTimeline({
  entries,
  currentUserId,
  currentUserName,
  today,
  onAddNote,
  onTogglePin,
  onEditNote,
  onDeleteNote,
}: ActivityTimelineProps) {
  const [filter, setFilter] = useState<"all" | "notes">("notes");
  const [noteDraft, setNoteDraft] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState("");

  const sorted = [...entries].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  const pinned = sorted.filter((e) => e.pinned);
  const visible = filter === "notes" ? sorted.filter((e) => e.kind === "note") : sorted;
  const noteCount = entries.filter((e) => e.kind === "note").length;

  const submitNote = () => {
    const text = noteDraft.trim();
    if (!text) return;
    onAddNote(text);
    setNoteDraft("");
  };

  const startEdit = (entry: TimelineEntry) => {
    setEditingId(entry.id);
    setEditDraft(entry.text);
  };

  const saveEdit = () => {
    const text = editDraft.trim();
    if (editingId && text) onEditNote(editingId, text);
    setEditingId(null);
    setEditDraft("");
  };

  return (
    <section>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3.5">
        <div className="flex items-baseline gap-2.5">
          <h2 className="text-lg font-bold tracking-tight text-text-primary">Activity</h2>
          <span className="text-sm text-text-faint">
            {entries.length} events · {noteCount} notes
          </span>
        </div>
        <div className="flex gap-[3px] rounded-pill border border-border bg-surface-inset p-[3px]">
          <button
            type="button"
            onClick={() => setFilter("all")}
            className={`rounded-pill px-3.75 py-1.5 text-[13px] font-semi ${
              filter === "all" ? "bg-surface text-text-primary shadow-xs" : "bg-transparent text-text-secondary"
            }`}
          >
            All activity
          </button>
          <button
            type="button"
            onClick={() => setFilter("notes")}
            className={`rounded-pill px-3.75 py-1.5 text-[13px] font-semi ${
              filter === "notes" ? "bg-surface text-text-primary shadow-xs" : "bg-transparent text-text-secondary"
            }`}
          >
            Notes
          </button>
        </div>
      </div>

      {/* compose */}
      <div className="mb-5 flex gap-3.25 rounded-lg border border-border bg-surface p-4 shadow-xs">
        <span className="flex h-[36px] w-[36px] flex-none items-center justify-center rounded-full text-[12.5px] font-bold text-white [background:var(--gradient-logo-mark-linear)]">
          {getInitials(currentUserName)}
        </span>
        <div className="min-w-0 flex-1">
          <textarea
            value={noteDraft}
            onChange={(e) => setNoteDraft(e.target.value)}
            rows={3}
            placeholder="Write a note or share an update…"
            className="w-full rounded-md border border-border px-3.25 py-2.75 text-sm leading-body text-text-primary"
          />
          <div className="mt-2.5 flex items-center gap-1.5">
            <button
              type="button"
              title="Mention someone"
              disabled
              className="flex h-[34px] w-[34px] cursor-not-allowed items-center justify-center rounded-sm border border-border bg-surface text-text-secondary"
            >
              <AtSign size={17} />
            </button>
            <button
              type="button"
              title="Attach a file"
              disabled
              className="flex h-[34px] w-[34px] cursor-not-allowed items-center justify-center rounded-sm border border-border bg-surface text-text-secondary"
            >
              <Paperclip size={17} />
            </button>
            <button
              type="button"
              onClick={submitNote}
              disabled={!noteDraft.trim()}
              className="ml-auto rounded-pill bg-accent px-4.5 py-2.25 text-[13.5px] font-semi text-white disabled:opacity-40"
            >
              Add note
            </button>
          </div>
        </div>
      </div>

      {/* pinned */}
      {pinned.length > 0 && (
        <div className="mb-5.5">
          <div className="mb-2.5 flex items-center gap-1.75 text-xs font-bold uppercase tracking-wide text-text-faint">
            <Pin size={13} className="fill-warning text-warning" />
            Pinned
          </div>
          <div className="flex flex-col gap-2.5">
            {pinned.map((entry) => (
              <div key={`pinned-${entry.id}`} className="rounded-md border border-warning-light bg-warning-light/40 p-3.25">
                <div className="mb-1.5 flex items-center gap-2.25">
                  <span className="flex h-[26px] w-[26px] flex-none items-center justify-center rounded-full bg-accent-lightest text-[10px] font-bold text-accent">
                    {getInitials(entry.whoName)}
                  </span>
                  <strong className="text-[13px] text-text-primary">{entry.whoName}</strong>
                  <span title={formatLongDate(entry.createdAt)} className="text-xs text-text-faint">
                    {formatRelativeTime(entry.createdAt, today)}
                  </span>
                  <button
                    type="button"
                    title="Unpin"
                    onClick={() => onTogglePin(entry.id)}
                    className="ml-auto flex items-center text-warning"
                  >
                    <Pin size={15} className="fill-warning" />
                  </button>
                </div>
                <p className="m-0 whitespace-pre-wrap text-[13.5px] leading-body text-text-secondary">{entry.text}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* timeline */}
      <div className="relative">
        {visible.length > 0 && <div className="absolute top-2 bottom-2 left-[17px] w-px bg-border" />}
        <div className="flex flex-col gap-4.5">
          {visible.map((entry) => {
            if (entry.kind === "note") {
              const canEdit = entry.whoId === currentUserId;
              const editing = editingId === entry.id;
              return (
                <div key={entry.id} className="relative flex gap-3.5">
                  <span className="z-10 flex h-[36px] w-[36px] flex-none items-center justify-center rounded-full bg-accent-lightest text-xs font-bold text-accent shadow-[0_0_0_4px_var(--color-surface)]">
                    {getInitials(entry.whoName)}
                  </span>
                  <div className="min-w-0 flex-1 rounded-md border border-border bg-surface p-3.75 shadow-xs">
                    <div className="mb-1.75 flex items-center gap-2.25">
                      <strong className="text-[13.5px] text-text-primary">{entry.whoName}</strong>
                      <span className="text-xs text-text-faint">·</span>
                      <span title={formatLongDate(entry.createdAt)} className="text-xs text-text-faint">
                        {formatRelativeTime(entry.createdAt, today)}
                      </span>
                      {entry.edited && <span className="text-[11.5px] italic text-text-faint">edited</span>}
                      <div className="ml-auto flex items-center gap-0.5">
                        <button
                          type="button"
                          title={entry.pinned ? "Unpin" : "Pin"}
                          onClick={() => onTogglePin(entry.id)}
                          className={`flex h-[28px] w-[28px] items-center justify-center rounded-sm hover:bg-surface-subtle ${
                            entry.pinned ? "text-warning" : "text-text-faint"
                          }`}
                        >
                          <Pin size={15} className={entry.pinned ? "fill-warning" : ""} />
                        </button>
                        {canEdit && (
                          <>
                            <button
                              type="button"
                              title="Edit"
                              onClick={() => startEdit(entry)}
                              className="flex h-[28px] w-[28px] items-center justify-center rounded-sm text-text-faint hover:bg-surface-subtle hover:text-text-primary"
                            >
                              <Pencil size={15} />
                            </button>
                            <button
                              type="button"
                              title="Delete"
                              onClick={() => onDeleteNote(entry.id)}
                              className="flex h-[28px] w-[28px] items-center justify-center rounded-sm text-text-faint hover:bg-danger-light hover:text-danger-cta"
                            >
                              <Trash2 size={15} />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                    {editing ? (
                      <div>
                        <textarea
                          value={editDraft}
                          onChange={(e) => setEditDraft(e.target.value)}
                          rows={3}
                          className="w-full rounded-sm border border-accent px-3 py-2.5 text-[13.5px] leading-body text-text-primary"
                        />
                        <div className="mt-2.25 flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => setEditingId(null)}
                            className="rounded-pill border border-border bg-surface px-3.5 py-1.75 text-[13px] font-semi text-text-secondary"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={saveEdit}
                            className="rounded-pill bg-accent px-4 py-1.75 text-[13px] font-semi text-white"
                          >
                            Save
                          </button>
                        </div>
                      </div>
                    ) : (
                      <p className="m-0 whitespace-pre-wrap text-[13.5px] leading-body text-text-secondary">{entry.text}</p>
                    )}
                  </div>
                </div>
              );
            }

            const { Icon, bg, fg } = AUTO_EVENT_ICON[entry.kind];
            return (
              <div key={entry.id} className="relative flex gap-3.5">
                <span
                  className={`z-10 flex h-[36px] w-[36px] flex-none items-center justify-center rounded-full shadow-[0_0_0_4px_var(--color-surface)] ${bg} ${fg}`}
                >
                  <Icon size={17} />
                </span>
                <div className="flex flex-1 flex-wrap items-center gap-2 py-2">
                  <span className="text-[13.5px] text-text-secondary">
                    <strong className="font-semi text-text-primary">{entry.whoName}:</strong> {entry.text}
                  </span>
                  <span title={formatLongDate(entry.createdAt)} className="text-xs text-text-faint">
                    · {formatRelativeTime(entry.createdAt, today)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {visible.length === 0 && (
          <div className="py-7.5 text-center text-[13.5px] text-text-faint">No activity yet.</div>
        )}
      </div>
    </section>
  );
}
