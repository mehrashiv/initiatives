"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { getServerClient } from "@/lib/insforge-server";
import { getPostHogClient } from "@/lib/posthog-server";
import { TASK_ATTACHMENTS_BUCKET, type Attachment } from "@/types";

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

const attachmentSchema = z.object({
  key: z.string().min(1),
  url: z.string().min(1),
  filename: z.string().min(1),
  mimeType: z.string().min(1),
  sizeBytes: z.number().int().positive(),
});

const addNoteSchema = z
  .object({
    taskId: z.string().uuid(),
    text: z.string().trim(),
    attachments: z.array(attachmentSchema).max(10).default([]),
  })
  .refine((v) => v.text.length > 0 || v.attachments.length > 0, {
    message: "Note text or at least one attachment is required",
  });

export async function addNote(
  input: z.infer<typeof addNoteSchema>,
): Promise<{ ok: true; id: string; createdAt: string } | { ok: false; error: string }> {
  const { taskId, text, attachments } = addNoteSchema.parse(input);
  const { insforge, user } = await requireUser();

  const { data, error } = await insforge.database
    .from("activities")
    .insert({ task_id: taskId, kind: "note", who: user.id, text, attachments })
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

  const { data, error } = await insforge.database
    .from("activities")
    .delete()
    .eq("id", activityId)
    .select("id, attachments");
  if (error) return { ok: false, error: "Failed to delete note." };
  if (!data || data.length === 0) return { ok: false, error: permissionError };

  // Best-effort cleanup: the note row is already gone, so a failed remove() here
  // just leaves an orphaned object rather than blocking the delete the user asked for.
  const attachments = (data[0].attachments ?? []) as Attachment[];
  if (attachments.length > 0) {
    const bucket = insforge.storage.from(TASK_ATTACHMENTS_BUCKET);
    await Promise.all(attachments.map((a) => bucket.remove(a.key).catch(() => undefined)));
  }

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
