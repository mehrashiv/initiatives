import type { ProjectStatus } from "@/types";
import type { ProgressSegment } from "@/components/shared/segment-colors";

export interface ProjectCardData {
  id: string;
  name: string;
  description: string;
  initiativeId: string;
  initiativeName: string;
  status: ProjectStatus;
  ownerId: string;
  ownerName: string;
  createdBy: string;
  progressPct: number;
  segments: ProgressSegment[];
  taskCount: number;
  atRiskCount: number;
  updatedAt: Date;
}

export interface ProjectFormValues {
  name: string;
  description: string;
  initiativeId: string;
  status: ProjectStatus;
  ownerId: string;
}
