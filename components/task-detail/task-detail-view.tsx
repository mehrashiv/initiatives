"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Check, Flag } from "lucide-react";
import { dayDiff, getInitials, parseDateOnly, toDateInputValue } from "@/lib/dates";
import { insforge } from "@/lib/insforge-client";
import { StatusBadge } from "@/components/shared/status-badge";
import { PageContainer } from "@/components/shared/page-container";
import { Toast } from "@/components/shared/toast";
import { STATUS_COLUMNS } from "@/components/tasks/types";
import {
  toggleTaskFlag,
  updateTaskBlockerOwner,
  updateTaskDeliveryDate,
  updateTaskDescription,
  updateTaskEndDate,
  updateTaskName,
  updateTaskOwner,
  updateTaskProgress,
  updateTaskProject,
  updateTaskStartDate,
  updateTaskStatus,
} from "@/actions/tasks";
import { addNote, deleteNote, editNote, toggleNotePin } from "@/actions/activities";
import { DetailsPanel } from "./details-panel";
import { ActivityTimeline } from "./activity-timeline";
import { timelineEntryFromRow, type ActivityChangedPayload } from "./activity-helpers";
import type { TimelineEntry } from "./types";
import type { Attachment, TaskStatus } from "@/types";
import type { ProjectOption } from "@/components/shared/new-task-modal";

interface OwnerOption {
  id: string;
  name: string;
}

interface TaskDetailViewProps {
  taskId: string;
  initialName: string;
  initialDescription: string;
  initialStatus: TaskStatus;
  // Raw "YYYY-MM-DD" strings — parsed here, in the browser, so local midnight is
  // the viewer's midnight rather than the server's (UTC) one.
  initialStartDate: string | null;
  initialEndDate: string | null;
  initialDeliveryDate: string | null;
  initialProgress: number;
  initialBlockerOwner: string;
  initialFlagged: boolean;
  initialOwnerId: string;
  createdAt: Date;
  updatedAt: Date;
  initialProjectId: string;
  projectOptions: ProjectOption[];
  ownerOptions: OwnerOption[];
  currentUserId: string;
  currentUserName: string;
  initialActivities: TimelineEntry[];
}

function statusLabel(status: TaskStatus) {
  return STATUS_COLUMNS.find((c) => c.status === status)?.title ?? status;
}

// A delivered or done task is no longer "due", so it reports how it finished
// against the end date instead of counting up overdue days (matches the Gantt buckets).
function dueChipFor(endDate: Date | null, deliveryDate: Date | null, status: TaskStatus, today: Date) {
  if (deliveryDate && endDate) {
    const late = dayDiff(deliveryDate, endDate);
    if (late > 0) return { text: `Delivered ${late} ${late === 1 ? "day" : "days"} late`, className: "bg-warning-light text-warning" };
    return { text: "Delivered on time", className: "bg-success-light text-success-dark" };
  }
  if (deliveryDate || status === "done") return { text: "Completed", className: "bg-success-light text-success-dark" };
  if (!endDate) return { text: "No due date", className: "bg-surface-inset text-text-secondary" };
  const diff = dayDiff(endDate, today);
  if (diff < 0) return { text: `${-diff} ${-diff === 1 ? "day" : "days"} overdue`, className: "bg-danger-light text-danger-cta" };
  if (diff === 0) return { text: "Due today", className: "bg-warning-light text-warning" };
  if (diff === 1) return { text: "Due tomorrow", className: "bg-surface-inset text-text-secondary" };
  return { text: `Due in ${diff} days`, className: "bg-surface-inset text-text-secondary" };
}

export function TaskDetailView({
  taskId,
  initialName,
  initialDescription,
  initialStatus,
  initialStartDate,
  initialEndDate,
  initialDeliveryDate,
  initialProgress,
  initialBlockerOwner,
  initialFlagged,
  initialOwnerId,
  createdAt,
  updatedAt,
  initialProjectId,
  projectOptions,
  ownerOptions,
  currentUserId,
  currentUserName,
  initialActivities,
}: TaskDetailViewProps) {
  const router = useRouter();
  const today = new Date();

  const [name, setName] = useState(initialName);
  const [description, setDescription] = useState(initialDescription);
  const [status, setStatus] = useState<TaskStatus>(initialStatus);
  const [startDate, setStartDate] = useState(() => (initialStartDate ? parseDateOnly(initialStartDate) : null));
  const [endDate, setEndDate] = useState(() => (initialEndDate ? parseDateOnly(initialEndDate) : null));
  const [deliveryDate, setDeliveryDate] = useState(() => (initialDeliveryDate ? parseDateOnly(initialDeliveryDate) : null));
  const [progress, setProgress] = useState(initialProgress);
  const [blockerOwner, setBlockerOwner] = useState(initialBlockerOwner);
  const [ownerId, setOwnerId] = useState(initialOwnerId);
  const [projectId, setProjectId] = useState(initialProjectId);
  const [followUp, setFollowUp] = useState(initialFlagged);
  const [activities, setActivities] = useState<TimelineEntry[]>(initialActivities);
  const [toast, setToast] = useState<{ message: string; tone: "success" | "error" } | null>(null);

  // Tracks the last value actually persisted, separate from the live (possibly
  // mid-drag/mid-keystroke) display state, so commits can diff against truth
  // and reverts on failure have a known-good value to fall back to.
  const committedProgressRef = useRef(initialProgress);
  const committedNameRef = useRef(initialName);
  const committedBlockerOwnerRef = useRef(initialBlockerOwner);
  const committedDescriptionRef = useRef(initialDescription);

  const ownerName = ownerOptions.find((o) => o.id === ownerId)?.name ?? "Unassigned";
  const selectedProject = projectOptions.find((p) => p.id === projectId);
  const projectName = selectedProject?.name ?? "Unassigned";
  const initiativeName = selectedProject?.initiativeName ?? "Unassigned";
  const dueChip = dueChipFor(endDate, deliveryDate, status, today);
  const profileNameById = useMemo(() => new Map(ownerOptions.map((o) => [o.id, o.name])), [ownerOptions]);

  const showToast = (message: string, tone: "success" | "error" = "success") => {
    setToast({ message, tone });
    setTimeout(() => setToast(null), tone === "error" ? 4500 : 2600);
  };

  useEffect(() => {
    let retried = false;
    const channel = `task-activity:${taskId}`;

    function handleActivityChanged(payload: ActivityChangedPayload) {
      const entry = timelineEntryFromRow(payload, profileNameById);
      setActivities((prev) =>
        prev.some((e) => e.id === entry.id) ? prev.map((e) => (e.id === entry.id ? entry : e)) : [...prev, entry],
      );
    }

    function handleRealtimeError(error: { channel?: string; code: string; message: string }) {
      console.error("Task activity realtime error", error);
    }

    async function subscribe() {
      try {
        await insforge.realtime.connect();
        const response = await insforge.realtime.subscribe(channel);
        if (!response.ok) throw new Error(response.error.message);
      } catch (err) {
        console.error("Task activity realtime subscribe failed", err);
        if (!retried) {
          retried = true;
          subscribe();
        }
      }
    }

    insforge.realtime.on<ActivityChangedPayload>("activity_changed", handleActivityChanged);
    insforge.realtime.on("error", handleRealtimeError);
    subscribe();

    return () => {
      insforge.realtime.off<ActivityChangedPayload>("activity_changed", handleActivityChanged);
      insforge.realtime.off("error", handleRealtimeError);
      insforge.realtime.unsubscribe(channel);
      insforge.realtime.disconnect();
    };
  }, [taskId, profileNameById]);

  // Inserts by the activity's real id — the realtime subscription above delivers the
  // same row back as an echo, and merging by id makes that echo a safe no-op replace
  // (same idempotent pattern the Kanban board uses for its own optimistic updates).
  // No id means the activity insert itself failed server-side; the task field update
  // already succeeded by this point, so there's nothing to (and nothing safe to) append.
  const appendActivity = (kind: "status" | "progress" | "owner" | "flag", text: string, id?: string, createdAt?: string) => {
    if (!id || !createdAt) return;
    setActivities((prev) =>
      prev.some((e) => e.id === id)
        ? prev
        : [
            ...prev,
            {
              id,
              kind,
              whoId: currentUserId,
              whoName: currentUserName,
              text,
              edited: false,
              pinned: false,
              attachments: [],
              createdAt: new Date(createdAt),
            },
          ],
    );
  };

  const handleStatusChange = (next: TaskStatus) => {
    const previousStatus = status;
    if (next === previousStatus) return;
    const previousProgress = progress;

    setStatus(next);
    if (next === "done") setProgress(100);

    updateTaskStatus({ taskId, fromStatus: previousStatus, toStatus: next })
      .then((result) => {
        if (!result.ok) {
          setStatus(previousStatus);
          if (next === "done") setProgress(previousProgress);
          showToast(result.error, "error");
          return;
        }
        if (next === "done") committedProgressRef.current = 100;
        appendActivity(
          "status",
          `Status changed from ${statusLabel(previousStatus)} to ${statusLabel(next)}`,
          result.activityId,
          result.activityCreatedAt,
        );
      })
      .catch(() => {
        setStatus(previousStatus);
        if (next === "done") setProgress(previousProgress);
        showToast("Failed to update task status.", "error");
      });
  };

  const handleToggleFollowUp = () => {
    const previous = followUp;
    const next = !previous;
    setFollowUp(next);

    toggleTaskFlag({ taskId, flagged: next })
      .then((result) => {
        if (!result.ok) {
          setFollowUp(previous);
          showToast(result.error, "error");
          return;
        }
        appendActivity(
          "flag",
          next ? "Flagged for follow-up" : "Follow-up cleared",
          result.activityId,
          result.activityCreatedAt,
        );
      })
      .catch(() => {
        setFollowUp(previous);
        showToast("Failed to update follow-up flag.", "error");
      });
  };

  const handleNameBlur = () => {
    const trimmed = name.trim();
    if (!trimmed) {
      setName(committedNameRef.current);
      return;
    }
    if (trimmed === committedNameRef.current) {
      setName(trimmed);
      return;
    }
    const previous = committedNameRef.current;
    setName(trimmed);
    updateTaskName({ taskId, name: trimmed })
      .then((result) => {
        if (!result.ok) {
          setName(previous);
          showToast(result.error, "error");
          return;
        }
        committedNameRef.current = trimmed;
      })
      .catch(() => {
        setName(previous);
        showToast("Failed to update task name.", "error");
      });
  };

  const handleProjectChange = (nextId: string) => {
    if (nextId === projectId) return;
    const previous = projectId;
    setProjectId(nextId);
    updateTaskProject({ taskId, projectId: nextId })
      .then((result) => {
        if (!result.ok) {
          setProjectId(previous);
          showToast(result.error, "error");
        }
      })
      .catch(() => {
        setProjectId(previous);
        showToast("Failed to update project.", "error");
      });
  };

  const handleStartDateChange = (date: Date | null) => {
    const previous = startDate;
    setStartDate(date);
    updateTaskStartDate({ taskId, startDate: toDateInputValue(date) || null })
      .then((result) => {
        if (!result.ok) {
          setStartDate(previous);
          showToast(result.error, "error");
        }
      })
      .catch(() => {
        setStartDate(previous);
        showToast("Failed to update start date.", "error");
      });
  };

  const handleEndDateChange = (date: Date | null) => {
    const previous = endDate;
    setEndDate(date);
    updateTaskEndDate({ taskId, endDate: toDateInputValue(date) || null })
      .then((result) => {
        if (!result.ok) {
          setEndDate(previous);
          showToast(result.error, "error");
        }
      })
      .catch(() => {
        setEndDate(previous);
        showToast("Failed to update end date.", "error");
      });
  };

  const handleDeliveryDateChange = (date: Date | null) => {
    const previous = deliveryDate;
    setDeliveryDate(date);
    updateTaskDeliveryDate({ taskId, deliveryDate: toDateInputValue(date) || null })
      .then((result) => {
        if (!result.ok) {
          setDeliveryDate(previous);
          showToast(result.error, "error");
          return;
        }
        if (result.autoFlipped) {
          const previousStatus = status;
          setStatus("delayed");
          appendActivity(
            "status",
            `Status automatically changed from ${statusLabel(previousStatus)} to Delayed — delivery date is after the planned end date`,
            result.activityId,
            result.activityCreatedAt,
          );
          showToast("Marked as Delayed — delivery date is after the end date.");
        }
      })
      .catch(() => {
        setDeliveryDate(previous);
        showToast("Failed to update delivery date.", "error");
      });
  };

  const handleProgressCommit = (next: number) => {
    const previous = committedProgressRef.current;
    if (next === previous) return;
    updateTaskProgress({ taskId, fromProgress: previous, toProgress: next })
      .then((result) => {
        if (!result.ok) {
          setProgress(previous);
          showToast(result.error, "error");
          return;
        }
        committedProgressRef.current = next;
        appendActivity("progress", `Progress changed from ${previous}% to ${next}%`, result.activityId, result.activityCreatedAt);
      })
      .catch(() => {
        setProgress(previous);
        showToast("Failed to update progress.", "error");
      });
  };

  const handleBlockerOwnerCommit = (value: string) => {
    const trimmed = value.trim();
    const previous = committedBlockerOwnerRef.current;
    setBlockerOwner(trimmed);
    if (trimmed === previous) return;
    updateTaskBlockerOwner({ taskId, blockerOwner: trimmed || null })
      .then((result) => {
        if (!result.ok) {
          setBlockerOwner(previous);
          showToast(result.error, "error");
          return;
        }
        committedBlockerOwnerRef.current = trimmed;
      })
      .catch(() => {
        setBlockerOwner(previous);
        showToast("Failed to update blocker owner.", "error");
      });
  };

  const handleDescriptionCommit = (value: string) => {
    const trimmed = value.trim();
    const previous = committedDescriptionRef.current;
    setDescription(trimmed);
    if (trimmed === previous) return;
    updateTaskDescription({ taskId, description: trimmed || null })
      .then((result) => {
        if (!result.ok) {
          setDescription(previous);
          showToast(result.error, "error");
          return;
        }
        committedDescriptionRef.current = trimmed;
      })
      .catch(() => {
        setDescription(previous);
        showToast("Failed to update description.", "error");
      });
  };

  const handleOwnerChange = (nextId: string) => {
    if (nextId === ownerId) return;
    const previousId = ownerId;
    const fromOwnerName = ownerOptions.find((o) => o.id === previousId)?.name ?? "Unassigned";
    const toOwnerName = ownerOptions.find((o) => o.id === nextId)?.name ?? "Unassigned";
    setOwnerId(nextId);
    updateTaskOwner({ taskId, toOwnerId: nextId, fromOwnerName, toOwnerName })
      .then((result) => {
        if (!result.ok) {
          setOwnerId(previousId);
          showToast(result.error, "error");
          return;
        }
        appendActivity("owner", `Owner changed from ${fromOwnerName} to ${toOwnerName}`, result.activityId, result.activityCreatedAt);
      })
      .catch(() => {
        setOwnerId(previousId);
        showToast("Failed to update owner.", "error");
      });
  };

  // Not optimistic, unlike the other handlers below — the note only enters local
  // state once a real id comes back. Edit/pin/delete all target a specific
  // activities.id, and a temp-id-then-swap approach breaks ActivityTimeline's
  // editingId tracking if the user starts editing before the swap lands.
  // Deduped by id since the realtime echo for this same insert can land first
  // (it now carries the same real attachments already inserted, so a plain
  // no-op on that branch is correct — see handleActivityChanged above).
  const handleAddNote = (text: string, attachments: Attachment[]) => {
    addNote({ taskId, text, attachments })
      .then((result) => {
        if (!result.ok) {
          showToast(result.error, "error");
          return;
        }
        setActivities((prev) =>
          prev.some((e) => e.id === result.id)
            ? prev
            : [
                ...prev,
                {
                  id: result.id,
                  kind: "note",
                  whoId: currentUserId,
                  whoName: currentUserName,
                  text,
                  edited: false,
                  pinned: false,
                  attachments,
                  createdAt: new Date(result.createdAt),
                },
              ],
        );
      })
      .catch(() => {
        showToast("Failed to add note.", "error");
      });
  };

  const handleEditNote = (id: string, text: string) => {
    const previous = activities.find((e) => e.id === id);
    if (!previous) return;
    setActivities((prev) => prev.map((e) => (e.id === id ? { ...e, text, edited: true } : e)));
    editNote({ taskId, activityId: id, text })
      .then((result) => {
        if (!result.ok) {
          setActivities((prev) => prev.map((e) => (e.id === id ? previous : e)));
          showToast(result.error, "error");
        }
      })
      .catch(() => {
        setActivities((prev) => prev.map((e) => (e.id === id ? previous : e)));
        showToast("Failed to update note.", "error");
      });
  };

  const handleDeleteNote = (id: string) => {
    const previous = activities.find((e) => e.id === id);
    if (!previous) return;
    setActivities((prev) => prev.filter((e) => e.id !== id));
    deleteNote({ taskId, activityId: id })
      .then((result) => {
        if (!result.ok) {
          setActivities((prev) => [...prev, previous]);
          showToast(result.error, "error");
        }
      })
      .catch(() => {
        setActivities((prev) => [...prev, previous]);
        showToast("Failed to delete note.", "error");
      });
  };

  const handleTogglePin = (id: string) => {
    const previous = activities.find((e) => e.id === id);
    if (!previous) return;
    const nextPinned = !previous.pinned;
    setActivities((prev) => prev.map((e) => (e.id === id ? { ...e, pinned: nextPinned } : e)));
    toggleNotePin({ taskId, activityId: id, pinned: nextPinned })
      .then((result) => {
        if (!result.ok) {
          setActivities((prev) => prev.map((e) => (e.id === id ? { ...e, pinned: previous.pinned } : e)));
          showToast(result.error, "error");
        }
      })
      .catch(() => {
        setActivities((prev) => prev.map((e) => (e.id === id ? { ...e, pinned: previous.pinned } : e)));
        showToast("Failed to update pin.", "error");
      });
  };

  return (
    <PageContainer>
      <button
        type="button"
        onClick={() => router.back()}
        className="mb-3.5 inline-flex items-center gap-1.75 rounded-sm py-1.5 pr-2 text-[13.5px] font-semi text-accent"
      >
        <ArrowLeft size={17} />
        Back
      </button>

      <div className="mb-6 flex flex-wrap items-start justify-between gap-5">
        <div className="min-w-70 flex-1">
          <div className="mb-2 text-[13px] font-semi text-accent">
            {initiativeName} · {projectName}
          </div>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={handleNameBlur}
            placeholder="Task name"
            className="-ml-2 w-[calc(100%+8px)] rounded-sm border border-transparent px-2 py-1 text-[28px] font-bold leading-snug tracking-tight text-text-primary hover:border-border focus:border-accent focus:bg-surface"
          />
          <div className="mt-3 flex flex-wrap items-center gap-2.25">
            <StatusBadge status={status} />
            <span className={`inline-flex items-center rounded-pill px-3 py-1.25 text-[12.5px] font-semi ${dueChip.className}`}>
              {dueChip.text}
            </span>
            <span className="inline-flex items-center gap-1.75 text-[13px] text-text-secondary">
              <span className="flex h-[24px] w-[24px] items-center justify-center rounded-full bg-accent-lightest text-[10px] font-bold text-accent">
                {getInitials(ownerName)}
              </span>
              {ownerName}
            </span>
          </div>
        </div>
        <div className="flex flex-none items-center gap-2.5">
          <button
            type="button"
            onClick={() => handleStatusChange("done")}
            className="inline-flex items-center gap-2 rounded-pill bg-success-dark px-4.5 py-2.75 text-sm font-semi text-white"
          >
            <Check size={16} />
            Mark done
          </button>
          <button
            type="button"
            onClick={handleToggleFollowUp}
            className={`inline-flex items-center gap-2 rounded-pill border px-4 py-2.75 text-sm font-semi ${
              followUp ? "border-warning-light bg-warning-light text-warning" : "border-border bg-surface text-text-secondary"
            }`}
          >
            <Flag size={16} className={followUp ? "fill-warning" : ""} />
            {followUp ? "Following" : "Follow"}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 items-start gap-7 lg:grid-cols-[320px_1fr]">
        <DetailsPanel
          description={description}
          onDescriptionChange={setDescription}
          onDescriptionCommit={handleDescriptionCommit}
          projectId={projectId}
          projectOptions={projectOptions}
          onProjectChange={handleProjectChange}
          status={status}
          onStatusChange={handleStatusChange}
          startDate={startDate}
          onStartDateChange={handleStartDateChange}
          endDate={endDate}
          onEndDateChange={handleEndDateChange}
          deliveryDate={deliveryDate}
          onDeliveryDateChange={handleDeliveryDateChange}
          progress={progress}
          onProgressChange={setProgress}
          onProgressCommit={handleProgressCommit}
          blockerOwner={blockerOwner}
          onBlockerOwnerChange={setBlockerOwner}
          onBlockerOwnerCommit={handleBlockerOwnerCommit}
          ownerId={ownerId}
          ownerOptions={ownerOptions}
          currentUserId={currentUserId}
          onOwnerChange={handleOwnerChange}
          createdAt={createdAt}
          updatedAt={updatedAt}
        />

        <div className="min-w-0 max-w-[820px]">
          <ActivityTimeline
            entries={activities}
            currentUserId={currentUserId}
            currentUserName={currentUserName}
            today={today}
            onAddNote={handleAddNote}
            onTogglePin={handleTogglePin}
            onEditNote={handleEditNote}
            onDeleteNote={handleDeleteNote}
          />
        </div>
      </div>

      {toast && <Toast message={toast.message} tone={toast.tone} />}
    </PageContainer>
  );
}
