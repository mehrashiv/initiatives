import { redirect } from "next/navigation";
import { getServerClient } from "@/lib/insforge-server";
import { MyActivitiesView } from "@/components/my-activities/my-activities-view";
import { activityTaskFromRow } from "@/components/my-activities/task-helpers";
import type { ProjectOption } from "@/components/shared/new-task-modal";

export default async function MyActivitiesPage() {
  const insforge = await getServerClient();
  const { data } = await insforge.auth.getCurrentUser();
  if (!data.user) redirect("/login");

  const { data: profile } = await insforge.database
    .from("profiles")
    .select("role")
    .eq("id", data.user.id)
    .single();
  const isAdmin = profile?.role === "admin";

  let tasksQuery = insforge.database
    .from("tasks")
    .select("id, project_id, name, status, end_date, progress, blocker_owner, flagged, owner, updated_at");
  if (!isAdmin) {
    tasksQuery = tasksQuery.eq("owner", data.user.id);
  }

  const [{ data: projects }, { data: initiatives }, { data: profiles }, { data: tasks }] = await Promise.all([
    insforge.database.from("projects").select("id, name, initiative_id, status").order("name"),
    insforge.database.from("initiatives").select("id, name"),
    insforge.database.from("profiles").select("id, name").order("name"),
    tasksQuery,
  ]);

  const initiativeNameById = new Map((initiatives ?? []).map((it) => [it.id, it.name]));
  const profileNameById = new Map((profiles ?? []).map((p) => [p.id, p.name]));

  const activeProjectOptions: ProjectOption[] = (projects ?? [])
    .filter((p) => p.status === "active")
    .map((p) => ({
      id: p.id,
      name: p.name,
      initiativeName: initiativeNameById.get(p.initiative_id) ?? "Unassigned",
    }));

  const projectOptionById = new Map(
    (projects ?? []).map((p) => [
      p.id,
      { id: p.id, name: p.name, initiativeName: initiativeNameById.get(p.initiative_id) ?? "Unassigned" },
    ]),
  );

  const activityTasks = (tasks ?? []).flatMap((t) => {
    const task = activityTaskFromRow(t, projectOptionById, profileNameById);
    return task ? [task] : [];
  });

  const currentUserName = data.user.profile?.name ?? data.user.email;

  return (
    <MyActivitiesView
      currentUserId={data.user.id}
      currentUserName={currentUserName}
      initialTasks={activityTasks}
      projectOptions={activeProjectOptions}
      ownerOptions={profiles ?? []}
    />
  );
}
