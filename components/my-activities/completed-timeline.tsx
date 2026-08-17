import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { formatShortDate, getInitials } from "@/lib/dates";
import { EmptyState } from "@/components/shared/empty-state";
import type { ActivityTask } from "./types";

interface CompletedTimelineProps {
  tasks: ActivityTask[];
  showOwner: boolean;
}

export function CompletedTimeline({ tasks, showOwner }: CompletedTimelineProps) {
  return (
    <section className="mt-5 rounded-lg border border-border bg-surface p-5.5 shadow-xs">
      <div className="mb-5 flex items-center gap-3">
        <span className="flex h-9.5 w-9.5 items-center justify-center rounded-sm bg-success-light text-success-dark">
          <CheckCircle2 size={20} />
        </span>
        <div>
          <h2 className="text-[17px] font-bold text-text-primary">Recently completed</h2>
          <span className="text-sm text-text-faint">
            {tasks.length} {tasks.length === 1 ? "task" : "tasks"} in the past week
          </span>
        </div>
      </div>

      {tasks.length === 0 ? (
        <EmptyState description="No tasks completed in the past week." />
      ) : (
        <div className="relative pl-7.5">
          <div className="absolute bottom-1.5 left-2.25 top-1.5 w-px bg-border" />
          {tasks.map((task) => (
            <Link
              key={task.id}
              href={`/tasks/${task.id}`}
              className="relative block rounded-md pr-2 pb-5.5 transition-colors duration-(--duration-base) last:pb-0 hover:bg-surface-subtle"
            >
              <span className="absolute -left-7.25 top-0.75 flex h-[20px] w-[20px] items-center justify-center rounded-full border-2 border-success bg-surface">
                <span className="h-2 w-2 rounded-full bg-success" />
              </span>
              <div className="flex flex-wrap items-center gap-2.5">
                <strong className="text-[15px] font-semi text-text-primary">{task.name}</strong>
                <span className="inline-flex items-center rounded-pill bg-accent-lightest px-2.5 py-0.75 text-xs font-semi text-accent">
                  {task.initiativeName}
                </span>
                <span className="inline-flex items-center rounded-pill bg-surface-inset px-2.5 py-0.75 text-xs font-semi text-text-secondary">
                  {task.projectName}
                </span>
                <span className="ml-auto flex items-center gap-3">
                  {showOwner && (
                    <span className="flex items-center gap-1.75 text-xs text-text-secondary">
                      <span className="flex h-[22px] w-[22px] flex-none items-center justify-center rounded-full bg-accent-lightest text-[10px] font-bold text-accent">
                        {getInitials(task.ownerName)}
                      </span>
                      {task.ownerName}
                    </span>
                  )}
                  {task.completedDate && (
                    <span className="text-xs text-text-faint">Completed {formatShortDate(task.completedDate)}</span>
                  )}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
