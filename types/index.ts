export type Role = "admin" | "user";

export interface AuthUser {
  name: string;
  email: string;
  role: Role;
}

export interface Profile {
  id: string;
  email: string;
  name: string;
  role: Role;
  created_at: string;
}

export type InitiativeStatus = "active" | "inactive";

export interface Initiative {
  id: string;
  name: string;
  goal: string | null;
  category: string | null;
  status: InitiativeStatus;
  created_by: string;
  owner: string;
  created_at: string;
  updated_at: string;
}

export type ProjectStatus = "active" | "inactive";

export interface Project {
  id: string;
  initiative_id: string;
  name: string;
  description: string | null;
  status: ProjectStatus;
  created_by: string;
  owner: string;
  created_at: string;
  updated_at: string;
}

export type TaskStatus = "to_do" | "in_progress" | "blocked" | "delayed" | "done";

export interface Task {
  id: string;
  project_id: string;
  name: string;
  description: string | null;
  status: TaskStatus;
  start_date: string | null;
  end_date: string | null;
  delivery_date: string | null;
  progress: number;
  blocker_owner: string | null;
  flagged: boolean;
  ai_summary: unknown;
  created_by: string;
  owner: string;
  created_at: string;
  updated_at: string;
}

export type ActivityKind =
  | "created"
  | "status"
  | "owner"
  | "progress"
  | "completed"
  | "flag"
  | "note";

export const TASK_ATTACHMENTS_BUCKET = "task-attachments";

export interface Attachment {
  key: string;
  url: string;
  filename: string;
  mimeType: string;
  sizeBytes: number;
}

export interface Activity {
  id: string;
  task_id: string;
  kind: ActivityKind;
  who: string;
  text: string;
  edited: boolean;
  pinned: boolean;
  attachments: Attachment[];
  created_at: string;
}
