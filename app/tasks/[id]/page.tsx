import { notFound, redirect } from "next/navigation";
import { getServerClient } from "@/lib/insforge-server";
import { TaskDetailView } from "@/components/task-detail/task-detail-view";
import { parseDateOnly } from "@/lib/dates";
import type { TimelineEntry } from "@/components/task-detail/types";
import type { ProjectOption } from "@/components/shared/new-task-modal";

function toDate(value: string | null): Date | null {
  return value ? parseDateOnly(value) : null;
}

export default async function TaskDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const insforge = await getServerClient();
  const { data: authData } = await insforge.auth.getCurrentUser();
  if (!authData.user) redirect("/login");

  const { data: task } = await insforge.database
    .from("tasks")
    .select(
      "id, project_id, name, description, status, start_date, end_date, delivery_date, progress, blocker_owner, flagged, owner, created_at, updated_at",
    )
    .eq("id", id)
    .single();
  if (!task) notFound();

  const [{ data: projects }, { data: initiatives }, { data: profiles }, { data: rawActivities }] = await Promise.all([
    insforge.database.from("projects").select("id, name, initiative_id").order("name"),
    insforge.database.from("initiatives").select("id, name"),
    insforge.database.from("profiles").select("id, name").order("name"),
    insforge.database
      .from("activities")
      .select("id, kind, who, text, edited, pinned, created_at")
      .eq("task_id", task.id)
      .order("created_at", { ascending: false }),
  ]);

  const initiativeNameById = new Map((initiatives ?? []).map((it) => [it.id, it.name]));
  const projectOptions: ProjectOption[] = (projects ?? []).map((p) => ({
    id: p.id,
    name: p.name,
    initiativeName: initiativeNameById.get(p.initiative_id) ?? "Unassigned",
  }));

  const profileNameById = new Map((profiles ?? []).map((p) => [p.id, p.name]));
  const currentUserId = authData.user.id;
  const currentUserName = profileNameById.get(currentUserId) ?? authData.user.profile?.name ?? authData.user.email;

  const initialActivities: TimelineEntry[] = (rawActivities ?? []).map((a) => ({
    id: a.id,
    kind: a.kind,
    whoId: a.who,
    whoName: profileNameById.get(a.who) ?? "Unknown",
    text: a.text,
    edited: a.edited,
    pinned: a.pinned,
    createdAt: new Date(a.created_at),
  }));

  return (
    <TaskDetailView
      taskId={task.id}
      initialName={task.name}
      initialDescription={task.description ?? ""}
      initialStatus={task.status}
      initialStartDate={toDate(task.start_date)}
      initialEndDate={toDate(task.end_date)}
      initialDeliveryDate={toDate(task.delivery_date)}
      initialProgress={task.progress}
      initialBlockerOwner={task.blocker_owner ?? ""}
      initialFlagged={task.flagged}
      initialOwnerId={task.owner}
      createdAt={new Date(task.created_at)}
      updatedAt={new Date(task.updated_at)}
      initialProjectId={task.project_id}
      projectOptions={projectOptions}
      ownerOptions={profiles ?? []}
      currentUserId={currentUserId}
      currentUserName={currentUserName}
      initialActivities={initialActivities}
    />
  );
}
