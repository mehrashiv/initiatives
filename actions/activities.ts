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

function revalidateTaskPaths(taskId: string) {
  revalidatePath("/tasks");
  revalidatePath("/my-activities");
  revalidatePath(`/tasks/${taskId}`);
}

const permissionError = "You don't have permission to do that.";

const addNoteSchema = z.object({
  taskId: z.string().uuid(),
  text: z.string().trim().min(1, "Note text is required"),
});

export async function addNote(
  input: z.infer<typeof addNoteSchema>,
): Promise<{ ok: true; id: string; createdAt: string } | { ok: false; error: string }> {
  const { taskId, text } = addNoteSchema.parse(input);
  const { insforge, user } = await requireUser();

  const { data, error } = await insforge.database
    .from("activities")
    .insert({ task_id: taskId, kind: "note", who: user.id, text })
    .select("id, created_at");
  if (error || !data || data.length === 0) return { ok: false, error: "Failed to add note." };

  const posthog = getPostHogClient();
  posthog.capture({ distinctId: user.id, event: "note_added", properties: { task_id: taskId } });

  revalidateTaskPaths(taskId);
  return { ok: true, id: data[0].id, createdAt: data[0].created_at };
}

const editNoteSchema = z.object({
  taskId: z.string().uuid(),
  activityId: z.string().uuid(),
  text: z.string().trim().min(1, "Note text is required"),
});

export async function editNote(
  input: z.infer<typeof editNoteSchema>,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const { taskId, activityId, text } = editNoteSchema.parse(input);
  const { insforge } = await requireUser();

  const { data, error } = await insforge.database
    .from("activities")
    .update({ text, edited: true })
    .eq("id", activityId)
    .select("id");
  if (error) return { ok: false, error: "Failed to update note." };
  if (!data || data.length === 0) return { ok: false, error: permissionError };

  revalidateTaskPaths(taskId);
  return { ok: true };
}

const deleteNoteSchema = z.object({
  taskId: z.string().uuid(),
  activityId: z.string().uuid(),
});

export async function deleteNote(
  input: z.infer<typeof deleteNoteSchema>,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const { taskId, activityId } = deleteNoteSchema.parse(input);
  const { insforge } = await requireUser();

  const { data, error } = await insforge.database.from("activities").delete().eq("id", activityId).select("id");
  if (error) return { ok: false, error: "Failed to delete note." };
  if (!data || data.length === 0) return { ok: false, error: permissionError };

  revalidateTaskPaths(taskId);
  return { ok: true };
}

const toggleNotePinSchema = z.object({
  taskId: z.string().uuid(),
  activityId: z.string().uuid(),
  pinned: z.boolean(),
});

export async function toggleNotePin(
  input: z.infer<typeof toggleNotePinSchema>,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const { taskId, activityId, pinned } = toggleNotePinSchema.parse(input);
  const { insforge } = await requireUser();

  const { data, error } = await insforge.database
    .from("activities")
    .update({ pinned })
    .eq("id", activityId)
    .select("id");
  if (error) return { ok: false, error: "Failed to update pin." };
  if (!data || data.length === 0) return { ok: false, error: permissionError };

  revalidateTaskPaths(taskId);
  return { ok: true };
}
