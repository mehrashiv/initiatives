# Code Standards

## Engineering Mindset

Build the smallest thing that correctly implements the spec in `project-overview.md` and `build-plan.md`. Follow the UI-first-then-logic order in `build-plan.md` — don't wire a Server Action against a screen that hasn't been visually verified yet. Reuse existing components from `ui-registry.md` before writing a new one.

## TypeScript

- Strict mode, no `any`. Prefer `unknown` + narrowing over `any` when a type is genuinely unknown.
- All InsForge row types live in `types/index.ts`, generated/maintained by hand to match the schema in `architecture.md` exactly — keep them in sync when the schema changes.
- Server Action inputs are validated with `zod` schemas, not just TypeScript types — TypeScript types are erased at runtime, the client cannot be trusted.

## Next.js 16 Conventions

- Server Components by default. Add `"use client"` only where interactivity (drag-and-drop, modals, Realtime subscriptions, form state) requires it.
- Data mutations go through Server Actions in `actions/*.ts` — never fetch-and-mutate from a Client Component directly against InsForge.
- Use `revalidatePath()` after every mutation that affects data shown on another route (e.g. updating a task's status should revalidate both `/tasks` and `/my-activities`).
- No `app/api/` route handlers in v1 — see `architecture.md`'s System Boundaries section. If a future feature genuinely needs one (e.g. a GPT-4o endpoint), add it with a comment explaining why a Server Action wasn't sufficient.

## File / Folder Naming

- Routes: lowercase, kebab-case (`my-activities`, not `myActivities`).
- Components: PascalCase filenames matching the exported component (`InitiativeCard.tsx`).
- Server Actions, lib utilities: camelCase filenames (`insforgeClient.ts` — but see Import Aliases below for actual chosen names).
- One component per file. Co-locate a component's own tiny helper types in the same file; shared types go in `types/index.ts`.

## Component Structure

```tsx
// components/initiatives/initiative-card.tsx
import type { Initiative } from "@/types";

interface InitiativeCardProps {
  initiative: Initiative;
  onEdit: (id: string) => void;
}

export function InitiativeCard({ initiative, onEdit }: InitiativeCardProps) {
  return (
    <div className="bg-surface border border-border rounded-2xl p-6">
      {/* ... */}
    </div>
  );
}
```

- Props typed with an explicit `interface`, named `<ComponentName>Props`.
- No default exports — always named exports, for consistent auto-import behavior.

## Server Actions

```tsx
// actions/tasks.ts
"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { getServerClient } from "@/lib/insforge-server";

const updateStatusSchema = z.object({
  taskId: z.string().uuid(),
  status: z.enum(["to_do", "in_progress", "blocked", "delayed", "done"]),
});

export async function updateTaskStatus(
  input: z.infer<typeof updateStatusSchema>,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const { taskId, status } = updateStatusSchema.parse(input);
  const insforge = getServerClient();

  // A thrown Error here would be redacted to a generic digest message by Next's
  // production build (`next start`) — confirmed empirically, `next dev` shows the
  // real message but a production build doesn't. Return expected, user-facing
  // errors instead of throwing them.
  const { error } = await insforge.from("tasks").update({ status }).eq("id", taskId);
  if (error) return { ok: false, error: "Failed to update task status." };

  await insforge.from("activities").insert({
    task_id: taskId,
    kind: "status",
    text: `Status changed to ${status}`,
  });

  revalidatePath("/tasks");
  revalidatePath("/my-activities");
  return { ok: true };
}
```

- Every Server Action: validate input with `zod`, perform the write scoped by the authenticated user (RLS does the real enforcement), `revalidatePath()` every affected route. **Return `{ ok: true, ... } | { ok: false; error: string }` for every expected, user-facing error case (write failed, permission denied, validation failure) — never `throw` for these.** Next.js 16 redacts a thrown `Error`'s message to a generic digest string in production builds (`next start`), so the caller never sees the real text; a returned value crosses the Server Action boundary untouched. Reserve `throw` for genuinely exceptional, non-user-facing cases the UI never expects to hit in normal use (e.g. the shared `requireUser()`/`requireAdmin()` guards' "Not signed in"/"Admins only" checks — already-authenticated/already-gated routes only reach these if something is badly wrong). The calling Client Component checks `result.ok` for the expected-error case and keeps a `.catch()`/try-catch fallback only for that residual, genuinely-unexpected-exception path — see `actions/tasks.ts`'s `updateTaskStatus` (the original precedent) and `actions/initiatives.ts`/`actions/projects.ts`/`actions/users.ts` for the shipped pattern.

## Permissions Mirroring

`lib/permissions.ts` exports small predicate functions (`canEdit(record, user)`, `canDelete(record, user)`) that mirror the RLS rules in `architecture.md` exactly: `is_admin() or created_by = user.id or owner = user.id`. Use these only to decide whether to show/enable a button — **never** treat them as the actual access control. The database enforces the real rule via RLS regardless of what the UI shows.

## InsForge Client Usage

- `lib/insforge-client.ts` — browser client, used only in Client Components (Realtime subscriptions, any client-side read that isn't worth a round-trip).
- `lib/insforge-server.ts` — server client, used in Server Components and Server Actions. This is the default for all reads and all writes.
- Never instantiate a client ad hoc inside a component — always import from these two files.

## Error Handling

- Server Actions return `{ ok: true, ... } | { ok: false; error: string }` for every expected, user-facing error case — never `throw` for these (Next.js 16 redacts a thrown `Error`'s message to a generic digest string in production builds, a real bug found and fixed for `updateTaskStatus`, then applied sitewide — see the Server Actions section above). The calling Client Component checks `result.ok` and shows `result.error` in the UI (toast or inline text) — never show a raw Postgres/InsForge error to the user. Keep a `.catch()`/try-catch fallback only for the residual, genuinely-unexpected-exception path (e.g. a network failure, or the shared `requireUser()`/`requireAdmin()` guards' own throws).
- Realtime subscription errors are logged to the console and the subscription is retried once; they never crash the page.

## PostHog Events

The full, locked list (see `project-overview.md` for the complete table with shipped/not-shipped status) — do not add a new event, or fire an existing one from a new call site, without updating this table and `project-overview.md` together. **Data events fire only from a real Server Action after a successful write — never from mock/local-only state**, even if the UI around it has already shipped (the data-event rows in `project-overview.md`'s table that are marked "removed" were caught violating this and pulled out during the Feature 03 review):

| Event | Fired when |
|---|---|
| `initiative_created` | A new Initiative is saved |
| `project_created` | A new Project is saved |
| `task_status_changed` | A Task's status changes (Kanban drag or Task Detail) |
| `task_completed` | A Task's status becomes Done via Kanban drag |
| `task_created` | A new Task is saved |
| `task_marked_done` | A Task is marked Done via the My Activities quick-action |
| `task_follow_up_toggled` | The follow-up flag is toggled on a task row |
| `note_added` | A note is added to a Task's activity timeline |

UX events (`user_logged_in`, `user_login_server`, `user_login_failed`, `user_logged_out`, `role_view_switched`, `activity_filter_selected`, `task_clicked`, `new_task_modal_opened`) aren't gated by this rule — see `project-overview.md`.

## Environment Variables

| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_INSFORGE_URL` | InsForge project URL |
| `NEXT_PUBLIC_INSFORGE_ANON_KEY` | InsForge anon/public key (browser client) |
| `INSFORGE_API_KEY` | InsForge full-access admin key, server-only. Used only by `lib/insforge-admin.ts` (`createAdminClient`) for Admin User Management's create/remove actions — never exposed as `NEXT_PUBLIC_*`. |
| `NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN` | PostHog project token |
| `NEXT_PUBLIC_POSTHOG_HOST` | PostHog ingestion host |

No OpenAI key yet — added when GPT-4o work actually starts, not before.

## Import Aliases

Use the `@/` alias for everything under the project root (`@/components/...`, `@/lib/...`, `@/types`, `@/actions/...`). Never use relative `../../../` chains.

## Comments

Default to no comments. Only write one when the code encodes a non-obvious business rule that isn't self-evident from naming — e.g. the delayed-auto-flip rule in the task update Server Action. Never write comments that just restate what the code already says.

## Approved Dependencies

- `@insforge/*` client packages (Auth, DB, Storage, Realtime)
- `posthog-js` (browser), `posthog-node` (server)
- `recharts` (Dashboard charts)
- `zod` (Server Action input validation)
- `lucide-react` (icons)
- `tailwindcss` v4, shadcn/ui components
- No drag-and-drop library — native HTML5 drag events only
- No new dependency without updating this list first
