import type { InitiativeStatus } from "@/types";
import type { ProgressSegment } from "@/components/shared/segment-colors";

export interface InitiativeCardData {
  id: string;
  name: string;
  goal: string;
  category: string;
  status: InitiativeStatus;
  ownerId: string;
  ownerName: string;
  createdBy: string;
  progressPct: number;
  segments: ProgressSegment[];
  projectCount: number;
  taskCount: number;
  atRiskCount: number;
  updatedAt: Date;
}

export interface InitiativeFormValues {
  name: string;
  goal: string;
  category: string;
  status: InitiativeStatus;
  ownerId: string;
}
