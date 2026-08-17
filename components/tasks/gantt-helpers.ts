import { dayDiff } from "@/lib/dates";
import { GANTT_BUCKET_ACCENT } from "./types";
import type { BoardTask, GanttBucket } from "./types";

export type GanttTailStyle = "none" | "hatch" | "dashed";

export interface GanttRowVisual {
  bucket: GanttBucket;
  label: string;
  barStart: Date;
  barEnd: Date;
  solidEnd: Date;
  tailStyle: GanttTailStyle;
  deliveryMarker: Date | null;
  lateByDays: number | null;
}

export function computeGanttRowVisual(task: BoardTask, today: Date): GanttRowVisual {
  const barStart = task.startDate ?? task.endDate;
  const { deliveryDate, endDate } = task;

  if (deliveryDate && dayDiff(deliveryDate, endDate) > 0) {
    const lateByDays = dayDiff(deliveryDate, endDate);
    return {
      bucket: "delayed",
      label: `Delayed ${lateByDays}d`,
      barStart,
      barEnd: deliveryDate,
      solidEnd: endDate,
      tailStyle: "hatch",
      deliveryMarker: deliveryDate,
      lateByDays,
    };
  }

  if (deliveryDate || task.status === "done") {
    const marker = deliveryDate ?? endDate;
    return {
      bucket: "on_time",
      label: "On time",
      barStart,
      barEnd: endDate,
      solidEnd: marker,
      tailStyle: marker.getTime() < endDate.getTime() ? "dashed" : "none",
      deliveryMarker: deliveryDate,
      lateByDays: null,
    };
  }

  if (dayDiff(today, endDate) > 0) {
    return {
      bucket: "at_risk",
      label: "Overdue",
      barStart,
      barEnd: endDate,
      solidEnd: endDate,
      tailStyle: "none",
      deliveryMarker: null,
      lateByDays: null,
    };
  }

  if (task.status === "blocked") {
    return {
      bucket: "at_risk",
      label: "Blocked",
      barStart,
      barEnd: endDate,
      solidEnd: endDate,
      tailStyle: "none",
      deliveryMarker: null,
      lateByDays: null,
    };
  }

  if (task.status === "in_progress") {
    return {
      bucket: "in_progress",
      label: "In progress",
      barStart,
      barEnd: endDate,
      solidEnd: endDate,
      tailStyle: "none",
      deliveryMarker: null,
      lateByDays: null,
    };
  }

  return {
    bucket: "to_do",
    label: "To do",
    barStart,
    barEnd: endDate,
    solidEnd: endDate,
    tailStyle: "none",
    deliveryMarker: null,
    lateByDays: null,
  };
}

export function ganttBucketAccent(bucket: GanttBucket) {
  return GANTT_BUCKET_ACCENT[bucket];
}
