import type { TaskStatus } from "@/types";
import type { ProjectOption } from "@/components/shared/new-task-modal";
import { parseDateOnly } from "@/lib/dates";
import type { BoardTask } from "./types";

export interface ProfileOption {
  id: string;
  name: string;
}

export interface TaskRow {
  id: string;
  project_id: string;
  name: string;
  status: TaskStatus;
  start_date?: string | null;
  end_date: string | null;
  delivery_date?: string | null;
  progress: number;
  blocker_owner: string | null;
  flagged: boolean;
  owner: string;
}

export interface TaskChangedPayload extends TaskRow {
  op: "insert" | "update";
}

export function boardTaskFromRow(
  row: TaskRow,
  projectOptionById: Map<string, ProjectOption>,
  profileNameById: Map<string, string>,
): BoardTask | null {
  const project = projectOptionById.get(row.project_id);
  if (!project) return null;

  const toDate = (value: string | null | undefined) => (value ? parseDateOnly(value) : null);

  return {
    id: row.id,
    name: row.name,
    status: row.status,
    projectId: project.id,
    projectName: project.name,
    initiativeName: project.initiativeName,
    ownerId: row.owner,
    ownerName: profileNameById.get(row.owner) ?? "Unassigned",
    startDate: toDate(row.start_date),
    endDate: toDate(row.end_date) ?? new Date(),
    deliveryDate: toDate(row.delivery_date),
    progress: row.progress,
    followUp: row.flagged,
    blockedReason: row.blocker_owner || null,
  };
}
