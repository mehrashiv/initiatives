# 0001. Saved filter state for the Tasks page

**Date**: 2026-11-03
**Status**: Accepted

## Summary

The Tasks page filters (Initiative, Projects, Owners, Status) and the Kanban/Gantt view will live in the page address (the URL query), so Back, refresh and bookmarks return the exact view. The last used state is also remembered in the browser for each user, so the navbar's Tasks link brings it back. The feature also adds an honest empty state, a "Showing 8 of 42 tasks" subtitle, a safe Back button on Task Detail, and a filter analytics event. No database change.

## Requirements

**User stories**:
- As a project lead, I want my filters and view to survive opening a task and coming back, so I can work through a filtered list without setting it up again.
- As any user, I want the Tasks link to bring back the view I last used, and a refresh or bookmark to show the same thing.
- As any user, I want to understand why the page is empty or why a task I just created is not visible.

**Acceptance criteria**:
- **AC-1**: Every change to a filter or to the Kanban/Gantt view updates the `/tasks` URL query immediately, with no new browser history entry and no server round trip. Format: keys `view`, `initiative`, `projects`, `owners`, `status`, in that order; list values are comma separated ids (status uses the `TaskStatus` values); default values are left out (`view=kanban` and empty filters never appear). Example: `/tasks?view=gantt&projects=a1,b2&status=in_progress,done`.
- **AC-2**: Refreshing `/tasks?…` shows the same view and filters on the first paint, with no flash of the default view.
- **AC-3**: Opening a task from a filtered Gantt view and pressing Back (the Task Detail button or the browser button) returns to the same Gantt view with the same filters.
- **AC-4**: Task Detail's Back button calls `router.back()` when the user has moved between pages of the app in this browser tab, and `router.push("/tasks")` otherwise (task opened from a bookmark, a new tab or a pasted link). Opened from My Activities, Back returns to My Activities.
- **AC-5**: Opening `/tasks` with no recognised query key (the navbar link) restores the last saved state for the signed in user in this browser, with no visible flash of the default view, and the URL then shows the restored query. With no saved state, the page shows defaults (Kanban, no filters).
- **AC-6**: Saved state is stored per user. A different account signed in on the same browser never gets another user's saved state.
- **AC-7**: Clear filters resets Initiative, Projects, Owners and Status in the page, the URL and the saved state. The Kanban/Gantt view does not change.
- **AC-8**: Invalid values in the URL or the saved state are dropped without an error: unknown project, owner or initiative ids, unknown statuses, an unknown view, and selected projects outside the chosen initiative. The URL is then cleaned to match what is shown, and the cleaned state is saved.
- **AC-9**: When browser storage is unavailable or holds unreadable data (private window, blocked storage, full quota, bad JSON), the page still works, the URL state still works, and nothing throws.
- **AC-10**: With at least one filter set and no matching task, the page shows the title "No tasks match these filters", the description "Try removing a filter or clearing them all.", and a Clear filters button. With no filter set and no task in scope, it shows "No tasks yet" and "Create a task to get started.", with no button.
- **AC-11**: The subtitle shows "Showing N of M tasks" when any filter is set, and "M tasks across your projects" when none is set. N is the filtered count, M is the count in the current View As scope. "task" is singular when M is 1.
- **AC-12**: A task created or changed over realtime that does not match the active filters stays hidden, with no notice. It shows as soon as it matches (for example its status changes into a selected status) or the filters change.
- **AC-13**: Creating a task with the New task modal that the active filters hide shows the toast "Task created. Hidden by your filters." with a Clear filters button, for 6 seconds. A created task that is visible shows the usual "Task created" toast.
- **AC-14**: Switching View As keeps every filter as it is. If nothing matches, AC-10's filtered empty state shows. Switching back restores the earlier result.
- **AC-15**: Each filter change made by the user sends the PostHog event `task_filter_selected` with `{ filter: "initiative" | "projects" | "owners" | "status", count }` (count is how many values are selected after the change; 0 or 1 for initiative). Clear filters sends it with `{ filter: "clear", count: 0 }`. Restoring from the URL or saved state sends nothing.

## Decision

_Decision history (context, options, rationale) is in [rationale.md](rationale.md). Verify steps are in [verify.md](verify.md)._

**Chosen option**: Option 1: URL query as the live mirror, plus a per user localStorage memory.

React state in `TasksView` stays the source of truth after mount. The URL and localStorage are mirrors written on every change. The server page parses the URL for the first render, and a bare `/tasks` holds for one frame while saved state is restored.

Calls made inside this decision:
- **`window.history.replaceState`, not `router.replace`.** Because `page.tsx` reads `searchParams`, `router.replace` would rerun the Server Component and refetch every task on each filter click. The native history API is supported by Next.js 16 and keeps `useSearchParams` in sync without a round trip. Runner up: `router.replace` with `{ scroll: false }`, correct but wasteful.
- **In app history detection** uses a `sessionStorage` flag set by a small `NavigationTracker` client component in the root layout (chosen by the developer). Runner up: same origin `document.referrer`, unreliable after client side navigation.
- **One shared visibility rule** (`matchesFilters`) is used by the list, the new task toast check and the tests, so they can never disagree.

## Feature design

**Data model sketch**: no database change. Client side state shape, used for the URL, for storage and in `TasksView`:

```ts
type TasksPageState = {
  view: "kanban" | "gantt";        // default "kanban"
  initiative: string;              // "" = all
  projects: string[];              // [] = all
  owners: string[];                // [] = all
  statuses: TaskStatus[];          // [] = all
};
```

Stored value: `localStorage["tasks-page-state:<userId>"] = JSON.stringify({ v: 1, ...TasksPageState })`. A missing `v`, the wrong `v`, or bad JSON counts as nothing saved. In app history flag: `sessionStorage["app-nav"] = "1"`.

**State transitions**: page load on `/tasks`:
- URL has any of the five keys (`hasQuery`): start from the sanitized URL state, render at once, clean the URL if sanitizing changed it, save.
- URL has none: hold, then read storage, sanitize it against the current option lists, apply it, write the URL, show the page.

**Interface surface** (no new endpoints or Server Actions):

| Unit | Kind | Inputs | Outputs | Notes |
|---|---|---|---|---|
| `components/tasks/filter-state.ts` | pure module | | `parseTasksQuery(params)`, `sanitizeState(raw, valid)`, `serializeState(state)` returning `""` or `"?…"`, `matchesFilters(task, state, projectInitiativeIds)`, `storageKey(userId)`, `readSavedState(userId)`, `writeSavedState(userId, state)` | Storage helpers wrap every access in try/catch and return `null` or do nothing on failure |
| `app/tasks/page.tsx` | Server Component | `searchParams: Promise<Record<string, string \| string[] \| undefined>>` | new props `initialState: TasksPageState`, `hasQuery: boolean` | Sanitizes against the fetched projects, initiatives, profiles and `STATUS_COLUMNS` |
| `TasksView` | client | `initialState`, `hasQuery`, existing props | | `useState` seeded from `initialState`; `restored` starts as `hasQuery` |
| Mirror effect in `TasksView` | client effect | `state`, `restored`, `useSearchParams().toString()` | `window.history.replaceState(null, "", "/tasks" + serializeState(state))` when it differs from `location.search`; `writeSavedState` | `useSearchParams` is only a change signal, so a navbar click to bare `/tasks` while the page is mounted is written back at once. The page is already dynamic, so no Suspense boundary is required |
| `components/layout/navigation-tracker.tsx` | client, root layout | `usePathname()` | sets `sessionStorage["app-nav"]` once the pathname changes after first mount | Renders nothing; try/catch around storage |
| Task Detail Back button | client | `sessionStorage["app-nav"]` | `router.back()` if set, else `router.push("/tasks")` | Read at click time; unreadable storage means "not set" |
| `Toast` | shared component | new optional `action?: { label: string; onClick: () => void }` | renders a button after the message | Existing callers unchanged |

**Value sourcing**:

| Action | Value produced / displayed | Source |
|---|---|---|
| First render | view and filters | `searchParams` parsed in `page.tsx` |
| First render | valid project, initiative, owner ids | the `projects`, `initiatives`, `profiles` queries `page.tsx` already runs |
| First render | valid statuses and views | `STATUS_COLUMNS` and the `TaskView` union |
| Sanitize | project to initiative mapping, for pruning | `projectInitiativeIds` (already built in `page.tsx`) |
| Restore | which user's saved state | `currentUserId` prop (from `auth.getCurrentUser`) |
| Restore | client side valid id sets | `projectOptions`, `initiativeOptions`, `profiles` props |
| Subtitle | N | `filteredTasks.length` |
| Subtitle | M | `scopedTasks.length` (View As scope) |
| Empty state | which copy | `anyFilter` (derived from state) |
| New task toast | hidden or visible | `matchesFilters(newTask, state, projectInitiativeIds)` |
| Back button | in app history or not | `sessionStorage["app-nav"]`, set by `NavigationTracker` |
| Analytics `count` | selected values after the change | the new array length, or 0/1 for initiative |

**Key invariants**:
- After mount, React state is the only source of truth; the URL and storage are always written from it, never read back from them.
- The URL and storage only ever hold sanitized state.
- `filteredTasks` and the new task toast check both use `matchesFilters`.
- Setting an initiative drops selected projects outside it (unchanged from Feature 33, now also applied when sanitizing).
- No analytics event fires from restore, URL parsing or cleaning.
- The hold only happens when `hasQuery` is false. Exactly what is held: the subtitle, the filter row and the board. The title and the New task button always render.

**Security model**: unchanged. The URL and storage hold ids only, never names. A non admin's server query is still scoped to `owner = auth.uid()`, so another user's id in `owners` simply matches nothing. No new RLS, actions or secrets.

**Configuration required**: none.

**Critical test scenarios**:
- `serializeState` and `parseTasksQuery` round trip; default values are left out; key order is fixed. Verifies **AC-1**.
- Render `TasksView` with `initialState` gantt plus a status: the Gantt view and filter show on first render; a filter click calls `history.replaceState` and not `router.replace`. Verifies **AC-1**, **AC-2**, **AC-3**.
- Bare `/tasks` with saved state: nothing filtered is shown before restore, the restored state shows after, the URL is written. Verifies **AC-5**.
- Saved state for user A is not applied for user B. Verifies **AC-6**.
- Clear filters on Gantt: filters reset, view still Gantt, URL `?view=gantt`, storage updated. Verifies **AC-7**.
- URL with a deleted project, a bad status and a project outside the chosen initiative: those values are dropped and the URL is cleaned. Verifies **AC-8**.
- `localStorage.getItem` throws, and storage holds bad JSON: the page renders defaults with no error. Verifies **AC-9**.
- Both empty state variants, and the filtered one's Clear button. Verifies **AC-10**.
- Subtitle with and without filters, singular and plural. Verifies **AC-11**.
- A realtime insert that misses the status filter is not shown; a later update into a selected status shows it. Verifies **AC-12**.
- Create a task that misses the filters: the hidden toast shows with a working Clear filters action. Verifies **AC-13**.
- Admin with Owners set to others switches View As to User: filtered empty state shows; switching back restores the list. Verifies **AC-14**.
- Back with and without the `app-nav` flag. Verifies **AC-4**.
- `task_filter_selected` fires on clicks and on clear, and not on restore. Verifies **AC-15**.
- Regression from Feature 33: hidden Kanban columns come back when Status is cleared.

## Build plan

Build approach: none recorded in `AGENTS.md`. The project's core rule (UI first, then logic) is already met, since Feature 33 shipped the UI. So this plan uses end to end slices: the URL round trip works through every layer first, then each layer is added.

1. Add `components/tasks/filter-state.ts` (state type, parse, sanitize, serialize, `matchesFilters`, storage helpers) with unit tests, and switch `filteredTasks` to `matchesFilters`. Satisfies **AC-1**, **AC-8**, **AC-9**.
2. `app/tasks/page.tsx` reads `searchParams`, sanitizes, and passes `initialState` and `hasQuery`; `TasksView` seeds its state from them. Satisfies **AC-2**, **AC-3**, **AC-8**.
3. Mirror effect in `TasksView` (`replaceState` plus `writeSavedState`, `useSearchParams` as the change signal); Clear filters keeps the view. Satisfies **AC-1**, **AC-6**, **AC-7**, **AC-8**.
4. Bare `/tasks` restore with the hold (`restored` flag, read storage, sanitize, apply). Satisfies **AC-5**, **AC-6**, **AC-9**.
5. `NavigationTracker` in `app/layout.tsx` and the Task Detail Back fallback in `components/task-detail/task-detail-view.tsx`. Satisfies **AC-3**, **AC-4**.
6. Empty state variants and the subtitle count in `TasksView`. Satisfies **AC-10**, **AC-11**, **AC-14**.
7. Add `action` to `Toast`; show the hidden toast for created tasks that miss the filters (6 second timeout). Confirm realtime needs no change. Satisfies **AC-12**, **AC-13**.
8. `task_filter_selected` capture in each filter handler and in Clear filters; add the event to the locked events tables in `context/project-overview.md` and `context/code-standards.md`. Satisfies **AC-15**.
9. Extend `components/tasks/tasks-view.test.tsx` with the critical test scenarios above. Satisfies **AC-1** to **AC-15**.

## Consequences

**Positive**:
- Back, refresh, bookmarks and the navbar link all return users to where they were.
- Filtered links can be shared between teammates (each sees the result within their own scope).
- One visibility rule, unit tested away from React.

**Negative / tradeoffs**:
- State is mirrored in three places (React, URL, storage); the build must keep the "write from state only" rule or they drift.
- A bare `/tasks` renders no board on the server; the board appears after hydration (one frame on a fast machine, longer on a slow one).
- The `app-nav` flag is per tab and outlives leaving the app. If a user goes from the app to another site in the same tab and then pastes a task link, Back goes to that site. This is rare, and accepted.
- Saved state per user grows by one small localStorage key per account per browser; nothing ever deletes it.
- Overrides Feature 11's "view toggle is local state" rule for this page only, so the Tasks page now differs from other toggles in the app.

**Neutral**:
- No migration, no feature flag. Rollback is reverting the commit; leftover storage keys are ignored.
- A new event name, `task_filter_selected`, enters the locked events list.

## Follow-up

- [ ] Record in `context/architecture.md` that the Tasks page's view and filters live in the URL plus `tasks-page-state:<userId>`, overriding Feature 11 for this page only.
- [ ] Mark the open realtime decision in `context/build-plan.md` Feature 34 as settled (hidden, no notice), and point Feature 34 at this spec.
- [ ] This repo has no `docs/scope/`; features are tracked in `context/build-plan.md` and `context/progress-tracker.md`. Decide whether to keep that or adopt the scope folder.
