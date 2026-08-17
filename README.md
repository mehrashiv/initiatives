# Initiative Tracker

An internal webapp for tracking strategic initiatives and the projects and tasks that deliver them. It replaces spreadsheets and Slack threads with a real data model: every **Initiative** breaks down into **Projects**, every Project breaks down into **Tasks**, and every Task carries an owner, a status, dates, and an append-only activity timeline. A portfolio-level **Dashboard** gives leadership a live view of what's on track, at risk, or overdue.

Core pages: My Activities (personal task list), Dashboard (KPIs/charts), Initiatives, Projects, Tasks (Kanban + Gantt), Task Detail (fields + live activity timeline), and admin-only User Management.

See [`context/project-overview.md`](context/project-overview.md) for the full product spec.

## Quick Start

**Assumptions:**
- You already have an InsForge project created (via the InsForge dashboard) and its API key/base URL — creating the InsForge project itself is out of scope here.
- You do **not** need a PostHog project yet — step 4 below creates one (or links an existing one) for you.
- Node.js 20+ and npm are installed.

**Steps:**

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Install the build-workflow skills** — `/architect`, `/remember`, `/imprint`, `/review`, `/recover`, the AI-agent skills referenced throughout `AGENTS.md` and used in "Building This Project" below. They're built by [JavaScript Mastery](https://www.youtube.com/@javascriptmastery) ([JavaScript-Mastery-Pro/skills](https://github.com/JavaScript-Mastery-Pro/skills), MIT licensed) and aren't bundled with this repo, so install them once for your coding agent:
   ```bash
   npx skills@latest add JavaScript-Mastery-Pro/skills
   ```

4. **Connect the InsForge MCP server** (lets your coding agent call InsForge's `fetch-docs`/`run-raw-sql`/`get-table-schema` tools directly — needed if you're continuing development with an AI agent, not just running the app):
   ```bash
   npx @insforge/install --client claude-code --env API_KEY=<your-insforge-api-key> --env API_BASE_URL=<your-insforge-base-url>
   ```

5. **Link the InsForge CLI** to the same project (this is the human-facing counterpart to step 4's MCP server — used below to apply database migrations):
   ```bash
   npx @insforge/cli login
   npx @insforge/cli link
   ```
   Then create `.env.local` in the project root with your InsForge values (from the InsForge dashboard):
   ```
   NEXT_PUBLIC_INSFORGE_URL=
   NEXT_PUBLIC_INSFORGE_ANON_KEY=
   INSFORGE_API_KEY=
   ```
   Apply the database schema — nothing in the app does this automatically, so this step is required before the app can run:
   ```bash
   npx @insforge/cli db migrations up --all
   ```

6. **Set up PostHog from scratch.** If you don't already have a PostHog account, run the setup wizard — it opens your browser to sign up/log in and create a project for you:
   ```bash
   npx -y @posthog/wizard@latest
   ```
   The wizard authenticates, then writes `NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN` and `NEXT_PUBLIC_POSTHOG_HOST` into `.env.local` automatically — no manual copy-pasting needed. (The event instrumentation itself is already built into this codebase; the wizard here is just provisioning your own project and credentials.)

7. **Bootstrap the first user.** There's no public signup form, and the in-app User Management screen requires an existing admin to use it. Create one user via the InsForge Auth dashboard, then promote them to admin:
   ```bash
   npx @insforge/cli db query "UPDATE profiles SET role='admin' WHERE email='you@example.com'"
   ```

8. **Run it**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) and log in with the user from step 7.

## How This Was Built

This project was built almost entirely by an AI coding agent (Claude Code), not hand-written. The workflow was:

1. **Write the spec first, as files, not prompts.** Before any code existed, a set of context documents were written under [`context/`](context/) — product overview, architecture/stack decisions, UI tokens, layout rules, code standards, library notes, a feature-by-feature build plan, and a progress tracker.
2. **[`AGENTS.md`](AGENTS.md)** is the contract the agent must follow on every session: it fixes the exact order those context files must be read in, the non-negotiable rules (no hardcoded colors, every page through the shared page-container, update the progress tracker and UI registry after every feature, etc.), and which skills to reach for and when.
3. **Build feature-by-feature, not all at once.** The agent worked through [`context/build-plan.md`](context/build-plan.md) one numbered feature at a time, using `/architect` to think through each feature before writing code, `/imprint` to capture new UI patterns into `context/ui-registry.md` after building them, and `/review` before considering a feature done.
4. **Session continuity via memory.** Because a feature can span multiple chat sessions, `/remember save` and `/remember restore` were used to persist and reload progress, and `context/progress-tracker.md` was kept current as the single source of truth for what's shipped vs. next.
5. **Backend and analytics were wired up interactively**, via the InsForge MCP server (database, auth, RLS, realtime) and the PostHog setup wizard — see Quick Start above.

The result: a full-stack app where the database schema, RLS policies, every page, and the analytics instrumentation were all generated by the agent against a fixed spec, with a human reviewing and steering at each feature boundary rather than writing the code by hand.

## Tech Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 16 (App Router), React 19, TypeScript (strict) |
| Backend | [InsForge](https://insforge.dev) — Auth, Postgres + RLS, Storage, Realtime (one service) |
| Analytics | PostHog (browser + server) |
| Styling | Tailwind CSS v4 (`@theme` in `globals.css`, no `tailwind.config.ts`) + shadcn/ui |
| Charts | recharts |
| Validation | zod |

> ⚠️ This is **not** the Next.js you already know — see the note at the top of [`AGENTS.md`](AGENTS.md). It pins specific framework conventions (e.g. `instrumentation-client.ts` for client PostHog init instead of a Provider) that differ from older Next.js versions. Read the relevant docs under `node_modules/next/dist/docs/` before assuming familiar APIs still apply.

## Prerequisites

- **Node.js 20+** and npm
- **An InsForge backend** — database, auth, storage, and realtime all come from this. **Setting up the InsForge project itself is out of scope of this README** — see Quick Start above for connecting to one you already have, or [insforge.dev](https://insforge.dev) to create one.
- **A PostHog account** — Quick Start above walks through creating a project via the setup wizard, so no PostHog project needs to exist ahead of time.
- **An AI coding agent (Claude Code)** — not required to *run* the app, but required to follow the build process this repo was designed around (see `AGENTS.md` and the skills it references: `/architect`, `/imprint`, `/review`, `/recover`, `/remember`). Install them via Quick Start step 2 — see Credits below.

`OPENAI_API_KEY` in `.env.local` is reserved for a future AI-summary feature — not used in v1, so it can be left blank.

## Building This Project

These are the steps used to build this app from an empty Next.js project, in order. They assume you're driving Claude Code (or a similarly capable coding agent) interactively, reviewing its output between steps rather than running them unattended.

### 1. Load the spec
Read `AGENTS.md` and follow its reading order through every file in `context/`. Don't write any code until the agent confirms it has read all of them — they're the entire spec for the app.

### 2. Set up styling
Install the Tailwind CSS skills (`tailwind-css`, `tailwind-css-patterns`, `tailwind-utility-classes`, `tailwind-best-practices`). Read `context/ui-tokens.md`, then configure `app/globals.css` for Tailwind v4 (`@theme`, no `tailwind.config.ts`).

### 3. Build the first page
Build the landing page (My Activities) against the UX mock in `context/designs/My Activities.dc.html`, using assets from `public/`.

### 4. Connect InsForge
Install the InsForge MCP server for your coding agent (see InsForge's docs for the install command and your project's API key/base URL), then call its `fetch-docs` tool so the agent has current InsForge instructions before writing any backend code. In a new session, re-run `fetch-docs` to confirm the MCP connection still works.

### 5. Add auth
Check `context/progress-tracker.md` and `context/build-plan.md`, fetch the latest InsForge auth docs via MCP, then implement login. Add `.env.local` with the InsForge URL/anon key from your InsForge dashboard. Update `progress-tracker.md`, then run `/imprint` and `/remember save`.

### 6. Add PostHog
Run `npx -y @posthog/wizard@latest` and authenticate in the browser it opens. In a fresh session, have the agent wire up event tracking for real interactions in the app, and confirm events arrive in the PostHog dashboard. Then `/review` and `/remember save`.

### 7. Design the database schema
`/remember restore` to reload context, switch the agent to Plan mode, then run `/architect` against a specific feature from `build-plan.md` (schema design works best thought through feature-by-feature, not all at once).

### 8. Repeat per feature
For every remaining feature in `context/build-plan.md`: `/architect` to plan it, build it, `/imprint` any new UI pattern into `context/ui-registry.md`, `/review` it, update `context/progress-tracker.md`, and `/remember save` before ending the session.

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [InsForge Documentation](https://insforge.dev)
- [PostHog Documentation](https://posthog.com/docs)

## Credits

The `/architect`, `/remember`, `/imprint`, `/review`, and `/recover` skills that structure the build process in this repo were built by **[JavaScript Mastery](https://www.youtube.com/@javascriptmastery)** — [JavaScript-Mastery-Pro/skills](https://github.com/JavaScript-Mastery-Pro/skills) (MIT licensed). They're not original to this project; install them via Quick Start step 2 above. The context files in this project were also adapted from one of JSMastery's project.
