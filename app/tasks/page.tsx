import { redirect } from "next/navigation";
import { getServerClient } from "@/lib/insforge-server";
import { TasksView } from "@/components/tasks/tasks-view";
import { boardTaskFromRow } from "@/components/tasks/task-helpers";
import { parseTasksQuery, sanitizeState } from "@/components/tasks/filter-state";
import type { ProjectOption } from "@/components/shared/new-task-modal";

export default async function TasksPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
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
    .select(
      "id, project_id, name, status, start_date, end_date, delivery_date, progress, blocker_owner, flagged, owner",
    );
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

  const projectOptions: ProjectOption[] = (projects ?? []).map((p) => ({
    id: p.id,
    name: p.name,
    initiativeName: initiativeNameById.get(p.initiative_id) ?? "Unassigned",
  }));
  const projectOptionById = new Map(projectOptions.map((p) => [p.id, p]));

  const activeProjectOptions = (projects ?? [])
    .filter((p) => p.status === "active")
    .map((p) => ({
      id: p.id,
      name: p.name,
      initiativeName: initiativeNameById.get(p.initiative_id) ?? "Unassigned",
    }));

  const boardTasks = (tasks ?? []).flatMap((t) => {
    const boardTask = boardTaskFromRow(t, projectOptionById, profileNameById);
    return boardTask ? [boardTask] : [];
  });

  const currentUserName = data.user.profile?.name ?? data.user.email;

  const initiativeOptions = [...(initiatives ?? [])]
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((it) => ({ id: it.id, name: it.name }));
  const projectInitiativeIds = Object.fromEntries((projects ?? []).map((p) => [p.id, p.initiative_id]));

  // View and filters from the URL, checked against the ids fetched above so stale links heal themselves.
  const { raw, hasQuery } = parseTasksQuery(await searchParams);
  const initialState = sanitizeState(raw, {
    projectIds: (projects ?? []).map((p) => p.id),
    initiativeIds: (initiatives ?? []).map((it) => it.id),
    ownerIds: (profiles ?? []).map((p) => p.id),
    projectInitiativeIds,
  });

  return (
    <TasksView
      initialTasks={boardTasks}
      projectOptions={projectOptions}
      activeProjectOptions={activeProjectOptions}
      initiativeOptions={initiativeOptions}
      projectInitiativeIds={projectInitiativeIds}
      profiles={profiles ?? []}
      currentUserId={data.user.id}
      currentUserName={currentUserName}
      initialState={initialState}
      hasQuery={hasQuery}
    />
  );
}
