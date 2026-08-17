"use client";

import { useRouter } from "next/navigation";
import { Flag, AlertCircle } from "lucide-react";
import posthog from "posthog-js";
import { dayDiff, formatShortDate, getInitials } from "@/lib/dates";
import { STATUS_ACCENT } from "./types";
import type { BoardTask } from "./types";

interface KanbanCardProps {
  task: BoardTask;
  today: Date;
  onDragStart: (taskId: string) => void;
}

export function KanbanCard({ task, today, onDragStart }: KanbanCardProps) {
  const router = useRouter();
  const accent = STATUS_ACCENT[task.status];
  const overdue = task.status !== "done" && dayDiff(task.endDate, today) < 0;

  return (
    <div
      draggable
      onDragStart={(e) => {
        onDragStart(task.id);
        e.dataTransfer.effectAllowed = "move";
      }}
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
      className={`cursor-pointer rounded-md border border-border border-l-4 bg-surface p-[11px] shadow-xs hover:shadow-sm ${accent.border}`}
    >
      <div className="flex items-start gap-1.5">
        <div className="flex-1 text-[13px] font-semi leading-snug text-text-primary">{task.name}</div>
        {task.followUp && <Flag size={13} className="mt-0.5 flex-none fill-warning text-warning" />}
      </div>
      <div className="mt-1 truncate text-[11.5px] text-text-faint">{task.projectName}</div>
      {task.blockedReason && (
        <div className="mt-1.75 flex items-center gap-1.25 text-[11px] font-semi text-danger-cta">
          <AlertCircle size={11} />
          <span className="truncate">{task.blockedReason}</span>
        </div>
      )}
      <div className="my-2.25 h-[5px] overflow-hidden rounded-pill bg-surface-inset">
        <span className={`block h-full ${accent.fill}`} style={{ width: `${task.progress}%` }} />
      </div>
      <div className="flex items-center gap-1.75">
        <span className="flex h-[21px] w-[21px] flex-none items-center justify-center rounded-full bg-accent-lightest text-[9px] font-bold text-accent">
          {getInitials(task.ownerName)}
        </span>
        <span className={`ml-auto text-[11px] font-med ${overdue ? "text-danger-cta" : "text-text-faint"}`}>
          Due {formatShortDate(task.endDate)}
        </span>
      </div>
    </div>
  );
}
