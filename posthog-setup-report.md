# PostHog post-wizard report

The wizard has completed a deep integration of PostHog analytics into the Initiatives Tracker app. The following changes were made:

- **`instrumentation-client.ts`** (new) — Client-side PostHog initialization using `posthog.init()` with a reverse proxy (`/ingest`), exception capture enabled, and debug mode in development.
- **`next.config.ts`** — Added reverse proxy rewrites for `/ingest/static/*`, `/ingest/array/*`, and `/ingest/*` pointing to PostHog's US asset and ingestion endpoints, plus `skipTrailingSlashRedirect: true`.
- **`lib/posthog-server.ts`** (new) — Singleton `getPostHogClient()` factory for server-side PostHog Node.js usage with `flushAt: 1` and `flushInterval: 0` for immediate flushing.
- **`.env.local`** — `NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN` and `NEXT_PUBLIC_POSTHOG_HOST` set with correct values.

| Event name | Description | File |
|---|---|---|
| `user_logged_in` | User successfully authenticated and is redirected to My Activities. | `components/auth/login-form.tsx` |
| `user_login_failed` | User submitted the login form but authentication failed. | `components/auth/login-form.tsx` |
| `user_logged_out` | User clicked Log out from the avatar dropdown menu. | `components/layout/avatar-menu.tsx` |
| `role_view_switched` | User toggled between User and Administrator view modes in the avatar menu. | `components/layout/avatar-menu.tsx` |
| `new_task_modal_opened` | User clicked the New task button to open the task creation modal. | `components/my-activities/my-activities-view.tsx` |
| `task_created` | User submitted the new task form and a task was added to My Activities. | `components/my-activities/my-activities-view.tsx` |
| `task_marked_done` | User clicked the check button to mark a task as complete. | `components/my-activities/my-activities-view.tsx` |
| `task_follow_up_toggled` | User toggled the follow-up flag on a task. | `components/my-activities/my-activities-view.tsx` |
| `activity_filter_selected` | User clicked a filter chip to narrow the task list. | `components/my-activities/activity-filters.tsx` |
| `task_clicked` | User clicked on a task row to navigate to the task detail page. | `components/my-activities/task-row.tsx` |
| `user_login_server` | Server-side event captured when a user's login server action is invoked. | `actions/profile.ts` |

User identification (`posthog.identify()`) is called in `components/auth/login-form.tsx` on successful login using the user's email as the distinct ID. `posthog.reset()` is called on logout in `components/layout/avatar-menu.tsx`.

## Next steps

We've built some insights and a dashboard for you to keep an eye on user behavior, based on the events we just instrumented:

- [Analytics basics (wizard) — Dashboard](https://us.posthog.com/project/465694/dashboard/1740549)
- [Daily Logins](https://us.posthog.com/project/465694/insights/8oUMNZH5)
- [Login to Task Created Funnel](https://us.posthog.com/project/465694/insights/cK5VQpia)
- [Tasks Completed Per Day](https://us.posthog.com/project/465694/insights/G88EIZpO)
- [Weekly Active Users](https://us.posthog.com/project/465694/insights/cx1REmPv)
- [Task Activity Overview](https://us.posthog.com/project/465694/insights/0akqixwq)

## Verify before merging

- [ ] Run a full production build (the wizard only verified the files it touched) and fix any lint or type errors introduced by the generated code.
- [ ] Run the test suite — call sites that were rewritten or instrumented may need updated mocks or fixtures.
- [ ] Add `NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN` and `NEXT_PUBLIC_POSTHOG_HOST` to `.env.example` and any monorepo/bootstrap scripts so collaborators know what to set.
- [ ] Wire source-map upload (`posthog-cli sourcemap` or your bundler's upload step) into CI so production stack traces de-minify.
- [ ] Confirm the returning-visitor path also calls `identify` — a handler that only identifies on fresh login can leave returning sessions on anonymous distinct IDs.

### Agent skill

We've left an agent skill folder in your project. You can use this context for further agent development when using Claude Code. This will help ensure the model provides the most up-to-date approaches for integrating PostHog.
