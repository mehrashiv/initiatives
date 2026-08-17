import { redirect } from "next/navigation";
import { getServerClient } from "@/lib/insforge-server";
import { computeRollup } from "@/lib/rollups";
import { startOfDay } from "@/lib/dates";
import { ProjectsView } from "@/components/projects/projects-view";
import type { ProjectCardData } from "@/components/projects/types";
import { SEGMENT_COLORS } from "@/components/shared/segment-colors";

export default async function ProjectsPage() {
  const insforge = await getServerClient();
  const { data } = await insforge.auth.getCurrentUser();
  if (!data.user) redirect("/login");

  const [{ data: profile }, { data: projects }, { data: initiatives }, { data: tasks }, { data: profiles }] = await Promise.all([
    insforge.database.from("profiles").select("role").eq("id", data.user.id).single(),
    insforge.database
      .from("projects")
      .select("id, initiative_id, name, description, status, created_by, owner, created_at, updated_at")
      .order("updated_at", { ascending: false }),
    insforge.database.from("initiatives").select("id, name").order("name"),
    insforge.database.from("tasks").select("project_id, status, progress, end_date"),
    insforge.database.from("profiles").select("id, name").order("name"),
  ]);

  const initiativeNameById = new Map((initiatives ?? []).map((it) => [it.id, it.name]));
  const ownerNameById = new Map((profiles ?? []).map((p) => [p.id, p.name]));

  const today = startOfDay(new Date());
  const rows: ProjectCardData[] = (projects ?? []).map((p) => {
    const rollup = computeRollup([p.id], tasks ?? [], today);
    return {
      id: p.id,
      name: p.name,
      description: p.description ?? "",
      initiativeId: p.initiative_id,
      initiativeName: initiativeNameById.get(p.initiative_id) ?? "Unassigned",
      status: p.status,
      ownerId: p.owner,
      ownerName: ownerNameById.get(p.owner) ?? "Unknown",
      createdBy: p.created_by,
      progressPct: rollup.progressPct,
      segments: rollup.segments.map((s) => ({ ...s, color: SEGMENT_COLORS[s.key] })),
      taskCount: rollup.taskCount,
      atRiskCount: rollup.atRiskCount,
      updatedAt: new Date(p.updated_at),
    };
  });

  return (
    <ProjectsView
      initialProjects={rows}
      initiatives={initiatives ?? []}
      people={profiles ?? []}
      currentUserId={data.user.id}
      currentUserRole={profile?.role === "admin" ? "admin" : "user"}
    />
  );
}
