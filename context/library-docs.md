# Library Docs

## Before Using Any Library

Check authority in this order: (1) an MCP tool/server for the library, if one is connected, (2) a Skill/AGENTS.md entry for the library, if one exists, (3) this file, (4) training knowledge as a last resort. This file documents the exact patterns this project uses — prefer them over inventing a new pattern even if training knowledge suggests an alternative.

---

## InsForge

InsForge is the entire backend: Auth, Postgres DB (with RLS), Storage, and Realtime, behind one client SDK.

### Client / Server Split

SSR auth uses `@insforge/sdk/ssr`, not the plain `@insforge/sdk` client — it owns the `insforge_access_token` / `insforge_refresh_token` cookie pair so Server Components, Client Components, and middleware all see the same session.

```ts
// lib/insforge-client.ts — browser client, for Client Components only
import { createBrowserClient } from "@insforge/sdk/ssr";

export const insforge = createBrowserClient();
```

```ts
// lib/insforge-server.ts — server client, for Server Components, Route Handlers, and Server Actions
import { cookies } from "next/headers";
import { createServerClient } from "@insforge/sdk/ssr";

export async function getServerClient() {
  return createServerClient({ cookies: await cookies() });
}
```

Both helpers read `NEXT_PUBLIC_INSFORGE_URL` / `NEXT_PUBLIC_INSFORGE_ANON_KEY` automatically — no explicit args needed. Always use the matching client for the context you're in. Never import the browser client into a Server Component, and never import the server client into a Client Component.

### Refresh route

The refresh token is httpOnly, so the browser client refreshes through a dedicated endpoint:

```ts
// app/api/auth/refresh/route.ts
import { createRefreshAuthRouter } from "@insforge/sdk/ssr";

export const { POST } = createRefreshAuthRouter();
```

This is the one exception to "no `app/api/` route handlers in v1" (`architecture.md`) — the SSR auth helpers require it.

### proxy.ts — session refresh + redirect guard

Next.js 16 renamed `middleware.ts` to `proxy.ts` (exported function is `proxy`, not `middleware`). `updateSession()` refreshes the access-token cookie before Server Components render and returns `{ refreshed, accessToken, error }` — `accessToken` is `null` when there's no valid session, which is exactly the signal the redirect guard needs.

```ts
// proxy.ts
import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@insforge/sdk/ssr";

export async function proxy(request: NextRequest) {
  const response = NextResponse.next({ request });
  const { accessToken } = await updateSession({
    requestCookies: request.cookies,
    responseCookies: response.cookies,
  });

  const isLoginPage = request.nextUrl.pathname === "/login";

  if (!accessToken && !isLoginPage) {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  if (accessToken && isLoginPage) {
    return NextResponse.redirect(new URL("/my-activities", request.url));
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|ingest|.*\\.(?:ico|png|jpg|jpeg|gif|svg|webp|woff2?|ttf)$).*)"],
};
```

**The matcher must exclude `public/` static assets by extension, not just `_next/static`/`_next/image`.** See `context/layout-fundamentals.md` Rule 3 for the generic explanation and fix pattern. The app-specific symptom here: an earlier version of this matcher only excluded `_next/static`/`_next/image`/`favicon.ico`, so requests for `/nile-logo.png` itself still went through the proxy, got redirected to `/login`, and `next/image`'s optimizer failed trying to parse the resulting HTML as an image (`400 The requested resource isn't a valid image.`) — reproducible even for a fully logged-in user, since the failure is on the optimizer's own cookie-less internal fetch.

**The matcher must also exclude `/ingest` (PostHog's reverse-proxy path from `next.config.ts`'s rewrites).** Without this, every PostHog call from an *unauthenticated* page — in practice, only `/login` — gets swept into the `!accessToken` redirect branch above and bounced to `/login` itself; the browser receives `/login`'s HTML where PostHog expected JSON, surfacing as `SyntaxError: Unexpected token '<'`/`"<!DOCTYPE "... is not valid JSON"`. Confirmed via direct `curl`: unauthenticated `POST /ingest/decide/` returned a `307` to `/login` before this fix, and a real `200` JSON response from PostHog's own servers (`server: envoy`) after it; an authenticated request was unaffected either way, since `!accessToken` is false once signed in. This had previously been misdiagnosed in this project as a "sandbox network restriction" — it is not; it reproduces identically against a live `next dev` server with full outbound internet access, and is fixed entirely by widening the matcher.

### Auth — email/password only

Sign-in/sign-out have to run where cookies can be written (the refresh token is httpOnly). Use `createAuthActions()` — not the plain `signInWithPassword`/`signOut` from the generic SDK docs — it wraps the same calls and writes/clears the `insforge_access_token`/`insforge_refresh_token` cookies internally, so the Server Action body never touches `setAuthCookies()` directly.

```ts
// actions/profile.ts (login is the one action allowed to run unauthenticated)
"use server";

import { cookies } from "next/headers";
import { z } from "zod";
import { createAuthActions } from "@insforge/sdk/ssr";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function login(input: z.infer<typeof loginSchema>) {
  const { email, password } = loginSchema.parse(input);
  const auth = createAuthActions({ cookies: await cookies() });
  const { error } = await auth.signInWithPassword({ email, password });
  if (error) throw new Error("Invalid email or password");
}

export async function logout() {
  const auth = createAuthActions({ cookies: await cookies() });
  await auth.signOut();
}
```

No `signInWithOAuth`, no public signup action for regular users — accounts come from the InsForge dashboard or the in-app Admin User Management screen (`actions/users.ts`), below.

### Admin client — User Management only

`createAdminClient` is a **separate, privileged** client — never use it for anything a normal authenticated user does. It's the only way to call InsForge's auth-system endpoints (`/api/auth/users`), which sit outside RLS entirely.

```ts
// lib/insforge-admin.ts — server-only, used only by actions/users.ts
import { createAdminClient } from "@insforge/sdk";

export function getAdminClient() {
  return createAdminClient({
    baseUrl: process.env.NEXT_PUBLIC_INSFORGE_URL!,
    apiKey: process.env.INSFORGE_API_KEY!,
  });
}
```

```ts
// actions/users.ts
"use server";

import { z } from "zod";
import { getServerClient } from "@/lib/insforge-server";
import { getAdminClient } from "@/lib/insforge-admin";

const createUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum(["user", "admin"]),
});

export async function createUser(input: z.infer<typeof createUserSchema>) {
  const { email, password, role } = createUserSchema.parse(input);
  const insforge = await getServerClient();
  const { data: caller } = await insforge.auth.getCurrentUser();
  const { data: callerProfile } = await insforge
    .database.from("profiles")
    .select("role")
    .eq("id", caller?.user?.id)
    .single();
  if (callerProfile?.role !== "admin") throw new Error("Admins only");

  const { data, error } = await getAdminClient().auth.signUp({ email, password, name: email.split("@")[0] });
  if (error) throw new Error(error.error === "AUTH_EMAIL_EXISTS" ? "A user with this email already exists." : "Failed to create user.");

  // A *fresh* admin client, not the one signUp() just ran on — see note below.
  if (role === "admin" && data?.user) {
    await getAdminClient().database.from("profiles").update({ role: "admin" }).eq("id", data.user.id);
  }
}
```

Two corrections vs. what you'd expect from the REST docs alone — both confirmed empirically against the live backend, not just read from a doc:

- **`signUp()`'s `profile` option does not carry a custom `role` key through to `handle_new_user()`.** Only the predefined `name`/`avatar_url` profile fields survive into `auth.users.profile`; `profile: { role }` is silently dropped. There is no signup-time way to set a custom column — the chosen role has to be set via a second, separate privileged `profiles` update right after `signUp()` resolves, as shown above.
- **That second update must use a brand-new `getAdminClient()` call, never the same client instance `signUp()` ran on.** `signUp()` mutates the calling client's internal session to the *newly created* (non-admin) user's own token — so a chained call on that same instance is no longer authenticated as the project admin, and `guard_profile_role_change`'s trigger correctly rejects it ("only an admin can change role"). Each privileged call this action makes should get its own `getAdminClient()` instance.
- **`requireEmailVerification` must actually be turned off via `PUT /api/auth/config`** (admin-only REST endpoint, no typed SDK wrapper — call it through `getAdminClient().getHttpClient().put("/api/auth/config", { requireEmailVerification: false })`). Disabling it in `architecture.md`'s prose is not the same as disabling it on the live project; until that PUT is actually called, `signUp()` returns `{ accessToken: null, requireEmailVerification: true }` with no `user` key at all, which is also why `data.user` can be `undefined` if you skip this step.

Removing a user has its own undocumented endpoint shape — there's no typed `deleteUser` method, only the generic HTTP client against the documented REST route:

```ts
// actions/users.ts — removeUser, continued
await getAdminClient().getHttpClient().delete("/api/auth/users", { body: { userIds: [userId] } });
```

Both `createUser` and `removeUser` in `actions/users.ts` start with this same caller-is-admin check — it's the *only* enforcement, since RLS can't see these endpoints (see `architecture.md`'s Invariants). `removeUser` additionally checks for any `initiatives`/`projects`/`tasks`/`activities` row still referencing the target as `created_by`/`owner`/`who` before calling the delete endpoint, and throws a clear error instead if any exist.

### DB Queries

```ts
// My Activities — role-scoped read
// getServerClient() is async, and .from() lives under .database — not on the client root
// (confirmed against the shipped client-BR9o-WUm.d.ts: InsForgeClient only exposes
// .auth/.database/.storage/.ai/.functions/.realtime/.emails/.payments at the top level).
const insforge = await getServerClient();
const { data: profile } = await insforge.database
  .from("profiles")
  .select("id, role")
  .eq("id", userId)
  .single();

const query = insforge.database.from("tasks").select("*, projects(name, initiatives(name))");
if (profile.role !== "admin") {
  query.eq("owner", userId);
}
const { data: tasks } = await query;
```

Always select only the columns/relations a screen actually needs — avoid `select("*")` on relational joins beyond what's displayed.

### Realtime

Used in **exactly two places** — the Kanban board and the Task Detail activity timeline. Nowhere else.

**There is no `postgres_changes`/`channel().on(...)` API** (that's Supabase's shape — an
earlier version of this doc described it and it doesn't exist on the InsForge SDK,
confirmed against the shipped `.d.ts` and the InsForge MCP docs). InsForge Realtime is a
named-channel pub/sub system (Socket.IO under the hood): `insforge.realtime.connect()`,
`.subscribe(channel)`, `.on(eventName, callback)`, `.unsubscribe(channel)`,
`.disconnect()`. Nothing is emitted automatically — a channel pattern must be registered
in `realtime.channels` (migration), and something must explicitly call
`realtime.publish(channel, event, payload)` — for both of this app's surfaces, that's a
Postgres trigger, not client code. The browser client is the existing
`insforge` singleton exported from `lib/insforge-client.ts`, not a `getBrowserClient()`
call.

```ts
// Migration — registers the channel + the publish trigger (see
// migrations/20260623042053_tasks-realtime-channel.sql for the shipped version)
insert into realtime.channels (pattern, description, enabled)
values ('tasks', 'Task INSERT/UPDATE events for the Kanban board', true)
on conflict (pattern) do update set description = excluded.description, enabled = excluded.enabled;

alter table realtime.channels enable row level security;
create policy tasks_channel_subscribe_authenticated
  on realtime.channels for select to authenticated using (pattern = 'tasks');

alter table realtime.messages enable row level security; -- no publish policy: only the trigger publishes

create or replace function public.notify_task_changed() returns trigger as $$
begin
  perform realtime.publish('tasks', 'task_changed', jsonb_build_object(
    'op', lower(tg_op), 'id', new.id, 'project_id', new.project_id, 'name', new.name,
    'status', new.status, 'end_date', new.end_date, 'progress', new.progress,
    'blocker_owner', new.blocker_owner, 'owner', new.owner
  ));
  return new;
end;
$$ language plpgsql security definer;

create trigger task_changed_realtime
  after insert or update of project_id, name, status, end_date, progress, blocker_owner, owner
  on public.tasks for each row execute function public.notify_task_changed();
```

```ts
// Kanban board — components/tasks/tasks-view.tsx (Client Component; owns the `tasks`
// state, not kanban-board.tsx, which is presentation-only)
useEffect(() => {
  function handleTaskChanged(payload: TaskChangedPayload) {
    const boardTask = boardTaskFromRow(payload, projectOptionById, profileNameById);
    if (boardTask) setTasks((prev) => upsertById(prev, boardTask)); // idempotent: own
    // optimistic drag update + its own echo carry the same value, so this is a no-op replace
  }

  insforge.realtime.on<TaskChangedPayload>("task_changed", handleTaskChanged);
  insforge.realtime.on("error", (error) => console.error("Kanban realtime error", error));
  insforge.realtime.connect().then(() => insforge.realtime.subscribe("tasks"));
  // subscribe failure is caught and retried once, then just logged — never crashes the page

  return () => {
    insforge.realtime.off("task_changed", handleTaskChanged);
    insforge.realtime.unsubscribe("tasks");
    insforge.realtime.disconnect();
  };
}, [projectOptionById, profileNameById]);
```

Task Detail's activity timeline (Feature 20, not yet built) follows the same
migration + `useEffect` shape — its own channel pattern, its own trigger on `activities`,
its own event name(s) — decided when that feature is actually built.

### RLS Notes

RLS policies are defined in `architecture.md`. The one exception worth restating here: pinning a note is allowed for *any* signed-in user, not just its author — this is enforced by a `before update` trigger (`enforce_note_update_columns`), not by the RLS policy itself, since RLS can't express "this column may change, that one may not" within a single row policy.

### Storage

Provisioned but **unused in v1** — reserved for a possible future note/task attachment feature. Do not create a bucket or wire any upload UI until that feature is actually scoped.

---

## PostHog

### Setup

Browser-side init lives in **`instrumentation-client.ts`** at the project root, not `lib/posthog-client.ts` — this Next.js version's real client-instrumentation convention (confirmed in `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/instrumentation-client.md`; introduced in 15.3, runs once before hydration, no Provider component needed):

```ts
// instrumentation-client.ts
import posthog from "posthog-js";

posthog.init(process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN!, {
  api_host: "/ingest",
  ui_host: "https://us.posthog.com",
  defaults: "2026-01-30",
  capture_exceptions: true,
  debug: process.env.NODE_ENV === "development",
});
```

`api_host: "/ingest"` routes through a same-origin reverse proxy (avoids ad-blockers) — added as rewrites in `next.config.ts`:

```ts
async rewrites() {
  return [
    { source: "/ingest/static/:path*", destination: "https://us-assets.i.posthog.com/static/:path*" },
    { source: "/ingest/array/:path*", destination: "https://us-assets.i.posthog.com/array/:path*" },
    { source: "/ingest/:path*", destination: "https://us.i.posthog.com/:path*" },
  ];
}
```

In Client Components, `import posthog from "posthog-js"` directly and call `posthog.capture(event, properties)` / `posthog.identify(distinctId, properties)` / `posthog.reset()` — no wrapper needed, the root-level `init()` above already configured the singleton.

```ts
// lib/posthog-server.ts
import { PostHog } from "posthog-node";

let posthogClient: PostHog | null = null;

export function getPostHogClient() {
  if (!posthogClient) {
    posthogClient = new PostHog(process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN!, {
      host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
      flushAt: 1,
      flushInterval: 0,
    });
  }
  return posthogClient;
}
```

`flushAt: 1` / `flushInterval: 0` flush every `capture()` immediately — required because a Server Action is a short-lived process with no background flush loop. (No `client.shutdown()` call needed with this config — only relevant if those defaults are ever changed back to batching.)

### Events

Capture only the events locked in `code-standards.md` / `project-overview.md`. **Data events must only be called from inside a Server Action, after the write that made them true succeeds** — never from a mock/local-state-only handler, even if that handler's UI has already shipped (see those two files' "removed, re-add inside the real Server Action" notes — this was violated and fixed during the Feature 03 review). Example:

```ts
const client = getPostHogClient();
client.capture({ distinctId: userId, event: "initiative_created", properties: { initiative_id: data.id } });
```

---

## recharts (Dashboard)

```tsx
// components/dashboard/completion-trend-chart.tsx
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

<ResponsiveContainer width="100%" height={240}>
  <LineChart data={trendData}>
    <CartesianGrid strokeDasharray="3 3" />
    <XAxis dataKey="period" />
    <YAxis />
    <Tooltip />
    <Line type="monotone" dataKey="completionPct" stroke="var(--color-accent)" strokeWidth={2} />
  </LineChart>
</ResponsiveContainer>
```

Use the token CSS variables from `ui-tokens.md` for every stroke/fill color — never a raw hex value inside a chart component.

---

## Future — OpenAI GPT-4o

Not implemented in v1. Planned use: AI-generated summaries (likely for Tasks or Initiatives — exact surface not yet decided). No route handler, schema field beyond the unused `tasks.ai_summary jsonb` placeholder, or code pattern exists yet. Update this section with real client setup, prompt patterns, and response-shape handling once that work is actually scoped — do not pre-build speculative code for it now.
