"use client";

import { useEffect, useRef } from "react";
import { dayDiff, formatShortDate } from "@/lib/dates";
import { computeGanttRowVisual } from "./gantt-helpers";
import { GanttRow } from "./gantt-row";
import type { BoardTask } from "./types";

interface GanttChartProps {
  tasks: BoardTask[];
  today: Date;
}

const PX_PER_DAY = 20;
const LABEL_WIDTH = 260;
const RANGE_PADDING_DAYS = 3;
// On first load, scroll so today's line sits just past the frozen label column,
// with this many days of past context still visible to its left.
const TODAY_LEAD_IN_DAYS = 7;

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

interface MonthSegment {
  key: string;
  label: string;
  left: number;
  width: number;
}

function buildMonthSegments(rangeStart: Date, totalDays: number, pxPerDay: number): MonthSegment[] {
  const segments: MonthSegment[] = [];
  let dayIndex = 0;

  while (dayIndex < totalDays) {
    const segmentStart = addDays(rangeStart, dayIndex);
    const month = segmentStart.getMonth();
    const year = segmentStart.getFullYear();
    let span = 0;
    while (dayIndex + span < totalDays) {
      const d = addDays(rangeStart, dayIndex + span);
      if (d.getMonth() !== month || d.getFullYear() !== year) break;
      span++;
    }
    segments.push({
      key: `${year}-${month}`,
      label: formatShortDate(segmentStart).slice(0, 3),
      left: dayIndex * pxPerDay,
      width: span * pxPerDay,
    });
    dayIndex += span;
  }

  return segments;
}

const LEGEND_ITEMS: { dot: string; label: string }[] = [
  { dot: "bg-success-dark", label: "Before / on time" },
  { dot: "bg-warning", label: "Delayed" },
  { dot: "bg-danger-cta", label: "At risk" },
  { dot: "bg-accent", label: "In progress" },
  { dot: "bg-text-secondary", label: "To do" },
];

export function GanttChart({ tasks, today }: GanttChartProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const hasScrolledToToday = useRef(false);

  const visuals = tasks.map((task) => computeGanttRowVisual(task, today));
  const earliest = visuals.reduce((min, v) => (v.barStart < min ? v.barStart : min), today);
  const latest = visuals.reduce((max, v) => (v.barEnd > max ? v.barEnd : max), today);

  const rangeStart = addDays(earliest, -RANGE_PADDING_DAYS);
  const rangeEnd = addDays(latest, RANGE_PADDING_DAYS);
  const totalDays = dayDiff(rangeEnd, rangeStart) + 1;
  const timelineWidth = totalDays * PX_PER_DAY;
  const todayLeft = dayDiff(today, rangeStart) * PX_PER_DAY;

  const monthSegments = buildMonthSegments(rangeStart, totalDays, PX_PER_DAY);

  useEffect(() => {
    if (hasScrolledToToday.current) return;
    hasScrolledToToday.current = true;
    scrollRef.current?.scrollTo({ left: Math.max(todayLeft - TODAY_LEAD_IN_DAYS * PX_PER_DAY, 0) });
  }, [todayLeft]);

  return (
    <div>
      <div className="mb-3.5 flex flex-wrap items-center gap-4 text-[12.5px] text-text-secondary">
        {LEGEND_ITEMS.map((item) => (
          <span key={item.label} className="flex items-center gap-1.5">
            <span className={`h-2 w-2 rounded-full ${item.dot}`} />
            {item.label}
          </span>
        ))}
        <span className="flex items-center gap-1.5">
          <span className="h-[8px] w-[8px] rotate-45 bg-text-primary" />
          Delivered
        </span>
        <span className="flex items-center gap-1.5">
          <span
            className="h-2.5 w-3.5"
            style={{
              background:
                "repeating-linear-gradient(45deg, color-mix(in srgb, var(--color-warning) 50%, transparent) 0 3px, transparent 3px 6px)",
            }}
          />
          Past plan
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-px bg-accent-bright" />
          Today
        </span>
      </div>

      <div ref={scrollRef} className="overflow-x-auto rounded-lg border border-border bg-surface shadow-xs">
        <div className="relative" style={{ width: LABEL_WIDTH + timelineWidth }}>
          <div
            className="pointer-events-none absolute top-0 bottom-0 z-10 w-px bg-accent-bright"
            style={{ left: LABEL_WIDTH + todayLeft }}
          />

          {monthSegments.map((seg) => (
            <div
              key={`grid-${seg.key}`}
              className="pointer-events-none absolute border-l border-border"
              style={{ left: LABEL_WIDTH + seg.left, top: 42, bottom: 0 }}
            />
          ))}

          <div className="flex border-b border-border bg-surface-subtle" style={{ height: 42 }}>
            <div
              className="sticky left-0 z-20 shrink-0 border-r border-border bg-surface-subtle px-4 text-[11px] font-bold uppercase tracking-wide text-text-faint flex items-center"
              style={{ width: LABEL_WIDTH }}
            >
              Task
            </div>
            <div className="relative shrink-0" style={{ width: timelineWidth, height: 42 }}>
              {monthSegments.map((seg) => (
                <div
                  key={seg.key}
                  className="absolute top-0 flex items-center border-l border-border px-2.5 text-xs font-med text-text-faint"
                  style={{ left: seg.left, width: seg.width, height: 42 }}
                >
                  {seg.label}
                </div>
              ))}
            </div>
          </div>

          {tasks.map((task) => (
            <GanttRow
              key={task.id}
              task={task}
              today={today}
              rangeStart={rangeStart}
              pxPerDay={PX_PER_DAY}
              timelineWidth={timelineWidth}
              labelWidth={LABEL_WIDTH}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
