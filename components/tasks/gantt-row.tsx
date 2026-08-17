"use client";

import { useRouter } from "next/navigation";
import posthog from "posthog-js";
import { dayDiff, formatShortDate } from "@/lib/dates";
import { computeGanttRowVisual, ganttBucketAccent } from "./gantt-helpers";
import type { BoardTask } from "./types";

interface GanttRowProps {
  task: BoardTask;
  today: Date;
  rangeStart: Date;
  pxPerDay: number;
  timelineWidth: number;
  labelWidth: number;
}

const BAR_HEIGHT = 10;

export function GanttRow({ task, today, rangeStart, pxPerDay, timelineWidth, labelWidth }: GanttRowProps) {
  const router = useRouter();
  const visual = computeGanttRowVisual(task, today);
  const accent = ganttBucketAccent(visual.bucket);

  const toPx = (date: Date) => dayDiff(date, rangeStart) * pxPerDay;

  const barLeft = toPx(visual.barStart);
  const solidWidth = toPx(visual.solidEnd) - barLeft;
  const tailLeft = toPx(visual.solidEnd);
  const tailWidth = toPx(visual.barEnd) - tailLeft;
  const markerLeft = visual.deliveryMarker ? toPx(visual.deliveryMarker) : null;
  // The solid segment always reads as "on track" (green) up to solidEnd — only the
  // hatched tail past it is amber. A "delayed" row's own accent.fill (amber) is for its
  // label/dot, not the on-track portion of its bar.
  const solidFill = visual.bucket === "delayed" ? "bg-success-dark" : accent.fill;

  return (
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
      className="group flex cursor-pointer border-b border-border last:border-b-0 hover:bg-surface-subtle"
    >
      <div
        className="sticky left-0 z-20 shrink-0 border-r border-border bg-surface px-4 py-3.5 group-hover:bg-surface-subtle"
        style={{ width: labelWidth }}
      >
        <div className="truncate text-[13.5px] font-semi text-text-primary">{task.name}</div>
        <div className="mt-0.75 flex items-center gap-1.25 text-[11.5px]">
          <span className={`font-semi ${accent.text}`}>{visual.label}</span>
          <span className="truncate text-text-faint">· {task.projectName}</span>
        </div>
      </div>

      <div className="relative shrink-0" style={{ width: timelineWidth, height: 56 }}>
        <div
          className={`absolute top-[18px] rounded-pill ${solidFill}`}
          style={{ left: barLeft, width: Math.max(solidWidth, 0), height: BAR_HEIGHT }}
        />

        {visual.tailStyle === "hatch" && tailWidth > 0 && (
          <div
            className="absolute top-[18px] rounded-pill"
            style={{
              left: tailLeft,
              width: tailWidth,
              height: BAR_HEIGHT,
              background:
                "repeating-linear-gradient(45deg, color-mix(in srgb, var(--color-warning) 40%, transparent) 0 4px, transparent 4px 8px)",
            }}
          />
        )}

        {visual.tailStyle === "dashed" && tailWidth > 0 && (
          <div
            className="absolute top-[18px] rounded-pill"
            style={{
              left: tailLeft,
              width: tailWidth,
              height: BAR_HEIGHT,
              border: "1.5px dashed var(--color-success-dark)",
            }}
          />
        )}

        {visual.lateByDays !== null && tailWidth > 0 && (
          <div
            className="absolute -top-[2px] text-[10.5px] font-bold text-warning"
            style={{ left: tailLeft }}
          >
            +{visual.lateByDays}d
          </div>
        )}

        {markerLeft !== null && (
          <div
            className="absolute top-1/2 h-[8px] w-[8px] -translate-y-1/2 rotate-45 bg-text-primary"
            style={{ left: markerLeft - 4 }}
          />
        )}

        <div className="absolute top-[31px] text-[11px] text-text-faint" style={{ left: barLeft }}>
          {formatShortDate(visual.barStart)}
        </div>
        <div
          className="absolute top-[31px] -translate-x-full text-[11px] text-text-faint"
          style={{ left: toPx(visual.barEnd) }}
        >
          {formatShortDate(visual.barEnd)}
        </div>

        {visual.lateByDays !== null && (
          <div className="absolute top-[44px] text-[11px] font-med text-warning" style={{ left: barLeft }}>
            Delivered {formatShortDate(visual.deliveryMarker!)}
          </div>
        )}
      </div>
    </div>
  );
}
