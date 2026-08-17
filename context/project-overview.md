# Project Overview

## About

**Initiative Tracker** is an internal Nile webapp for tracking strategic initiatives and the projects and tasks that deliver them. It replaces spreadsheets and Slack threads with a real data model: every Initiative breaks down into Projects, every Project breaks down into Tasks, and every Task carries an owner, a status, dates, and an append-only activity timeline. A portfolio-level Dashboard gives leadership a live view of what's on track, at risk, or overdue.

## Problem It Solves

Teams currently track initiative progress in disconnected spreadsheets and chat threads. There's no single source of truth for who owns what, what's overdue, or how a delay on one task cascades up to the initiative it belongs to. Initiative Tracker gives every Initiative/Project/Task a real owner and status, and rolls that data up into an executive Dashboard automatically — no manual status reporting.

## Pages

| Route | Page | Purpose |
|---|---|---|
| `/login` | Login | Email + password sign-in. The only unauthenticated route. |
| `/my-activities` | My Activities | Home page after login. The signed-in user's own task list (or, for admins, everyone's). |
| `/dashboard` | Dashboard | Portfolio-level KPIs, charts, and tables across all initiatives/projects/tasks. |
| `/initiatives` | Initiatives | Card grid of all Initiatives. Create/edit via a side drawer. |
| `/projects` | Projects | Card grid of all Projects. Create/edit via a side drawer. |
| `/tasks` | Tasks | Kanban and Gantt views of all Tasks (toggle between them). |
| `/tasks/[id]` | Task Detail | One task's full details, status controls, and activity/notes timeline. |
| `/users` | User Management | Admin-only. Create and remove user accounts in-app. |

## Navigation

Top navbar, present on every authenticated page:

- **Logo** — Nile shield mark + "nile" wordmark (left-aligned), linking to `/my-activities`.
- **Nav items** (5): My Activities, Dashboard, Initiatives, Projects, Tasks.
- **Bell icon** — static/non-interactive in v1 (no notification system yet — see Out of Scope).
- **Avatar menu** — user's initials/name, role label, a "View as" toggle (admin-only — a regular user never sees it at all), a "User management" link (admin-only, opens `/users`), and Log out.

No sidebar, no breadcrumbs. Every page is reached directly from the navbar.

### View As: sitewide owner scoping

The avatar menu's "View as" toggle (User / Administrator, visible only to admins) controls how every owner-bearing list in the app is filtered: in **User** view, My Activities, the Tasks page (both Kanban and Gantt), Initiatives, and Projects all show only records where the signed-in admin is the `owner` — exactly what a regular user would see. In **Administrator** view (the default for an admin), all of those same views show every owner's records, unfiltered. A regular user has no toggle and is always scoped to their own records everywhere. See `architecture.md`'s "App-Level Role Scoping" section for the implementation.

## Core User Flow

### My Activities
The signed-in user's personal task list. Regular users see only tasks where they are the `owner`; admins see tasks across all owners when "View as: Administrator," or just their own when "View as: User" (see the View As section above) — in the all-owners case, each row and each "Recently completed" entry also shows an owner avatar + name. Tasks are grouped/filterable by status, with quick filter chips. Each row shows the task name, parent project/initiative, dates, and status badge, with inline quick actions (mark done, flag, add a quick note) — no need to open Task Detail for common actions. A "+ New task" button opens a modal to create a task without leaving the page. No pagination — the full list renders at once.

### Initiatives
A card grid, one card per Initiative, showing name, a one-line goal/description, status (Active/Inactive), category, owner, and progress — scoped by the View As toggle the same way My Activities is (an admin in "User" view sees only the Initiatives they own). Clicking a card (or its "Edit" menu item) opens a right-side drawer with the full Initiative form: name (80-character cap, with a similar-name warning if another Initiative has a near-identical name, shown in create mode only — this check always runs against every Initiative in the org, ignoring the View As scope), goal (free-text description of the outcome, optional), category, owner, status. The card's "⋯" menu offers **Edit**, **Set active/inactive**, and **Delete** — no Duplicate. A "+ New initiative" button opens the same drawer in create mode. Saving shows a toast ("Initiative created" / "Initiative updated").

### Projects
Same structure as Initiatives, including View As scoping: card grid, drawer form (name with 80-char cap + similar-name warning, description — free-text describing what the project delivers, optional — initiative it belongs to, owner, status), "⋯" menu with Edit / Set active-inactive / Delete (no Duplicate), "+ New project" button, toasts ("Project created" / "Project updated").

### Tasks — Kanban
Five fixed columns: **To Do, In Progress, Blocked, Delayed, Done**. Each task renders as a draggable card (name, project, owner, due date, status-colored left border). Dragging a card to a new column updates its status immediately. Other users viewing the board see the move live (Realtime). Empty columns show a dashed placeholder. Like every other owner-bearing list, the board (and the Gantt view below) is scoped by the View As toggle — an admin in "User" view only sees their own cards/rows.

### Tasks — Gantt
A timeline view of the same tasks: one row per task, a horizontal bar spanning `start_date`–`end_date`. A bar that runs past its `end_date` without being marked Done renders with a hatched overrun stripe. A task delivered before its `end_date` renders a dashed outline for the early portion. The `delivery_date` (when set) renders as a diamond marker on the bar. A vertical "today" line marks the current date across the whole chart.

### Task Detail
Opens from My Activities, Kanban, Gantt, or direct link. Two panels:
- **Details** — name (no character limit), description (free text, no character limit), project, owner, status, start/end/delivery dates, progress, blocker owner (free text) when status is Blocked. Editing a field saves immediately and appends a system activity row (e.g. "Jane changed status to In Progress") — except description and blocker owner, both free-text fields that save on blur without their own activity row. The "Follow" button toggles the same `tasks.flagged` value shown as the flag icon on My Activities' row and the Kanban card — one shared state, not a per-page copy.
- **Activity** — a reverse-chronological, append-only timeline mixing system events (status/owner/progress/completion changes) and user notes. Notes can be added, edited, or deleted by their author only; **any** signed-in user can pin/unpin any note. Pinned notes float to the top. New activity (from any connected user) appears live via Realtime, no refresh needed.

Setting `delivery_date` to a date later than `end_date` automatically flips the task's status to **Delayed** instead of **Done**, and logs that auto-flip as a system activity row.

### Dashboard
A filter bar (quarter selector, "vs previous period" toggle, Initiative filter, Owner filter, category chips, and three "lens" preset buttons — `Delayed & at risk`/`Team load now`/`Quarter review`, live as of Feature 30) sits above two KPI rows and a stack of charts/tables, all computed directly from the Initiatives/Projects/Tasks/Activities tables, not from PostHog:
- **Right now** (6 cards, always live/today): Active initiatives, Active projects, Portfolio completion %, At risk, Overdue tasks, Blocked tasks.
- **In period** (6 cards, scoped to the selected quarter): Tasks completed, Net flow, On-time delivery, Projects delivered, Avg cycle time, Avg slip.
- **Project health** donut (On track/Delayed/Stalled/Done — a per-project bucket reused by the Risk cards below) + a **Velocity** bar chart (Week/Month/Quarter toggle, real regrouping) + an **On-time delivery trend** line.
- **Risk & red flags**: Delayed projects, Stalled (30d+ quiet) projects, Oldest blockers.
- **Effort allocation**: Active tasks by category.
- **Team performance**: per-owner active load, done/overdue/blocked counts, on-time %.
- **Looking ahead**: upcoming task due dates (next 30/60/90 days) + a Period comparison table.

### User Management
Admin-only, reached via the avatar menu's "User management" link. A table of every user (avatar/name, "You" tag on the admin's own row, email, role badge), with a "+ Add user" button and a remove icon per row (hidden on the admin's own row — you can't remove yourself). "Add user" opens a drawer: email, password, and a User/Administrator role toggle chosen up front. The account is created directly in-app — no email round-trip, no separate verification step. Removing a user is blocked with a clear error if they still own or created any Initiative/Project/Task/activity; ownership has to be reassigned first.

## Data Architecture

Every Initiative, Project, and Task has both a **`created_by`** and an **`owner`**:
- `created_by` is permanent — the person who created it keeps visibility into it even after reassigning ownership.
- `owner` is reassignable — any signed-in user can reassign ownership of anything to anyone else.
- My Activities, Initiatives, Projects, and the Tasks page (Kanban + Gantt) all filter strictly by `owner = current user` for the `user` role; an admin sees every owner's records, or just their own when previewing via the View As toggle.

Roles are enforced in the database (RLS), not just hidden in the UI:
- **Admin** — full CRUD on every Initiative/Project/Task.
- **User** — can create anything, and can edit/delete only what they created or currently own.

Role is chosen up front when an account is created via the in-app User Management screen (admins-only — see below); the signup trigger reads the chosen role from auth metadata and defaults to `'user'` if none is given. There's no in-app control to change an *existing* user's role after creation — correcting one (including bootstrapping the very first admin, since Add User itself requires an existing admin to use it) is still a manual `UPDATE profiles SET role='admin' WHERE email=...` run via `run-raw-sql`/`db query`. The InsForge dashboard has no field for this column either way.

## Features In Scope

- Email/password login (InsForge Auth), protected routes via middleware
- User Management (admin-only): create and remove user accounts in-app, with role chosen at creation
- Initiatives, Projects, Tasks: full CRUD with creator/owner model
- My Activities: owner-scoped task list with quick actions and inline task creation
- Kanban board with drag-and-drop status changes, live-updating across users
- Gantt chart with overrun/early/delivery-date/today-line rendering
- Task Detail with field editing and an append-only activity/notes timeline, live-updating across users
- Note pinning (anyone), note edit/delete (author only)
- Delayed-auto-flip rule when delivery date is set past the end date
- Executive Dashboard: KPIs, filters, lenses, charts/tables computed from operational data
- PostHog event tracking (see below)

## Features Out of Scope (v1)

- Public self-signup — there's no registration form anywhere; every account is created by an admin, either via the in-app User Management screen or directly in the InsForge dashboard, and credentials are shared out of band
- OAuth login (Google/GitHub, etc.) — email/password only
- Real notification system / bell dropdown — bell icon is static
- @mention parsing in notes
- File attachments on notes or tasks (InsForge Storage is provisioned but unused in v1)
- "Duplicate" action on Initiatives/Projects
- Multi-tenancy / multiple workspaces
- Pagination anywhere
- AI-generated summaries (GPT-4o) — planned for a future version, not built now

## PostHog Events

Two categories. **Data events** mark a real, persisted state change and must only fire from a real Server Action after a successful write — never from mock/local-only state, so an event name is never trustworthy until the feature that writes the real row has shipped. **UX events** track a real interaction (auth, navigation, filtering) and are independent of any particular feature's data being real yet.

Data events:

| Event | Fired when | Shipped |
|---|---|---|
| `initiative_created` | A new Initiative is saved | Yes (Feature 08) |
| `project_created` | A new Project is saved | Yes (Feature 10) |
| `task_status_changed` | A Task's status changes, via Kanban drag or Task Detail | Yes (Feature 13) |
| `task_completed` | A Task's status becomes Done via Kanban drag | Yes (Feature 13) |
| `task_created` | A new Task is saved | Yes (Feature 25) — fires server-side from `createTask` |
| `task_marked_done` | A Task is marked Done via the My Activities quick-action — kept as a distinct name from `task_completed` above so board-completion and quick-action-completion stay separable in analytics | Yes (Feature 23) — fires server-side from `markTaskDone`, which also logs a distinct `kind: 'completed'` activity row |
| `task_follow_up_toggled` | The follow-up flag is toggled on a task row (My Activities, or Task Detail's "Follow" button — same shared `tasks.flagged` column) | Yes (Feature 23) — fires server-side from `toggleTaskFlag` on every toggle, set or clear |
| `note_added` | A note is added to a Task's activity timeline | Yes (Feature 19) |

UX events:

| Event | Fired when | Shipped |
|---|---|---|
| `user_logged_in` | Login succeeds (client-side) | Yes |
| `user_login_server` | Login succeeds (server-side mirror of the above, captured in the Server Action itself) | Yes |
| `user_login_failed` | Login form submitted with bad credentials | Yes |
| `user_logged_out` | "Log out" clicked in the avatar menu | Yes |
| `role_view_switched` | "View as" toggled in the avatar menu | Yes |
| `activity_filter_selected` | A filter chip is clicked on My Activities | Yes |
| `task_clicked` | A task row is clicked to navigate to Task Detail | Yes |
| `new_task_modal_opened` | The "New task" button is clicked to open the modal | Yes (Feature 25) — re-added alongside the real `createTask` Server Action |

This is the full, locked list. Do not add a new event, or fire an existing one from a new call site, without updating this table and `code-standards.md`'s copy together.

## Target User

A team lead or program manager at Nile who owns or tracks a portfolio of initiatives and needs day-to-day visibility into task-level progress without chasing status updates manually.

## Success Criteria

- A user can create an Initiative → Project → Task chain and see it reflected immediately on My Activities, the Kanban board, and the Dashboard.
- Reassigning a Task's owner immediately changes whose My Activities list it appears on, while the creator retains visibility.
- Two users with the Kanban board open simultaneously see each other's drag-and-drop status changes without refreshing.
- Two users with the same Task Detail page open simultaneously see each other's new notes and status changes without refreshing.
- A regular user cannot edit or delete an Initiative/Project/Task they neither created nor own, even via direct API calls (enforced by RLS, not just hidden UI).
- The Dashboard's KPIs and charts always match the underlying Initiatives/Projects/Tasks data — no separate analytics pipeline to keep in sync.
