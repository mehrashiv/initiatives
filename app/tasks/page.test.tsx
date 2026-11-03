import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ReactElement } from "react";
import { getServerClient } from "@/lib/insforge-server";
import { DEFAULT_TASKS_STATE } from "@/components/tasks/filter-state";
import TasksPage from "./page";

// System boundaries only: the InsForge server client, the router redirect, and the client view
// (rendered elsewhere; here only the props the server hands it matter).
vi.mock("@/lib/insforge-server", () => ({ getServerClient: vi.fn() }));
vi.mock("next/navigation", () => ({
  redirect: vi.fn((path: string) => {
    throw new Error(`redirect:${path}`);
  }),
}));
vi.mock("@/components/tasks/tasks-view", () => ({ TasksView: () => null }));

type Row = Record<string, unknown>;

const TABLES: Record<string, Row[]> = {
  profiles: [
    { id: "u1", name: "Shiv Mehra", role: "admin" },
    { id: "u2", name: "Srinivas Neerukonda", role: "user" },
  ],
  initiatives: [
    { id: "i1", name: "Hands On Lab" },
    { id: "i2", name: "Documentation" },
  ],
  projects: [
    { id: "p1", name: "HOL Infrastructure", initiative_id: "i1", status: "active" },
    { id: "p3", name: "Tech Docs Cleanup", initiative_id: "i2", status: "active" },
  ],
  tasks: [
    { id: "t1", project_id: "p1", name: "Rack the servers", status: "to_do", start_date: "2026-11-01", end_date: "2026-11-20", delivery_date: null, progress: 0, blocker_owner: null, flagged: false, owner: "u1" },
    { id: "t2", project_id: "p3", name: "Fix the typos", status: "done", start_date: "2026-11-01", end_date: "2026-11-20", delivery_date: null, progress: 0, blocker_owner: null, flagged: false, owner: "u2" },
  ],
};

// A tiny PostgREST style query: chained eq filters apply to the rows, and awaiting it resolves { data }.
function query(rows: Row[]) {
  let current = rows;
  const q = {
    select: () => q,
    order: () => q,
    eq: (column: string, value: unknown) => {
      current = current.filter((r) => r[column] === value);
      return q;
    },
    single: () => Promise.resolve({ data: current[0] ?? null }),
    then: (resolve: (v: { data: Row[] }) => unknown) => Promise.resolve({ data: current }).then(resolve),
  };
  return q;
}

function signIn(userId: string | null) {
  vi.mocked(getServerClient).mockResolvedValue({
    auth: {
      getCurrentUser: async () => ({
        data: { user: userId ? { id: userId, email: `${userId}@example.com`, profile: { name: "Signed In" } } : null },
      }),
    },
    database: { from: (table: string) => query(TABLES[table]) },
  } as unknown as Awaited<ReturnType<typeof getServerClient>>);
}

async function renderPage(params: Record<string, string | string[] | undefined>) {
  const element = (await TasksPage({ searchParams: Promise.resolve(params) })) as ReactElement<Record<string, unknown>>;
  return element.props;
}

beforeEach(() => {
  vi.clearAllMocks();
  signIn("u1");
});

describe("TasksPage", () => {
  // covers: AC-2 (the first render already has the URL's view and filters)
  it("hands the view and filters from the URL to the client view", async () => {
    const props = await renderPage({ view: "gantt", status: "in_progress,done", owners: "u2" });

    expect(props.hasQuery).toBe(true);
    expect(props.initialState).toEqual({ ...DEFAULT_TASKS_STATE, view: "gantt", statuses: ["in_progress", "done"], owners: ["u2"] });
  });

  // covers: AC-5 (a bare /tasks lets the client restore the saved state)
  it("reports no query and default state for a bare /tasks", async () => {
    const props = await renderPage({});

    expect(props.hasQuery).toBe(false);
    expect(props.initialState).toEqual(DEFAULT_TASKS_STATE);
  });

  // covers: AC-8 (stale links heal against the live id lists)
  it("drops ids and values that do not exist in the database", async () => {
    const props = await renderPage({ projects: "p1,gone", owners: "ghost", status: "done,archived", view: "table" });

    expect(props.initialState).toEqual({ ...DEFAULT_TASKS_STATE, projects: ["p1"], statuses: ["done"] });
  });

  // covers: AC-8 (projects outside the chosen initiative are dropped)
  it("drops a selected project that belongs to another initiative", async () => {
    const props = await renderPage({ initiative: "i2", projects: "p1,p3" });

    expect(props.initialState).toEqual({ ...DEFAULT_TASKS_STATE, initiative: "i2", projects: ["p3"] });
  });

  it("passes sorted initiatives and each project's initiative for filtering", async () => {
    const props = await renderPage({});

    expect(props.initiativeOptions).toEqual([
      { id: "i2", name: "Documentation" },
      { id: "i1", name: "Hands On Lab" },
    ]);
    expect(props.projectInitiativeIds).toEqual({ p1: "i1", p3: "i2" });
  });

  it("loads every task for an admin and only their own for a regular user", async () => {
    const asAdmin = await renderPage({});
    signIn("u2");
    const asUser = await renderPage({});

    expect((asAdmin.initialTasks as { id: string }[]).map((t) => t.id)).toEqual(["t1", "t2"]);
    expect((asUser.initialTasks as { id: string }[]).map((t) => t.id)).toEqual(["t2"]);
  });

  it("sends a signed out visitor to /login", async () => {
    signIn(null);

    await expect(renderPage({ view: "gantt" })).rejects.toThrow("redirect:/login");
  });
});
