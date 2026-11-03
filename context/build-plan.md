# Build Plan

## Core Principle

Build each screen's UI first with realistic mock data, verify it visually against the mockup/screenshots, and only then wire up real InsForge data and mutation logic. Never write logic against a screen that hasn't been visually verified first.

---

## Phase 1 — Foundation

### 01. App shell & navbar
- **UI:** Root layout, top navbar (logo, 5 nav items, static bell, avatar menu placeholder), page container/max-width, font setup (self-hosted Inter).
- **Logic:** None yet — navbar links route via `next/link`; active-item highlighting based on current path.

### 02. Auth
- **UI:** `/login` page — email + password fields, submit button, error text area.
- **Logic:** InsForge `signInWithPassword`; `proxy.ts` (Next.js 16's renamed `middleware.ts`) redirects unauthenticated requests to `/login` and redirects authenticated requests away from `/login` to `/my-activities`. No public self-signup UI — accounts are created by an admin (dashboard or, once Feature 06 ships, the in-app User Management screen).
- **PostHog:** `identify()` call on successful login — wired once Feature 03 (PostHog init) lands; deferred for now since there's no PostHog client to call yet.

### 03. PostHog init
- **UI:** None.
- **Logic:** Browser init via `instrumentation-client.ts` (this Next.js version's client-instrumentation file convention — no `PostHogProvider` needed) plus a reverse proxy in `next.config.ts`; server client via `lib/posthog-server.ts`. Also shipped general UX event tracking not tied to any later feature (`user_logged_in`/`user_login_failed`/`user_logged_out`/`role_view_switched`/`activity_filter_selected`/`task_clicked`/`user_login_server`) — see `project-overview.md`'s PostHog Events table for the full locked list and which events are real vs. still pending their feature.

### 04. DB schema + RLS
- **UI:** None.
- **Logic:** Create `profiles`, `initiatives`, `projects`, `tasks`, `activities` tables, the `is_admin()` helper, every RLS policy, and the note-pin trigger — all exactly as specified in `architecture.md`.

---

## Phase 2 — User Management

### 05. User management UI (mock data)
- **UI:** Avatar-menu "User management" link, admin-only (visible only when `profiles.role === 'admin'`). `/users` page — table of all users (avatar/name, "You" tag on the current row, email, role badge, remove icon hidden for the current user's own row), "+ Add user" button, right-side drawer form (email, password with an 8-char strength hint, role toggle: User / Administrator). Mock data only.

### 06. User management real data + create/delete logic
- **Logic:** "Add user" is a Server Action using a privileged `createAdminClient()` (server-only `INSFORGE_API_KEY`, never exposed to the browser) to create the InsForge auth user, with the chosen role passed through `profile` metadata so the signup trigger sets it directly. "Remove user" uses the same privileged client to delete the auth user. Both actions independently verify the caller's own `profiles.role === 'admin'` before running — InsForge's user-management endpoints sit outside RLS/PostgREST, so the Server Action itself is the enforcement boundary here, not the database (see `architecture.md`'s Invariants). Removal is blocked with a clear error if the target user still has any `initiatives`/`projects`/`tasks`/`activities` referencing them as `created_by`/`owner`/`who`.

---

## Phase 3 — Initiatives

### 07. Initiatives UI (mock data)
- **UI:** Card grid (name, status badge, category, owner, progress), "+ New initiative" button, right-side drawer form (name with 80-char cap + similar-name warning, category, owner, status), card "⋯" menu with Edit / Set active-inactive / Delete only.

### 08. Initiatives real data + CRUD logic
- **Logic:** Server Actions for create/update/delete, each respecting the creator-or-owner-or-admin rule (mirrored client-side via `lib/permissions.ts`, enforced server-side by RLS). Expanded beyond the original CRUD-only scope to also include real rollup computation (`progressPct`, `segments`, `projectCount`, `taskCount`, `atRiskCount`) via `lib/initiative-rollups.ts`, computed from the `projects`/`tasks` tables rather than deferred to Dashboard — see `progress-tracker.md` for the formulas.
- **PostHog:** `initiative_created`.

---

## Phase 4 — Projects

### 09. Projects UI (mock data)
- **UI:** Same shape as Initiatives — card grid, drawer form (name with 80-char cap + similar-name warning, description, parent initiative, owner, status), "⋯" menu with Edit / Set active-inactive / Delete only. Progress segments use the same 5-bucket scheme as Initiatives (`SEGMENT_COLORS`). Initiative/Owner pickers query real data (both already real by this point); Project records themselves are mock fixtures until Feature 10.

### 10. Projects real data + CRUD logic
- **Logic:** Server Actions for create/update/delete, same permission rule as Initiatives. Real rollup computation (`progressPct`, `segments`, `taskCount`, `atRiskCount`) pulled forward into this feature too, via the shared `lib/rollups.ts` (renamed from `lib/initiative-rollups.ts` once Projects became its second consumer) — same precedent as Feature 08, computed from the `tasks` table and showing 0 until Tasks (Phase 5) ships.
- **PostHog:** `project_created`.

---

## Phase 5 — Tasks (Kanban + Gantt)

### 11. Tasks page shell + view toggle
- **UI:** `/tasks` page with a Kanban/Gantt toggle control.

### 12. Kanban UI (mock drag)
- **UI:** Five fixed columns (To Do, In Progress, Blocked, Delayed, Done), draggable task cards, dashed empty-column placeholder. Drag reorders visually only — no persistence yet. **Scope confirmed with the developer:** also includes the "+ New task" button (reuses the shared `NewTaskModal`, mock-submit only) and the Project filter dropdown — both deferred from Feature 11, now meaningful since the board has real task-shaped content to act on/filter. See `progress-tracker.md`'s Feature 12 entry for the full decision log.

### 13. Kanban real data + status logic
- **Logic:** Dropping a card on a new column calls a Server Action that updates `tasks.status` and appends a `status` activity row.
- **PostHog:** `task_status_changed` (and `task_completed` if the new status is Done).

### 14. Kanban realtime wiring
- **Logic:** Subscribe to the `tasks` Realtime channel; merge remote INSERT/UPDATE events into board state by task id; unsubscribe on unmount.

### 15. Gantt UI (mock data)
- **UI:** One row per task, bar spanning start–end date, hatched overrun stripe, dashed early-delivery outline, delivery-date diamond marker, vertical today-line, legend.

### 16. Gantt real data
- **Logic:** Replace mock rows with real task date ranges; recompute hatch/dashed/diamond rendering from real `start_date`/`end_date`/`delivery_date`/`status`.

---

## Phase 6 — Task Detail

### 17. Task Detail UI (mock data)
- **UI:** Details panel (name, project, owner, status, dates, progress, blocker owner when Blocked) and Activity timeline (mixed system events + notes, pin icon, edit/delete on the current user's own notes).

### 18. Details panel save logic
- **Logic:** Each field save is its own Server Action call, appending the matching system activity row. Setting `delivery_date` later than `end_date` auto-sets `status = 'delayed'` instead of leaving/marking it Done, with its own system activity row describing the auto-flip.

### 19. Notes logic
- **Logic:** Add note (Server Action, `kind = 'note'`), edit/delete restricted to the author, pin/unpin allowed for any signed-in user.
- **PostHog:** `note_added`.

### 20. Task Detail realtime wiring
- **Logic:** Subscribe to `task-activity-${taskId}`; INSERT prepends (respecting pinned-first ordering), UPDATE replaces by id; unsubscribe on unmount.

---

## Phase 7 — My Activities

### 21. My Activities UI (mock data)
- **UI:** Header ("Hello, {name}"), filter chip row, task list rows (name, project/initiative, dates, status badge, quick-action icons), "+ New task" button. Mock data only.
- **Logic:** None yet.

### 22. My Activities real data + role scope
- **Logic:** Replace mock data with a real query. Scope expanded, confirmed with the developer: the "All owners / Just me" toggle is the existing `AvatarMenu` "View as" control (admin-only, now wired live instead of cosmetic), lifted into a shared `ViewAsProvider` Client Context (`components/layout/view-as-context.tsx`) so it can scope every owner-bearing list sitewide, not just this page — see `architecture.md`'s "App-Level Role Scoping" section. My Activities, Initiatives, Projects, and the Tasks page (Kanban + Gantt) all now filter to `owner = auth.uid()` for the `user` role or when an admin previews "User" view; an admin in "Administrator" view (the default) sees every owner's records, same as today.

### 23. Quick-action logic
- **Logic:** Inline mark-done, flag, and quick-note actions write directly via Server Actions and append the matching `activities` row, without navigating to Task Detail.
- **PostHog:** `task_marked_done` on mark-done (kept distinct from Kanban's `task_completed`, Feature 13, so the two completion paths stay separable in analytics), `task_follow_up_toggled` on flag.

### 24. New Task modal UI
- **UI:** Centered modal — task name (no char limit), project picker, owner picker, dates. Mock submit only.

### 25. New Task modal save logic
- **Logic:** Server Action creates the task (`created_by = auth.uid()` always; `owner` defaults to `auth.uid()` but is reassignable via a real owner picker added to the modal) and an initial `created` activity row. Also added `tasks.description` (a real schema gap found while building this — the modal's Description field had nowhere to persist to), surfaced as an editable field on Task Detail.
- **PostHog:** `task_created`.

---

## Phase 8 — Dashboard

### 26. Filter bar + KPI cards UI (mock data)
- **UI:** Quarter selector, vs-previous-period toggle, Initiative filter, Owner filter, category chips, 4 lens preset buttons (later reduced to 3 — "Strategic work" was dropped in Feature 30 since it depended on a category split that doesn't exist in this app's real data; see `progress-tracker.md`'s Feature 30 entry), the "Right now" row of **6** KPI cards (Active initiatives, Active projects, Portfolio completion %, At risk, Overdue tasks, Blocked tasks) with delta indicators — corrected from 5 to match the mockup, which wraps a 6th card. Stops at this row; the mockup's "In period" card row, Project health donut, and Velocity & momentum chart belong to Feature 27.

### 27. Charts/tables UI (mock data)
- **UI:** Status breakdown chart, completion trend chart, owner workload table, at-risk list, and the rest of the chart/table set from the mockup screenshots — all with mock data matching the visual layout.

### 28. KPI real data wiring
- **Logic:** Each KPI is a direct aggregate query against `initiatives`/`projects`/`tasks`, scoped by the active filters/lens, with period-over-period delta computed by comparing against the prior equivalent period.

### 29. Charts/tables real data wiring
- **Logic:** Same direct-aggregate-query approach for every chart and table — no PostHog dependency anywhere on this page.

### 30. Empty states + lens presets logic
- **Logic:** Empty state per chart/table when a filter combination returns no data; lens buttons re-run the same aggregate queries with a different grouping dimension.

---

## Phase 9 — Note Attachments

### 31. Note attachments UI (mock data)
- **UI:** Paperclip button in Task Detail's note-compose toolbar opens a native multi-file picker; selected files render as removable chips under the compose textarea. Posted notes render their attachments — image thumbnails, filename/size chips for everything else. New **Attachments** filter pill added next to the existing All activity/Notes toggle. Mock data only — no real upload, no real storage.

### 32. Note attachments real data + storage logic
- **Logic:** `migrations/*_activities-add-attachments.sql` adds `activities.attachments jsonb not null default '[]'`. New private `task-attachments` InsForge Storage bucket with custom `storage.objects` RLS (any authenticated SELECT, owner-only INSERT/DELETE — see `architecture.md`'s "Note Attachments" section for the exact policies). Client-side direct upload via the existing browser InsForge client (`uploadAuto()` per file, 25 MB/file cap, 10 files/note cap, any file type); `addNote` extended to accept `attachments` and persist them alongside the note in one insert, with its text requirement relaxed to allow empty text when ≥1 attachment is present. Rendering uses the SDK's authenticated `download()` + object URL (the bucket is private, so the raw `url` field isn't directly browser-loadable). `deleteNote` additionally removes the note's storage objects before deleting the row.

---

## Phase 10 — Tasks Filters

New features, not an amendment: Feature 12 (which added the original single Project `<select>`) has already shipped, so this phase replaces that dropdown rather than rewriting Feature 12's history. Mockup: `context/designs/tasks-filters-mock.html`.

### 33. Tasks filter bar UI
- **UI:** Replace the Tasks page's single Project `<select>` with a filter row of four dropdowns, same visual family as the Dashboard `FilterBar`/`FilterDropdown`: **Initiative** (single select, "All initiatives" default), **Projects** (multiselect with checkboxes), **Owners** (multiselect with checkboxes, avatar initials, shown to every role), **Status** (multiselect with checkboxes, status color dots). Each multiselect trigger summarizes its selection ("All projects", one name, or "3 projects"). A "Clear filters" link appears only when any filter is set. The Kanban/Gantt toggle stays on the same row, right aligned. Needs a new multiselect variant of `FilterDropdown` (the existing one is single select only).
- **Done when:** all four controls render with real initiative/project/owner/status options and match the mockup; the row wraps cleanly at narrow widths.
- **Scope adjusted during build (2026-11-03):** the filters are live in this feature, not inert: the old Project `<select>` already filtered, so shipping inert replacements would have regressed it, and the filtering itself is a few lines. Built here: AND/OR filter combination over the `viewAsRole` scoped list (both views), Initiative pruning of the Projects list (and dropping selected projects outside the chosen initiative), Kanban hiding unselected status columns, and a Clear filters link. Left for Feature 34: saved page state (URL + browser memory), the Back fallback, the empty state copy, and the filtered subtitle count. New `components/tasks/filter-pickers.tsx` (`FilterSelect` + `FilterMultiSelect`, pill trigger, same backdrop/menu mechanics and z-index family as `FilterDropdown`).

### 34. Tasks filter logic
- **Logic:** (The filtering, Initiative pruning and Kanban column hiding moved into Feature 33 during its build; see its scope note.) Empty state copy changes from "No tasks for this project filter yet" to a generic "No tasks match these filters" with a Clear filters action. Subtitle count reflects the filtered set.
- **Saved page state (decided with the developer):** the four filters **and** the Kanban/Gantt view live in the `/tasks` URL query (e.g. `?view=gantt&initiative=…&projects=…&owners=…&status=in_progress,done`), updated with `router.replace` so each filter click doesn't add a browser history entry. This makes Task Detail's Back button (`router.back()`), the browser back button and a page refresh all return to the exact view and filters the user left. The last used state is also remembered in the browser (`localStorage`, wrapped in try/catch), so opening `/tasks` with no query (the navbar's Tasks link) restores it; "Clear filters" resets both the URL and the remembered state. Deliberately overrides Feature 11's "toggle state is local `useState`, not a URL param" decision for this page only. Query values use ids, not names; unknown ids (a deleted project, an owner no longer in `profiles`) are ignored rather than erroring. Task Detail's Back link keeps `router.back()` but falls back to `router.push("/tasks")` when there is no in-app history (task opened directly from a bookmark, new tab or link), where the remembered state then restores the view and filters.
- **Realtime decision (settled 2026-11-03):** realtime inserted or updated tasks that miss the active filters stay hidden, with no notice; they appear once they match or the filters change. A task created from the New task modal that the filters hide gets a "Task created. Hidden by your filters." toast with a Clear filters action.
- **Spec:** [0001](../docs/specs/0001-tasks-filter-saved-state/index.md) (the full build spec: acceptance criteria, URL format, restore flow, Back fallback, `task_filter_selected` event, build plan).
- **Done when:** each filter narrows both views correctly, Initiative pruning works, hidden Kanban columns return when Status is cleared, and the empty state appears for a no match combination. Opening a task from a filtered Gantt view and pressing Back returns to that same Gantt view with the same filters; refreshing keeps them; clicking Tasks in the navbar restores the last used state; Clear filters resets everything.

---

## Feature Count

| Phase | Features |
|---|---|
| 1. Foundation | 4 |
| 2. User Management | 2 |
| 3. Initiatives | 2 |
| 4. Projects | 2 |
| 5. Tasks (Kanban + Gantt) | 6 |
| 6. Task Detail | 4 |
| 7. My Activities | 5 |
| 8. Dashboard | 5 |
| 9. Note Attachments | 2 |
| 10. Tasks Filters | 2 |
| **Total** | **34** |
