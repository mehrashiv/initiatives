import type { ActivityKind } from "@/types";
import type { TimelineEntry } from "./types";

export interface ActivityRow {
  id: string;
  task_id: string;
  kind: ActivityKind;
  who: string;
  text: string;
  edited: boolean;
  pinned: boolean;
  created_at: string;
}

export interface ActivityChangedPayload extends ActivityRow {
  op: "insert" | "update";
}

export function timelineEntryFromRow(row: ActivityRow, profileNameById: Map<string, string>): TimelineEntry {
  return {
    id: row.id,
    kind: row.kind,
    whoId: row.who,
    whoName: profileNameById.get(row.who) ?? "Unknown",
    text: row.text,
    edited: row.edited,
    pinned: row.pinned,
    createdAt: new Date(row.created_at),
  };
}
