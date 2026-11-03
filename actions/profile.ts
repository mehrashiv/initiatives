"use server";

import { cookies } from "next/headers";
import { z } from "zod";
import { createAuthActions } from "@insforge/sdk/ssr";
import { getPostHogClient } from "@/lib/posthog-server";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function login(input: z.infer<typeof loginSchema>): Promise<{ error: string } | undefined> {
  const { email, password } = loginSchema.parse(input);
  const auth = createAuthActions({ cookies: await cookies() });
  const { error } = await auth.signInWithPassword({ email, password });
  if (error) {
    console.error("[login] signInWithPassword failed", { email, statusCode: error.statusCode, error: error.error, message: error.message });
    return { error: error.statusCode === 401 ? "Invalid email or password" : error.message || "Sign in failed" };
  }
  const posthog = getPostHogClient();
  posthog.capture({ distinctId: email, event: "user_login_server", properties: { email } });
}

export async function logout() {
  const auth = createAuthActions({ cookies: await cookies() });
  await auth.signOut();
}
