# Architecture

## Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 16, App Router, React 19, TypeScript (strict) |
| Backend | InsForge — Auth, Postgres DB + RLS, Storage, Realtime (all one service) |
| Analytics | PostHog (browser + server) |
| Styling | Tailwind CSS v4 (`@theme` in `globals.css`, no `tailwind.config.ts`) + shadcn/ui |
| Charts | recharts (Dashboard donut/bar/line charts) |
| Drag-and-drop | Native HTML5 drag events (`draggable`, `onDragStart`/`onDragOver`/`onDrop`) — matches the mockup's own implementation; no DnD library needed |
| Future (not v1) | OpenAI GPT-4o, for AI-generated task/initiative summaries |

There is **no agent layer** in this project — that's a JobPilot-template-specific concept that doesn't apply here.

## Folder Structure

```
app/
  login/page.tsx
  my-activities/page.tsx
  dashboard/page.tsx
  initiatives/page.tsx
  projects/page.tsx
  tasks/
    page.tsx              # Kanban/Gantt toggle
    [id]/page.tsx          # Task Detail
  users/page.tsx          # User Management, admin-only
  layout.tsx
  globals.css
proxy.ts                   # auth redirect guard
instrumentation-client.ts   # browser PostHog init (Next.js 16's client-instrumentation convention — no Provider needed)
actions/
  initiatives.ts
  projects.ts
  tasks.ts
  activities.ts
  profile.ts
  users.ts                # admin-only create/remove, via createAdminClient
components/
  layout/                  # navbar, avatar menu
  my-activities/
  initiatives/
  projects/
  tasks/                   # kanban + gantt components
  task-detail/             # details panel + activity timeline
  dashboard/
  users/                   # user table + add-user drawer
  shared/                  # status-badge, owner-picker, empty-state, page-container
  ui/                      # shadcn/ui primitives
lib/
  insforge-client.ts       # browser client
  insforge-server.ts       # server client (Server Actions, Server Components)
  insforge-admin.ts        # createAdminClient(), server-only — Admin User Management only
  posthog-server.ts        # getPostHogClient(), server-only singleton
  permissions.ts           # mirrors RLS for UI gating only
  dates.ts
  utils.ts
types/
  index.ts
```

**No `app/api/` route handlers in v1.** Every mutation is a Server Action; every read is a direct InsForge query from a Server Component or a Server Action. Add a route handler only when there's a concrete external caller that needs one (e.g. a future webhook) — not preemptively.

## System Boundaries

| Concern | Owned by |
|---|---|
| Auth (sessions, password login) | InsForge Auth |
| All application data | InsForge Postgres, enforced by RLS |
| File storage | InsForge Storage (provisioned, **unused in v1** — reserved for a possible future note/task attachment feature) |
| Live updates | InsForge Realtime — **only** for the Tasks page (Kanban + Gantt, one shared subscription) and the Task Detail activity timeline |
| Event analytics | PostHog |
| AI summaries | Not built. Future: OpenAI GPT-4o, surface TBD |

## InsForge DB Schema

```sql
-- profiles: one row per InsForge auth user
profiles (
  id          uuid primary key references auth.users(id),
  email       text not null,
  name        text not null,
  role        text not null default 'user' check (role in ('admin','user')),
  created_at  timestamptz not null default now()
)

initiatives (
  id          uuid primary key default gen_random_uuid(),
  name        text not null check (char_length(name) <= 80),
  goal        text,
  category    text,
  status      text not null default 'active' check (status in ('active','inactive')),
  created_by  uuid not null references profiles(id),
  owner       uuid not null references profiles(id),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
)

projects (
  id             uuid primary key default gen_random_uuid(),
  initiative_id  uuid not null references initiatives(id) on delete cascade,
  name           text not null check (char_length(name) <= 80),
  description    text,
  status         text not null default 'active' check (status in ('active','inactive')),
  created_by     uuid not null references profiles(id),
  owner          uuid not null references profiles(id),
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
)

tasks (
  id             uuid primary key default gen_random_uuid(),
  project_id     uuid not null references projects(id) on delete cascade,
  name           text not null,                       -- no length cap, unlike initiatives/projects
  description    text,                                -- free text, no length cap (Feature 25)
  status         text not null default 'to_do'
                 check (status in ('to_do','in_progress','blocked','delayed','done')),
  start_date     date,
  end_date       date,
  delivery_date  date,
  progress       int not null default 0 check (progress between 0 and 100),
  blocker_owner  text,                                 -- free text, set when status = 'blocked'
  flagged        boolean not null default false,       -- "follow-up" — one shared value across My Activities, Kanban, Task Detail (Feature 23)
  ai_summary     jsonb,                                -- reserved for future GPT-4o use, unused in v1
  created_by     uuid not null references profiles(id),
  owner          uuid not null references profiles(id),
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
)

activities (
  id          uuid primary key default gen_random_uuid(),
  task_id     uuid not null references tasks(id) on delete cascade,
  kind        text not null
              check (kind in ('created','status','owner','progress','completed','flag','note')),
  who         uuid not null references profiles(id),
  text        text not null,    -- system-generated description for non-note kinds; note body for 'note'
  edited      boolean not null default false,
  pinned      boolean not null default false,
  created_at  timestamptz not null default now()
)
```

## Row Level Security

RLS is the **real** enforcement layer. `lib/permissions.ts` mirrors these same rules for UI gating (hiding buttons the DB would reject), but it is never the source of truth — a direct API call must be rejected by the database itself.

An `is_admin()` `SECURITY DEFINER` helper backs every admin check:

```sql
create function is_admin() returns boolean as $$
  select role = 'admin' from profiles where id = auth.uid()
$$ language sql security definer stable;
```

| Table | SELECT | INSERT | UPDATE | DELETE |
|---|---|---|---|---|
| `profiles` | any authenticated user (needed for the owner picker) | via auth trigger only | own row only; `role` column changeable only by admins (trigger-enforced) | none |
| `initiatives` / `projects` | any authenticated user (the View As toggle's owner-scoping happens in the app query, not RLS — see below) | `created_by = auth.uid()` | `is_admin() or created_by = auth.uid() or owner = auth.uid()` | same as UPDATE |
| `tasks` | any authenticated user (same app-level scoping as above) | `created_by = auth.uid()` | `is_admin() or created_by = auth.uid() or owner = auth.uid()` | same as UPDATE |
| `activities` | any authenticated user | `who = auth.uid()` | see below | `kind = 'note' and who = auth.uid()` |

**`activities` UPDATE is split by kind:**
- System kinds (`created`, `status`, `owner`, `progress`, `completed`, `flag`) are **fully immutable** — no UPDATE policy matches them at all.
- `note` kind: the RLS UPDATE policy allows the author (`who = auth.uid()`) to update any column. To let *any* signed-in user toggle `pinned` on someone else's note (RLS is row-level, not column-level, so this can't be expressed as a policy alone), a `before update` trigger checks: if the requester is not the author, reject the update unless every column except `pinned` is unchanged.

```sql
create function enforce_note_update_columns() returns trigger as $$
begin
  if old.who <> auth.uid() then
    if new.text <> old.text or new.edited <> old.edited then
      raise exception 'only the author can edit a note''s text';
    end if;
  end if;
  return new;
end;
$$ language plpgsql security definer;

create trigger note_pin_or_author_edit
  before update on activities
  for each row execute function enforce_note_update_columns();
```

## App-Level Role Scoping (the "View As" toggle)

RLS already lets any authenticated user `SELECT` every row of `initiatives`/`projects`/`tasks` (see the table above) — ownership-based *visibility* scoping (as opposed to ownership-based *write* permission, which RLS does enforce) is entirely an application-layer concern, driven by one global toggle:

- **`components/layout/view-as-context.tsx`** exports `ViewAsProvider` and a `useViewAs()` hook (`{ viewAsRole, isAdmin, setViewAsRole }`). The provider is mounted in `app/layout.tsx`, wrapping both `<Navbar/>` and `{children}`, initialized from the signed-in user's **real** `profiles.role`. For a non-admin, the provider always returns `viewAsRole: "user"` regardless of any state — there is no client state an authenticated-but-non-admin request could ever spoof into a wider view, since the value is clamped by the real role on every read, not just at init.
- **`<ViewAsProvider>` must be keyed on the real role**: `<ViewAsProvider key={user?.role ?? "user"} realRole={user?.role ?? "user"}>`. Next's root layout persists across the client-side navigation from `/login` (unauthenticated, real role defaults to `"user"`) to the post-login redirect (authenticated, real role becomes the actual role) — a provider using a plain `useState(realRole)` only consumes that initial value on first mount, so without the `key` prop the toggle's internal state stays frozen at `"user"` after login, and an admin's very first My Activities visit silently defaults to "Just me" instead of "Administrator" (a real bug found and fixed during Feature 22). Keying on the real role forces a remount — and only a remount — exactly when the signed-in identity's actual role changes, not when the toggle itself is flipped.
- **`AvatarMenu`** is the only UI that calls `setViewAsRole`. The "User" / "Administrator" pills render at all only when `isAdmin` — a non-admin user never sees the toggle, just their (always-"User") role label.
- **`app/my-activities/page.tsx` and `app/tasks/page.tsx` query based on the signed-in user's real role**, not the toggle (which is client-only state the server can't see without an extra request): an admin's query is always unscoped (every owner); a non-admin's query is always `.eq("owner", auth.uid())` directly at the database level — there's no toggle for them to flip, so there's no reason to ever send a regular user's browser any other owner's rows at all.
- **`app/initiatives/page.tsx` and `app/projects/page.tsx` deliberately stay unscoped at the query level for every role**, unlike the two above — both already derive a second, app-wide value from the same fetched rows (`categories` for Initiatives; effectively the org-wide similar-name namespace for both) that has to reflect every record regardless of viewing scope, not just the current user's own. Scoping the query itself would either require a second round trip to recompute those values unscoped, or silently shrink them for a non-admin. Since both pages already sent every owner's rows to every authenticated browser before this toggle existed (no regression, just an existing characteristic), it's simpler to leave the query unscoped and rely entirely on the client-side filter below.
- Each page's Client View component (`MyActivitiesView`, `TasksView`, `InitiativesView`, `ProjectsView`) reads `viewAsRole` via `useViewAs()` and derives a scoped subset before any of its existing search/filter/grouping logic runs: `viewAsRole === "admin" ? all : all.filter(item => item.ownerId === currentUserId)`. For My Activities/Tasks this is a no-op for a non-admin (the query already returned only their own rows); for Initiatives/Projects it's the only scoping that ever happens, for every role.
- **Exception, by design**: Initiatives' similar-name duplicate-name warning always checks against every Initiative in the org, never just the current scoped view — it exists to catch genuine org-wide name collisions, not to respect a display preference.
- When an admin is viewing "All owners" (`viewAsRole === "admin"`), My Activities' task rows and "Recently completed" entries show an owner avatar + name (mirroring the equivalent always-on owner display that Initiative/Project cards and Kanban cards already have) — hidden in "Just me" view, since every row is implicitly the signed-in user's own at that point.

## Quick Actions & the "Follow-up" Flag (Feature 23)

My Activities' three inline row actions (mark-done, flag/follow-up, quick-note) write directly via `actions/tasks.ts`/`actions/activities.ts`, no navigation to Task Detail required:

- **Mark done** (`markTaskDone`) sets `status = 'done'`, `progress = 100`, and logs a `kind: 'completed'` activity row — deliberately distinct from Kanban's drag-to-Done path, which logs `kind: 'status'`. This mirrors the PostHog split (`task_marked_done` vs `task_completed`) at the activity-log level too, so the timeline itself shows which surface completed a task.
- **Flag/follow-up** (`toggleTaskFlag`) writes the real `tasks.flagged` column (added in `migrations/20260623220300_tasks-add-flagged.sql`) and logs a `kind: 'flag'` activity row ("Flagged for follow-up" / "Follow-up cleared"). `tasks.flagged` is **one shared value across three surfaces** — My Activities' row icon, the Kanban card's icon (read-only there), and Task Detail's "Follow" button (a real toggle calling the same action) — all read/write the same column, not three independent local states. Fires `task_follow_up_toggled` on every toggle, set or clear.
- **Quick-note** reuses the existing `addNote` Server Action (`kind: 'note'`, same one Task Detail's own notes use) — no new action needed, just a new inline UI: the My Activities row expands in place to reveal a textarea + Save/Cancel, instead of opening a popover or navigating away.

All three follow the same optimistic-update + revert-on-failure + `Toast` pattern already established in `tasks-view.tsx`/`initiatives-view.tsx`/etc. — My Activities had no `Toast` wired in before this feature.

## Task Creation & the Description Field (Feature 25)

The New Task modal (`components/shared/new-task-modal.tsx`) is wired to a real `createTask` Server Action (`actions/tasks.ts`), called identically from both consumers (My Activities, Tasks page):

- **Owner is a real field on the modal**, defaulting to the current user but reassignable via the same `OwnerPicker` used everywhere else — confirmed with the developer specifically because a manager may create a task on someone else's behalf. `createTask` always sets `created_by = auth.uid()` (the creator, permanent) and `owner` to whatever the form submits (defaults to self) — RLS's `tasks` INSERT policy only checks `created_by = auth.uid()`, so this needed no policy change.
- **`tasks.description text`** (added in `migrations/20260624065915_tasks-add-description.sql`) closes a real gap: the modal already had a free-text Description field with nowhere to persist to, the same class of gap as Initiative's `goal`/Project's `description` columns. It's surfaced as an editable textarea at the top of Task Detail's `DetailsPanel`, committed on blur exactly like `blocker_owner` — no system activity-log row on edit, since free-text fields don't get one (matching the existing `blocker_owner` precedent, not a new exception).
- **`createTask` logs an initial `kind: 'created'` activity row** ("Task created") — the first time this reserved-since-Feature-04 enum value has ever been inserted, same situation `completed` was in before Feature 23.
- Both call sites insert the new row into local state non-optimistically, only after `createTask` resolves successfully, using the real returned `taskId`/`createdAt` — same precedent Feature 19 established for `addNote` (an optimistic temp-id-then-swap risks the same class of bug a fake id would cause elsewhere). The Tasks page's own realtime channel still receives an INSERT echo for the new row regardless; the existing idempotent upsert-by-id merge makes that a safe no-op.

## Project Health & Dashboard Aggregates (Feature 29)

`lib/dashboard-aggregates.ts` computes every Dashboard widget below "Right now" from one server-fetched dataset (`app/dashboard/page.tsx` fetches `initiatives`/`projects`/`tasks`/`activities` unscoped, same precedent as Feature 28). All filtering goes through one shared `matchDashboardScope()` cascade: category/initiative-id filters narrow the initiative set and cascade down to projects→tasks; the Owner filter applies independently at each entity's own `owner` column, never inherited — the same rule Feature 28 established for the Right Now KPIs, now factored out instead of re-implemented per function.

**Project health** is a new per-project bucket — `on_track` / `delayed` / `stalled` / `done` — computed once by `computeProjectHealthList()` and reused by both the Project Health donut and two of the three Risk & red flags cards, rather than two separate definitions. Priority order: `done` (every task `done`) → `delayed` (any task overdue, or `status` in `blocked`/`delayed`) → `stalled` (no activity in 30+ days) → `on_track`. "Last activity" for the stalled check joins `activities` (`max(created_at)` per task) rather than relying on `tasks.updated_at` alone — a note never touches the task row's `updated_at`, so a project being actively discussed via notes would otherwise misread as stalled.

**Things that don't map onto the real schema, by design:**
- **Strategic vs. Tactical** (a category-based split in the original mockup, where tactical = category `'Operations'`) was dropped entirely rather than approximated — none of this app's real categories (`Customer`/`SO Operations`/`Sales Enablement`) match the mockup's rule, and guessing a substitute mapping was rejected in favor of asking. `StrategicMixCard` no longer exists.
- **"Looking ahead"** is task `end_date` only — neither `projects` nor `initiatives` has a date column, so there's no real "project end date" or "initiative target" to read from despite Feature 27's mock implying otherwise.
- **Avg slip** uses the real `delivery_date` vs `end_date` gap (both real columns — `delivery_date` is set via Task Detail, independent of `status`). **Avg cycle time** uses `updated_at − created_at` for tasks that completed inside the measured period (`updated_at` is this codebase's standing completion-date proxy, same as Feature 22/28).
- **Portfolio completion %** and **Blocked tasks** carry no `prev`/delta anywhere on the Dashboard (Right Now KPIs or the Period Comparison table) — a real historical value for either would require parsing system-generated activity text, which nothing else in this codebase does (Feature 28's ruling, reused here rather than re-litigated).

**Date-only columns need `parseDateOnly()`, not a bare `new Date(string)`.** `end_date`/`delivery_date`/`start_date` are `date` columns; parsing the raw string directly reads it as UTC midnight, which a browser at a negative UTC offset displays as the previous calendar day, and which day-count subtraction against a precise "now" instant rounds inconsistently. `lib/dates.ts`'s `parseDateOnly()` (`${value.slice(0,10)}T00:00:00`, no `Z`) fixes this the same way `app/tasks/[id]/page.tsx`'s local `toDate` and `fromDateInputValue` already did — every date-only comparison in `dashboard-aggregates.ts` routes through it plus `dayDiff`/`startOfDay`, never raw millisecond math. `created_at`/`updated_at` (real `timestamptz` values) don't need this — inequality comparisons against them are timezone-safe by construction, which is why Feature 28's overdue checks never needed this helper.

## Data Flow

### Server Action mutation (the default path for every write)
```
UI event (form submit, button click, drag-drop)
  → Server Action in actions/*.ts
  → InsForge server client write (insforge-server.ts), scoped by auth.uid()
  → revalidatePath() on the affected route(s)
  → PostHog server-side capture() if the mutation matches a tracked event
```

### Realtime — Kanban + Gantt (the only other live surface besides Task Detail)

InsForge Realtime has no Supabase-style "subscribe to table changes" primitive — it's a
named-channel pub/sub system (Socket.IO). Something must explicitly call
`realtime.publish(channel, event, payload)`; a channel pattern must be registered (and
can be RLS-restricted) in `realtime.channels` before anyone can subscribe to it. Shipped
in `migrations/20260623042053_tasks-realtime-channel.sql`: a `tasks` channel pattern
(subscribe restricted to `authenticated`, matching the table's own RLS), and a trigger on
`tasks` that calls `realtime.publish('tasks', 'task_changed', <row + op>)`. Kanban and
Gantt are one component (`tasks-view.tsx`) sharing one `tasks` state and one subscription
— the trigger's `AFTER INSERT OR UPDATE OF` column list and published payload cover every
field either view renders: `project_id, name, status, start_date, end_date, delivery_date,
progress, blocker_owner, owner, flagged` (extended in `migrations/20260623130807_tasks-realtime-gantt-fields.sql`
to add `start_date`/`delivery_date` once Gantt — Feature 16 — started reading this same
state; without both the column list *and* the payload covering every rendered field, a
Kanban-only change like a drag-to-status-update would publish a payload missing those two
keys, and `boardTaskFromRow()` reads a missing key as `null` — silently wiping a task's
real Gantt bar on every other open tab). Extended again in
`migrations/20260623220300_tasks-add-flagged.sql` to add `flagged` once Feature 23 made
the My Activities/Task Detail "follow-up" toggle write a real column — same precedent: a
flag toggled from My Activities or Task Detail now shows up live on an open Kanban tab's
card, not just on next navigation.

```
Kanban + Gantt page (components/tasks/tasks-view.tsx) mounts
  → insforge.realtime.connect(), then .subscribe("tasks")
  → on "task_changed": upsert into local board state by task id (idempotent — a user's
    own optimistic drag update and its own realtime echo carry the same value, so the
    upsert is a no-op replace; a failed write never reaches the trigger, so the existing
    revert-on-failure path is unaffected)
  → on unmount: off the listener, unsubscribe, disconnect
```

### Realtime — Task Detail activity timeline

Shipped in `migrations/20260623220210_task-activity-realtime-channel.sql`: a **wildcard**
channel pattern (`task-activity:%`, subscribe restricted to `authenticated`, matching the
Kanban `tasks` channel's access model since `activities` SELECT RLS is also "any
authenticated user" — no extra per-task ownership check), and a trigger on `activities`
that calls `realtime.publish('task-activity:' || NEW.task_id, 'activity_changed', <row +
op>)`. This is the first channel in this codebase to use the `:`/`%` wildcard mechanism
rather than one flat literal pattern — each Task Detail page subscribes to its own
resolved channel, `task-activity:${taskId}`, instead of one shared global channel. The
separator is `:`, not `-`: task ids are UUIDs with internal hyphens, and the wildcard
RLS pattern relies on `split_part(channel_name, ':', 2)` to recover the task id from the
resolved channel name — a hyphen separator would collide with the UUID's own hyphens.

The trigger fires `AFTER INSERT OR UPDATE OF text, edited, pinned` — every new activity
row (system event or note) publishes once on insert; only `text`/`edited`/`pinned`
updates publish again, since those are the only columns any UPDATE can touch (system
kinds are immutable, and notes can only have those three columns changed — see RLS
above). DELETE is intentionally not wired: note deletion in another open tab goes stale
until that tab's next navigation, an accepted minor gap rather than scope creep beyond
what this feature needs.

`ActivityTimeline` already fully re-sorts its `entries` array by `createdAt` on every
render and separates pinned entries into their own section, so the merge logic below
never needs to care about insert position — appending anywhere in the array produces
identical rendered output.

The bigger wrinkle this feature surfaced: every system-event activity row (status/
owner/progress/delivery-date-auto-flip changes) was already being inserted by its
Server Action in `actions/tasks.ts`, and `task-detail-view.tsx` was appending an
optimistic local copy with a synthetic `local-${kind}-${Date.now()}` id. Once this
realtime channel went live, that synthetic id would never match the real id the
trigger publishes, so the acting user would see every status/owner/progress change
appear **twice**. Fixed by extending the same fix Feature 19 already validated for
`addNote`: each of those four Server Actions now `.select("id, created_at")` on its
`activities` insert and returns it, so the client only ever holds real ids — the
realtime echo becomes a safe no-op replace-by-id, the same idempotent pattern Kanban
already relies on for its own optimistic drag updates. If the activity insert itself
fails server-side, the action still returns `ok: true` (the task field update is the
source of truth and already succeeded) with `activityId`/`activityCreatedAt` simply
omitted — the client appends nothing rather than reintroducing a fake id.

```
Task Detail page mounts
  → connect + subscribe to `task-activity:${taskId}`
  → on `activity_changed`: merge into local activities by id — replace if present,
    else append (covers both INSERT and UPDATE; no need to branch on `op`)
  → on unmount: off the listener, unsubscribe, disconnect
```

## Authentication

- InsForge Auth, **email/password only** — no Google/GitHub/OAuth.
- `proxy.ts` (Next.js 16 renamed Middleware to Proxy — same mechanism, exported as a `proxy()` function with the same `config.matcher` shape) checks the InsForge session on every request; any unauthenticated request to any route other than `/login` is redirected to `/login`. After successful login, redirect to `/my-activities`.
- **No public self-signup.** `/login` only ever renders an email + password form — there is no registration UI. Every account is admin-created, either via the in-app User Management screen (see below) or directly in the InsForge dashboard.
- `requireEmailVerification` is disabled project-wide. This app has no public self-signup to protect against; every account is already admin-vetted before it exists, so the verification gate is redundant — and this project has no SMTP configured, so a verification email could never actually be delivered.

## Admin User Management

`/users` (admin-only) lets an admin create and remove accounts in-app, without touching the InsForge dashboard.

These are calls against InsForge's **auth system**, not the `public` schema — there is no PostgREST table and no RLS policy possible for "who may create or delete a user." The two endpoints involved (`POST /api/auth/users` to create, the admin-only `DELETE /api/auth/users` to remove) sit entirely outside RLS. This means **the Server Action itself is the enforcement boundary** for this one feature, not the database — a deliberate, narrow exception to this project's usual "never trust the client, RLS is the real enforcement" model (see Invariants).

`app/users/page.tsx` itself (a Server Component) also checks the signed-in user's `profiles.role` and redirects non-admins to `/my-activities` before rendering anything — `proxy.ts` only confirms the request is *authenticated*, not that the user is an *admin*, so the page has to do that part itself. This is defense-in-depth on top of the Server Action checks above, not a substitute for them.

- Both Server Actions independently verify the caller's own `profiles.role === 'admin'` (a normal RLS-protected `select` against `profiles`) before doing anything privileged.
- Both then use a privileged admin client — `createAdminClient({ apiKey: process.env.INSFORGE_API_KEY })` — never the per-request user-session client. `INSFORGE_API_KEY` is a full-access admin key (sourced from `.insforge/project.json`'s `api_key` field), server-only, never `NEXT_PUBLIC_*`.
- **Create:** `adminClient.auth.signUp({ email, password, name })`. `signUp()`'s `profile` option does **not** carry a custom `role` key through to `handle_new_user()` — only the predefined `name`/`avatar_url` fields survive (confirmed empirically; `profile: { role }` is silently dropped). The chosen role is instead set via a second, separate `profiles` UPDATE right after `signUp()` resolves, skipped when the role is the default `'user'`. That second call must use a **brand-new** `getAdminClient()` instance — `signUp()` swaps the calling client's session over to the newly created user's own token, so reusing it for the role update gets rejected by `guard_profile_role_change`. There's no in-app control to change an *existing* user's role; that still requires the SQL bootstrap path (`run-raw-sql`/`db query`), same as before this feature existed.
- **Remove:** no typed SDK method exists for this — call the admin-only `DELETE /api/auth/users` route directly via `adminClient.getHttpClient().delete("/api/auth/users", { body: { userIds: [id] } })`. It deletes the auth user (cascades to `profiles` via `ON DELETE CASCADE`). Blocked first, with a clear error, if the target still has any `initiatives`/`projects`/`tasks`/`activities` row referencing them as `created_by`/`owner`/`who` — those FKs have no cascade, and silently reassigning that data to the removing admin would corrupt the `created_by` audit trail this schema is designed to keep permanent.

## Invariants

- RLS is the real enforcement; `lib/permissions.ts` only mirrors it for UI gating — never trust the client. **The one exception:** Admin User Management's create/remove actions call InsForge's auth-system endpoints directly, which RLS cannot reach — those two Server Actions enforce the admin check themselves (see above).
- Every Server Action scopes its write using the caller's `auth.uid()`, never a client-supplied user id.
- Realtime channels are always subscribed in a `useEffect` and torn down on unmount — no leaked subscriptions.
- The Tasks page (Kanban + Gantt) and Task Detail activity timeline are the **only** Realtime surfaces. Every other page reads on navigation and relies on `revalidatePath` after mutations.
- No `app/api/` route handler is added without a documented external caller that needs it.
- `created_by` is set once at INSERT time and never changes. `owner` is the only reassignable identity field.
- Dashboard numbers are always computed directly from `initiatives`/`projects`/`tasks` — never from PostHog.
