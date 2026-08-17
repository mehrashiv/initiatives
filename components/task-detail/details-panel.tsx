"use client";

import { AlertCircle, ChevronDown, Lock } from "lucide-react";
import { formatLongDate, fromDateInputValue, toDateInputValue } from "@/lib/dates";
import { OwnerPicker } from "@/components/shared/owner-picker";
import { STATUS_COLUMNS } from "@/components/tasks/types";
import { STATUS_PILL_TONE } from "./types";
import type { TaskStatus } from "@/types";
import type { ProjectOption } from "@/components/shared/new-task-modal";

interface OwnerOption {
  id: string;
  name: string;
}

interface DetailsPanelProps {
  description: string;
  onDescriptionChange: (value: string) => void;
  onDescriptionCommit: (value: string) => void;
  projectId: string;
  projectOptions: ProjectOption[];
  onProjectChange: (id: string) => void;
  status: TaskStatus;
  onStatusChange: (status: TaskStatus) => void;
  startDate: Date | null;
  onStartDateChange: (date: Date | null) => void;
  endDate: Date | null;
  onEndDateChange: (date: Date | null) => void;
  deliveryDate: Date | null;
  onDeliveryDateChange: (date: Date | null) => void;
  progress: number;
  onProgressChange: (progress: number) => void;
  onProgressCommit: (progress: number) => void;
  blockerOwner: string;
  onBlockerOwnerChange: (value: string) => void;
  onBlockerOwnerCommit: (value: string) => void;
  ownerId: string;
  ownerOptions: OwnerOption[];
  currentUserId: string;
  onOwnerChange: (id: string) => void;
  createdAt: Date;
  updatedAt: Date;
}

export function DetailsPanel({
  description,
  onDescriptionChange,
  onDescriptionCommit,
  projectId,
  projectOptions,
  onProjectChange,
  status,
  onStatusChange,
  startDate,
  onStartDateChange,
  endDate,
  onEndDateChange,
  deliveryDate,
  onDeliveryDateChange,
  progress,
  onProgressChange,
  onProgressCommit,
  blockerOwner,
  onBlockerOwnerChange,
  onBlockerOwnerCommit,
  ownerId,
  ownerOptions,
  currentUserId,
  onOwnerChange,
  createdAt,
  updatedAt,
}: DetailsPanelProps) {
  const progressLocked = status === "done";
  const displayProgress = progressLocked ? 100 : progress;
  const selectedProject = projectOptions.find((p) => p.id === projectId);

  return (
    <aside className="sticky top-22 rounded-lg border border-border bg-surface p-5 shadow-xs">
      <div className="mb-4 text-xs font-bold uppercase tracking-wide text-text-faint">Details</div>

      <div className="mb-4.5">
        <div className="mb-2 text-xs font-bold uppercase tracking-wide text-text-faint">Description</div>
        <textarea
          value={description}
          onChange={(e) => onDescriptionChange(e.target.value)}
          onBlur={(e) => onDescriptionCommit(e.currentTarget.value)}
          rows={3}
          placeholder="No description yet — add one"
          className="w-full resize-y rounded-md border border-border px-3.25 py-2.75 text-sm leading-body text-text-primary"
        />
      </div>

      <div className="mb-4.5">
        <div className="mb-2 text-xs font-bold uppercase tracking-wide text-text-faint">Project</div>
        <div className="relative">
          <select
            value={projectId}
            onChange={(e) => onProjectChange(e.target.value)}
            className="w-full cursor-pointer appearance-none rounded-sm border border-border bg-surface px-3 py-2.5 pr-9.5 text-sm text-text-primary"
          >
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
      </div>

      <div className="mb-4.5">
        <div className="mb-2 text-xs font-bold uppercase tracking-wide text-text-faint">Status</div>
        <div className="flex flex-wrap gap-1.5">
          {STATUS_COLUMNS.map((column) => {
            const tone = STATUS_PILL_TONE[column.status];
            const selected = column.status === status;
            return (
              <button
                key={column.status}
                type="button"
                onClick={() => onStatusChange(column.status)}
                className={`rounded-pill border px-3 py-1.5 text-[12.5px] font-semi transition-colors duration-(--duration-base) ${
                  selected ? `${tone.border} ${tone.bg} ${tone.fg}` : "border-border bg-surface text-text-secondary"
                }`}
              >
                {column.title}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mb-4.5 grid grid-cols-2 gap-3.5">
        <div>
          <div className="mb-2 text-xs font-bold uppercase tracking-wide text-text-faint">Start date</div>
          <input
            type="date"
            value={toDateInputValue(startDate)}
            onChange={(e) => onStartDateChange(fromDateInputValue(e.target.value))}
            className="w-full rounded-sm border border-border px-2.5 py-2.25 text-[13.5px] text-text-primary"
          />
        </div>
        <div>
          <div className="mb-2 text-xs font-bold uppercase tracking-wide text-text-faint">End date</div>
          <input
            type="date"
            value={toDateInputValue(endDate)}
            onChange={(e) => onEndDateChange(fromDateInputValue(e.target.value))}
            className="w-full rounded-sm border border-border px-2.5 py-2.25 text-[13.5px] text-text-primary"
          />
        </div>
      </div>

      <div className="mb-4.5">
        <div className="mb-2 text-xs font-bold uppercase tracking-wide text-text-faint">Progress</div>
        <div className="flex h-[30px] items-center gap-2.75">
          <input
            type="range"
            min={0}
            max={100}
            step={5}
            value={displayProgress}
            disabled={progressLocked}
            onChange={(e) => onProgressChange(Number(e.target.value))}
            onPointerUp={(e) => onProgressCommit(Number(e.currentTarget.value))}
            onBlur={(e) => onProgressCommit(Number(e.currentTarget.value))}
            className="flex-1 accent-accent disabled:cursor-not-allowed"
          />
          <span className="min-w-[36px] text-right text-[13px] tabular-nums text-text-secondary">{displayProgress}%</span>
        </div>
        {progressLocked && (
          <div className="mt-1.5 flex items-center gap-1.25 text-[11.5px] text-text-faint">
            <Lock size={12} />
            Progress is locked at 100% while this task is Done.
          </div>
        )}
      </div>

      <div className="mb-4.5">
        <div className="mb-2 text-xs font-bold uppercase tracking-wide text-text-faint">
          Delivery date <span className="font-med normal-case tracking-normal text-text-faint">· actual</span>
        </div>
        <input
          type="date"
          value={toDateInputValue(deliveryDate)}
          onChange={(e) => onDeliveryDateChange(fromDateInputValue(e.target.value))}
          className="w-full rounded-sm border border-border px-2.5 py-2.25 text-[13.5px] text-text-primary"
        />
      </div>

      <div className="mb-4.5">
        <div className="mb-2 text-xs font-bold uppercase tracking-wide text-text-faint">Owner</div>
        <OwnerPicker value={ownerId} options={ownerOptions} currentUserId={currentUserId} onChange={onOwnerChange} />
      </div>

      {status === "blocked" && (
        <div className="mb-4.5 rounded-md bg-danger-light p-3.25">
          <div className="mb-2.5 flex items-center gap-2">
            <AlertCircle size={14} className="text-danger-cta" />
            <span className="text-xs font-bold uppercase tracking-wide text-danger-cta">Blocker</span>
          </div>
          <input
            value={blockerOwner}
            onChange={(e) => onBlockerOwnerChange(e.target.value)}
            onBlur={(e) => onBlockerOwnerCommit(e.currentTarget.value)}
            placeholder="Who owns the blocker?"
            className="w-full rounded-sm border border-danger-cta/30 bg-surface px-2.75 py-2.25 text-[13px] text-text-primary"
          />
        </div>
      )}

      <div className="mt-3.5 flex flex-wrap items-center gap-3 border-t border-border pt-3.25 text-[11.5px] text-text-faint">
        <span>Created {formatLongDate(createdAt)}</span>
        <span className="h-[3px] w-[3px] rounded-full bg-text-faint" />
        <span>Updated {formatLongDate(updatedAt)}</span>
      </div>
    </aside>
  );
}
