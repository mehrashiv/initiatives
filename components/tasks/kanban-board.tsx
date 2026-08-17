"use client";

import { useState } from "react";
import type { TaskStatus } from "@/types";
import { KanbanCard } from "./kanban-card";
import { STATUS_ACCENT, STATUS_COLUMNS } from "./types";
import type { BoardTask } from "./types";

interface KanbanBoardProps {
  tasks: BoardTask[];
  today: Date;
  onDropTask: (taskId: string, status: TaskStatus) => void;
}

export function KanbanBoard({ tasks, today, onDropTask }: KanbanBoardProps) {
  const [draggingId, setDraggingId] = useState<string | null>(null);

  return (
    <div className="flex items-start gap-3.5 overflow-x-auto pb-2">
      {STATUS_COLUMNS.map((col) => {
        const items = tasks
          .filter((t) => t.status === col.status)
          .sort((a, b) => a.endDate.getTime() - b.endDate.getTime());
        const accent = STATUS_ACCENT[col.status];

        return (
          <div
            key={col.status}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              if (draggingId) onDropTask(draggingId, col.status);
              setDraggingId(null);
            }}
            className="flex min-h-30 min-w-65 flex-1 flex-col gap-2.5 rounded-md border border-border bg-surface-subtle p-2.75"
          >
            <div className="flex items-center gap-2 px-1 py-0.5">
              <span className={`h-2 w-2 rounded-full ${accent.dot}`} />
              <span className="text-[12.5px] font-bold text-text-primary">{col.title}</span>
              <span className="ml-auto flex h-[19px] min-w-5 items-center justify-center rounded-pill border border-border bg-surface px-1.5 text-[11px] font-bold text-text-secondary">
                {items.length}
              </span>
            </div>

            {items.map((task) => (
              <KanbanCard key={task.id} task={task} today={today} onDragStart={setDraggingId} />
            ))}

            {items.length === 0 && (
              <div className="rounded-sm border border-dashed border-border py-3.5 text-center text-xs text-text-faint">
                Drop here
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
