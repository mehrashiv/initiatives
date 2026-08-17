import type { TaskStatus } from "@/types";

export interface ActivityTask {
  id: string;
  name: string;
  status: TaskStatus;
  initiativeName: string;
  projectName: string;
  ownerId: string;
  ownerName: string;
  endDate: Date;
  completedDate: Date | null;
  updatedAt: Date;
  progress: number;
  followUp: boolean;
  blockedReason: string | null;
  newNoteCount: number;
}

