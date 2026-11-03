# Verify: Tasks filter logic (Feature 34) · spec 0001 · updated 2026-11-03
_Steps derived from spec 0001 acceptance criteria. `/check verify` runs these; `/test` locks the durable ones._

## UI / manual
- [ ] On `/tasks`, pick Status "In Progress" and "Done", then switch to Gantt → URL reads `/tasks?view=gantt&status=in_progress,done`, the browser Back history did not grow, and the network tab shows no new `/tasks` RSC request per click → AC-1
- [ ] Refresh that URL → Gantt with the same Status filter on the first paint, no flash of Kanban → AC-2
- [ ] From that filtered Gantt view, open a task, press the Task Detail Back button → same Gantt view and filters. Repeat with the browser Back button → same result → AC-3
- [ ] Paste a task URL into a fresh tab, press Back → lands on `/tasks` (with the saved view and filters), not a blank page → AC-4
- [ ] Open a task from My Activities, press Back → returns to My Activities → AC-4
- [ ] Set filters, then click Tasks in the navbar (bare `/tasks`) → saved view and filters come back, no visible flash of the default view, URL shows the query again. Same after closing the tab and opening `/tasks` → AC-5
- [ ] While already on a filtered `/tasks`, click the navbar Tasks link → URL is written back to the current query at once → AC-5
- [ ] Sign out, sign in as a different user in the same browser, open `/tasks` → defaults, not the first user's filters. DevTools shows one `tasks-page-state:<userId>` key per account → AC-6
- [ ] On Gantt with filters set, click Clear filters → all four filters reset, view stays Gantt, URL is `/tasks?view=gantt`, saved key holds empty filters → AC-7
- [ ] Open `/tasks?projects=<deleted id>,<real id>&status=done,archived&view=table` → page loads without error, shows Kanban with only the real project and Done, URL is cleaned to match → AC-8
- [ ] Open `/tasks?initiative=<A>&projects=<project in B>` → the project is dropped, URL cleaned → AC-8
- [ ] In a private window (or with site storage blocked), use the filters → page works, URL still updates, no console errors. Set the saved key to `{oops` by hand and reload bare `/tasks` → defaults, no error → AC-9
- [ ] Pick a combination with no matches → "No tasks match these filters", "Try removing a filter or clearing them all.", and a Clear filters button that works → AC-10
- [ ] As a user with no tasks and no filters → "No tasks yet", "Create a task to get started.", no button → AC-10
- [ ] Subtitle: no filters → "M tasks across your projects"; with a filter → "Showing N of M tasks"; with exactly one task in scope → "task" singular → AC-11
- [ ] With Status = To Do, have a second session move a visible task to Done → it disappears silently; move it back → it reappears. Create a Done task from another session → not shown, no notice → AC-12
- [ ] With Status = Done, create a To Do task from the New task modal → toast "Task created. Hidden by your filters." with Clear filters, lasting about 6 seconds; clicking Clear filters shows the task. Without filters → plain "Task created" → AC-13
- [ ] As admin, set Owners to another person, switch View As to User → filtered empty state, filters unchanged; switch back → their tasks return → AC-14
- [ ] In PostHog live events, each filter change sends `task_filter_selected` with the right `filter` and `count`; Clear filters sends `{ filter: "clear", count: 0 }`; reloading a filtered URL or restoring from bare `/tasks` sends nothing → AC-15

## Value sourcing checks
- [ ] First render reads the URL: edit the query by hand and reload → page matches the new query (source: `searchParams` in `app/tasks/page.tsx`)
- [ ] Valid ids come from the live lists: delete (or archive) a project in the DB, reload a URL that names it → dropped (source: `projects`, `initiatives`, `profiles` queries)
- [ ] Restore uses the signed in user's id: two accounts, different saved filters, each sees only their own (source: `currentUserId`)
- [ ] M follows View As: as admin, switch View As and watch M change while filters stay (source: `scopedTasks.length`)
- [ ] Back decision follows the tab flag: clear `sessionStorage["app-nav"]` in DevTools on Task Detail, press Back → goes to `/tasks` (source: `NavigationTracker`)

## Commands
- [ ] `npm test` → all pass (`components/tasks/filter-state.test.ts`, `components/tasks/tasks-view.test.tsx`, `components/layout/navigation-tracker.test.tsx`) → AC-1 to AC-15
- [ ] `npx tsc --noEmit` and `npx eslint components app` → clean
- [ ] `npm run build` → succeeds

## Acceptance-criteria coverage
- AC-1 step 1 · AC-2 step 2 · AC-3 step 3 · AC-4 steps 4, 5 · AC-5 steps 6, 7 · AC-6 step 8 · AC-7 step 9 · AC-8 steps 10, 11 · AC-9 step 12 · AC-10 steps 13, 14 · AC-11 step 15 · AC-12 step 16 · AC-13 step 17 · AC-14 step 18 · AC-15 step 19
