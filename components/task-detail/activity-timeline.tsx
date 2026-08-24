"use client";

import { useEffect, useRef, useState } from "react";
import {
  AtSign,
  CheckCircle2,
  File as FileIcon,
  Flag,
  Paperclip,
  Pencil,
  Pin,
  Plus,
  RefreshCw,
  Trash2,
  TrendingUp,
  UserCog,
  X,
} from "lucide-react";
import { formatLongDate, formatRelativeTime, getInitials } from "@/lib/dates";
import { insforge } from "@/lib/insforge-client";
import { TASK_ATTACHMENTS_BUCKET, type ActivityKind, type Attachment } from "@/types";
import { formatFileSize } from "./activity-helpers";
import type { PendingAttachment, TimelineEntry } from "./types";

const MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024;
const MAX_FILES_PER_NOTE = 10;

const AUTO_EVENT_ICON: Record<Exclude<ActivityKind, "note">, { Icon: typeof Plus; bg: string; fg: string }> = {
  created: { Icon: Plus, bg: "bg-accent-lightest", fg: "text-accent" },
  status: { Icon: RefreshCw, bg: "bg-surface-inset", fg: "text-text-secondary" },
  owner: { Icon: UserCog, bg: "bg-accent-lightest", fg: "text-accent" },
  progress: { Icon: TrendingUp, bg: "bg-accent-lightest", fg: "text-accent" },
  completed: { Icon: CheckCircle2, bg: "bg-success-light", fg: "text-success-dark" },
  flag: { Icon: Flag, bg: "bg-warning-light", fg: "text-warning" },
};

// The bucket is private, so `attachment.url` isn't directly browser-loadable —
// each posted attachment fetches its bytes via the authenticated download()
// call and renders a local object URL, revoked on unmount.
function PostedAttachment({ attachment }: { attachment: Attachment }) {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  const isImage = attachment.mimeType.startsWith("image/");

  useEffect(() => {
    let cancelled = false;
    let objectUrl: string | null = null;
    insforge.storage
      .from(TASK_ATTACHMENTS_BUCKET)
      .download(attachment.key)
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error || !data) {
          setFailed(true);
          return;
        }
        objectUrl = URL.createObjectURL(data);
        setBlobUrl(objectUrl);
      });
    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [attachment.key]);

  const handleDownloadClick = () => {
    if (!blobUrl) return;
    const link = document.createElement("a");
    link.href = blobUrl;
    link.download = attachment.filename;
    link.click();
  };

  if (isImage) {
    return blobUrl ? (
      <a
        href={blobUrl}
        target="_blank"
        rel="noreferrer"
        title={attachment.filename}
        className="block h-[72px] w-[72px] overflow-hidden rounded-sm border border-border"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={blobUrl} alt={attachment.filename} className="h-full w-full object-cover" />
      </a>
    ) : (
      <div className="flex h-[72px] w-[72px] items-center justify-center rounded-sm border border-border bg-surface-inset text-text-faint">
        {failed ? <FileIcon size={18} /> : <span className="text-[10px]">Loading…</span>}
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={handleDownloadClick}
      disabled={!blobUrl}
      title={attachment.filename}
      className="flex items-center gap-1.75 rounded-sm border border-border bg-surface-inset py-1.5 pr-2.5 pl-2 text-xs text-text-secondary disabled:opacity-60"
    >
      <FileIcon size={14} className="text-text-faint" />
      <span className="max-w-40 truncate">{attachment.filename}</span>
      <span className="text-text-faint">{formatFileSize(attachment.sizeBytes)}</span>
    </button>
  );
}

interface ActivityTimelineProps {
  entries: TimelineEntry[];
  currentUserId: string;
  currentUserName: string;
  today: Date;
  onAddNote: (text: string, attachments: Attachment[]) => void;
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
  const [filter, setFilter] = useState<"all" | "notes" | "attachments">("notes");
  const [noteDraft, setNoteDraft] = useState("");
  const [pendingAttachments, setPendingAttachments] = useState<PendingAttachment[]>([]);
  const [attachError, setAttachError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const sorted = [...entries].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  const pinned = sorted.filter((e) => e.pinned);
  const visible =
    filter === "notes"
      ? sorted.filter((e) => e.kind === "note")
      : filter === "attachments"
        ? sorted.filter((e) => e.kind === "note" && e.attachments.length > 0)
        : sorted;
  const noteCount = entries.filter((e) => e.kind === "note").length;

  const handleFilesSelected = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setAttachError(null);

    const incoming = Array.from(files);
    const room = Math.max(MAX_FILES_PER_NOTE - pendingAttachments.length, 0);
    if (incoming.length > room) setAttachError(`Up to ${MAX_FILES_PER_NOTE} files per note.`);
    const toUpload = incoming.slice(0, room);

    setIsUploading(true);
    const uploaded: PendingAttachment[] = [];
    for (const file of toUpload) {
      if (file.size > MAX_FILE_SIZE_BYTES) {
        setAttachError(`"${file.name}" is over the 25 MB limit.`);
        continue;
      }
      const { data, error } = await insforge.storage.from(TASK_ATTACHMENTS_BUCKET).uploadAuto(file);
      if (error || !data) {
        setAttachError(`Failed to upload "${file.name}".`);
        continue;
      }
      uploaded.push({
        key: data.key,
        url: data.url,
        filename: file.name,
        mimeType: data.mimeType || file.type || "application/octet-stream",
        sizeBytes: data.size,
        previewUrl: file.type.startsWith("image/") ? URL.createObjectURL(file) : undefined,
      });
    }
    setIsUploading(false);
    if (uploaded.length > 0) setPendingAttachments((prev) => [...prev, ...uploaded]);
  };

  const removePendingAttachment = (key: string) => {
    setPendingAttachments((prev) => {
      const removed = prev.find((a) => a.key === key);
      if (removed?.previewUrl) URL.revokeObjectURL(removed.previewUrl);
      return prev.filter((a) => a.key !== key);
    });
    // Best-effort: the user explicitly discarded this pick before sending, so
    // don't leave the just-uploaded object behind. Fire-and-forget — worst case
    // it joins the same accepted "never sent" orphan case as an abandoned tab.
    insforge.storage.from(TASK_ATTACHMENTS_BUCKET).remove(key).catch(() => undefined);
  };

  const submitNote = () => {
    const text = noteDraft.trim();
    if (!text && pendingAttachments.length === 0) return;
    onAddNote(
      text,
      pendingAttachments.map((a) => ({
        key: a.key,
        url: a.url,
        filename: a.filename,
        mimeType: a.mimeType,
        sizeBytes: a.sizeBytes,
      })),
    );
    setNoteDraft("");
    setPendingAttachments([]);
    setAttachError(null);
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
          <button
            type="button"
            onClick={() => setFilter("attachments")}
            className={`rounded-pill px-3.75 py-1.5 text-[13px] font-semi ${
              filter === "attachments" ? "bg-surface text-text-primary shadow-xs" : "bg-transparent text-text-secondary"
            }`}
          >
            Attachments
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

          {pendingAttachments.length > 0 && (
            <div className="mt-2.5 flex flex-wrap gap-2">
              {pendingAttachments.map((a) => (
                <div
                  key={a.key}
                  className="flex items-center gap-1.75 rounded-sm border border-border bg-surface-inset py-1 pr-1.5 pl-1.75 text-xs text-text-secondary"
                >
                  {a.previewUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={a.previewUrl} alt="" className="h-[20px] w-[20px] rounded-xs object-cover" />
                  ) : (
                    <FileIcon size={14} className="text-text-faint" />
                  )}
                  <span className="max-w-40 truncate">{a.filename}</span>
                  <span className="text-text-faint">{formatFileSize(a.sizeBytes)}</span>
                  <button
                    type="button"
                    title="Remove"
                    onClick={() => removePendingAttachment(a.key)}
                    className="flex h-[16px] w-[16px] items-center justify-center rounded-full text-text-faint hover:bg-surface hover:text-text-primary"
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}
            </div>
          )}
          {isUploading && <p className="mt-1.5 text-xs text-text-faint">Uploading…</p>}
          {attachError && <p className="mt-1.5 text-xs text-danger-cta">{attachError}</p>}

          <div className="mt-2.5 flex items-center gap-1.5">
            <button
              type="button"
              title="Mention someone"
              disabled
              className="flex h-[34px] w-[34px] cursor-not-allowed items-center justify-center rounded-sm border border-border bg-surface text-text-secondary"
            >
              <AtSign size={17} />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              hidden
              onChange={(e) => {
                handleFilesSelected(e.target.files);
                e.target.value = "";
              }}
            />
            <button
              type="button"
              title="Attach a file"
              disabled={isUploading}
              onClick={() => fileInputRef.current?.click()}
              className="flex h-[34px] w-[34px] items-center justify-center rounded-sm border border-border bg-surface text-text-secondary hover:border-accent hover:text-accent disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Paperclip size={17} />
            </button>
            <button
              type="button"
              onClick={submitNote}
              disabled={isUploading || (!noteDraft.trim() && pendingAttachments.length === 0)}
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
                      <>
                        {entry.text && (
                          <p className="m-0 whitespace-pre-wrap text-[13.5px] leading-body text-text-secondary">{entry.text}</p>
                        )}
                        {entry.attachments.length > 0 && (
                          <div className={`flex flex-wrap gap-2 ${entry.text ? "mt-2.5" : ""}`}>
                            {entry.attachments.map((a) => (
                              <PostedAttachment key={a.key} attachment={a} />
                            ))}
                          </div>
                        )}
                      </>
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
