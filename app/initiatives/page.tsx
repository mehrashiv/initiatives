import { redirect } from "next/navigation";
import { getServerClient } from "@/lib/insforge-server";
import { computeRollup } from "@/lib/rollups";
import { startOfDay } from "@/lib/dates";
import { InitiativesView } from "@/components/initiatives/initiatives-view";
import type { InitiativeCardData } from "@/components/initiatives/types";
import { SEGMENT_COLORS } from "@/components/shared/segment-colors";

export default async function InitiativesPage() {
  const insforge = await getServerClient();
  const { data } = await insforge.auth.getCurrentUser();
  if (!data.user) redirect("/login");

  const [{ data: profile }, { data: initiatives }, { data: projects }, { data: tasks }, { data: profiles }] = await Promise.all([
    insforge.database.from("profiles").select("role").eq("id", data.user.id).single(),
    insforge.database
      .from("initiatives")
      .select("id, name, goal, category, status, created_by, owner, created_at, updated_at")
      .order("updated_at", { ascending: false }),
    insforge.database.from("projects").select("id, initiative_id"),
    insforge.database.from("tasks").select("project_id, status, progress, end_date"),
    insforge.database.from("profiles").select("id, name"),
  ]);

  const nameById = new Map((profiles ?? []).map((p) => [p.id, p.name]));
  const projectsByInitiative = new Map<string, string[]>();
  for (const p of projects ?? []) {
    projectsByInitiative.set(p.initiative_id, [...(projectsByInitiative.get(p.initiative_id) ?? []), p.id]);
  }

  const today = startOfDay(new Date());
  const rows: InitiativeCardData[] = (initiatives ?? []).map((it) => {
    const rollup = computeRollup(projectsByInitiative.get(it.id) ?? [], tasks ?? [], today);
    return {
      id: it.id,
      name: it.name,
      goal: it.goal ?? "",
      category: it.category ?? "",
      status: it.status,
      ownerId: it.owner,
      ownerName: nameById.get(it.owner) ?? "Unknown",
      createdBy: it.created_by,
      progressPct: rollup.progressPct,
      segments: rollup.segments.map((s) => ({ ...s, color: SEGMENT_COLORS[s.key] })),
      projectCount: rollup.projectCount,
      taskCount: rollup.taskCount,
      atRiskCount: rollup.atRiskCount,
      updatedAt: new Date(it.updated_at),
    };
  });

  const categories = [...new Set(rows.map((r) => r.category).filter(Boolean))].sort();
  const people = (profiles ?? []).map((p) => ({ id: p.id, name: p.name }));

  return (
    <InitiativesView
      initialInitiatives={rows}
      categories={categories}
      people={people}
      currentUserId={data.user.id}
      currentUserRole={profile?.role === "admin" ? "admin" : "user"}
    />
  );
}
