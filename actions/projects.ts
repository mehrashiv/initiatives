"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { getServerClient } from "@/lib/insforge-server";
import { getPostHogClient } from "@/lib/posthog-server";

async function requireUser() {
  const insforge = await getServerClient();
  const { data } = await insforge.auth.getCurrentUser();
  if (!data.user) throw new Error("Not signed in");
  return { insforge, user: data.user };
}

const createProjectSchema = z.object({
  name: z.string().trim().min(1).max(80),
  description: z.string().trim().max(2000).optional().default(""),
  initiativeId: z.string().uuid(),
  status: z.enum(["active", "inactive"]),
  ownerId: z.string().uuid(),
});

export async function createProject(
  input: z.infer<typeof createProjectSchema>,
): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  const { name, description, initiativeId, status, ownerId } = createProjectSchema.parse(input);
  const { insforge, user } = await requireUser();

  const { data, error } = await insforge.database
    .from("projects")
    .insert({
      name,
      description: description || null,
      initiative_id: initiativeId,
      status,
      created_by: user.id,
      owner: ownerId,
    })
    .select("id")
    .single();
  // Thrown errors here would be redacted to a generic message by Next's production
  // build — these are expected, user-facing outcomes, so return them instead.
  if (error || !data) return { ok: false, error: "Failed to create project." };

  const posthog = getPostHogClient();
  posthog.capture({ distinctId: user.id, event: "project_created", properties: { project_id: data.id } });

  revalidatePath("/projects");
  return { ok: true, id: data.id as string };
}

const updateProjectSchema = z.object({
  id: z.string().uuid(),
  name: z.string().trim().min(1).max(80),
  description: z.string().trim().max(2000).optional().default(""),
  initiativeId: z.string().uuid(),
  status: z.enum(["active", "inactive"]),
  ownerId: z.string().uuid(),
});

export async function updateProject(
  input: z.infer<typeof updateProjectSchema>,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const { id, name, description, initiativeId, status, ownerId } = updateProjectSchema.parse(input);
  const { insforge } = await requireUser();

  const { data, error } = await insforge.database
    .from("projects")
    .update({ name, description: description || null, initiative_id: initiativeId, status, owner: ownerId })
    .eq("id", id)
    .select("id");
  if (error) return { ok: false, error: "Failed to update project." };
  if (!data || data.length === 0) return { ok: false, error: "You don't have permission to edit this project." };

  revalidatePath("/projects");
  return { ok: true };
}

const toggleProjectStatusSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(["active", "inactive"]),
});

export async function toggleProjectStatus(
  input: z.infer<typeof toggleProjectStatusSchema>,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const { id, status } = toggleProjectStatusSchema.parse(input);
  const { insforge } = await requireUser();

  const { data, error } = await insforge.database.from("projects").update({ status }).eq("id", id).select("id");
  if (error) return { ok: false, error: "Failed to update project status." };
  if (!data || data.length === 0) return { ok: false, error: "You don't have permission to edit this project." };

  revalidatePath("/projects");
  return { ok: true };
}

const deleteProjectSchema = z.object({ id: z.string().uuid() });

export async function deleteProject(
  input: z.infer<typeof deleteProjectSchema>,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const { id } = deleteProjectSchema.parse(input);
  const { insforge } = await requireUser();

  const { data, error } = await insforge.database.from("projects").delete().eq("id", id).select("id");
  if (error) return { ok: false, error: "Failed to delete project." };
  if (!data || data.length === 0) return { ok: false, error: "You don't have permission to delete this project." };

  revalidatePath("/projects");
  return { ok: true };
}
