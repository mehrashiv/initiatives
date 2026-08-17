import type { Role } from "@/types";

interface OwnableRecord {
  created_by: string;
  owner: string;
}

interface PermissionUser {
  id: string;
  role: Role;
}

export function canEditInitiative(user: PermissionUser, initiative: OwnableRecord): boolean {
  return user.role === "admin" || initiative.created_by === user.id || initiative.owner === user.id;
}

export function canDeleteInitiative(user: PermissionUser, initiative: OwnableRecord): boolean {
  return canEditInitiative(user, initiative);
}

export function canEditProject(user: PermissionUser, project: OwnableRecord): boolean {
  return user.role === "admin" || project.created_by === user.id || project.owner === user.id;
}

export function canDeleteProject(user: PermissionUser, project: OwnableRecord): boolean {
  return canEditProject(user, project);
}
