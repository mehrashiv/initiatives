"use client";

import { AlertTriangle, MoreVertical } from "lucide-react";
import { formatRelativeTime, getInitials } from "@/lib/dates";
import type { InitiativeCardData } from "./types";

interface InitiativeCardProps {
  initiative: InitiativeCardData;
  today: Date;
  menuOpen: boolean;
  highlighted: boolean;
  canEdit: boolean;
  canDelete: boolean;
  onOpen: () => void;
  onToggleMenu: () => void;
  onEdit: () => void;
  onToggleStatus: () => void;
  onDelete: () => void;
}

export function InitiativeCard({
  initiative,
  today,
  menuOpen,
  highlighted,
  canEdit,
  canDelete,
  onOpen,
  onToggleMenu,
  onEdit,
  onToggleStatus,
  onDelete,
}: InitiativeCardProps) {
  const active = initiative.status === "active";
  const hasRisk = active && initiative.atRiskCount > 0;

  return (
    <div
      onClick={onOpen}
      className={`relative flex h-62 cursor-pointer flex-col overflow-hidden rounded-lg border bg-surface p-4.5 pb-3.75 transition-shadow duration-(--duration-base) hover:shadow-md ${
        highlighted ? "border-accent shadow-[0_0_0_3px_rgba(32,112,225,.18)]" : "border-border shadow-xs"
      } ${active ? "" : "opacity-82"}`}
    >
      <div
        className="absolute top-0 right-0 left-0 h-[3px]"
        style={{ background: hasRisk ? "linear-gradient(90deg, var(--color-danger-cta), var(--color-warning))" : "transparent" }}
      />

      <div className="mb-3 flex items-center gap-2">
        <span className={`h-2 w-2 flex-none rounded-full ${active ? "bg-success-dark" : "bg-text-faint"}`} />
        <span className="text-[11.5px] font-semi text-text-secondary">{active ? "Active" : "Inactive"}</span>
        <span className="max-w-32.5 overflow-hidden rounded-pill bg-accent-lightest px-2.25 py-0.5 text-[11px] font-semi text-ellipsis whitespace-nowrap text-accent">
          {initiative.category}
        </span>
        {(canEdit || canDelete) && (
          <div className="relative ml-auto">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onToggleMenu();
              }}
              className="flex h-[28px] w-[28px] items-center justify-center rounded-sm text-text-faint hover:bg-surface-subtle"
            >
              <MoreVertical size={18} />
            </button>
            {menuOpen && (
              <>
                <div onClick={(e) => e.stopPropagation()} className="fixed inset-0 z-48" />
                <div
                  onClick={(e) => e.stopPropagation()}
                  className="absolute top-[32px] right-0 z-49 w-42 rounded-md border border-border bg-surface p-1.25 text-left shadow-lg"
                >
                  {canEdit && (
                    <>
                      <button type="button" onClick={onEdit} className="block w-full rounded-sm px-2.5 py-2 text-left text-[13.5px] text-text-primary hover:bg-surface-subtle">
                        Edit
                      </button>
                      <button type="button" onClick={onToggleStatus} className="block w-full rounded-sm px-2.5 py-2 text-left text-[13.5px] text-text-primary hover:bg-surface-subtle">
                        {active ? "Set inactive" : "Set active"}
                      </button>
                    </>
                  )}
                  {canEdit && canDelete && <div className="my-1 h-px bg-border" />}
                  {canDelete && (
                    <button type="button" onClick={onDelete} className="block w-full rounded-sm px-2.5 py-2 text-left text-[13.5px] text-danger-cta hover:bg-danger-light">
                      Delete
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        )}
      </div>

      <div className="mb-1.25 line-clamp-2 min-h-11.5 text-[17px] font-bold leading-snug tracking-tight text-text-primary">
        {initiative.name}
      </div>
      <div className="mb-4 h-4.5 overflow-hidden text-ellipsis whitespace-nowrap text-[13px] text-text-faint">
        {initiative.goal}
      </div>

      <div className="mb-2.75 flex items-center gap-2.75">
        <div className="flex h-1.75 flex-1 overflow-hidden rounded-pill bg-surface-inset">
          {initiative.segments.map((seg) => (
            <span key={seg.key} style={{ width: `${seg.pct}%`, background: seg.color }} className="h-full" />
          ))}
        </div>
        <span className="min-w-[36px] text-right text-[13px] font-bold tabular-nums text-text-primary">
          {initiative.progressPct}%
        </span>
      </div>

      <div className="flex items-center gap-2.25 text-[12.5px] text-text-secondary">
        <span>
          {initiative.projectCount} {initiative.projectCount === 1 ? "project" : "projects"}
        </span>
        <span className="h-0.75 w-0.75 rounded-full bg-text-faint" />
        <span>
          {initiative.taskCount} {initiative.taskCount === 1 ? "task" : "tasks"}
        </span>
        {hasRisk && (
          <span className="ml-0.5 inline-flex items-center gap-1 font-semi text-danger-cta">
            <AlertTriangle size={13} />
            {initiative.atRiskCount} at risk
          </span>
        )}
      </div>

      <div className="mt-auto flex items-center gap-2.25 border-t border-border pt-3.25">
        <span className="flex h-[24px] w-[24px] flex-none items-center justify-center rounded-full bg-accent-lightest text-[10px] font-bold text-accent">
          {getInitials(initiative.ownerName)}
        </span>
        <span className="overflow-hidden text-ellipsis whitespace-nowrap text-[12.5px] font-med text-text-secondary">
          {initiative.ownerName}
        </span>
        <span className="ml-auto flex-none text-[11.5px] text-text-faint">
          Updated {formatRelativeTime(initiative.updatedAt, today)}
        </span>
      </div>
    </div>
  );
}
