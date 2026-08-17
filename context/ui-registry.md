# UI Registry

A living document of components that already exist, so new work reuses them instead of duplicating. Empty at the start of the build — fill it in as components are built.

## How to Use

- **Before building a component:** check this table for something reusable.
- **After building a component:** add a row here so the next feature can find and reuse it.

| Component | Path | Used by | Notes |
|---|---|---|---|
| `Navbar` | `components/layout/navbar.tsx` | Root layout (every authenticated page) | Logo, 5 nav links with active-route highlighting, static bell, mobile hamburger menu under `md:`. Takes a `user: AuthUser \| null` prop; renders `null` on `/login` or when there's no signed-in user. |
| `ViewAsProvider` / `useViewAs` | `components/layout/view-as-context.tsx` | Root layout (wraps `Navbar` + `{children}`); consumed by `AvatarMenu`, `MyActivitiesView`, `TasksView`, `InitiativesView`, `ProjectsView` | **Feature 22:** the only non-visual entry in this table — a Client Context, not a component. Exposes `{ viewAsRole, isAdmin, setViewAsRole }`. Initialized from the signed-in user's real `profiles.role`; for a non-admin always returns `viewAsRole: "user"` regardless of any state. **Must be keyed by the real role at its mount site** (`<ViewAsProvider key={user?.role ?? "user"} .../>` in `app/layout.tsx`) — without the key, its internal `useState` initializer only fires once and stays frozen at whatever role was real during the *first* render of the root layout (which is `"user"`, from the unauthenticated `/login` render that always precedes a client-side post-login navigation) — a real bug caught during this feature's own verification, not a hypothetical. |
| `AvatarMenu` | `components/layout/avatar-menu.tsx` | `Navbar` | Avatar dropdown: real signed-in user's name/initials (`AuthUser` prop, name falls back to email). The role label next to the name always shows the real `user.role` (`"Administrator"`/`"User"`) — never derived from the togglable preview state. **Feature 22:** the "View as" toggle now reads/writes the shared `ViewAsProvider` context instead of local state, and the whole "View as" block (label + pills + description) renders only when `isAdmin` — previously it rendered unconditionally for every role. It's no longer cosmetic: My Activities, Kanban, Gantt, Initiatives, and Projects all scope their lists by it. "User management" link uses the real `user.role === 'admin'` gate, not mocked — navigates to `/users`. Log out is wired to the real `logout()` Server Action. |
| `PageContainer` | `components/shared/page-container.tsx` | Every page's top-level `<main>` (My Activities, Initiatives, Users; use for every future page too) | **Mandatory** — never hand-roll the page wrapper. Single fixed width (`max-w-360`, 1440px as of Feature 12 — see Pattern notes) — no prop, no per-page variant; `Navbar`'s inner container uses the same `max-w-360` so its edges always line up with page content. Always carries `w-full` — see Pattern notes below for why that's load-bearing, not cosmetic. |
| `StatusBadge` | `components/shared/status-badge.tsx` | `TaskRow`; reusable for any Task/Initiative/Project status pill | Single source of truth for status → color mapping per `ui-tokens.md`. |
| `EmptyState` | `components/shared/empty-state.tsx` | My Activities task list, `CompletedTimeline` | Optional title, description, optional action node. |
| `Toast` | `components/shared/toast.tsx` | `UsersView` (first user); reusable for any action-level success/error confirmation | Fixed bottom-center pill (ink bg). `tone="success"` (check, default) or `tone="error"` (alert-circle) — same container, icon swap only. Reuse for Initiative/Project/Task "created" confirmations instead of building a new one. |
| `ActivityFilters` | `components/my-activities/activity-filters.tsx` | My Activities page | Triage chips (All open/Overdue/Due today/This week/Blocked-at risk/Follow-up) + search box. |
| `TaskGroup` | `components/my-activities/task-group.tsx` | My Activities page | Bucket section header (dot + title + count) wrapping `TaskRow`s. |
| `TaskRow` | `components/my-activities/task-row.tsx` | `TaskGroup` | Single task row: name/flag, status + blocked/stale/new-note indicators, progress bar, due/timing pill, quick actions (mark done, flag, note). Navigates to `/tasks/[id]` — real page since Feature 17 (Task Detail). **Feature 22:** real data; takes a `showOwner` prop (true only when an admin is viewing "All owners") that renders an owner avatar+name column — see the Visual Pattern Reference entry below. **Feature 23:** mark-done/flag call real Server Actions (optimistic + revert + `Toast`, lifted to the parent); the row itself is now split into an outer bordered wrapper + an inner clickable/navigable flex row, so a new third child — the quick-note expand panel — can sit below the clickable row without triggering navigation. The note icon button toggles `noteOpen` instead of navigating; see the new "Inline quick-note expand panel" pattern below. |
| `CompletedTimeline` | `components/my-activities/completed-timeline.tsx` | My Activities page | "Recently completed" vertical timeline, last 8 days. **Feature 22:** real data (`completedDate` approximated from `tasks.updated_at` when `status='done'`, no real `completed_at` column exists); dropped the mock-only `description` line (no schema column); gained the same `showOwner` owner-avatar treatment as `TaskRow`. |
| `NewTaskModal` | `components/shared/new-task-modal.tsx` | My Activities page, Tasks page | Centered create-task modal. **Feature 12:** moved here from `components/my-activities/` once the Tasks page became a second consumer — same "second consumer triggers the move" precedent as `OwnerPicker`/`SEGMENT_COLORS`/`Rollup`. `ProjectOption`/`NewTaskFormValues`/`NewTaskStatus` moved with it; My Activities' own import path updated, no behavior change there. **Feature 25:** gained a real `OwnerPicker` field (`ownerId` in `NewTaskFormValues`, new `ownerOptions`/`currentUserId`/`OwnerOption` props) defaulting to the current user but reassignable — confirmed with the developer, since a manager may create a task for someone else; the old "always assigns current user" note above no longer applies. Now calls the real `createTask` Server Action via each consumer's `onCreate` instead of mock-mutating local state. |
| `LoginForm` | `components/auth/login-form.tsx` | `/login` page | Email + password fields, inline error text, calls the `login` Server Action directly (no `<form action>`/FormData binding — matches the structured-object Server Action call style used elsewhere). |
| `UsersView` | `components/users/users-view.tsx` | `/users` page | Owns drawer-open/pending-remove/toast state. Takes real `initialRows`/`currentUserEmail` from the Server Component; calls `actions/users.ts` directly and `router.refresh()` on success rather than mirroring server state in local `useState` — simplest correct option for a low-frequency admin screen. |
| `UserTable` | `components/users/user-table.tsx` | `UsersView` | User/Email/Role/remove-icon columns (`grid-cols-[1.7fr_1.7fr_150px_44px]`). Remove icon hidden entirely on the signed-in user's own row (email-match against `currentUserEmail`). No row hover, no click-through — matches `ui-rules.md`'s "no detail view" note for this table. |
| `RoleBadge` | `components/users/role-badge.tsx` | `UserTable`, `AddUserDrawer`'s own row preview (none currently, just the table) | Same dot+pill recipe family as `StatusBadge` but a separate component since `Role` isn't part of the `TaskStatus \| InitiativeStatus \| ProjectStatus` union. `admin` → `bg-accent-lightest`/`text-accent` (exact hex match to the design's `#EEF4FE`/`#0E4EAF`); `user` → `bg-surface-subtle`/`text-secondary` (closest existing token to the design's one-off `#F1F4F8` — no token matches that hex exactly). |
| `AddUserDrawer` | `components/users/add-user-drawer.tsx` | `UsersView` | Right-side drawer: email, password (show/hide + 8-char strength hint), role toggle (reuses `AvatarMenu`'s exact two-option active/inactive toggle recipe). Client-side pre-validation (email format, duplicate-against-loaded-rows, password length) backstops the real Server Action error, which always wins on conflict. |
| `OwnerPicker` | `components/shared/owner-picker.tsx` | `InitiativeDrawer`, `ProjectDrawer`, `DetailsPanel` (Task Detail), `NewTaskModal` | Trigger button (avatar + name + chevron) opens a dropdown: search input, "Suggested" row (current user first + up to 3 others as pill buttons), divider, full filtered list with checkmark on the selected row. **Feature 08:** takes `{id, name}[]` options and a `currentUserId`/`onChange(id)` contract (real `profiles.id`-backed, not a display-name string) — ready to reuse as-is for Projects/Tasks. **Feature 25:** the anticipated "future Project/Task drawer" consumer is realized — `NewTaskModal` now uses it too, fourth call site, zero component changes needed. |
| `InitiativeCard` | `components/initiatives/initiative-card.tsx` | `InitiativesView` | Fixed-height (`h-62` = 248px) grid card. Risk-accent top stripe, status dot + category pill + "⋯" menu (Edit / Set active-inactive / Delete only — no Duplicate, see `ui-rules.md`), clamped name + truncated goal line, stacked multi-segment progress bar, project/task counts + at-risk indicator, owner-avatar-and-updated-time footer. Supports a `highlighted` prop (blue ring, ~2.8s) for the just-created/just-edited card. **Feature 08:** the "⋯" menu trigger itself is now omitted entirely (`canEdit`/`canDelete` both false) when the signed-in user is neither creator, owner, nor admin — previously rendered unconditionally. The progress segment color key (`components/initiatives/types.ts`'s `SEGMENT_COLORS`) gained a 5th `delayed` bucket (`var(--color-warning)`), alongside the pre-existing `done`/`in_progress`/`blocked`/`to_do`. |
| `InitiativeDrawer` | `components/initiatives/initiative-drawer.tsx` | `InitiativesView` | Right-side drawer, same 468px recipe as `AddUserDrawer` but with `rounded-pill` footer buttons (the sitewide default per `ui-tokens.md` — Add User's `rounded-sm` is the documented exception, not this one). Fields: Name (80-char cap, similar-name warning, **create mode only**), Goal (textarea), Category (pill picker + inline "+ New" add-to-pool), Status toggle, Owner (`OwnerPicker`). Single component for both create and edit — parent remounts it via `key={editId ?? "create"}` rather than syncing props through an effect. **Feature 08:** save button shows a "Saving…" disabled state while its now-`async` `onSave` is in flight; category-add is local state seeded from the `categories` prop (no more `onAddCategory` callback up to the parent). |
| `InitiativesView` | `components/initiatives/initiatives-view.tsx` | `/initiatives` page | Filter-chip-bar-with-counts (All/Active/Inactive) + search box pattern; reuse verbatim for Projects (`build-plan.md` Feature 09 documents the same structure). **Feature 08:** real data — renders straight off Server Component props (no local mutable mirror), calls `actions/initiatives.ts` Server Actions then `router.refresh()` for every mutation, same pattern as `UsersView`. **Feature 22:** the grid/search/chip-counts/subtitle all derive from a `viewAsRole`-scoped subset of the server-fetched rows (`useViewAs()`) — every initiative when `"admin"`, only `ownerId === currentUserId` otherwise. The similar-name check stays deliberately unscoped (checked against every Initiative in the org regardless of toggle position). |
| `Rollup` / `RollupSegment` / `computeRollup` / `isTaskAtRisk` | `lib/rollups.ts` | `app/initiatives/page.tsx`, `app/projects/page.tsx` | **Feature 10:** renamed from `lib/initiative-rollups.ts`/`InitiativeRollup`/`InitiativeRollupSegment`/`computeInitiativeRollup` once Projects became a second consumer — same "second consumer triggers the move" precedent as the `SEGMENT_COLORS` extraction below. No logic changes from the rename. `computeRollup(projectIds, allTasks, today)` already took an array of project ids and filtered tasks by membership, so Projects calls it with a single-element `[project.id]` array per card — no new parameter or overload needed. |
| `SEGMENT_COLORS` / `ProgressSegment` | `components/shared/segment-colors.ts` | `InitiativeCard` (via `app/initiatives/page.tsx`), `ProjectCard` (via `app/projects/page.tsx`, real data as of Feature 10) | **Feature 09:** moved out of `components/initiatives/types.ts` once Projects became a second consumer of the identical 5-bucket (`done`/`in_progress`/`blocked`/`delayed`/`to_do`) color map — not a premature abstraction, the second consumer is what triggered the move. `InitiativeCardData`/`ProjectCardData`'s `segments` fields both type as `ProgressSegment[]`. |
| `ProjectCard` | `components/projects/project-card.tsx` | `ProjectsView` | Near-identical copy of `InitiativeCard`'s recipe (same `h-62` card, risk-accent stripe, stacked progress bar, owner footer). One visual difference: the category pill is replaced with an initiative pill (`FolderClosed` icon + `initiativeName`, same `bg-accent-lightest`/`text-accent` tint). **Feature 10:** the "⋯" menu trigger is now permission-gated exactly like `InitiativeCard` — `canEdit`/`canDelete` props added, trigger omitted entirely when both are false, Edit+Set-active/inactive and Delete (plus the divider between them) each independently gated. |
| `ProjectDrawer` | `components/projects/project-drawer.tsx` | `ProjectsView` | Same 468px drawer shell/footer as `InitiativeDrawer`. Fields: Initiative (`<select>`, required — plain native select per the literal mock, not a rich picker like `OwnerPicker` since the list is short and has no search/suggested concept), Name (80-char cap + similar-name warning, create-mode only, checked sitewide against every Project regardless of parent Initiative — reused verbatim even though the literal mock's own JS omits this for Projects; both `build-plan.md` and `project-overview.md` spec it in writing), Description (textarea, reuses `InitiativeDrawer`'s Goal-textarea recipe), Status toggle, Owner (`OwnerPicker`, real profiles). No Category field — Projects don't have one. Unchanged since Feature 09. |
| `ProjectsView` | `components/projects/projects-view.tsx` | `/projects` page | Same filter-chip/search/grid/drawer/toast shape as `InitiativesView`. **Feature 10:** real data — dropped the Feature 09 local `useState` mock-CRUD mirror; renders straight off `initialProjects` props and calls `actions/projects.ts` Server Actions then `router.refresh()` for every mutation, same pattern as `InitiativesView`/`UsersView`. Computes `canEditProject`/`canDeleteProject` per card via `lib/permissions.ts` (new `currentUserRole` prop). **Toggle-status now flashes a toast** ("Project set active"/"Project set inactive") — a deliberate change from Feature 09's silent toggle (which matched the literal mock at the time), made for consistency with `InitiativesView`'s real-data toggle behavior now that the mutation can actually fail and needs error-toast handling either way. **Feature 22:** scoped by `useViewAs()` exactly like `InitiativesView` — every project when `"admin"`, only `ownerId === currentUserId` otherwise; similar-name check stays unscoped. |
| `TasksView` | `components/tasks/tasks-view.tsx` | `/tasks` page | **Feature 11:** page shell only — title/subtitle header + the Kanban/Gantt segmented toggle (local `useState`, defaults to `"kanban"`). No task data, no "+ New task" button, no Project filter yet — both deferred to Feature 12 since neither has real content to act on. Each tab shows an `EmptyState` placeholder with tab-specific copy, proving the toggle works ahead of Feature 12 (Kanban) / Feature 15 (Gantt) replacing it with real content. **Feature 12:** owns `tasks`/`view`/`projectFilter`/`modalOpen` state. Header gained the "+ New task" CTA (reuses `NewTaskModal`, mock-submit only — appends to this page's own local list, does not sync with My Activities' separate local mock list). Filter row gained the Project `<select>` pill (filters the board client-side by `projectId`; lists every project regardless of status, unlike the modal's own picker which is active-only). Kanban tab now renders `KanbanBoard` with real task data instead of the `EmptyState` placeholder; Gantt tab is unchanged (still Feature 15's placeholder). Whole-board `EmptyState` ("No tasks here") now shows when the Project filter yields zero tasks — distinct from `KanbanBoard`'s own per-column "Drop here" placeholder. **Feature 22:** a `scopedTasks` derivation (`useViewAs()`) sits between the raw `tasks` state and the existing `projectFilter` — every task when `"admin"`, only `ownerId === currentUserId` otherwise — feeding both `KanbanBoard` and `GanttChart` identically, so the toggle affects both tabs. |
| `KanbanBoard` | `components/tasks/kanban-board.tsx` | `TasksView` (Kanban tab) | **Feature 12:** the 5 fixed columns (To Do/In Progress/Blocked/Delayed/Done), in that order, never reordered. Native HTML5 drag-and-drop only (`draggable`, `onDragStart`/`onDragOver`/`onDrop`) — no DnD library, per `architecture.md`. Column-to-column only: dropping changes the dragged task's `status` in the parent's local state (lifted via `onDropTask`) and the column re-sorts by due date; there's no manual within-column position drag, matching the literal mock's own behavior. Dropping back into the same column is a no-op (status unchanged). |
| `KanbanCard` | `components/tasks/kanban-card.tsx` | `KanbanBoard` | **Feature 12:** click navigates to `/tasks/[id]` (real page since Feature 17) and fires `task_clicked` (existing locked PostHog event, second call site alongside `TaskRow`'s — both describe the same semantic action). **Feature 23:** the card's flag icon (`task.followUp`) now reflects the real `tasks.flagged` column instead of a hardcoded `false` — read-only here, no toggle button on the card itself; toggled from My Activities or Task Detail, reflected live via the Kanban realtime channel (now carrying `flagged` in its payload). No component changes needed — it already rendered whatever `followUp` it was given. |
| `GanttChart` | `components/tasks/gantt-chart.tsx` | `TasksView` (Gantt tab) | **Feature 15:** legend row + month-axis header + horizontally-scrollable timeline table + full-height today-line. Renders its own dedicated mock fixture set (`gantt-mock-data.ts`), not the same `tasks` state Kanban uses — the Project filter dropdown has no effect on this tab yet, by design (mirrors Kanban's own Feature-11-before-Feature-12 stage). **Post-launch fix (2026-06-25):** now `"use client"`; auto-scrolls the timeline on mount so today's line sits just past the frozen Task column (`TODAY_LEAD_IN_DAYS` of past context still visible) instead of defaulting to the oldest task's date. See Pattern notes below. |
| `GanttRow` | `components/tasks/gantt-row.tsx` | `GanttChart` | **Feature 15:** one row's label (name + schedule-health label + project) and bar (solid/hatch/dashed segments, diamond marker, date captions). Bar colors come from `gantt-helpers.ts`'s computed 5-bucket health mapping, not the raw Kanban status colors — see `ui-tokens.md`'s Gantt Bar entry. **Post-launch fix (2026-06-25):** the whole row is now clickable — fires `task_clicked` (existing locked PostHog event, third call site alongside `TaskRow`'s and `KanbanCard`'s) and navigates to `/tasks/[id]`, identical payload shape and `cursor-pointer` styling to `KanbanCard`'s click handler. |
| `TaskDetailView` | `components/task-detail/task-detail-view.tsx` | `app/tasks/[id]/page.tsx` | **Feature 17:** local task-field state (name, status, dates, progress, blocker, owner, follow) seeded from a real `tasks` row by URL id. Title block (breadcrumb, inline-editable name, status badge + due chip + owner), Mark done / Follow actions, two-column grid wrapping `DetailsPanel` + `ActivityTimeline`. `router.back()` for the back button, no dynamic per-source label. **Feature 18:** every field except Follow now persists — optimistic update → Server Action → revert + error `Toast` on failure, same shape as Kanban's drag/`InitiativesView`/`ProjectsView`/`UsersView`. Each successful save also pushes a matching `TimelineEntry` onto local `activities` state (`appendActivity` helper) since there's no realtime subscription yet (Feature 20) — without it a just-saved system row stays invisible until a hard reload. **Feature 19:** `onAddNote`/`onEditNote`/`onDeleteNote`/`onTogglePin` now call real Server Actions (`actions/activities.ts`) instead of mutating local state directly. `handleAddNote` is the one handler that is *not* optimistic — it waits for `addNote`'s real `{ id, createdAt }` before inserting into local state, since an optimistic temp-id-then-swap approach breaks `ActivityTimeline`'s `editingId` tracking if a user starts editing before the swap lands (caught live during this feature's own verification). `handleEditNote`/`handleDeleteNote`/`handleTogglePin` stay optimistic-then-revert, since they only ever target already-real ids. **Feature 23:** Follow is no longer the one un-persisted field — `followUp` is seeded from a real `initialFlagged` prop and `handleToggleFollowUp` calls the same `toggleTaskFlag` Server Action My Activities uses (optimistic + revert + `Toast`, same shape as every other field here), appending a `kind:'flag'` row via `appendActivity` (its kind union extended from `"status" \| "progress" \| "owner"` to include `"flag"`). **Post-launch fix (2026-06-25):** gained `projectId` state — a real gap, since project reassignment was always spec'd (`project-overview.md`/`build-plan.md`) but never built. The header breadcrumb is now derived live from `projectOptions.find(p => p.id === projectId)` instead of static `projectName`/`initiativeName` string props, same derivation pattern `ownerName` already used — reassigning updates the breadcrumb instantly. `handleProjectChange` is optimistic + revert + error `Toast`, but with no `appendActivity` call (silent save, matching the precedent below). |
| `DetailsPanel` | `components/task-detail/details-panel.tsx` | `TaskDetailView` | **Feature 17:** status 5-pill group, start/end/delivery date inputs, progress slider (locked + noted when `status==='done'`), `OwnerPicker` reused as-is, single-field Blocker panel (status==='blocked' only — literal mock's second "what's blocking this" field dropped, schema/spec only has one), created/updated footer. See Pattern notes below. **Feature 18:** date inputs/status pills/owner picker save immediately on change; the progress slider's `onChange` still drives live local state every drag tick but only commits (`onProgressCommit`) on `onPointerUp`/`onBlur`; the Blocker input commits (`onBlockerOwnerCommit`) on `onBlur`. Date-string conversion now imports `toDateInputValue`/`fromDateInputValue` from `lib/dates.ts` (moved out of this file so `TaskDetailView` can use them too). **Feature 25:** gained a Description textarea at the top of the panel (above Status) — commits on blur exactly like the Blocker input (`onDescriptionCommit`), no system activity row, closing the real `tasks.description` schema gap found while wiring the New Task modal's save logic. **Post-launch fix (2026-06-25):** gained a Project field right after Description — native `<select>` + `ChevronDown` + "Initiative" pill, lifted verbatim from `NewTaskModal`'s own Project field (lists every project regardless of status, unlike that modal's active-only create-time list — the current value must always be a valid option). Saves immediately on change via the new `updateTaskProject` Server Action; no activity row, no migration — `activities.kind` has no `'project'` value, same precedent as the silent name/date/blocker-owner fields above. |
| `ActivityTimeline` | `components/task-detail/activity-timeline.tsx` | `TaskDetailView` | **Feature 17:** All-activity/Notes filter (reuses the Kanban/Gantt segmented-toggle recipe verbatim), compose box (inert decorative @mention/attach icons, same precedent as the static bell icon), Pinned section, vertical-line timeline mixing real system `activities` rows with mock note entries (`mock-notes.ts` — spliced in since Notes have no write path until Feature 19). Note cards get pin (any user) + edit/delete (author only); system rows are never editable. **Feature 18:** real status/owner/progress saves (and the delayed auto-flip) now add genuine system rows alongside the still-mock notes — no component changes needed, it already rendered whatever `entries` it was given. **Feature 19:** `mock-notes.ts` deleted — every note is now a real `activities` row from the moment it's added. No component changes needed here either; the component never knew or cared whether an entry was mock. |
| `DashboardView` | `components/dashboard/dashboard-view.tsx` | `/dashboard` page | **Feature 26:** page header (first-ever page-level eyebrow — "Portfolio" in `text-accent`, see Pattern notes below — + h1 "Executive dashboard" + subtitle), owns all filter-bar state (quarter, vs-previous, Initiative filter, Owner filter, active category, active lens — all local `useState`, functionally inert this feature), renders `FilterBar` then the "Right now" section (green dot + label + subtitle) + 6 `KpiCard`s in a `flex flex-wrap` row. Real `initiatives`/`profiles` lists come in as props from `app/dashboard/page.tsx`; the 6 KPI numbers come from the `DASHBOARD_KPIS` mock fixture — same "pickers real, entity data mock" split as Feature 09's Projects UI. **Feature 27:** assembles the full mockup's widget stack in order — Right now → In period (6 `PeriodKpiCard`s) → Project health/Velocity 2-up grid → On-time trend (full width) → Risk & red flags (3-up `RiskCard` grid) → Effort allocation (2-up grid) → Team performance table → Looking ahead (2-up grid). Every section header now goes through the shared `SectionHeader` component. All Feature 27 data is mock (`mock-data.ts`); filter-bar/lens controls remain functionally inert across the whole page, same precedent as Feature 26. **Feature 29:** every section past "Right now" now computes from real data via `lib/dashboard-aggregates.ts`, fed by a `matchDashboardScope()` cascade over one `useMemo`'d dataset (`rawInitiatives`/`rawProjects`/`rawTasks`/`rawActivities`, the last one new this feature). The Velocity chart's Week/Month/Quarter toggle is now real state owned here (lifted out of `VelocityChart`) and shared with `OnTimeTrendChart`'s bucket choice (collapsing "Week" to monthly buckets — a trend line is too sparse at weekly granularity). Effort allocation's grid dropped to one card (`StrategicMixCard` removed entirely — see its row below). `prevQuarterLabel`/the comparison window are now derived from the *selected* quarter, not always "the quarter before today" — fixes a latent label mismatch from Feature 26/27 that only became visible once the numbers underneath were real. **Feature 30:** the `activeLens` string state is gone, replaced by a computed `lensPresets` list (3 presets, each with a `match()`/`apply()`) passed down to `FilterBar` as `lenses` — `active` is derived by comparing current filter state to each preset's fields every render, not tracked via click. Also passes `hasData={scoped.tasks.length > 0}` to `VelocityChart`/`OnTimeTrendChart` and fills in the two missing `RiskCard` `emptyMessage` props. |
| `FilterBar` | `components/dashboard/filter-bar.tsx` | `DashboardView` | **Feature 26:** one `Card`-recipe panel — top row of 4 `FilterDropdown`s (quarter, vs-previous, Initiative, Owner), a divider, then CATEGORY chips (reuses the Filter-chip-bar recipe verbatim, single-select — confirmed with the developer over multi-select) and LENSES preset buttons (same chip recipe, independent single-select state). Category list and Initiative/Owner options are real data passed down from `DashboardView`. **Feature 30:** the local `LENS_PRESETS` string array + `activeLens`/`onLensChange` props are gone — `FilterBar` is now purely presentational for lenses too, taking a `lenses: LensPreset[]` prop (`{label, active, apply}[]`) computed by `DashboardView`. Down from 4 presets to 3 ("Strategic work" dropped — no real backing once Feature 29 dropped the category split it depended on). Clicking a lens always calls its `apply()`; no toggle-off click handling (a lens is a one-shot preset-merge, not a stateful mode, matching the literal design mock's `dashLens()`). |
| `FilterDropdown` | `components/dashboard/filter-dropdown.tsx` | `FilterBar` (quarter, vs-previous, Initiative, Owner — 4 call sites) | **Feature 26:** generalizes `OwnerPicker`'s open/close/backdrop mechanics (`fixed inset-0` click-away layer, `absolute top-[calc(100%+6px)]` menu, same z-index family) into a plain icon+label+chevron trigger with a flat text option list — no avatar/search, since these 4 use cases don't need either. `icon` prop is optional (the Initiative filter renders with none, matching the mockup). |
| `KpiCard` | `components/dashboard/kpi-card.tsx` | `DashboardView` (×6) | **Feature 26:** label, big stat (`KPI stat number` token, `text-2xl font-semi leading-tight`), then either a colored delta pill (`TrendingUp`/`TrendingDown` + signed value, green/red) or a plain gray trend annotation (the 6th "Blocked tasks" card only — `delta: null` + `trend: "→ 0"`), then a caption line. Delta color is **not** literal up=green/down=red — each `KpiData` entry carries its own `goodDirection: "up" \| "down"`; the pill renders `success-dark` when `delta.direction === goodDirection`, `danger-cta` otherwise. See `components/dashboard/mock-data.ts`'s `DASHBOARD_KPIS` for the exact 6 entries and their tagged direction. |
| `SectionHeader` | `components/dashboard/section-header.tsx` | `DashboardView` (×6 — Right now, In period, Risk & red flags, Effort allocation, Team performance, Looking ahead) | **Feature 27:** extracted from "Right now"'s inline markup once it had 6 call sites — colored dot (`dotColor` prop, plain CSS color/var) + bold label + faint subtitle. See the Visual Pattern Reference entry below. |
| `PeriodKpiCard` | `components/dashboard/period-kpi-card.tsx` | `DashboardView` (×6, "In period" row) | **Feature 27:** a second, visually distinct KPI card next to `KpiCard` — bigger value text (32px) and a filled-pill delta (colored background, not just colored text+icon) instead of being a `variant` of `KpiCard`, since the mockup's "In period" row is a real visual departure from "Right now." See the Visual Pattern Reference entry below. |
| `ProjectHealthCard` | `components/dashboard/project-health-card.tsx` | `DashboardView` | **Feature 27:** first chart in the codebase — a recharts `PieChart` donut (`innerRadius`/`outerRadius`, no stroke) with the on-track % overlaid via an absolutely-positioned center div (recharts has no built-in center-label slot), a 3-row segment legend (dot/label/count/pct), and an "Aggregate completion" progress bar below. See the Visual Pattern Reference entry below. **Feature 29:** the mock's 3-bucket `on_track`/`at_risk`/`delayed` segment model was replaced with a real 4-bucket `on_track`/`delayed`/`stalled`/`done` health model (see `architecture.md`'s new "Project Health" section) — the component itself needed zero changes since it already maps generically over whatever `segments` it's given. **Feature 30:** renders the shared `EmptyState` (description-only) in place of the donut/legend/completion-bar when `activeProjectsTotal === 0`. |
| `VelocityChart` | `components/dashboard/velocity-chart.tsx` | `DashboardView` | **Feature 27:** recharts `BarChart`, two `Bar` series (Completed/Started) per period. Includes a Week/Month/Quarter granularity toggle (segmented-pill recipe, same family as the Kanban/Gantt toggle) that is visual-only/local state — does not recompute the chart data, same "filter bar inert this feature" precedent as Feature 26. **Feature 29:** granularity state lifted out to `DashboardView` (`granularity`/`onGranularityChange` props) so `OnTimeTrendChart` can share the same bucket choice; the toggle now actually regroups the bars by real task created/completed counts. **Feature 30:** new `hasData` prop — when false, renders the shared `EmptyState` in place of the chart (the granularity toggle stays visible above it). Gated on total scoped task count, not bucket-array length, since the bucket array is always fully populated (fixed time periods) regardless of data. |
| `OnTimeTrendChart` | `components/dashboard/on-time-trend-chart.tsx` | `DashboardView` | **Feature 27:** recharts `AreaChart`, single series, gradient fill (`var(--color-accent)` at 16% opacity fading to 0) under a `var(--color-accent-bright)` stroke — matches `ui-tokens.md`'s "Dashboard Chart Colors" table for the completion/on-time trend line. **Feature 29:** subtitle corrected from "% of projects delivered by their end date" to "% of tasks completed by their end date" — the real computation has always been task-level (no project-level due date exists in the schema), the mock copy just hadn't been checked against that until now. **Feature 30:** new `hasData` prop, same gate/reasoning as `VelocityChart` — renders the shared `EmptyState` in place of the chart when false. |
| `RiskCard` | `components/dashboard/risk-card.tsx` | `DashboardView` (×3 — Delayed projects, Stalled, Oldest blockers) | **Feature 27:** one generic component for all 3 "Risk & red flags" cards via `title`/`count`/`tone`/`dotColor`/`items`/`emptyMessage`/`footer` props, rather than 3 near-duplicate components — title + count badge, a dotted list of `{name, sub, tag}` items (or an empty-state message), and an optional footer stat row (used by "Oldest blockers" for the Overdue tasks count). See the Visual Pattern Reference entry below. **Feature 30:** the `emptyMessage` prop was already built but only wired for "Stalled" — "Delayed projects" and "Oldest blockers" now get one too, for parity. The footer stat (on "Oldest blockers") still renders even when `items` is empty — it's an independent real value, not part of the empty/non-empty branch. |
| `CategoryMixCard` | `components/dashboard/category-mix-card.tsx` | `DashboardView` (Effort allocation) | **Feature 27:** "Active tasks by category" — a stack of labeled progress bars (label/count/pct header line + a plain width-percentage bar), same bar mechanics as Initiative/Project progress bars, not a chart. **Feature 29:** now the only card in the Effort allocation section (see `StrategicMixCard` below) — renders full-width instead of in a 2-up grid. **Feature 30:** renders the shared `EmptyState` in place of the bar stack when `items.length === 0`. |
| ~~`StrategicMixCard`~~ | ~~`components/dashboard/strategic-mix-card.tsx`~~ | — | **Feature 27:** "Strategic vs. tactical" — a 2-segment stacked bar (`bg-accent`/`bg-warning`, in-bar % labels), legend, a "Heaviest initiative" callout panel (`bg-surface-subtle`), and a "Mix shift vs. last quarter" list (dot + category + current % + signed delta, green/red by sign). **Feature 29: removed.** The mock's split (tactical = category `'Operations'`) doesn't map onto any of this app's real categories (`Customer`/`SO Operations`/`Sales Enablement`) — confirmed with the developer rather than guessing a mapping. "Heaviest initiative" and "Mix shift" were dropped along with it (the latter would have hit the same unreconstructable-history problem Feature 28 already ruled out for other metrics). |
| `TeamPerformanceTable` | `components/dashboard/team-performance-table.tsx` | `DashboardView` | **Feature 27:** the build-plan's "owner workload table" — `grid-cols-[2fr_1.4fr_80px_80px_80px_90px]` header + one row per member: gradient-mark avatar initials (`[background:var(--gradient-logo-mark-linear)]`, same token `AvatarMenu` uses) + name + optional flag pill, an active-load progress bar + count, then Done/Overdue/Blocked/On-time columns. **Feature 30:** when `members.length === 0`, renders the shared `EmptyState` instead of the column-header grid + rows (no header shown — nothing to label). |
| `ComingDueCard` | `components/dashboard/coming-due-card.tsx` | `DashboardView` (Looking ahead) | **Feature 27:** "Coming due" — 3 stat tiles (next 30/60/90 days) over a list of `{name, sub, dateLabel, tone, days}` items, date label colored per-item via the `tone` field (red/amber/gray by urgency). **Feature 29:** the mock's `sub` text ("Project end date"/"Initiative target") implied deadlines that don't exist as real columns on `projects`/`initiatives`. Real data is task `end_date` only, `sub` now reads `{initiative name} · {owner}` — same shape, no component change. **Feature 30:** the 3 stat tiles (30/60/90 days) always render, even at 0 — they're real values, not an absence of data. Only the `items` list below them swaps to the shared `EmptyState` when empty (which, by construction, only happens when all 3 tiles are also 0). |
| `PeriodComparisonCard` | `components/dashboard/period-comparison-card.tsx` | `DashboardView` (Looking ahead) | **Feature 27:** "Period comparison" — a 4-column (`Metric/Now/Prior/Δ`) table, one row per tracked metric, Δ colored green/red/gray per row (`CompareRow.color`, hand-set per fixture rather than derived). `rangeLabel`/`comparisonLabel` props are reused from `DashboardView`'s existing quarter state (`prevQuarterLabel` via `getRecentQuarterLabels`). |

---

## Visual Pattern Reference

Captured via `/imprint` from the My Activities feature (first feature built). Future components of these types should match the exact classes below rather than inventing new values.

### Page container (`<main>`)

File: `components/shared/page-container.tsx`
Last updated: 2026-06-22

| Property | Class |
|---|---|
| Container | `mx-auto w-full max-w-360 px-4 py-6 pb-18 md:px-6` — one width (1440px as of Feature 12; was 1280px before that), no variants. `Navbar`'s inner row uses the same `max-w-360` so its edges line up with every page's content. |

**Pattern notes — three corrections layered on the same component:**
- **`w-full` is required, not decorative** — see `context/layout-fundamentals.md` Rule 2 for the generic CSS explanation (flex-parent + auto-margin-centered child = shrink-to-fit, not stretch-then-cap). This shipped broken on My Activities and Users before being caught and centralized here — every page must render through `PageContainer`, never re-type the className.
- **One width, not two.** This component originally had a `maxWidth?: "default" | "narrow"` prop (1440px sitewide, 1040px for `/users`, matching the literal design mock's own per-screen values). Removed after direct developer feedback that the gap was too visually jarring — `/users` looked noticeably narrower/more margin-heavy than every other page despite sharing the same navbar. Unified to a single 1280px at the time — a deliberate compromise between the two original values, not a return to either one.
- **1280px → 1440px (Feature 12).** The Kanban board's 5 fixed columns (min-width 260px each + gaps) need ~1356px of inner content width to render without a horizontal scrollbar; at 1280px with the standard `md:px-6` padding, only ~1216px was available — a 140px shortfall no amount of padding adjustment alone could close (even zero padding only reaches 1280px). Confirmed with the developer before changing a sitewide constant: raised the single shared width back to 1440px (its pre-unification value) rather than reopening the old two-width split — still one width, applied everywhere, just a bigger number. Verified live: the Kanban board's `scrollWidth`/`clientWidth` are now equal (no overflow) at a 1600px viewport, and every other page (`My Activities`, etc.) measured `main`'s rendered width at exactly 1440px.

### Page header with eyebrow (Dashboard)

File: `components/dashboard/dashboard-view.tsx`
Last updated: 2026-06-24

| Property | Class |
|---|---|
| Eyebrow | `mb-1.5 text-sm font-bold uppercase tracking-wide text-accent` |
| h1 | `mb-1.25 text-2xl font-semi tracking-tight text-text-primary` — same h1 recipe every other page already uses (Initiatives/Tasks) |
| Subtitle | `text-base text-text-secondary` — same as every other page |

**Pattern notes:** First page-level eyebrow anywhere in the app. `ui-tokens.md`'s "Eyebrow / overline" typography row pre-dated any real usage and specified `text-warning` (orange); the Dashboard mockup's eyebrow is unambiguously blue, so the token's color was corrected to `text-accent` to match the first real usage rather than leaving the doc wrong. Every other page's header (Initiatives, Tasks, etc.) has no eyebrow — don't retrofit one elsewhere without a reason; this pattern exists because the Dashboard mockup specifically called for it.

### Card / Section panel

File: `components/my-activities/completed-timeline.tsx`, `components/my-activities/my-activities-view.tsx` (task list `<section>`)
Last updated: 2026-06-20

| Property | Class |
|---|---|
| Background | `bg-surface` |
| Border | `border border-border` |
| Border radius | `rounded-lg` |
| Shadow | `shadow-xs` |
| Padding | `p-5.5` (≈22px) when the section has its own internal header; sectioned lists (task group headers) use `px-[20px] py-2.75` instead |
| Spacing between stacked sections | `mt-5` (24px, `spacing-5` token) |

**Pattern notes:** This is the one card recipe used for every top-level panel on My Activities (task list, recently-completed). Use it for any new top-level page panel (Initiative/Project card grids, Dashboard widgets) unless a more specific recipe below applies.

### Small icon button (32px square control)

File: `components/my-activities/task-row.tsx` (mark done / flag / note), `components/my-activities/new-task-modal.tsx` (close button)

| Property | Class |
|---|---|
| Size | `h-[32px] w-[32px]` — **always use the explicit arbitrary value, never `h-8 w-8`** (see gotcha below) |
| Background | `bg-surface` |
| Border | `border border-border` |
| Border radius | `rounded-sm` |
| Icon | `lucide-react`, `size={16}`, default `text-text-faint` |
| Hover (neutral) | `hover:border-success-light hover:bg-success-light hover:text-success-dark` (mark-done) or the equivalent tint for the action's semantic color (warning tint for flag, accent tint for note) |
| Active/toggled state | swap to the filled tint directly, e.g. flagged: `border-warning-light bg-warning-light text-warning` |

**Pattern notes:** Every quick-action icon button on a row uses this exact 32px recipe with a semantic-color hover tint matching the action (success=done, warning=flag, accent=note/comment). Reuse this for Kanban card actions and Task Detail controls later.

⚠️ **Gotcha — do not use bare `h-8`/`w-8`/`p-6`/`gap-7`/etc.** This project's `globals.css` redefines Tailwind's `--spacing-5`..`--spacing-9` to non-default values (`spacing-8` = 64px, not 32px). Bare numeric utilities 5–9 silently resolve to the wrong size with no error — this already caused real 2x-oversized icon buttons once. For one-off control/icon dimensions, always use an explicit arbitrary value (`h-[32px]`). Only use bare `n-5`..`n-9` when you mean the documented spacing token itself (card padding, section gaps).

### CTA button (pill, gradient)

File: `components/my-activities/my-activities-view.tsx` ("+ New task")

| Property | Class |
|---|---|
| Background | `[background:var(--gradient-cta)]` — never a solid color |
| Text | `text-white font-bold text-sm` |
| Shape | `rounded-pill` |
| Padding | `px-[20px] py-3` |
| Shadow | `shadow-cta-glow` |
| Icon | leading `lucide-react` icon, `size={18}` |

**Pattern notes:** Per `ui-rules.md`, every page-level "+ New X" action uses this exact recipe. Reuse verbatim for "+ New initiative" / "+ New project".

### Modal primary / secondary buttons (footer)

File: `components/my-activities/new-task-modal.tsx`

| Property | Class |
|---|---|
| Primary ("Create task") | `rounded-pill bg-text-primary px-[20px] py-2.5 text-sm font-semi text-white disabled:opacity-40` |
| Secondary ("Cancel") | `rounded-pill border border-border bg-surface px-4.5 py-2.5 text-sm font-semi text-text-secondary` |
| Footer container | `flex justify-end gap-2.5 border-t border-border px-5 py-4` |

**Pattern notes — flagged inconsistency:** the primary button here uses `bg-text-primary` (solid ink) in a pill shape, which deviates from `ui-tokens.md`'s documented generic Primary button recipe (`bg-accent`, `rounded-sm`, not pill). This was a deliberate choice to match the actual UX mock for this specific modal (logged in `progress-tracker.md`) — not an error. Don't "fix" it to match the generic recipe without checking the mock for whatever modal you're building next; the mock is the higher-priority source for this specific control.

### Modal / Dialog container

File: `components/my-activities/new-task-modal.tsx`

| Property | Class |
|---|---|
| Overlay | `fixed inset-0 z-70 flex items-center justify-center bg-text-primary/34 p-5` |
| Panel | `w-115 max-w-full overflow-hidden rounded-lg bg-surface shadow-lg` |
| Header | `flex items-center justify-between gap-3 border-b border-border px-5 py-5` |
| Body | `flex flex-col gap-4 px-5 py-5` |
| Footer | see button table above |

**Pattern notes:** Overlay scrim color is expressed as `bg-text-primary/34` (the Nile Ink token at 34% opacity via Tailwind's opacity modifier) rather than a hardcoded rgba — always derive scrim colors from an existing token this way.

### Form input (text/select/date)

File: `components/my-activities/new-task-modal.tsx`

| Property | Class |
|---|---|
| Background | `bg-surface` (only stated explicitly on `<select>`; inputs/textarea inherit) |
| Border | `border border-border` |
| Border radius | `rounded-sm` (textarea uses `rounded-md`) |
| Padding | `px-3 py-2.5` (date inputs use `py-2.25`) |
| Text | `text-sm text-text-primary` |
| Label | `mb-1.5 block text-[11.5px] font-bold uppercase tracking-wide text-text-faint`, required marker `text-danger-cta` |
| Focus | global rule in `globals.css`: `border-color: var(--color-accent-bright); box-shadow: var(--ring-focus);` |

**Pattern notes — Feature 25:** `DetailsPanel`'s new Description field (Task Detail) reuses this exact textarea variant (`rounded-md border border-border px-3.25 py-2.75 text-sm leading-body`) verbatim — same recipe as `InitiativeDrawer`'s Goal field and this modal's own Description field, just a third/fourth consumer. No new classes introduced.

### Clickable list row ("card-like" row)

File: `components/my-activities/task-row.tsx`, `components/my-activities/completed-timeline.tsx`

| Property | Class |
|---|---|
| Hover | `hover:bg-surface-subtle` with `transition-colors duration-(--duration-base)` |
| Cursor | implicit via `<Link>`/`cursor-pointer` on plain `<div>` rows |
| Row accent (status/risk) | colored `border-l-[3px]` using semantic tone (`border-l-danger-cta`, `border-l-warning`, `border-l-accent`, `border-l-border-strong`) — only on bordered rows, not timeline rows |
| Radius (timeline variant, no left border) | `rounded-md` |

**Pattern notes:** Any future row-style list (Kanban card list view, Task Detail's activity timeline, Initiatives/Projects table rows if added) should default to whole-row hover (`hover:bg-surface-subtle`), not just a hover effect on the title text — confirmed via user feedback that "just the title" wasn't sufficient affordance.

### Status badge

File: `components/shared/status-badge.tsx` (shared — use this component, don't reinvent)

| Property | Class |
|---|---|
| Shape | `rounded-pill` |
| Padding | `px-2.25 py-0.5` |
| Text | `text-xs font-med` |
| Colors | looked up per status from `ui-tokens.md`'s Status Badges tables — see component source, never hardcode |

### Auth card (centered, full-viewport)

File: `app/login/page.tsx` — no design mock exists for `/login`; built directly from `ui-tokens.md` recipes since this is the one unauthenticated page (no Navbar, per `Navbar`'s own `pathname === "/login"` early return).

| Property | Class |
|---|---|
| Outer wrapper | `flex min-h-screen items-center justify-center bg-surface-subtle px-4` |
| Card | `w-full max-w-[400px] rounded-lg border border-border bg-surface p-8 shadow-sm` |
| Header | centered logo + `text-lg font-semi` heading + `text-sm text-text-secondary` subtext, `gap-3` |
| Field error | `text-sm text-danger-cta` directly below the fields, above the submit button — not a toast, per `ui-rules.md`'s Form Inputs rule |

**Pattern notes:** Reuse this exact card recipe for any other full-page (non-navbar) screen, should one ever be needed.

### Side drawer (Add user)

File: `components/users/add-user-drawer.tsx`
Last updated: 2026-06-21

| Property | Class |
|---|---|
| Overlay | `fixed inset-0 z-60 bg-text-primary/34` |
| Panel | `fixed top-0 right-0 bottom-0 z-61 w-[468px] max-w-[92vw] bg-surface shadow-lg` |
| Header | `border-b border-border px-5 py-5`, `text-lg font-bold` title, 32px explicit close button (same recipe as the small-icon-button entry above) |
| Body | `flex-1 overflow-y-auto px-5.5 py-5.5 gap-5` |
| Footer | `border-t border-border px-5.5 py-3.5 gap-2.5`, buttons **`rounded-sm`** |

**Pattern notes — flagged inconsistency, confirmed deliberate:** every other drawer in this app (Initiative/Project) uses `rounded-pill` footer buttons per `ui-tokens.md`'s generic Drawer recipe, but the Add User drawer's own literal markup in `My Activities.dc.html` (lines ~1221–1222) uses `border-radius:var(--r-sm)` for both Cancel and Add user — confirmed by direct comparison against the Initiative drawer's footer in the same file, which does use `var(--r-pill)`. Followed the concrete mock for this one control, same precedent as the New Task modal's primary-button note above. Width/overlay/shadow still match the standard Drawer recipe exactly.

### Navbar

File: `components/layout/navbar.tsx`
Last updated: 2026-06-22

| Property | Class |
|---|---|
| Header | `sticky top-0 z-40 border-b border-border bg-surface` |
| Inner content row | `mx-auto flex h-16 w-full max-w-360 items-center justify-between px-4 md:px-6` — same `max-w-360` (1440px) as `PageContainer`, so edges always line up; see that entry's Pattern notes for the 1280→1440 history |
| Logo + nav group | `flex items-center gap-[36px]` |
| Nav item (shared) | `rounded-pill px-3.5 py-2 text-sm font-med transition-colors duration-(--duration-base)` |
| Nav item (active) | `text-accent` — color only, no underline, per `ui-rules.md` |
| Nav item (inactive) | `text-text-secondary hover:text-text-primary` |
| Right-side group | `flex items-center gap-3.5` |
| Bell icon button | `relative flex h-10 w-10 cursor-default items-center justify-center rounded-full border border-border bg-surface-subtle text-text-secondary`, `aria-disabled`, non-interactive per `ui-rules.md` |
| Bell badge dot | `absolute right-2.5 top-2.5 h-2 w-2 rounded-full border-2 border-surface bg-warning` |
| Mobile hamburger button | `flex h-10 w-10 items-center justify-center rounded-sm border border-border text-text-primary md:hidden` |
| Mobile menu panel | `absolute left-0 right-0 top-16 z-30 flex flex-col gap-0.5 border-b border-border bg-surface px-4 py-2 shadow-lg md:hidden` |
| Mobile menu item | `rounded-sm px-3.5 py-3 text-[15px] font-med`; active `bg-accent-lightest text-accent`, inactive `text-text-secondary` |

**Pattern notes:** First full capture of this component's pattern — it existed since Feature 01 but was only ever a one-line row in the main component table above, never imprinted in detail. Captured now because the file was touched in Feature 12's page-width follow-up (`max-w-320` → `max-w-360`). Returns `null` on `/login` or when there's no signed-in user (handled in the component itself, not via a wrapper).

### Page container — narrower admin page (superseded)

File: `components/users/users-view.tsx`
Last updated: 2026-06-21

**Superseded — see the "Page container (`<main>`)" entry above.** `/users` originally used 1040px instead of the sitewide 1440px every other page used, matching the literal mock (`My Activities.dc.html` line 1118 sets `max-width:1040px` for this view) — that was a deliberate choice, not an oversight, at the time. Direct developer feedback after seeing it live overrode the mock here: the two widths looked inconsistent next to each other, so all pages (including `/users`) now share one 1280px width via `PageContainer`. Kept this entry for history; don't reintroduce a per-page width variant.

### Toast (action confirmation)

File: `components/shared/toast.tsx`
Last updated: 2026-06-21

| Property | Class |
|---|---|
| Position | `fixed bottom-6.5 left-1/2 z-80 -translate-x-1/2` |
| Background | `bg-text-primary` (ink) — same for both tones, icon is the only thing that changes |
| Shape | `rounded-pill` |
| Padding | `px-4.5 py-2.75` |
| Text | `text-[13.5px] font-med text-white` |
| Icon | `lucide-react`, `size={16}` — `Check`/`text-success` for `tone="success"` (default), `AlertCircle`/`text-danger-cta` for `tone="error"` |
| Shadow | `shadow-lg` |
| Auto-dismiss | not built into the component — caller-managed `setTimeout` (2600ms success / 4500ms error used in `UsersView`) |

**Pattern notes:** One container recipe for both outcomes, icon swap only. Reuse this exact component for every future action-level confirmation (`initiative_created`, `project_created`, etc. once those UIs wire real Server Actions) instead of building a new toast. **Feature 18 (Task Detail field saves):** error-only usage, same as Kanban's drag — routine single-field saves stay silent on success (no "name updated" noise per field), `tone="error"` + revert fires on failure. The one success-tone exception is the delayed auto-flip (saving a `delivery_date` later than `end_date`), since that's a server-decided side effect the user didn't directly request and is worth surfacing once.

### Role / status dot-pill badge (small variant)

File: `components/users/role-badge.tsx`
Last updated: 2026-06-21

| Property | Class |
|---|---|
| Shape | `rounded-pill` |
| Padding | `px-2.75 py-1.25` |
| Text | `text-xs font-semi` |
| Dot | `h-1.5 w-1.5 rounded-full`, color matches the text tone |
| Colors | `admin` → `bg-accent-lightest`/`text-accent`/dot `bg-accent`; `user` → `bg-surface-subtle`/`text-secondary`/dot `bg-text-faint` |

**Pattern notes:** Same dot+pill family as `StatusBadge`, but a separate component (slightly larger padding, `font-semi` not `font-med`) since `Role` isn't part of `StatusBadge`'s status union and the mock sizes it a notch bigger. Don't merge the two — keep this recipe distinct rather than overloading `StatusBadge`'s prop type.

### Data table row (non-interactive, admin tables)

File: `components/users/user-table.tsx`
Last updated: 2026-06-21

| Property | Class |
|---|---|
| Container | `overflow-hidden rounded-lg border border-border bg-surface shadow-xs` (same Card recipe as the top-level panel pattern above) |
| Header row | `bg-surface-subtle border-b border-border`; cells `text-[11px] font-bold uppercase tracking-wide text-text-faint` |
| Body row | `border-b border-border last:border-b-0` — **no hover, no left-border accent** |
| Columns | explicit `grid-cols-[1.7fr_1.7fr_150px_44px]` arbitrary template, not Tailwind's named `grid-cols-N` scale |

**Pattern notes:** Deliberately the opposite of the "Clickable list row" pattern above — this table has no detail view, per `ui-rules.md`'s explicit "no row click-through" rule for User Management. Don't add `hover:bg-surface-subtle` here by habit; only give a future admin table row hover/click affordance if it actually navigates somewhere (e.g. a future Initiatives/Projects table view, if one is ever added instead of the current card grid).

### Filter-chip bar + search box (card-grid pages)

File: `components/initiatives/initiatives-view.tsx`
Last updated: 2026-06-21

| Property | Class |
|---|---|
| Chip (inactive) | `rounded-pill border border-border bg-surface px-3.5 py-2 text-[13.5px] font-semi text-text-secondary` |
| Chip (active) | `border-accent bg-accent text-white` (same shape/padding, just the on-state colors) |
| Count bubble | `rounded-pill px-1.5 text-[11.5px] font-bold`, `h-4.75 min-w-5` — `bg-surface-inset text-text-secondary` inactive, `bg-white/22 text-white` when the parent chip is active |
| Search box | `rounded-pill border border-border bg-surface px-3.5 py-2`, fixed `w-67.5` (270px), `ml-auto` to push right of the chip row |
| Search input | borderless/transparent, `text-[13.5px]`, paired with a `lucide-react` `Search` icon (`size={16}`, `text-text-faint`) |

**Pattern notes:** First used on `/initiatives`; reuse verbatim for `/projects` (`build-plan.md` Feature 09 documents the identical All/Active/Inactive-chip + search structure). Keep the bare 3-chip set (All/Active/Inactive) — don't add more filter dimensions to this bar; a richer filter need belongs in a separate control, not more chips.

### Card grid (Initiative/Project card-per-record pages)

File: `components/initiatives/initiative-card.tsx`, `components/initiatives/initiatives-view.tsx`
Last updated: 2026-06-21

| Property | Class |
|---|---|
| Grid | `grid grid-cols-[repeat(auto-fill,minmax(330px,1fr))] gap-4.5` |
| Card | `relative flex h-62 flex-col overflow-hidden rounded-lg border bg-surface p-4.5 pb-3.75` — `border-border shadow-xs` normal, `border-accent shadow-[0_0_0_3px_rgba(32,112,225,.18)]` when freshly saved (`highlighted` prop, cleared after ~2.8s), `opacity-82` whole-card when the record's status is inactive |
| Risk-accent top stripe | `absolute top-0 right-0 left-0 h-[3px]`, `background: linear-gradient(90deg, var(--color-danger-cta), var(--color-warning))` when active-and-at-risk, else `transparent` — inline `style`, not a class, since it's a gradient |
| Status dot | `h-2 w-2 rounded-full`, `bg-success-dark` active / `bg-text-faint` inactive |
| Category pill | `rounded-pill bg-accent-lightest px-2.25 py-0.5 text-[11px] font-semi text-accent`, `max-w-32.5` with ellipsis truncation |
| "⋯" menu trigger | `flex h-[28px] w-[28px] items-center justify-center rounded-sm text-text-faint hover:bg-surface-subtle`, `lucide-react` `MoreVertical` `size={18}` — **the entire trigger is omitted from the DOM** (not just disabled) when the signed-in user has neither edit nor delete permission on the record |
| "⋯" menu panel | `absolute top-[32px] right-0 z-49 w-42 rounded-md border border-border bg-surface p-1.25 shadow-lg`; rows `rounded-sm px-2.5 py-2 text-[13.5px] hover:bg-surface-subtle`; destructive row swaps to `text-danger-cta hover:bg-danger-light`; one `h-px bg-border` divider before the destructive row — **Edit/Set-active-inactive rows and the divider+Delete row are each independently gated** (`canEdit` / `canDelete`), so a user with only one of the two permissions still gets a menu with just that one action and no orphaned divider |
| Name | `line-clamp-2 min-h-11.5 text-[17px] font-bold leading-snug tracking-tight` |
| One-line description (goal) | `h-4.5 overflow-hidden text-ellipsis whitespace-nowrap text-[13px] text-text-faint` |
| Stacked progress bar | track `h-1.75 rounded-pill bg-surface-inset overflow-hidden flex`; one `<span>` per segment, inline `style={{ width, background }}` since segment colors are data-driven, not a fixed token set. Segment color key lives in `components/initiatives/types.ts`'s `SEGMENT_COLORS` (5 buckets: `done` → `var(--color-success-dark)`, `in_progress` → `var(--color-accent-bright)`, `blocked` → `var(--color-danger-cta)`, `delayed` → `var(--color-warning)`, `to_do` → `var(--color-border)`) |
| Footer | `mt-auto border-t border-border pt-3.25`; owner avatar is the same 24px `bg-accent-lightest`/`text-accent` initials-circle recipe used everywhere else (`OwnerPicker`, `RoleBadge`'s family); "Updated …" right-aligned via `ml-auto`, `text-[11.5px] text-text-faint` |

**Pattern notes:** Menu's three actions are exactly Edit / Set active-inactive / Delete — the design mock (`My Activities.dc.html`) also shows a "Duplicate" item here, deliberately dropped per `ui-rules.md`'s explicit "never show Duplicate" rule. The `highlighted` ring + the menu's `z-48`/`z-49` stacking match the literal mock (`highlightInitId` / `initMenuId` in the prototype's own JS) rather than being invented. Reuse this whole card recipe verbatim for Projects (Feature 09) — same fields apply (name, status, category, owner, progress) minus nothing; Projects' "goal" line and category pill should follow this exact pattern. **Feature 08:** the permission-gated-menu pattern (compute `canEdit`/`canDelete` via `lib/permissions.ts` in the parent view, pass down as props, omit the trigger entirely when both are false) is the precedent Projects/Tasks cards should follow once their own records become creator/owner-scoped — don't invent a different gating mechanism per entity. **Feature 08 follow-up fix:** `to_do`'s segment color (`var(--color-border)`, `#DCE3ED`) is deliberately near-identical to the track's `bg-surface-inset` (`#EEF2F8`) so an un-started task reads as "empty" — but that only looks right if a `to_do`-bucketed task actually has `progress = 0`. `lib/initiative-rollups.ts`'s `segmentBucketFor()` therefore buckets `to_do` vs `in_progress` by `progress > 0`, not the literal `status` string (a task can be `status='to_do'` with real progress entered, which must render as the visible `in_progress` color or the bar looks empty at a high `progressPct`); `blocked`/`delayed`/`done` are still taken verbatim from `status` regardless of progress. Any future progress-bar-style visualization bucketing by task status (Dashboard's status breakdown chart, a Project-level bar, etc.) should follow this same progress-aware rule, not pure status-count. **Feature 09:** reused verbatim for `ProjectCard` as anticipated — only the category-pill swap (folder icon + initiative name) differed. **Feature 10:** the "⋯" menu's permission gating now applies to `ProjectCard` too, via the new `canEditProject`/`canDeleteProject` in `lib/permissions.ts` — same gating mechanism, no divergence.

### Drawer with inline tag-pill picker (Goal + Category fields)

File: `components/initiatives/initiative-drawer.tsx`
Last updated: 2026-06-21

| Property | Class |
|---|---|
| Drawer shell | same 468px right-side recipe as `AddUserDrawer` (`fixed`, `z-60`/`z-61`, `w-[468px] max-w-[92vw]`) — **but footer buttons are `rounded-pill`**, the sitewide default; `AddUserDrawer`'s `rounded-sm` remains the one documented exception, not a precedent to copy here |
| Textarea (Goal) | `w-full resize-y rounded-md border border-border px-3.25 py-2.75 text-sm leading-body` — `rounded-md` not `rounded-sm`, matching the existing New Task modal's textarea convention |
| Pill picker (Category) | unselected: `rounded-pill border border-border bg-surface px-3.25 py-1.5 text-[12.5px] font-semi text-text-secondary`; selected: `border-accent bg-accent-lightest text-accent` |
| Inline "add new" trigger | dashed pill: `rounded-pill border border-dashed border-border px-3 py-1.5 text-text-secondary`, leading `Plus` icon `size={13}` |
| Inline "add new" input state | solid-border pill wrapping a borderless input + a small circular confirm button (`h-[24px] w-[24px] rounded-full bg-accent text-white`) |
| Status toggle (2-option) | `rounded-pill border px-5 py-2 text-[13px] font-semi`; selected "active"-style option → `bg-accent`, selected "inactive"-style option → `bg-text-secondary` (both `text-white`); unselected → `border-border bg-surface text-text-secondary` |

**Pattern notes:** The inline category add-button pushes the new value into the *shared* category pool (not just this one record), mirroring the literal mock's `addCategory()` — so the next drawer open already offers it as a pill. The similar-name warning only evaluates in create mode (mirrors the mock's `!isEdit` guard) — don't show it while editing an existing record's own name. **Correction (Feature 09 planning):** this note previously said Projects have no Goal/Category-equivalent field at all — that was wrong. The literal Project mock has a "Description" textarea (same free-text-outcome concept as Initiatives' Goal, schema column named `description` not `goal` to match the visible UI label) — reuse the Textarea recipe above for it. Only the Category pill-picker is Initiative-specific and doesn't carry over; Projects get a plain `<select>` for their required Initiative field instead.

### Segmented view toggle (Kanban/Gantt)

File: `components/tasks/tasks-view.tsx`
Last updated: 2026-06-22

| Property | Class |
|---|---|
| Container | `inline-flex gap-[3px] rounded-pill bg-surface-inset p-[3px]` |
| Tab (active) | `bg-surface text-accent shadow-xs` |
| Tab (inactive) | `bg-transparent text-text-secondary` |
| Tab (shared) | `inline-flex items-center gap-[7px] rounded-pill px-[15px] py-[7px] text-[13px] font-semi` |
| Icon | `lucide-react`, `size={15}` — `Kanban`/`GanttChart`, exact name matches in the installed package, no improvised SVG needed |

**Pattern notes:** Distinct from both the filter-chip recipe (`border-accent bg-accent` active state, used on Initiatives/Projects' All/Active/Inactive chips) and the drawer status-toggle recipe (solid `bg-accent`/`bg-text-secondary` per option) — this is a third toggle family: a neutral track with a white "selected tab" surface, taken verbatim from the mock since no generic token recipe covers it. Reuse this exact recipe for any future two-or-more-option view switcher; don't reach for the filter-chip or status-toggle recipes instead.

### Owner picker (search + suggested + full list)

File: `components/shared/owner-picker.tsx`
Last updated: 2026-06-21

| Property | Class |
|---|---|
| Trigger button | `flex items-center gap-2.25 rounded-sm border border-border bg-surface px-2.75 py-1.75`, 24px initials avatar + name + trailing `ChevronDown` |
| Dropdown panel | `absolute top-[calc(100%+6px)] right-0 left-0 z-63 max-h-75 rounded-md border border-border bg-surface p-2.25 shadow-lg`; click-outside-to-close via a `fixed inset-0 z-62` scrim underneath it |
| Search row | `rounded-sm border border-border px-2.5 py-1.75`, leading `Search` icon `size={15}` |
| "Suggested" pills | `rounded-pill border py-1 pr-2.75 pl-1.25 text-xs font-semi`; current user always listed first, suffixed `(me)` |
| Full list row | `rounded-sm px-2.25 py-1.75 text-[13.5px] hover:bg-surface-subtle`, selected row gets `bg-accent-lightest` + a trailing `Check` icon |

**Pattern notes:** Lives in `components/shared/` (not `components/initiatives/`) specifically so Project and Task drawers can import it once they need an owner field — don't duplicate this dropdown per-feature. **Feature 08:** upgraded from a plain `string` name to a real `{id, name}[]` options list with `value`/`onChange` operating on `profiles.id` (`currentUserId` replaces `currentUserName`) — Projects/Tasks drawers can import and use it exactly as-is, no further prop-shape changes anticipated. **Feature 25:** that anticipated reuse landed — `NewTaskModal` now renders this component verbatim for its new Owner field (default-to-self, freely reassignable), zero changes to `owner-picker.tsx` itself. Fourth call site overall, alongside `InitiativeDrawer`/`ProjectDrawer`/`DetailsPanel`.

### Kanban column

File: `components/tasks/kanban-board.tsx`
Last updated: 2026-06-22

| Property | Class |
|---|---|
| Container | `flex min-h-30 min-w-65 flex-1 flex-col gap-2.5 rounded-md border border-border bg-surface-subtle p-2.75` — `min-h-30` (120px) deliberately matches the literal mock's `min-height:120px` even though it's a bare integer ≥10, so it's unaffected by this project's 5–9 spacing-token collision gotcha |
| Header row | `flex items-center gap-2 px-1 py-0.5` |
| Status dot | `h-2 w-2 rounded-full` + the column's status-accent `dot` class (see Status accent map below) |
| Title | `text-[12.5px] font-bold text-text-primary` |
| Count badge | `ml-auto flex h-[19px] min-w-5 items-center justify-center rounded-pill border border-border bg-surface px-1.5 text-[11px] font-bold text-text-secondary` |
| Empty placeholder ("Drop here") | `rounded-sm border border-dashed border-border py-3.5 text-center text-xs text-text-faint` — per-column only, distinct from the sitewide `EmptyState` component |

**Pattern notes:** Exactly 5 fixed columns (To Do/In Progress/Blocked/Delayed/Done), never reordered, per `ui-rules.md`. Native HTML5 drag-and-drop only (`draggable`/`onDragStart`/`onDragOver`/`onDrop`) — no DnD library. Column-to-column drag only: dropping changes the task's status (lifted to the parent via `onDropTask`) and the column re-sorts by due date; there's no manual within-column position reordering, matching the literal mock's own behavior exactly. Dropping back into the same column is a no-op.

### Kanban card

File: `components/tasks/kanban-card.tsx`
Last updated: 2026-06-22

| Property | Class |
|---|---|
| Container | `cursor-pointer rounded-md border border-border border-l-4 bg-surface p-[11px] shadow-xs hover:shadow-sm` + the status-accent `border` class — **4px left border**, per `ui-tokens.md`'s documented "Kanban Card" recipe, overriding the literal mock's one-off 3px (same override precedent as the Tasks page h1) |
| Name row | `flex items-start gap-1.5`; name `flex-1 text-[13px] font-semi leading-snug text-text-primary`; flag icon (`lucide-react` `Flag`, `size={13}`) `mt-0.5 flex-none fill-warning text-warning`, shown only when `followUp` |
| Project line | `mt-1 truncate text-[11.5px] text-text-faint` |
| Blocked-reason line | `mt-1.75 flex items-center gap-1.25 text-[11px] font-semi text-danger-cta` + `AlertCircle` `size={11}`, shown only when `blockedReason` is set (not status-gated — a `delayed` task can carry one too, matching `TaskRow`'s precedent of treating `blockedReason` as an independent field) |
| Progress bar | track `my-2.25 h-[5px] overflow-hidden rounded-pill bg-surface-inset`; fill `block h-full` + the status-accent `fill` class, `style={{ width: progress+'%' }}` — status-colored fill (not the CTA-gradient bar `TaskRow` uses), since this is the one component the literal mock spec's status-color fill for |
| Footer row | `flex items-center gap-1.75`; owner avatar `flex h-[21px] w-[21px] flex-none items-center justify-center rounded-full bg-accent-lightest text-[9px] font-bold text-accent` (same initials-circle family as `OwnerPicker`/card footers, just smaller); due date `ml-auto text-[11px] font-med`, `text-danger-cta` when overdue (`status !== "done"` and past due) else `text-text-faint` |

**Status accent map** (`STATUS_ACCENT` in `components/tasks/types.ts`) — single source of truth for the column dot, card left-border, and progress fill, all three driven by the same per-status entry:

| Status | Token suffix | Classes |
|---|---|---|
| `to_do` | `text-secondary` | `border-l-text-secondary` / `bg-text-secondary` |
| `in_progress` | `accent` | `border-l-accent` / `bg-accent` |
| `blocked` | `danger-cta` | `border-l-danger-cta` / `bg-danger-cta` |
| `delayed` | `warning` | `border-l-warning` / `bg-warning` |
| `done` | `success-dark` | `border-l-success-dark` / `bg-success-dark` |

**Pattern notes:** Reuses `StatusBadge`'s exact tone palette rather than the literal mock's one-off hex values (e.g. mock's `to_do` dot is `#9DB0BD`, not an existing token — mapped to `text-secondary` instead, the same tone `StatusBadge` already uses for `to_do`). **Gotcha avoided:** the map stores full literal class strings (`border-l-text-secondary`, not a bare suffix interpolated into `border-l-${suffix}`) — Tailwind's scanner needs the complete class name to appear as a literal substring somewhere in source, so a split/interpolated class silently fails to generate any CSS. Same convention as `StatusBadge`'s `TONE` map. Click on a card fires `task_clicked` (existing locked PostHog event, second call site alongside `TaskRow`'s) and navigates to `/tasks/[id]` (real page since Feature 17).

### Project filter (pill select)

File: `components/tasks/tasks-view.tsx`
Last updated: 2026-06-22

| Property | Class |
|---|---|
| Label | `text-xs font-semi text-text-faint` ("Project") |
| Select | `min-w-50 cursor-pointer appearance-none rounded-pill border border-border bg-surface px-3.5 py-2.25 pr-9 text-[13.5px] font-semi text-text-primary` |
| Chevron overlay | `lucide-react` `ChevronDown`, `size={16}`, `pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-text-faint` |

**Pattern notes:** Plain native `<select>` styled as a pill (not a rich searchable picker like `OwnerPicker`) — same reasoning as `ProjectDrawer`'s Initiative field: the list is short with no search/suggested concept needed. Lists every project regardless of status (unlike the "+ New task" modal's own project picker, which is active-only) — mirrors the literal mock's own split between its unfiltered `taskProjectFilterOptions` and its active-only `taskProjectOptions`. Not the same recipe as the "Project picker with Initiative pill" below — this one is a `rounded-pill` filter control, not a form field.

### Project picker with Initiative pill (select + chevron + pill)

Files: `components/shared/new-task-modal.tsx` (original), `components/task-detail/details-panel.tsx` (second consumer, 2026-06-25)
Last updated: 2026-06-25

| Property | Class |
|---|---|
| Label | `mb-1.5 block text-[11.5px] font-bold uppercase tracking-wide text-text-faint` (modal) / `mb-2 text-xs font-bold uppercase tracking-wide text-text-faint` (Details panel — matches that panel's own section-label recipe instead) |
| Select | `w-full cursor-pointer appearance-none rounded-sm border border-border bg-surface px-3 py-2.5 pr-9.5 text-sm text-text-primary` |
| Chevron overlay | `lucide-react` `ChevronDown`, `size={16}`, `pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-text-faint` |
| Initiative pill (shown once a project is selected) | wrapper `mt-2 inline-flex items-center gap-1.5 text-xs text-text-secondary`; "Initiative" label `text-[11px] font-semi uppercase tracking-wide text-text-faint`; pill itself `inline-flex items-center gap-1 rounded-pill bg-accent-lightest px-2.5 py-0.5 text-xs font-semi text-accent` |

**Pattern notes:** `rounded-sm` border select (a form field), not the `rounded-pill` filter-control recipe above — don't conflate the two. Both consumers need a `ProjectOption` (`{id, name, initiativeName}`, exported from `new-task-modal.tsx`) to render the pill. **Scope differs by intent, not by accident**: the New Task modal's list is active-projects-only (you wouldn't create a task under a dead project), while `DetailsPanel`'s reassign field lists every project regardless of status (the task's *current* project must always be a valid, selectable option even if it's since gone inactive — an active-only list would silently break the controlled `<select>`'s value the moment that happened). `DetailsPanel`'s instance saves immediately on change via `updateTaskProject` (silent — no `activities` row, no migration, same precedent as the panel's name/date/blocker-owner fields) rather than staying as an uncommitted form value like the modal's own copy.

### Gantt legend row

File: `components/tasks/gantt-chart.tsx`
Last updated: 2026-06-22

| Property | Class |
|---|---|
| Container | `mb-3.5 flex flex-wrap items-center gap-4 text-[12.5px] text-text-secondary` |
| Color-bucket item | `flex items-center gap-1.5` wrapping a `h-2 w-2 rounded-full` dot + label |
| Delivered marker swatch | `h-[8px] w-[8px] rotate-45 bg-text-primary` (same diamond shape used on the bar itself) |
| Past-plan (hatch) swatch | `h-2.5 w-3.5`, inline `style` `repeating-linear-gradient(45deg, color-mix(in srgb, var(--color-warning) 50%, transparent) 0 3px, transparent 3px 6px)` |
| Today swatch | `h-3 w-px bg-accent-bright` |

**Pattern notes:** 5 color-bucket dots (on time/delayed/at risk/in progress/to do) plus 3 marker swatches (diamond/hatch/line), one flat row, no grouping — matches the design mock's single-line legend. `color-mix(in srgb, ...)` is used wherever a token color needs partial opacity inside an inline `style` (Tailwind's `/NN` opacity modifier only works on `class` names, not raw CSS custom properties referenced via `var()`).

### Gantt chart table (axis + today-line + rows)

File: `components/tasks/gantt-chart.tsx`
Last updated: 2026-06-25

| Property | Class |
|---|---|
| Outer scroll container | `overflow-x-auto rounded-lg border border-border bg-surface shadow-xs` (same Card recipe as every other top-level panel) |
| Today line | `pointer-events-none absolute top-0 bottom-0 z-10 w-px bg-accent-bright` — positioned via inline `left`, spans the full table by living in the same `relative` wrapper as the header + all rows (height comes from that wrapper's normal-flow content, not an explicit value) |
| Month grid line | `pointer-events-none absolute border-l border-border`, inline `left: LABEL_WIDTH + seg.left`, `top: 42, bottom: 0` — one per month segment, rendered as a sibling before the header so it paints behind the bars; runs the full height of the body only (`top: 42` skips the header strip, which already draws its own divider via the month-segment cell's `border-l`) |
| Header row | `flex border-b border-border bg-surface-subtle`, fixed `height: 42` (inline) |
| Header "Task" label | `sticky left-0 z-20 shrink-0 border-r border-border bg-surface-subtle px-4 text-[11px] font-bold uppercase tracking-wide text-text-faint flex items-center` — frozen column, see Pattern notes |
| Month segment | `absolute top-0 flex items-center border-l border-border px-2.5 text-xs font-med text-text-faint`, `left`/`width`/`height` all inline (computed from day offsets) |
| Scale | `PX_PER_DAY = 20`, `LABEL_WIDTH = 260` (both named constants in `gantt-chart.tsx`, not tokens — this is a generated/computed layout, not a fixed design recipe) |

**Pattern notes:** Month-header cells and the today-line are absolutely positioned inside a `relative` parent that has **no explicit height of its own** — its height comes entirely from its in-flow children (header + rows), which is what lets `top-0 bottom-0` on the today-line stretch correctly without a magic number. Forgetting to give the header row itself an explicit `height` (rather than relying on padding) silently collapses its absolutely-positioned month-segment children to zero height — hit and fixed during this feature's own Playwright verification pass, not a hypothetical.

**Frozen "Task" column (2026-06-25):** both the header's and each row's label cell are `sticky left-0` within the same `overflow-x-auto` container — no separate scroll container needed, since `position: sticky` pins relative to the nearest scrolling ancestor through any number of non-scrolling parents in between. Requires an explicit opaque background (`bg-surface-subtle` header / `bg-surface` row, with `group-hover:bg-surface-subtle` on the row label so hover still reads as one piece) and `z-20` — higher than the today-line's `z-10` — so the frozen column visually masks bars/grid-lines/today-line scrolling underneath it instead of showing them bleed through. Verified by diffing the header's "Task" label bounding box before vs. after scrolling the container 400px in a throwaway Playwright check: identical pixel position both times.

**Scroll-to-today on load (2026-06-25):** `GanttChart` now `"use client"`, holding a `scrollRef` on the `overflow-x-auto` container plus a `hasScrolledToToday` ref guard. A `useEffect` keyed on `todayLeft` runs once per mount and sets `scrollRef.current.scrollTo({ left: Math.max(todayLeft - TODAY_LEAD_IN_DAYS * PX_PER_DAY, 0) })` (`TODAY_LEAD_IN_DAYS = 7`, a named constant alongside `PX_PER_DAY`/`LABEL_WIDTH`) — previously the container's native default (`scrollLeft: 0`) left the view stranded at `rangeStart`, i.e. the oldest task's date, which could be months or years in the past. The ref guard (not an empty dependency array) keeps `eslint-plugin-react-hooks`'s exhaustive-deps rule satisfied while still only auto-scrolling once per mount — a later `todayLeft` recompute (e.g. the Project filter narrowing `tasks` and shifting `rangeStart`) does not yank the user's own subsequent scroll position back to today. Verified live via Playwright against a throwaway task set spanning a 2-year-old "done" task out to a future "to do" task: `scrollLeft` landed exactly at `todayLeft - 140`, putting the today-line just past the frozen label column with a week of past context still visible, while the underlying timeline itself still spans the full multi-year range (see the data-volume note in `progress-tracker.md`'s Post-Launch Changes section — this is a view-position fix only, not a query/payload-size fix).

### Gantt row + bar

File: `components/tasks/gantt-row.tsx`
Last updated: 2026-06-25

| Property | Class |
|---|---|
| Row container | `group flex cursor-pointer border-b border-border last:border-b-0 hover:bg-surface-subtle` — whole row is a click target (`onClick` → `task_clicked` → `/tasks/[id]`), same affordance family as `KanbanCard`'s container and the generic "Clickable list row" pattern above |
| Label cell | `sticky left-0 z-20 shrink-0 border-r border-border bg-surface px-4 py-3.5 group-hover:bg-surface-subtle`, width inline (`LABEL_WIDTH`) — frozen on horizontal scroll, see `GanttChart`'s Pattern notes above |
| Task name | `truncate text-[13.5px] font-semi text-text-primary` |
| Health label + project line | `mt-0.75 flex items-center gap-1.25 text-[11.5px]` — label `font-semi {bucket text color}`, project `truncate text-text-faint` prefixed with "· " |
| Bar track cell | `relative shrink-0`, `height: 56` (inline) |
| Bar segment (solid) | `absolute top-[18px] rounded-pill {fill}`, `height: 10` — fill is **always** `bg-success-dark` up to wherever a tail begins, never the bucket's own accent color when that bucket is "delayed" (see Gotcha below) |
| Hatch tail (delayed overrun) | same `rounded-pill` box, inline `background: repeating-linear-gradient(45deg, color-mix(in srgb, var(--color-warning) 40%, transparent) 0 4px, transparent 4px 8px)` |
| Dashed tail (early delivery) | same box, inline `border: 1.5px dashed var(--color-success-dark)` (unfilled — outline only) |
| "+Nd" late badge | `absolute -top-[2px] text-[10.5px] font-bold text-warning`, shown only over the hatch tail |
| Delivery diamond | `absolute top-1/2 h-[8px] w-[8px] -translate-y-1/2 rotate-45 bg-text-primary` — always ink-colored, never bucket-colored |
| Date captions | `absolute top-[31px] text-[11px] text-text-faint` (start, left-aligned at the bar's start) and the same class plus `-translate-x-full` (end, right-aligned at the bar's end) |
| "Delivered {date}" caption | `absolute top-[44px] text-[11px] font-med text-warning`, shown only for the delayed bucket |

**Schedule-health bucket → color** (`GANTT_BUCKET_ACCENT` in `components/tasks/types.ts`, looked up via `gantt-helpers.ts`'s `computeGanttRowVisual`) — a deliberate departure from the literal design mock's colors, confirmed via `/architect` before building:

| Bucket | Fill/dot/text | When |
|---|---|---|
| `on_time` | `success-dark` | Delivered on/before `end_date`, or `done` with no delivery date |
| `in_progress` | `accent` | `status = in_progress`, not past `end_date` |
| `to_do` | `text-secondary` | `status = to_do`, not past `end_date` |
| `at_risk` | `danger-cta` | `status = blocked` (any time), or undelivered + past `end_date` ("Overdue") |
| `delayed` | `warning` | Delivered later than `end_date` — but only the **hatch tail** is amber; the solid portion is always `success-dark` |

**Pattern notes:** This is a *schedule-health* mapping, not the Kanban `STATUS_ACCENT` map — same task can be `accent`-blue on the Kanban board and `danger-cta`-red on the Gantt chart if it's overdue. The literal design mock rendered "Overdue" in orange and "Delayed Nd" in pink/crimson; both were overridden to keep "Delayed" reading as amber (consistent with the Kanban Delayed-status badge, per the standing Feature-12 decision that Delayed must stay visually distinct from Blocked "across Kanban/Gantt later") and to give "Overdue" its own real color (`danger-cta`, shared with Blocked, both meaning "actively at risk right now") rather than colliding with Delayed's amber. **Real bug caught during this feature's own Playwright verification:** the first draft applied the bucket's own accent color to the *entire* solid bar segment, which made a "Delayed" row's pre-deadline portion render amber instead of green — fixed by hardcoding the solid segment to `success-dark` whenever `bucket === "delayed"`, since only the hatch tail past `end_date` should read amber. **Realtime gap, not yet relevant:** the existing `tasks` realtime payload (Feature 14's trigger) does not carry `start_date`/`delivery_date` — harmless today since Gantt still renders its own separate mock fixtures, but Feature 16 (wiring Gantt to the real `tasks` state) must either extend that trigger/payload or it will silently null out a task's Gantt-only date fields on its very next Kanban-triggered realtime echo.

### Status pill selector group (Task Detail)

File: `components/task-detail/details-panel.tsx`
Last updated: 2026-06-23

| Property | Class |
|---|---|
| Container | `flex flex-wrap gap-1.5` |
| Pill (shared) | `rounded-pill border px-3 py-1.5 text-[12.5px] font-semi transition-colors duration-(--duration-base)` |
| Pill (unselected) | `border-border bg-surface text-text-secondary` |
| Pill (selected) | per-status `border`/`bg`/`fg` from `STATUS_PILL_TONE` (`components/task-detail/types.ts`) |

**`STATUS_PILL_TONE`** — selected-state colors, one entry per `TaskStatus`, deliberately mirroring `ui-tokens.md`'s Status Badges (Tasks) bg/text pairs exactly (not invented):

| Status | Selected classes |
|---|---|
| `to_do` | `border-border-strong bg-surface-subtle text-text-secondary` |
| `in_progress` | `border-accent bg-accent-light text-accent` |
| `blocked` | `border-danger-cta bg-danger-light text-danger-cta` |
| `delayed` | `border-warning bg-warning-light text-warning` |
| `done` | `border-success-dark bg-success-light text-success-dark` |

**Pattern notes:** A new component shape — distinct from `StatusBadge` (read-only pill, no border) and from the segmented view-toggle (only 2 options, single active surface). One button per `TaskStatus`, order taken from the existing `STATUS_COLUMNS` list (`components/tasks/types.ts`) rather than a new duplicate list. Clicking any pill sets `status` directly — this is the *only* status-change control on Task Detail (no separate dropdown). Reuse this exact recipe for any future "pick one of N statuses" control; don't reach for the segmented-toggle or filter-chip recipes instead.

### Progress slider with locked state

File: `components/task-detail/details-panel.tsx`

| Property | Class |
|---|---|
| Track + thumb | native `<input type="range">`, `flex-1 accent-accent disabled:cursor-not-allowed` |
| Percentage label | `min-w-9 text-right text-[13px] tabular-nums text-text-secondary` |
| Locked note | `mt-1.5 flex items-center gap-1.25 text-[11.5px] text-text-faint` + `lucide-react` `Lock` `size={12}` |

**Pattern notes:** Locked (`disabled`, value forced to 100, note shown) whenever `status === 'done'` — a derived render, not a separate mock fixture or a persisted flag. `accent-accent` (Tailwind's native-control accent-color utility) is the only way to theme a range input's thumb/track without a fully custom slider component; matches the project's accent token without hardcoding a hex value into the native control.

### Details rail (sticky)

File: `components/task-detail/details-panel.tsx`

| Property | Class |
|---|---|
| Container | `sticky top-22 rounded-lg border border-border bg-surface p-5 shadow-xs` |
| Section label | `mb-2 text-xs font-bold uppercase tracking-wide text-text-faint` |

**Pattern notes:** Same Card recipe (`border-border`, `shadow-xs`, `rounded-lg`) as every other top-level panel, plus `sticky top-22` so the panel stays in view while the (potentially longer) Activity column scrolls — first use of `sticky` positioning in this app. The Blocker sub-panel (`bg-danger-light`, shown only when `status === 'blocked'`) holds a single free-text field for `blocker_owner` — the literal design mock showed two fields here, but schema and `project-overview.md` both spec only one; followed the written spec, same precedent as the Initiative/Project goal-vs-description resolutions.

### Activity timeline (Task Detail)

File: `components/task-detail/activity-timeline.tsx`
Last updated: 2026-06-23

| Property | Class |
|---|---|
| All-activity/Notes filter | reuses the segmented view-toggle recipe verbatim (see that entry above) — same neutral-track/white-active-tab family, not a new pattern. Defaults to **Notes**, not All activity (developer request, post-Feature-19) — system events are still one click away via the same toggle. |
| Compose box | `flex gap-3.25 rounded-lg border border-border bg-surface p-4 shadow-xs` (Card recipe), avatar `[background:var(--gradient-logo-mark-linear)]` |
| Decorative compose icons | `@mention`/attach buttons render `disabled`, `cursor-not-allowed` — same "rendered but inert" precedent as the navbar's static bell icon, since both @mentions and attachments are explicit Out-of-Scope-v1 features |
| Pinned card | `rounded-md border border-warning-light bg-warning-light/40 p-3.25` |
| Timeline connector | `absolute top-2 bottom-2 left-[17px] w-px bg-border`, sits behind 36px (`h-9 w-9`) avatar/icon circles which each carry `shadow-[0_0_0_4px_var(--color-surface)]` to punch a clean ring through the line |
| Note card | `rounded-md border border-border bg-surface p-3.75 shadow-xs`; pin/edit/delete icon buttons are `h-[28px] w-[28px] rounded-sm` (same family as the 32px small-icon-button recipe, one size down) |
| Auto-event row | no card — bare `flex items-center gap-2 py-2`; icon circle colored per `ActivityKind` via `AUTO_EVENT_ICON` (kind-specific bg/fg, e.g. `completed` → `bg-success-light`/`text-success-dark`); text rendered as `**{whoName}:** {text}`, a colon separator rather than the literal mock's bare "{who} {sentence}" concatenation, since this project's real stored `activities.text` (e.g. "Status changed from To Do to Blocked") doesn't read as a grammatical continuation of a name the way the mock's authored copy did |

**Pattern notes:** Pinned notes render in **both** the Pinned section and their normal chronological position in the main timeline (not removed from the main list) — matches the literal mock's two independent, non-exclusive loops. The Notes-only filter only narrows the main timeline; the Pinned section always shows all pinned notes regardless of filter, since `pinned` can only ever be true on a `note`-kind row (system rows have no UPDATE policy at all, so they can never be marked pinned). **Feature 19:** notes are real `activities` rows end to end — `mock-notes.ts` is gone, and the component itself needed zero changes (it always just rendered whatever `entries`/`onAddNote`/etc. it was given; only `TaskDetailView`'s handlers changed from local-state mutation to real Server Action calls). Edit/Delete icon buttons render only when `entry.whoId === currentUserId` (author-only, client-side gate matching the DB's own author-only enforcement); the Pin button has no such gate, matching the DB trigger that lets any signed-in user flip `pinned` on someone else's note.

**Post-Feature-19 fixes, caught by the developer from a live screenshot:**
- **Avatar/icon circles rendered nearly 3x oversized.** All three `h-9 w-9` circles in this file (compose-box avatar, note-card avatar, auto-event icon) hit this project's documented bare-5–9-spacing-token collision (`--spacing-9` is redefined to 96px, not Tailwind's default 36px) — the same bug class first caught on the My Activities row actions and New Task modal close button. Fixed to explicit `h-[36px] w-[36px]`, matching this section's own table above which already documented the *intended* size as "36px." Same fix applied to `details-panel.tsx`'s progress-percentage `min-w-9` (→ `min-w-[36px]`) and, since it's the identical bug, to the pre-existing `initiative-card.tsx`/`project-card.tsx` progress-percentage labels too.
- **Activity column took up too much width on a wide viewport.** The design mock pairs its `352px 1fr` two-column grid with a 1280px-capped page; this app's page width was bumped sitewide to 1440px back in Feature 12 (Kanban-overflow fix), so the same `1fr` track inherited ~150px of extra width that the mock never rendered with. Fixed by wrapping `ActivityTimeline` in a `max-w-[820px]` div inside the grid track (`task-detail-view.tsx`) — comment/timeline reading width now stays fixed regardless of viewport; any leftover grid-track width just sits as right-side whitespace in the column rather than stretching note cards edge to edge.

### Owner avatar + name (admin "All owners" view only)

File: `components/my-activities/task-row.tsx`, `components/my-activities/completed-timeline.tsx`
Last updated: 2026-06-23

| Property | Class |
|---|---|
| Background (avatar circle) | `bg-accent-lightest` |
| Border | none |
| Border radius | `rounded-full` |
| Text — initials | `text-accent`, `font-bold`, `text-[10.5px]` (task row) / `text-[10px]` (completed-timeline chip) |
| Text — name | `text-text-secondary`, `text-[13px]` (task row) / `text-xs` (completed-timeline chip) |
| Spacing | avatar+name `gap-2` (task row) / `gap-1.75` (chip); task row's whole owner column is a fixed `w-32.5` flex-none slot between the due-date column and the quick-action buttons |
| Hover state | none — static display, not interactive |
| Shadow | none |
| Accent usage | `bg-accent-lightest` + `text-accent` initials-circle recipe |

**Pattern notes:** Both call sites take a `showOwner: boolean` prop and render nothing at all when false (never a collapsed/hidden column) — My Activities rows are implicitly "the signed-in user's own" in that case, so an owner label would be redundant. Sizes (26px row / 22px chip) are locally tuned to each layout's available space, not a new family — **confirmed consistent with the existing avatar-circle recipe already used by `InitiativeCard`/`ProjectCard`'s owner footer (24px, `text-[10px]`) and `KanbanCard`'s owner badge (21px, `text-[9px]`)**: same `bg-accent-lightest`/`text-accent` initials circle + `text-text-secondary` name, just sized per context. No drift — this is the one, sitewide "whose is this" avatar pattern, reused a fourth and fifth time rather than reinvented.

**Pattern notes:** Taken directly from the literal design mock's own `showOwner: st.role === 'admin'` logic (`My Activities.dc.html`) — never written into any prose spec doc before Feature 22. Both call sites take a `showOwner: boolean` prop and render nothing at all when false, rather than rendering a hidden/collapsed column — My Activities' rows are implicitly "the signed-in user's own" in that case, so an owner label would be redundant. Initiative/Project cards and Kanban cards never needed an equivalent toggle since they already show an owner avatar unconditionally (org-wide catalogs, never implicitly "mine" the way My Activities is by default).

### Inline quick-note expand panel (My Activities row)

File: `components/my-activities/task-row.tsx`
Last updated: 2026-06-23

| Property | Class |
|---|---|
| Trigger | The existing "Add note" 32px icon button (see "Small icon button" above) — toggles local `noteOpen` instead of navigating; gets the same filled-tint "active" treatment as the flag button (`border-accent-lightest bg-accent-lightest text-accent`) while open |
| Panel container | `border-t border-border bg-surface-subtle px-4.25 py-3`, sits *below* the row as a sibling, not inside it |
| Textarea | `w-full rounded-md border border-border bg-surface px-3 py-2.5 text-sm leading-body text-text-primary`, `rows={2}`, `autoFocus` — same textarea recipe as `NewTaskModal`'s Description field |
| Footer buttons | `Cancel`: `rounded-pill border border-border bg-surface px-3.5 py-1.5 text-xs font-semi text-text-secondary`; `Save`: `rounded-pill bg-text-primary px-4 py-1.5 text-xs font-semi text-white disabled:opacity-40` — same color pairing as `NewTaskModal`'s footer, just smaller padding/text for an inline-row context |
| Disabled state | Save disabled when the trimmed textarea is empty or a save is in flight |

**Pattern notes:** First UI in this codebase for composing a note outside Task Detail's full timeline — there is no popover/portal primitive anywhere in `components/` to reuse, so this had to be designed from scratch. Confirmed with the developer: the row expands in place (this panel) rather than an anchored popover (new positioning/click-outside logic with no precedent) or a centered modal (heavier than the "quick" intent, closer to feeling like leaving the page). Structurally, this required splitting `TaskRow`'s previously-single clickable div into an outer non-clickable wrapper (carries the border classes) containing the inner clickable/navigable row, with this panel as a second sibling below it — clicks inside the panel never reach the row's navigate-on-click handler because the panel sits outside that handler's element entirely, not because of `stopPropagation` (though the panel's own `onClick` also stops propagation, belt-and-suspenders, since a future edit could nest it differently). On save, calls the lifted `onAddNote(id, text)` (reuses the existing `addNote` Server Action, same `kind:'note'` row Task Detail's own notes use) and only clears/collapses on success — a failure leaves the typed text intact so nothing is lost, with the error surfaced via the page's own `Toast`.

### KPI stat card (Dashboard)

File: `components/dashboard/kpi-card.tsx`
Last updated: 2026-06-24

| Property | Class |
|---|---|
| Background | `bg-surface` |
| Border | `border border-border` |
| Border radius | `rounded-lg` |
| Text — label | `text-sm font-med text-text-secondary` |
| Text — stat value | `text-2xl font-semi leading-tight tracking-tight text-text-primary` — the documented "KPI stat number" token (`ui-tokens.md`), first real usage |
| Text — caption | `text-xs text-text-faint` |
| Spacing | `p-4.5` container padding; `mt-2` label→value, `mt-1` value→caption; delta sits inline with the value via `flex items-baseline gap-2` |
| Hover state | none — static display, not interactive |
| Shadow | `shadow-xs` |
| Accent usage | delta pill only: `text-success-dark` + `TrendingUp` icon when the change moved the metric's tagged `goodDirection`, `text-danger-cta` + `TrendingDown` otherwise — **not** literal up-arrow=green/down-arrow=red. A card with no period-over-period delta (the "Blocked tasks" card) renders a plain `text-text-faint` trend annotation instead of the colored pill. |

**Pattern notes:** First stat/KPI card in the codebase — no prior pattern to match. Reuses the generic `Card`/`Section panel` family (`bg-surface`/`border-border`/`rounded-lg`/`shadow-xs`) for the container shell, same as every other panel in the app. **Inconsistency, deliberately left as-is:** this card's padding (`p-4.5`, 18px) doesn't match either existing card-padding convention already in this registry — `ui-tokens.md`'s generic "Cards" component token specifies `p-5` (24px, paired with `shadow-sm`), while the "Card / Section panel" pattern above specifies `p-5.5` (≈22px, paired with `shadow-xs`). Confirmed with the developer during Feature 27's `/architect` session: leave this card's one-off padding alone rather than reconcile it now — every *new* card built in Feature 27 uses the documented `p-5.5`/`shadow-xs` recipe verbatim (no fourth value introduced), so the drift is contained to this one pre-existing component rather than spreading.

### Filter dropdown trigger (Dashboard filter bar)

File: `components/dashboard/filter-dropdown.tsx`
Last updated: 2026-06-24

| Property | Class |
|---|---|
| Trigger background | `bg-surface` |
| Trigger border | `border border-border` |
| Trigger radius | `rounded-sm` |
| Trigger text | `text-sm font-med text-text-primary`; optional leading icon `text-accent`; trailing `ChevronDown` `text-text-faint` |
| Trigger spacing | `px-3.25 py-2.5`, `gap-2.25` between icon/label/chevron |
| Menu container | `absolute top-[calc(100%+6px)] right-0 left-0`, `rounded-md border border-border bg-surface p-1.5 shadow-lg`, `max-h-75 overflow-y-auto` |
| Menu option | `rounded-sm px-2.5 py-1.75 text-[13.5px] text-text-primary hover:bg-surface-subtle`; selected row gets `bg-accent-lightest` + a trailing `Check` icon (`text-accent`) |
| Shadow | trigger: none; open menu: `shadow-lg` |
| Accent usage | leading icon (when present) + selected-row check, both `text-accent` |

**Pattern notes:** Generalizes `OwnerPicker`'s open/close/backdrop mechanics (`fixed inset-0` click-away layer, same `absolute top-[calc(100%+6px)]` positioning, same z-index family) into a plain icon+label+chevron trigger with a flat text option list — no avatar/search, since none of this dropdown's 4 call sites (Quarter, vs-previous, Initiative, Owner filters) need either. **Inconsistency, deliberately left as-is:** the trigger's padding (`px-3.25 py-2.5`) doesn't exactly match `OwnerPicker`'s own trigger padding (`px-2.75 py-1.75`) despite both being "click to open a dropdown" buttons of the same conceptual family. Confirmed with the developer during Feature 27's `/architect` session: out of scope, not reconciled — revisit only if a third dropdown-trigger variant gets built.

### Section header (colored dot + label + subtitle)

File: `components/dashboard/section-header.tsx`
Last updated: 2026-06-24

| Property | Class |
|---|---|
| Dot | `h-2 w-2 rounded-full`, `background` set via inline `style` from a `dotColor` prop (a CSS color/var string, not a Tailwind class — each section uses a different semantic color) |
| Label | `text-sm font-semi text-text-primary` |
| Subtitle | `text-sm text-text-faint` |
| Spacing | `mt-9 mb-3.5`, `gap-2.5` between dot/label/subtitle |

**Pattern notes:** Extracted from "Right now"'s inline markup (Feature 26) once Feature 27 gave it 6 call sites (Right now, In period, Risk & red flags, Effort allocation, Team performance, Looking ahead) — same "Nth consumer triggers extraction" precedent as `OwnerPicker`/`SEGMENT_COLORS`/`Rollup`. Dot colors used so far: `var(--color-success)` (Right now), `var(--color-accent)` (In period, Team performance), `var(--color-danger)` (Risk & red flags), `var(--color-violet)` (Effort allocation), `var(--color-warning)` (Looking ahead) — taken from the mockup's own per-section dot colors, mapped to the nearest existing token rather than a literal hex.

### Period KPI card (pill delta)

File: `components/dashboard/period-kpi-card.tsx`
Last updated: 2026-06-24

| Property | Class |
|---|---|
| Background / border / radius / shadow | `bg-surface border border-border rounded-lg shadow-xs` (documented "Card / Section panel" recipe) |
| Padding | `p-5.5` — the documented value, not `KpiCard`'s one-off `p-4.5` |
| Text — label | `text-[12.5px] font-med text-text-secondary` |
| Text — stat value | `text-[32px] leading-none font-semi tracking-tight text-text-primary` — bigger than `KpiCard`'s 24px, per the mockup's "In period" row |
| Delta | filled pill: `rounded-pill px-2.25 py-1 text-[12.5px] font-semi`, `bg-success-light text-success-dark` (good) or `bg-danger-light text-danger-cta` (bad) + `TrendingUp`/`TrendingDown` icon — a colored *background*, unlike `KpiCard`'s plain colored text+icon with no fill |
| Accent usage | same `goodDirection`-vs-`direction` comparison as `KpiCard`, not literal up=green |

**Pattern notes:** A second, visually distinct KPI card family next to `KpiCard` rather than a `variant` prop on it — confirmed with the developer during Feature 27's `/architect` session, since the value-text size and the pill-vs-plain-text delta are both real visual differences in the mockup, not just a tone change. If a third KPI-card visual variant is ever needed, prefer adding a third component over retrofitting a branchy variant prop onto either of these two.

### Donut chart with center label (recharts)

File: `components/dashboard/project-health-card.tsx`
Last updated: 2026-06-24

| Property | Value |
|---|---|
| Chart | recharts `PieChart` > `Pie` (`innerRadius={46}` `outerRadius={64}` `startAngle={90}` `endAngle={-270}` `stroke="none"`) wrapped in `ResponsiveContainer` |
| Slice colors | one `Cell` per segment, `fill` from the segment's own token color (`var(--color-success-dark)`/`var(--color-danger-cta)`/`var(--color-warning)`) — never a recharts default palette color |
| Center label | **not** a recharts feature — an absolutely-positioned `<div className="absolute inset-0 flex flex-col items-center justify-center">` sibling, overlaid on a `relative` wrapper around the `ResponsiveContainer` |
| Container size | `h-32 w-32` (128px, matches the mockup's donut diameter) |

**Pattern notes:** First chart in the codebase. recharts has no built-in slot for center content inside a donut, so the on-track % is a plain absolutely-positioned div layered on top of the chart via a `relative` wrapper — not a recharts prop or plugin. Reuse this exact overlay technique for any future donut/gauge that needs a center label; don't reach for a recharts label/customized-shape API for this, it's simpler as plain HTML on top.

### Risk / red-flag card (generic)

File: `components/dashboard/risk-card.tsx`
Last updated: 2026-06-24

| Property | Class |
|---|---|
| Background / border / radius / shadow | `bg-surface border border-border rounded-lg shadow-xs` |
| Padding | `p-5` |
| Title + count badge | `text-[15px] font-semi` title, `rounded-pill` count badge in the card's `tone` (`bg-danger-light text-danger-cta` or `bg-warning-light text-warning`) |
| List item | small `tone`-colored dot + name/sub text + a `tone`-colored tag pill on the right |
| Empty state | plain `text-text-secondary` message, shown only when `items` is empty and `emptyMessage` is provided |
| Optional footer | a single label/value stat row below a `border-t` divider |

**Pattern notes:** One generic component (`title`/`count`/`tone`/`dotColor`/`items`/`emptyMessage`/`footer` props) reused for all 3 "Risk & red flags" cards (Delayed projects, Stalled, Oldest blockers) rather than 3 near-identical components — confirmed during Feature 27's `/architect` session, since the only real differences between the three are tone, copy, and whether a footer stat is present. Reuse this component for any future "flagged items list with a count badge" card rather than building a new one.
