# Memory — Feature 29 (Charts/Tables Real Data Wiring)

Last updated: 2026-06-24 (end of session)

## What was built

- **Feature 29 shipped** — every Dashboard widget below "Right now" (8 widget groups, the full set Feature 27 built on mock data) now computes from real `initiatives`/`projects`/`tasks`/`activities` rows.
- **`lib/dashboard-aggregates.ts`** — added `matchDashboardScope()` (shared filter cascade, factored out of Feature 28's `computeRightNowKpis`), `countActiveAtOrBefore`/`countOverdueAsOf` (also extracted from Feature 28, same behavior), `lastActivityByTaskId()`, and one `compute*` function per widget: `computeProjectHealthList`/`computeProjectHealthSummary`, `computeRiskData`, `computeCategoryMix`, `computeTeamPerformance`, `computeLookingAhead`, `computePeriodKpis`/`computePeriodComparisonRows` (sharing one internal `computePeriodMetrics()`), `computeVelocityBars`/`computeOnTimeTrend`.
- **`lib/dates.ts`** — added `getTrailingWeekBuckets`/`getTrailingMonthBuckets`/`getTrailingQuarterBuckets`/`getGranularityBuckets`, `getQuarterEndDate`, and `parseDateOnly` (the last one added mid-session to fix a real bug — see below).
- **`app/dashboard/page.tsx`** — now also fetches `activities (task_id, created_at)`, plus `name` on `projects`, and `name`/`delivery_date`/`blocker_owner` on `tasks`.
- **`components/dashboard/dashboard-view.tsx`** — rewritten: every section now reads from `useMemo`'d real-data computations instead of `mock-data.ts` constants. Velocity chart's Week/Month/Quarter granularity state lifted up from `velocity-chart.tsx` so `OnTimeTrendChart` can share it.
- **`components/dashboard/mock-data.ts`** — every data constant deleted (`PERIOD_KPIS`, `PROJECT_HEALTH`, `VELOCITY_BARS`, `ON_TIME_TREND`, `RISK_DATA`, `CATEGORY_MIX`, `EFFORT_ALLOCATION`, `TEAM_PERFORMANCE`, `LOOKING_AHEAD_FORWARD`, `COMPARE_ROWS`); all type interfaces kept. `ProjectHealthSegment.key` changed from the mock's 3-bucket `on_track|at_risk|delayed` to the real 4-bucket `on_track|delayed|stalled|done` model.
- **`components/dashboard/strategic-mix-card.tsx` deleted** — Strategic/Tactical split dropped entirely (see decisions). `CategoryMixCard` now renders full-width alone in the Effort allocation section.
- **`components/dashboard/velocity-chart.tsx`** — granularity is now a prop (`granularity`/`onGranularityChange`), not local state.
- **`components/dashboard/on-time-trend-chart.tsx`** — subtitle corrected from "% of projects delivered..." to "% of tasks completed..." (the real computation has always been task-level).
- **Docs**: `progress-tracker.md` (Feature 29 checked off, full decision log entry, "Next up" → Feature 30), `project-overview.md`'s Dashboard section rewritten to match the real 6+6 KPI cards and 8 widget groups, `ui-registry.md` updated for every touched component, new "Project Health & Dashboard Aggregates" section added to `architecture.md`.

## Decisions made

- **"Project health" (On track/Delayed/Stalled/Done)** adopted from the original mockup's own JS logic (never previously ported to any doc) — resolves the project-level "delayed/stalled" definition Feature 28 left open. Priority: Done → Delayed (overdue or blocked/delayed task) → Stalled (30+ days no activity) → On track. One shared bucket, reused by the donut and two Risk & red flags cards.
- **"Last activity" joins the `activities` table**, not just `tasks.updated_at` — a note doesn't touch the task row, so a project being actively discussed would otherwise misread as stalled. Confirmed with the developer before building.
- **Strategic vs. Tactical split dropped entirely.** The mockup's rule (tactical = category `'Operations'`) matches none of this app's real categories. Asked the developer directly rather than guessing a substitute mapping — answer was to drop it, not approximate it. `StrategicMixCard` deleted; `CategoryMixCard` takes the full row.
- **"Looking ahead" rebuilt on task `end_date` only** — neither `projects` nor `initiatives` has a date column; Feature 27's mock sub-labels ("Project end date"/"Initiative target") never had anything real to back them.
- **Velocity granularity toggle wired for real this feature**, not deferred to Feature 30 — confirmed as this chart's own concern, not a "lens." Shared with the On-time trend chart (collapsing "Week" to monthly buckets for that one, since a weekly on-time line is too sparse).
- **Period Comparison table's "Portfolio completion" and "Blocked tasks" rows ship with no prev/delta**, staying consistent with Feature 28's ruling that those two need activity-log text parsing this codebase doesn't do.
- **Comparison window now anchors to the *selected* quarter**, not "the quarter before today" — `prevQuarterLabel` was previously today-relative regardless of the dropdown, a latent bug invisible while the numbers under it were mock.

## Problems solved

- **Real date-parsing/timezone bug, caught only by live Playwright verification (not `tsc`/`eslint`).** Date-only columns (`end_date`, `delivery_date`) were parsed with bare `new Date(rawString)`, which reads as UTC midnight — displays as the *previous* calendar day in a negative-UTC-offset browser, and rounds day-count subtraction inconsistently depending on time-of-day. First caught as "Jul 4" displayed for a stored `2026-07-05`, and "in 9d" instead of the correct "in 10d." Fixed with a new `parseDateOnly()` helper (matches the existing `toDate`/`fromDateInputValue` local-midnight pattern already used elsewhere in this codebase) routed through everywhere a date-only field is compared or displayed, alongside the existing `dayDiff`/`startOfDay` helpers instead of raw millisecond math. `created_at`/`updated_at` (real timestamptz) were left untouched — inequality comparisons against them are timezone-safe by construction.

## Current state

- Feature 29 fully shipped and verified. `tsc --noEmit`/`eslint` clean on every touched file (pre-existing `context/designs/` prototype-bundle findings untouched, same as every prior feature).
- Verified live via Playwright against a hand-built throwaway initiative (5 projects deliberately hitting each health bucket, 7 tasks, 1 note activity specifically proving the activities-join staleness decision, 1 cross-owner task on an existing real user to exercise the owner-filter cascade and a 2-row team table) — all created via direct SQL + the InsForge admin signup, all deleted afterward, confirmed via post-cleanup count queries returning zero. Every widget's numbers matched hand-calculation exactly, across multiple filter/quarter/granularity/"no comparison" combinations. Zero console errors throughout.
- `progress-tracker.md` current through Feature 29. Phase 8 (Dashboard) is 4 of 5 features done.
- `/imprint` run at end of session: nothing new to capture — Feature 29 was logic/data-wiring only, no new visual patterns (the one real layout change, `CategoryMixCard` going full-width, was already captured in `ui-registry.md` during the build itself).
- A scratch `next dev` server was started on :3000 for verification (no developer server was running at session start) and was left running in case the developer wants to look at the dashboard.

## Next session starts with

**Feature 30 — Empty states + lens presets logic** (Phase 8, final feature, `build-plan.md`): "Empty state per chart/table when a filter combination returns no data; lens buttons re-run the same aggregate queries with a different grouping dimension." The 4 lens preset buttons (`Delayed & at risk`/`Team load now`/`Strategic work`/`Quarter review`) are still purely cosmetic (`activeLens` state exists but does nothing). Note: "Strategic work" as a lens label is now awkward since the Strategic/Tactical concept was deliberately dropped this session — will need a fresh decision on what (if anything) that lens preset should mean against real data, or whether to rename/drop it. No widget currently has a real empty state — worth an `/architect` pass given both sub-features (empty states + lens semantics) touch every widget built across Features 27–29.

## Open questions

- What "Strategic work" (the lens preset) should mean now that the category-based Strategic/Tactical split was dropped — carried over from this session, not resolved.
- No other open questions blocking Feature 29 itself — fully shipped, nothing carried over from this feature's own scope.
