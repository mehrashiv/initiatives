"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { getServerClient } from "@/lib/insforge-server";
import { getPostHogClient } from "@/lib/posthog-server";
import { STATUS_COLUMNS } from "@/components/tasks/types";

async function requireUser() {
  const insforge = await getServerClient();
  const { data } = await insforge.auth.getCurrentUser();
  if (!data.user) throw new Error("Not signed in");
  return { insforge, user: data.user };
}

function statusLabel(status: string) {
  return STATUS_COLUMNS.find((c) => c.status === status)?.title ?? status;
}

function revalidateTaskPaths(taskId: string) {
  revalidatePath("/tasks");
  revalidatePath("/my-activities");
  revalidatePath(`/tasks/${taskId}`);
}

const taskStatusSchema = z.enum(["to_do", "in_progress", "blocked", "delayed", "done"]);
const dateInputSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date")
  .nullable();
const permissionError = "You don't have permission to edit this task.";

const updateTaskStatusSchema = z.object({
  taskId: z.string().uuid(),
  fromStatus: taskStatusSchema,
  toStatus: taskStatusSchema,
});

export async function updateTaskStatus(
  input: z.infer<typeof updateTaskStatusSchema>,
): Promise<
  { ok: true; activityId?: string; activityCreatedAt?: string } | { ok: false; error: string }
> {
  const { taskId, fromStatus, toStatus } = updateTaskStatusSchema.parse(input);
  const { insforge, user } = await requireUser();

  // Marking a task Done also persists progress=100 in the same write —
  // lib/rollups.ts averages the raw progress column with no Done special-case,
  // so a Done task left below 100% would silently undercount initiative/project rollups.
  const { data, error } = await insforge.database
    .from("tasks")
    .update(toStatus === "done" ? { status: toStatus, progress: 100 } : { status: toStatus })
    .eq("id", taskId)
    .select("id");
  // Thrown errors here would be redacted to a generic message by Next's production
  // build (confirmed empirically: `next dev` showed the real message, `next start`
  // didn't) — these are expected, user-facing outcomes, so return them instead.
  if (error) return { ok: false, error: "Failed to update task status." };
  if (!data || data.length === 0) return { ok: false, error: permissionError };

  // The task field update above is the source of truth and has already succeeded —
  // a failure recording the activity row below must not flip this action to ok:false
  // (that would make the client revert a status change that's already persisted).
  const { data: activity } = await insforge.database
    .from("activities")
    .insert({
      task_id: taskId,
      kind: "status",
      who: user.id,
      text: `Status changed from ${statusLabel(fromStatus)} to ${statusLabel(toStatus)}`,
    })
    .select("id, created_at");

  const posthog = getPostHogClient();
  posthog.capture({
    distinctId: user.id,
    event: "task_status_changed",
    properties: { task_id: taskId, from_status: fromStatus, to_status: toStatus },
  });
  if (toStatus === "done") {
    posthog.capture({ distinctId: user.id, event: "task_completed", properties: { task_id: taskId } });
  }

  revalidateTaskPaths(taskId);
  return { ok: true, activityId: activity?.[0]?.id, activityCreatedAt: activity?.[0]?.created_at };
}

const updateTaskNameSchema = z.object({
  taskId: z.string().uuid(),
  name: z.string().trim().min(1, "Task name is required"),
});

export async function updateTaskName(
  input: z.infer<typeof updateTaskNameSchema>,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const { taskId, name } = updateTaskNameSchema.parse(input);
  const { insforge } = await requireUser();

  const { data, error } = await insforge.database.from("tasks").update({ name }).eq("id", taskId).select("id");
  if (error) return { ok: false, error: "Failed to update task name." };
  if (!data || data.length === 0) return { ok: false, error: permissionError };

  revalidateTaskPaths(taskId);
  return { ok: true };
}

const updateTaskProjectSchema = z.object({
  taskId: z.string().uuid(),
  projectId: z.string().uuid(),
});

export async function updateTaskProject(
  input: z.infer<typeof updateTaskProjectSchema>,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const { taskId, projectId } = updateTaskProjectSchema.parse(input);
  const { insforge } = await requireUser();

  const { data, error } = await insforge.database
    .from("tasks")
    .update({ project_id: projectId })
    .eq("id", taskId)
    .select("id");
  if (error) return { ok: false, error: "Failed to update project." };
  if (!data || data.length === 0) return { ok: false, error: permissionError };

  revalidateTaskPaths(taskId);
  return { ok: true };
}

const updateTaskStartDateSchema = z.object({
  taskId: z.string().uuid(),
  startDate: dateInputSchema,
});

export async function updateTaskStartDate(
  input: z.infer<typeof updateTaskStartDateSchema>,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const { taskId, startDate } = updateTaskStartDateSchema.parse(input);
  const { insforge } = await requireUser();

  const { data, error } = await insforge.database
    .from("tasks")
    .update({ start_date: startDate })
    .eq("id", taskId)
    .select("id");
  if (error) return { ok: false, error: "Failed to update start date." };
  if (!data || data.length === 0) return { ok: false, error: permissionError };

  revalidateTaskPaths(taskId);
  return { ok: true };
}

const updateTaskEndDateSchema = z.object({
  taskId: z.string().uuid(),
  endDate: dateInputSchema,
});

export async function updateTaskEndDate(
  input: z.infer<typeof updateTaskEndDateSchema>,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const { taskId, endDate } = updateTaskEndDateSchema.parse(input);
  const { insforge } = await requireUser();

  const { data, error } = await insforge.database
    .from("tasks")
    .update({ end_date: endDate })
    .eq("id", taskId)
    .select("id");
  if (error) return { ok: false, error: "Failed to update end date." };
  if (!data || data.length === 0) return { ok: false, error: permissionError };

  revalidateTaskPaths(taskId);
  return { ok: true };
}

const updateTaskDeliveryDateSchema = z.object({
  taskId: z.string().uuid(),
  deliveryDate: dateInputSchema,
});

export async function updateTaskDeliveryDate(
  input: z.infer<typeof updateTaskDeliveryDateSchema>,
): Promise<
  | { ok: true; autoFlipped: boolean; activityId?: string; activityCreatedAt?: string }
  | { ok: false; error: string }
> {
  const { taskId, deliveryDate } = updateTaskDeliveryDateSchema.parse(input);
  const { insforge, user } = await requireUser();

  const { data: task } = await insforge.database.from("tasks").select("end_date, status").eq("id", taskId).single();
  if (!task) return { ok: false, error: "Task not found." };

  const autoFlip =
    deliveryDate !== null && task.end_date !== null && deliveryDate > task.end_date && task.status !== "delayed";

  const { data, error } = await insforge.database
    .from("tasks")
    .update(autoFlip ? { delivery_date: deliveryDate, status: "delayed" } : { delivery_date: deliveryDate })
    .eq("id", taskId)
    .select("id");
  if (error) return { ok: false, error: "Failed to update delivery date." };
  if (!data || data.length === 0) return { ok: false, error: permissionError };

  let activity: { id: string; created_at: string }[] | null = null;
  if (autoFlip) {
    const result = await insforge.database
      .from("activities")
      .insert({
        task_id: taskId,
        kind: "status",
        who: user.id,
        text: `Status automatically changed from ${statusLabel(task.status)} to Delayed — delivery date is after the planned end date`,
      })
      .select("id, created_at");
    activity = result.data;
  }

  revalidateTaskPaths(taskId);
  return {
    ok: true,
    autoFlipped: autoFlip,
    activityId: activity?.[0]?.id,
    activityCreatedAt: activity?.[0]?.created_at,
  };
}

const updateTaskProgressSchema = z.object({
  taskId: z.string().uuid(),
  fromProgress: z.number().int().min(0).max(100),
  toProgress: z.number().int().min(0).max(100),
});

export async function updateTaskProgress(
  input: z.infer<typeof updateTaskProgressSchema>,
): Promise<
  { ok: true; activityId?: string; activityCreatedAt?: string } | { ok: false; error: string }
> {
  const { taskId, fromProgress, toProgress } = updateTaskProgressSchema.parse(input);
  const { insforge, user } = await requireUser();

  const { data, error } = await insforge.database
    .from("tasks")
    .update({ progress: toProgress })
    .eq("id", taskId)
    .select("id");
  if (error) return { ok: false, error: "Failed to update progress." };
  if (!data || data.length === 0) return { ok: false, error: permissionError };

  const { data: activity } = await insforge.database
    .from("activities")
    .insert({
      task_id: taskId,
      kind: "progress",
      who: user.id,
      text: `Progress changed from ${fromProgress}% to ${toProgress}%`,
    })
    .select("id, created_at");

  revalidateTaskPaths(taskId);
  return { ok: true, activityId: activity?.[0]?.id, activityCreatedAt: activity?.[0]?.created_at };
}

const updateTaskBlockerOwnerSchema = z.object({
  taskId: z.string().uuid(),
  blockerOwner: z.string().trim().nullable(),
});

export async function updateTaskBlockerOwner(
  input: z.infer<typeof updateTaskBlockerOwnerSchema>,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const { taskId, blockerOwner } = updateTaskBlockerOwnerSchema.parse(input);
  const { insforge } = await requireUser();

  const { data, error } = await insforge.database
    .from("tasks")
    .update({ blocker_owner: blockerOwner || null })
    .eq("id", taskId)
    .select("id");
  if (error) return { ok: false, error: "Failed to update blocker owner." };
  if (!data || data.length === 0) return { ok: false, error: permissionError };

  revalidateTaskPaths(taskId);
  return { ok: true };
}

const markTaskDoneSchema = z.object({
  taskId: z.string().uuid(),
});

export async function markTaskDone(
  input: z.infer<typeof markTaskDoneSchema>,
): Promise<
  { ok: true; activityId?: string; activityCreatedAt?: string } | { ok: false; error: string }
> {
  const { taskId } = markTaskDoneSchema.parse(input);
  const { insforge, user } = await requireUser();

  const { data, error } = await insforge.database
    .from("tasks")
    .update({ status: "done", progress: 100 })
    .eq("id", taskId)
    .select("id");
  if (error) return { ok: false, error: "Failed to mark task done." };
  if (!data || data.length === 0) return { ok: false, error: permissionError };

  const { data: activity } = await insforge.database
    .from("activities")
    .insert({
      task_id: taskId,
      kind: "completed",
      who: user.id,
      text: "Marked as done",
    })
    .select("id, created_at");

  const posthog = getPostHogClient();
  posthog.capture({ distinctId: user.id, event: "task_marked_done", properties: { task_id: taskId } });

  revalidateTaskPaths(taskId);
  return { ok: true, activityId: activity?.[0]?.id, activityCreatedAt: activity?.[0]?.created_at };
}

const toggleTaskFlagSchema = z.object({
  taskId: z.string().uuid(),
  flagged: z.boolean(),
});

export async function toggleTaskFlag(
  input: z.infer<typeof toggleTaskFlagSchema>,
): Promise<
  { ok: true; activityId?: string; activityCreatedAt?: string } | { ok: false; error: string }
> {
  const { taskId, flagged } = toggleTaskFlagSchema.parse(input);
  const { insforge, user } = await requireUser();

  const { data, error } = await insforge.database
    .from("tasks")
    .update({ flagged })
    .eq("id", taskId)
    .select("id");
  if (error) return { ok: false, error: "Failed to update follow-up flag." };
  if (!data || data.length === 0) return { ok: false, error: permissionError };

  const { data: activity } = await insforge.database
    .from("activities")
    .insert({
      task_id: taskId,
      kind: "flag",
      who: user.id,
      text: flagged ? "Flagged for follow-up" : "Follow-up cleared",
    })
    .select("id, created_at");

  const posthog = getPostHogClient();
  posthog.capture({
    distinctId: user.id,
    event: "task_follow_up_toggled",
    properties: { task_id: taskId, flagged },
  });

  revalidateTaskPaths(taskId);
  return { ok: true, activityId: activity?.[0]?.id, activityCreatedAt: activity?.[0]?.created_at };
}

const createTaskSchema = z.object({
  name: z.string().trim().min(1, "Task name is required"),
  description: z.string().trim(),
  projectId: z.string().uuid(),
  ownerId: z.string().uuid(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date"),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date"),
  status: z.enum(["to_do", "in_progress", "blocked"]),
});

export async function createTask(
  input: z.infer<typeof createTaskSchema>,
): Promise<{ ok: true; taskId: string; createdAt: string } | { ok: false; error: string }> {
  const { name, description, projectId, ownerId, startDate, endDate, status } = createTaskSchema.parse(input);
  const { insforge, user } = await requireUser();

  const { data, error } = await insforge.database
    .from("tasks")
    .insert({
      project_id: projectId,
      name,
      description: description || null,
      status,
      start_date: startDate,
      end_date: endDate,
      created_by: user.id,
      owner: ownerId,
    })
    .select("id, created_at")
    .single();
  if (error || !data) return { ok: false, error: "Failed to create task." };

  await insforge.database.from("activities").insert({
    task_id: data.id,
    kind: "created",
    who: user.id,
    text: "Task created",
  });

  const posthog = getPostHogClient();
  posthog.capture({ distinctId: user.id, event: "task_created", properties: { task_id: data.id } });

  revalidateTaskPaths(data.id);
  return { ok: true, taskId: data.id, createdAt: data.created_at };
}

const updateTaskDescriptionSchema = z.object({
  taskId: z.string().uuid(),
  description: z.string().trim().nullable(),
});

export async function updateTaskDescription(
  input: z.infer<typeof updateTaskDescriptionSchema>,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const { taskId, description } = updateTaskDescriptionSchema.parse(input);
  const { insforge } = await requireUser();

  const { data, error } = await insforge.database
    .from("tasks")
    .update({ description: description || null })
    .eq("id", taskId)
    .select("id");
  if (error) return { ok: false, error: "Failed to update description." };
  if (!data || data.length === 0) return { ok: false, error: permissionError };

  revalidateTaskPaths(taskId);
  return { ok: true };
}

const updateTaskOwnerSchema = z.object({
  taskId: z.string().uuid(),
  toOwnerId: z.string().uuid(),
  fromOwnerName: z.string(),
  toOwnerName: z.string(),
});

export async function updateTaskOwner(
  input: z.infer<typeof updateTaskOwnerSchema>,
): Promise<
  { ok: true; activityId?: string; activityCreatedAt?: string } | { ok: false; error: string }
> {
  const { taskId, toOwnerId, fromOwnerName, toOwnerName } = updateTaskOwnerSchema.parse(input);
  const { insforge, user } = await requireUser();

  const { data, error } = await insforge.database
    .from("tasks")
    .update({ owner: toOwnerId })
    .eq("id", taskId)
    .select("id");
  if (error) return { ok: false, error: "Failed to update owner." };
  if (!data || data.length === 0) return { ok: false, error: permissionError };

  const { data: activity } = await insforge.database
    .from("activities")
    .insert({
      task_id: taskId,
      kind: "owner",
      who: user.id,
      text: `Owner changed from ${fromOwnerName} to ${toOwnerName}`,
    })
    .select("id, created_at");

  revalidateTaskPaths(taskId);
  return { ok: true, activityId: activity?.[0]?.id, activityCreatedAt: activity?.[0]?.created_at };
}
