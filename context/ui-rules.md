# UI Rules

Concise rules for building Initiative Tracker's UI. `ui-tokens.md` is the source of truth for every color/spacing/radius/shadow value — this file covers layout and component patterns. Always reference a token, never a raw value.

---

## Font

Self-host Inter via the `@font-face` rules in `globals.css` (see `ui-tokens.md`) — do not use `next/font/google` or any CDN font. Apply `font-sans` to the `<html>` tag in the root layout.

---

## Layout

- Page max-width: **1440px**, centered — one width, every page, no per-page variants. (Originally 1440px sitewide with a separate 1040px admin variant for `/users`; unified to a single 1280px after developer feedback that the gap between the two looked inconsistent. Raised back to 1440px in Feature 12 so the Kanban board's 5 columns fit without a horizontal scrollbar — still one width everywhere, just a bigger shared number; see `ui-registry.md`'s Page container entry for the full history.)
- The navbar's inner content row uses this exact same max-width, so its left/right edges always line up with the page content below it.
- Main content padding: `px-4 py-6 pb-18 md:px-6` (16px sides on mobile, 32px sides from `md:` up; 24px top, 72px bottom).
- Gap between page sections: 24px (`spacing-5`).
- Navbar height: 64px, full viewport width, white background.
- Top navbar only — no sidebar, no breadcrumbs, on any page.
- No pagination anywhere — every list (My Activities, Initiatives, Projects, Tasks) renders its full result set.

### Page container — always use the shared component

**Every page's top-level `<main>` must be `components/shared/page-container.tsx`'s `PageContainer`** — never hand-roll a `<main className="mx-auto max-w-320 ...">` on a per-page basis. It takes no width prop; there is exactly one page width, by design (see above).

This isn't just a DRY preference — see `context/layout-fundamentals.md` (Rule 1 and Rule 2) for the actual CSS mechanics this protects against: a hand-rolled `mx-auto max-w-*` wrapper silently shrinks to fit its own content instead of stretching to the cap, because the root layout's `<body>` is a flex container. This shipped broken, independently, on three different pages before being centralized into `PageContainer` — the shared component is the fix, not just a convenience.

---

## Navbar

Logo (left) — Nile shield mark + "nile" wordmark, links to `/my-activities`. Then 5 nav items: My Activities, Dashboard, Initiatives, Projects, Tasks. Then, right-aligned: a static bell icon and the avatar menu.

- Active nav item: `text-accent`, weight 500, 14px.
- Inactive nav item: `text-text-secondary`, weight 500, 14px.
- No underline — active state is color only.
- The bell icon is **non-interactive** in v1 — no badge, no dropdown, `aria-disabled`. Do not wire a notification feature behind it.
- The avatar menu's "User management" link only renders when `profiles.role === 'admin'` — never show it to a regular user, even briefly during a loading state.

---

## Cards

Every Initiative/Project/Task card and every Dashboard widget lives in a card per the `Cards` recipe in `ui-tokens.md` (`bg-surface`, `border-border`, `radius-lg`, `shadow-sm`, `spacing-5` padding). Cards are always white — color appears via badges/bars/text inside the card, never as the card's own background.

---

## Typography Hierarchy

Use exactly the three levels defined in `ui-tokens.md`'s Typography table: section/card heading, body/primary text, secondary/caption text. Don't introduce a fourth level.

---

## Drawers (Initiative / Project create-edit)

- 468px wide, slides in from the right, per the Drawer recipe in `ui-tokens.md`.
- Fields: name (text input, 80-char cap, inline similar-name warning if another record of the same type has a near-identical name — shown in create mode only, not while editing), category/initiative picker, owner picker, status toggle. The Initiative drawer additionally has a **Goal** field (free-text textarea, optional) — Projects have no Goal field, don't carry it over.
- Footer: Cancel (ghost button) + Save (primary button), right-aligned.
- Card's "⋯" menu opens exactly three actions: **Edit**, **Set active/inactive**, **Delete**. Never show a "Duplicate" item — it's out of scope for this product.

---

## Modal (New Task)

- Centered, fixed width (~480px), overlay dims the background.
- Fields: task name (**no character limit** — unlike Initiative/Project names), description (textarea, optional), project picker, owner picker (defaults to current user, reassignable), start/end dates, status.
- Footer: Cancel + Create, right-aligned.

---

## Drawer (Add user)

- 468px wide, slides in from the right — same Drawer recipe as the Initiative/Project drawers.
- Fields: email, password (with show/hide toggle and an 8-char strength hint), role toggle (User / Administrator).
- Footer: Cancel (ghost) + Add user (primary), right-aligned.
- No edit mode — this drawer only ever creates. There is no in-app control to change an existing user's role.

---

## Table (User Management)

- Columns: User (avatar + name + "You" tag on the admin's own row), Email, Role (pill badge, same recipe as Status Badges), and a trailing remove-icon column.
- The remove icon is hidden entirely on the current user's own row — an admin can never remove themselves.
- No pagination, no row click-through — this table has no detail view.

---

## Kanban Board

- Exactly 5 fixed columns, in this order: **To Do, In Progress, Blocked, Delayed, Done.** Never add, remove, or reorder columns.
- Each card shows: task name, parent project, owner avatar, due date, and a status-colored left border (4px) per the Status Badges (Tasks) table in `ui-tokens.md`.
- Native HTML5 drag-and-drop only — no drag library. Dropping into a new column is the only way to change status from this view.
- Empty column: dashed border placeholder box, no card.

---

## Gantt Chart

- One row per task. Bar spans `start_date`–`end_date` normally, filled with the task's computed **schedule-health** color — a separate 5-bucket mapping (on time / in progress / to do / at risk / delayed), not the raw Status Badges (Tasks) colors. See `ui-tokens.md`'s Gantt Bar entry for the exact bucket table and the reasoning for deviating from the literal design mock's colors.
- **Overdue** (not done, undelivered, today past `end_date`): bar stays flush at its own `end_date` — solid "at risk" color, no extension, no hatch. It only flags risk; it doesn't claim to know how late delivery will eventually be.
- **Delayed Nd** (delivered later than `end_date`, by N days): bar extends past `end_date` out to `delivery_date`. The start–`end_date` portion is the on-time green; only the `end_date`–`delivery_date` extension is hatched.
- **Early delivery** (delivered before `end_date`): bar stays at its original `end_date`. The start–`delivery_date` portion is solid green; the `delivery_date`–`end_date` tail is a dashed outline, not filled.
- `delivery_date`, when set: diamond marker on the bar at that date, always ink-colored (`var(--color-text-primary)`), never bucket-colored.
- A vertical "today" line spans the full chart height.
- A legend below the chart explains the 5 bucket colors plus diamond/hatch/today-line.
- The "Task" name column is frozen (`sticky left-0`) inside the chart's own `overflow-x-auto` container — it never scrolls out of view horizontally, in the header or in any row. Every month column gets a vertical divider line running the full height of the chart (header + all rows), not just inside the header strip.
- Clicking anywhere on a row (`GanttRow`'s outer `<div>`) navigates to `/tasks/[id]`, identical to `KanbanCard`'s click behavior — same `task_clicked` PostHog payload shape, same `cursor-pointer`.
- On mount, the chart scrolls itself so today's line sits just past the frozen Task column (with `TODAY_LEAD_IN_DAYS` of past context still visible) instead of defaulting to `scrollLeft: 0` (the oldest task's date) — see `GanttChart`'s Pattern notes in `ui-registry.md`.

---

## Status Badges

Use the exact color pairs from `ui-tokens.md`'s Status Badges tables — one set for Task status (To Do/In Progress/Blocked/Delayed/Done), one set for Initiative/Project status (Active/Inactive). All badges are pill-shaped (`radius-pill`), `padding: 2px 8px`, `text-xs`, weight 500. Never invent a new status color outside these tables.

---

## Buttons

Use the Primary / CTA / Secondary / Ghost recipes from `ui-tokens.md`. Rule of thumb: page-level "create new" actions (+ New initiative / + New project / + New task) are **CTA** buttons (gradient background, pill shape); in-form Save/Update actions are **Primary** buttons (solid accent, 8px radius); Cancel is **Ghost**.

---

## Form Inputs

Per the Input Fields recipe in `ui-tokens.md`. Validation errors render inline below the field in `text-danger-cta`, never as a raw alert/toast for field-level errors (toasts are reserved for action-level confirmations like "Initiative created").

---

## Tables (Dashboard owner-workload / at-risk lists)

- No alternating row colors — white rows separated by a `border-border` hairline.
- Column headers: uppercase, 12px, weight 500, `text-text-secondary`.
- Row text: 14px, `text-text-primary`.
- Row hover: `bg-surface-subtle`.

---

## Empty States

Every list/chart/table that can be empty needs one: short descriptive text in `text-text-faint`, optional icon above it, and a CTA button only if there's a logical next action (e.g. My Activities empty state offers "+ New task").

---

## Tailwind v4 Note

Tokens are defined with `@theme` in `globals.css` — never add a `tailwind.config.ts` for colors/spacing/radius. New tokens always go into `@theme`, and must be added to `ui-tokens.md` in the same change.

---

## Do Nots

- Never use Tailwind's built-in color classes (`bg-blue-500`, `text-gray-600`) — project tokens only.
- Never put a "Duplicate" action anywhere on Initiatives or Projects.
- Never add a sidebar, breadcrumb trail, or pagination control to any page.
- Never make the bell icon interactive.
- Never use a solid color for a CTA button — always `var(--gradient-cta)`.
- Never add more than 5 Kanban columns or reorder the fixed To Do → In Progress → Blocked → Delayed → Done sequence.
- Never use `position: fixed` for page UI — normal flow layout only (the navbar is the one exception, and it's handled by the root layout, not ad hoc per page).
- Never show a raw database/API error message to the user.
- Never hand-roll a page's top-level `<main className="mx-auto max-w-... ...">` — always render through `PageContainer` (`components/shared/page-container.tsx`). See the Layout section above for why.
