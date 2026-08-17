import { redirect } from "next/navigation";
import { getServerClient } from "@/lib/insforge-server";
import { UsersView } from "@/components/users/users-view";
import type { UserRow } from "@/components/users/types";

export default async function UsersPage() {
  const insforge = await getServerClient();
  const { data } = await insforge.auth.getCurrentUser();
  if (!data.user) redirect("/login");

  const { data: profile } = await insforge.database
    .from("profiles")
    .select("role")
    .eq("id", data.user.id)
    .single();
  if (profile?.role !== "admin") redirect("/my-activities");

  const { data: profiles } = await insforge.database
    .from("profiles")
    .select("id, name, email, role")
    .order("created_at", { ascending: true });

  const rows: UserRow[] = (profiles ?? []).map((p) => ({
    id: p.id,
    name: p.name,
    email: p.email,
    role: p.role === "admin" ? "admin" : "user",
  }));

  return <UsersView initialRows={rows} currentUserEmail={data.user.email} />;
}
