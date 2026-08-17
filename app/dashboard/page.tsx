import { redirect } from "next/navigation";
import { getServerClient } from "@/lib/insforge-server";
import { DashboardView } from "@/components/dashboard/dashboard-view";

export default async function DashboardPage() {
  const insforge = await getServerClient();
  const { data } = await insforge.auth.getCurrentUser();
  if (!data.user) redirect("/login");

  const [{ data: initiatives }, { data: profiles }, { data: projects }, { data: tasks }, { data: activities }] = await Promise.all([
    insforge.database
      .from("initiatives")
      .select("id, name, category, status, owner, created_at")
      .order("name", { ascending: true }),
    insforge.database.from("profiles").select("id, name"),
    insforge.database.from("projects").select("id, initiative_id, name, status, owner, created_at"),
    insforge.database
      .from("tasks")
      .select(
        "id, project_id, name, status, progress, start_date, end_date, delivery_date, blocker_owner, owner, created_at, updated_at",
      ),
    insforge.database.from("activities").select("task_id, created_at"),
  ]);

  const categories = [...new Set((initiatives ?? []).map((i) => i.category).filter(Boolean))].sort();
  const people = (profiles ?? []).map((p) => ({ id: p.id, name: p.name }));

  return (
    <DashboardView
      initiatives={(initiatives ?? []).map((i) => ({ id: i.id, name: i.name }))}
      people={people}
      categories={categories}
      rawInitiatives={initiatives ?? []}
      rawProjects={projects ?? []}
      rawTasks={tasks ?? []}
      rawActivities={activities ?? []}
    />
  );
}
