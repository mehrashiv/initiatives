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

const createInitiativeSchema = z.object({
  name: z.string().trim().min(1).max(80),
  goal: z.string().trim().max(2000).optional().default(""),
  category: z.string().trim().max(80).optional().default(""),
  status: z.enum(["active", "inactive"]),
  ownerId: z.string().uuid(),
});

export async function createInitiative(
  input: z.infer<typeof createInitiativeSchema>,
): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  const { name, goal, category, status, ownerId } = createInitiativeSchema.parse(input);
  const { insforge, user } = await requireUser();

  const { data, error } = await insforge.database
    .from("initiatives")
    .insert({
      name,
      goal: goal || null,
      category: category || null,
      status,
      created_by: user.id,
      owner: ownerId,
    })
    .select("id")
    .single();
  // Thrown errors here would be redacted to a generic message by Next's production
  // build — these are expected, user-facing outcomes, so return them instead.
  if (error || !data) return { ok: false, error: "Failed to create initiative." };

  const posthog = getPostHogClient();
  posthog.capture({ distinctId: user.id, event: "initiative_created", properties: { initiative_id: data.id } });

  revalidatePath("/initiatives");
  return { ok: true, id: data.id as string };
}

const updateInitiativeSchema = z.object({
  id: z.string().uuid(),
  name: z.string().trim().min(1).max(80),
  goal: z.string().trim().max(2000).optional().default(""),
  category: z.string().trim().max(80).optional().default(""),
  status: z.enum(["active", "inactive"]),
  ownerId: z.string().uuid(),
});

export async function updateInitiative(
  input: z.infer<typeof updateInitiativeSchema>,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const { id, name, goal, category, status, ownerId } = updateInitiativeSchema.parse(input);
  const { insforge } = await requireUser();

  const { data, error } = await insforge.database
    .from("initiatives")
    .update({ name, goal: goal || null, category: category || null, status, owner: ownerId })
    .eq("id", id)
    .select("id");
  if (error) return { ok: false, error: "Failed to update initiative." };
  if (!data || data.length === 0) return { ok: false, error: "You don't have permission to edit this initiative." };

  revalidatePath("/initiatives");
  return { ok: true };
}

const toggleInitiativeStatusSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(["active", "inactive"]),
});

export async function toggleInitiativeStatus(
  input: z.infer<typeof toggleInitiativeStatusSchema>,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const { id, status } = toggleInitiativeStatusSchema.parse(input);
  const { insforge } = await requireUser();

  const { data, error } = await insforge.database.from("initiatives").update({ status }).eq("id", id).select("id");
  if (error) return { ok: false, error: "Failed to update initiative status." };
  if (!data || data.length === 0) return { ok: false, error: "You don't have permission to edit this initiative." };

  revalidatePath("/initiatives");
  return { ok: true };
}

const deleteInitiativeSchema = z.object({ id: z.string().uuid() });

export async function deleteInitiative(
  input: z.infer<typeof deleteInitiativeSchema>,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const { id } = deleteInitiativeSchema.parse(input);
  const { insforge } = await requireUser();

  const { data, error } = await insforge.database.from("initiatives").delete().eq("id", id).select("id");
  if (error) return { ok: false, error: "Failed to delete initiative." };
  if (!data || data.length === 0) return { ok: false, error: "You don't have permission to delete this initiative." };

  revalidatePath("/initiatives");
  return { ok: true };
}
