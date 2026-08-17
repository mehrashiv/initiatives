"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { getServerClient } from "@/lib/insforge-server";
import { getAdminClient } from "@/lib/insforge-admin";

async function requireAdmin() {
  const insforge = await getServerClient();
  const { data } = await insforge.auth.getCurrentUser();
  if (!data.user) throw new Error("Not signed in");

  const { data: profile } = await insforge.database
    .from("profiles")
    .select("role")
    .eq("id", data.user.id)
    .single();
  if (profile?.role !== "admin") throw new Error("Admins only");

  return data.user;
}

const createUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum(["user", "admin"]),
});

export async function createUser(
  input: z.infer<typeof createUserSchema>,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const { email, password, role } = createUserSchema.parse(input);
  await requireAdmin();

  const admin = getAdminClient();
  const { data, error } = await admin.auth.signUp({
    email,
    password,
    name: email.split("@")[0],
  });
  // Thrown errors here would be redacted to a generic message by Next's production
  // build — these are expected, user-facing outcomes, so return them instead.
  if (error) {
    return {
      ok: false,
      error: error.error === "AUTH_EMAIL_EXISTS" ? "A user with this email already exists." : "Failed to create user.",
    };
  }

  // signUp() only persists the predefined `name`/`avatar_url` profile fields — a custom
  // `role` key never reaches handle_new_user(), so the chosen role must be set via a
  // second, privileged update right after creation (confirmed empirically against the
  // live backend; the row otherwise stays at the table's default 'user').
  //
  // A *fresh* admin client is required for this second call: signUp() swaps the calling
  // client instance's internal session over to the newly created (non-admin) user's own
  // token, so reusing `admin` here would update as that user and get rejected by
  // guard_profile_role_change ("only an admin can change role") — confirmed empirically.
  if (role === "admin" && data?.user) {
    const { error: roleError } = await getAdminClient().database.from("profiles").update({ role: "admin" }).eq("id", data.user.id);
    if (roleError) return { ok: false, error: "User was created, but setting the administrator role failed." };
  }

  revalidatePath("/users");
  return { ok: true };
}

const removeUserSchema = z.object({
  userId: z.string().uuid(),
});

export async function removeUser(
  input: z.infer<typeof removeUserSchema>,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const { userId } = removeUserSchema.parse(input);
  await requireAdmin();

  const insforge = await getServerClient();
  const ownershipChecks = await Promise.all([
    insforge.database
      .from("initiatives")
      .select("id", { count: "exact", head: true })
      .or(`created_by.eq.${userId},owner.eq.${userId}`),
    insforge.database
      .from("projects")
      .select("id", { count: "exact", head: true })
      .or(`created_by.eq.${userId},owner.eq.${userId}`),
    insforge.database
      .from("tasks")
      .select("id", { count: "exact", head: true })
      .or(`created_by.eq.${userId},owner.eq.${userId}`),
    insforge.database.from("activities").select("id", { count: "exact", head: true }).eq("who", userId),
  ]);
  const totalOwned = ownershipChecks.reduce((sum, result) => sum + (result.count ?? 0), 0);
  // Thrown errors here would be redacted to a generic message by Next's production
  // build — these are expected, user-facing outcomes, so return them instead.
  if (totalOwned > 0) {
    return {
      ok: false,
      error: `This user still owns or created ${totalOwned} record${totalOwned === 1 ? "" : "s"} — reassign them first.`,
    };
  }

  const admin = getAdminClient();
  try {
    await admin.getHttpClient().delete("/api/auth/users", { body: { userIds: [userId] } });
  } catch {
    return { ok: false, error: "Failed to remove user." };
  }

  revalidatePath("/users");
  return { ok: true };
}
