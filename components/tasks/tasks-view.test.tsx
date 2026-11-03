import { beforeEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import posthog from "posthog-js";
import { ViewAsProvider, useViewAs } from "@/components/layout/view-as-context";
import { createTask } from "@/actions/tasks";
import { insforge } from "@/lib/insforge-client";
import type { Role, TaskStatus } from "@/types";
import { TasksView } from "./tasks-view";
import { DEFAULT_TASKS_STATE, storageKey, type TasksPageState } from "./filter-state";
import type { TaskChangedPayload } from "./task-helpers";
import type { BoardTask } from "./types";

// System boundaries only: the realtime socket, server actions, analytics and the router.
vi.mock("@/lib/insforge-client", () => ({
  insforge: {
    realtime: {
      connect: vi.fn().mockResolvedValue(undefined),
      subscribe: vi.fn().mockResolvedValue({ ok: true }),
      unsubscribe: vi.fn(),
      disconnect: vi.fn(),
      on: vi.fn(),
      off: vi.fn(),
    },
  },
}));
vi.mock("@/actions/tasks", () => ({ updateTaskStatus: vi.fn(), createTask: vi.fn() }));
vi.mock("posthog-js", () => ({ default: { capture: vi.fn() } }));
const mockRouterReplace = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), back: vi.fn(), replace: mockRouterReplace }),
  useSearchParams: () => new URLSearchParams(window.location.search),
}));

const SHIV = { id: "u1", name: "Shiv Mehra" };
const SRINI = { id: "u2", name: "Srinivas Neerukonda" };

const projectOptions = [
  { id: "p1", name: "HOL Infrastructure", initiativeName: "Hands On Lab" },
  { id: "p2", name: "Reservation System", initiativeName: "Hands On Lab" },
  { id: "p3", name: "Tech Docs Cleanup", initiativeName: "Documentation" },
];
const projectInitiativeIds = { p1: "i1", p2: "i1", p3: "i2" };
const initiativeOptions = [
  { id: "i2", name: "Documentation" },
  { id: "i1", name: "Hands On Lab" },
];

function task(id: string, name: string, projectId: string, owner: typeof SHIV, status: TaskStatus): BoardTask {
  const project = projectOptions.find((p) => p.id === projectId)!;
  return {
    id,
    name,
    status,
    projectId,
    projectName: project.name,
    initiativeName: project.initiativeName,
    ownerId: owner.id,
    ownerName: owner.name,
    startDate: new Date("2026-11-01T00:00:00"),
    endDate: new Date("2026-11-20T00:00:00"),
    deliveryDate: null,
    progress: 0,
    followUp: false,
    blockedReason: null,
  };
}

const TASKS = [
  task("t1", "Rack the servers", "p1", SHIV, "to_do"),
  task("t2", "Book the demo room", "p2", SRINI, "in_progress"),
  task("t3", "Fix the typos", "p3", SHIV, "done"),
  task("t4", "Write the intro", "p3", SRINI, "to_do"),
];
const ALL_NAMES = TASKS.map((t) => t.name);

// Lets a test switch View As the way the avatar menu does.
function ViewAsSwitch() {
  const { setViewAsRole } = useViewAs();
  return (
    <>
      <button type="button" onClick={() => setViewAsRole("user")}>
        view as user
      </button>
      <button type="button" onClick={() => setViewAsRole("admin")}>
        view as admin
      </button>
    </>
  );
}

interface RenderOptions {
  initialState?: TasksPageState;
  hasQuery?: boolean;
  tasks?: BoardTask[];
}

function renderView(
  role: Role = "admin",
  { initialState = DEFAULT_TASKS_STATE, hasQuery = true, tasks = TASKS }: RenderOptions = {},
) {
  return render(
    <ViewAsProvider realRole={role}>
      <ViewAsSwitch />
      <TasksView
        initialTasks={tasks}
        projectOptions={projectOptions}
        activeProjectOptions={projectOptions}
        initiativeOptions={initiativeOptions}
        projectInitiativeIds={projectInitiativeIds}
        profiles={[SHIV, SRINI]}
        currentUserId={SHIV.id}
        currentUserName={SHIV.name}
        initialState={initialState}
        hasQuery={hasQuery}
      />
    </ViewAsProvider>,
  );
}

const trigger = (label: string) => screen.getByRole("button", { name: new RegExp(`^${label}`) });
const clearFilters = () => screen.queryByRole("button", { name: "Clear filters" });

function expectVisibleTasks(names: string[]) {
  for (const name of ALL_NAMES) {
    if (names.includes(name)) expect(screen.getByText(name)).toBeInTheDocument();
    else expect(screen.queryByText(name)).not.toBeInTheDocument();
  }
}

async function pickInitiative(user: ReturnType<typeof userEvent.setup>, name: string) {
  await user.click(trigger("Initiative"));
  await user.click(screen.getByRole("button", { name: new RegExp(`^${name}`) }));
}

async function check(user: ReturnType<typeof userEvent.setup>, label: string, options: string[]) {
  await user.click(trigger(label));
  for (const option of options) await user.click(screen.getByRole("menuitemcheckbox", { name: new RegExp(option) }));
  await user.click(trigger(label)); // backdrop covers the page; the trigger itself toggles closed
}

const expectGantt = () => expect(screen.getByRole("button", { name: "Gantt" })).toHaveAttribute("aria-pressed", "true");

const columnTitles = () =>
  ["To Do", "In Progress", "Blocked", "Delayed", "Done"].filter((title) =>
    screen.queryByText(title, { selector: "span" }),
  );

const state = (overrides: Partial<TasksPageState>): TasksPageState => ({ ...DEFAULT_TASKS_STATE, ...overrides });
const saved = (userId: string) => JSON.parse(window.localStorage.getItem(storageKey(userId)) ?? "null");

let user: ReturnType<typeof userEvent.setup>;
beforeEach(() => {
  user = userEvent.setup();
  window.history.replaceState(null, "", "/tasks");
  window.localStorage.clear();
  vi.clearAllMocks();
});

describe("TasksView filter bar", () => {
  it("renders the four filters at their defaults with every task and no Clear filters link", () => {
    renderView();

    expect(trigger("Initiative")).toHaveTextContent("All initiatives");
    expect(trigger("Projects")).toHaveTextContent("All projects");
    expect(trigger("Owners")).toHaveTextContent("All owners");
    expect(trigger("Status")).toHaveTextContent("All statuses");
    expectVisibleTasks(ALL_NAMES);
    expect(clearFilters()).not.toBeInTheDocument();
  });

  it("lists initiatives with how many projects each holds", async () => {
    renderView();

    await user.click(trigger("Initiative"));

    expect(screen.getByRole("button", { name: /^All initiatives\s*3 projects$/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^Hands On Lab\s*2 projects$/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^Documentation\s*1 project$/ })).toBeInTheDocument();
  });

  it("narrows to the chosen initiative's tasks and shows Clear filters", async () => {
    renderView();

    await pickInitiative(user, "Hands On Lab");

    expectVisibleTasks(["Rack the servers", "Book the demo room"]);
    expect(clearFilters()).toBeInTheDocument();
  });

  it("prunes the Projects menu to the chosen initiative and titles it for that initiative", async () => {
    renderView();

    await pickInitiative(user, "Hands On Lab");
    await user.click(trigger("Projects"));

    const options = screen.getAllByRole("menuitemcheckbox").map((el) => el.textContent);
    expect(options).toEqual(["HOL Infrastructure", "Reservation System"]);
    expect(screen.getByText("Projects in Hands On Lab")).toBeInTheDocument();
  });

  it("shows each project's initiative as a hint when no initiative is chosen", async () => {
    renderView();

    await user.click(trigger("Projects"));

    expect(screen.getByRole("menuitemcheckbox", { name: /^Tech Docs Cleanup\s*Documentation$/ })).toBeInTheDocument();
  });

  it("matches any of the checked projects", async () => {
    renderView();

    await check(user, "Projects", ["HOL Infrastructure", "Tech Docs Cleanup"]);

    expectVisibleTasks(["Rack the servers", "Fix the typos", "Write the intro"]);
    expect(trigger("Projects")).toHaveTextContent(/2 projects/);
  });

  it("drops checked projects that fall outside a newly chosen initiative", async () => {
    renderView();

    await check(user, "Projects", ["HOL Infrastructure", "Tech Docs Cleanup"]);
    await pickInitiative(user, "Hands On Lab");

    expect(trigger("Projects")).toHaveTextContent("HOL Infrastructure");
    expectVisibleTasks(["Rack the servers"]);
  });

  it("keeps checked projects when the initiative goes back to All", async () => {
    renderView();

    await pickInitiative(user, "Hands On Lab");
    await check(user, "Projects", ["Reservation System"]);
    await pickInitiative(user, "All initiatives");

    expect(trigger("Projects")).toHaveTextContent("Reservation System");
    expectVisibleTasks(["Book the demo room"]);
  });

  it("matches any of the checked owners", async () => {
    renderView();

    await check(user, "Owners", ["Srinivas Neerukonda"]);

    expectVisibleTasks(["Book the demo room", "Write the intro"]);
  });

  it("lists owners with their initials", async () => {
    renderView();

    await user.click(trigger("Owners"));

    expect(screen.getByRole("menuitemcheckbox", { name: /^SM\s*Shiv Mehra$/ })).toBeInTheDocument();
    expect(screen.getByRole("menuitemcheckbox", { name: /^SN\s*Srinivas Neerukonda$/ })).toBeInTheDocument();
  });

  it("combines different filters so a task must pass all of them", async () => {
    renderView();

    await check(user, "Owners", ["Shiv Mehra"]);
    await check(user, "Status", ["To Do", "Done"]);
    await pickInitiative(user, "Documentation");

    expectVisibleTasks(["Fix the typos"]);
  });

  it("shows only the checked status columns on Kanban, and all five again once Status is cleared", async () => {
    renderView();

    await check(user, "Status", ["To Do", "Done"]);
    expect(columnTitles()).toEqual(["To Do", "Done"]);
    expectVisibleTasks(["Rack the servers", "Fix the typos", "Write the intro"]);

    await user.click(trigger("Status"));
    await user.click(screen.getByRole("button", { name: "Clear" }));
    await user.click(trigger("Status"));

    expect(columnTitles()).toEqual(["To Do", "In Progress", "Blocked", "Delayed", "Done"]);
  });

  it("applies the same filters to the Gantt view", async () => {
    renderView();

    await check(user, "Owners", ["Srinivas Neerukonda"]);
    await user.click(screen.getByRole("button", { name: "Gantt" }));

    expectVisibleTasks(["Book the demo room", "Write the intro"]);
  });

  it("resets every filter with Clear filters, which then hides itself", async () => {
    renderView();

    await pickInitiative(user, "Hands On Lab");
    await check(user, "Owners", ["Shiv Mehra"]);
    await check(user, "Status", ["To Do"]);
    await user.click(clearFilters()!);

    expect(trigger("Initiative")).toHaveTextContent("All initiatives");
    expect(trigger("Projects")).toHaveTextContent("All projects");
    expect(trigger("Owners")).toHaveTextContent("All owners");
    expect(trigger("Status")).toHaveTextContent("All statuses");
    expectVisibleTasks(ALL_NAMES);
    expect(clearFilters()).not.toBeInTheDocument();
  });

  it("shows the empty state when no task matches the combination", async () => {
    renderView();

    await check(user, "Owners", ["Shiv Mehra"]);
    await check(user, "Status", ["In Progress"]);

    expectVisibleTasks([]);
    expect(screen.getByText("No tasks match these filters")).toBeInTheDocument();
  });

  it("filters within a regular user's own tasks only", async () => {
    renderView("user");

    expectVisibleTasks(["Rack the servers", "Fix the typos"]);
    await pickInitiative(user, "Documentation");

    expectVisibleTasks(["Fix the typos"]);
  });
});

describe("TasksView saved page state", () => {
  it("shows the view and filters from the URL on the first render", () => {
    renderView("admin", { initialState: state({ view: "gantt", statuses: ["done"] }) });

    expect(trigger("Status")).toHaveTextContent("Done");
    expectGantt();
    expectVisibleTasks(["Fix the typos"]);
  });

  it("mirrors each filter and view change into the URL without a router call or history entry", async () => {
    renderView();
    const historyLength = window.history.length;

    await check(user, "Status", ["In Progress", "Done"]);
    expect(window.location.search).toBe("?status=in_progress,done");

    await user.click(screen.getByRole("button", { name: "Gantt" }));
    expect(window.location.search).toBe("?view=gantt&status=in_progress,done");

    expect(window.history.length).toBe(historyLength);
    expect(mockRouterReplace).not.toHaveBeenCalled();
  });

  it("holds the filter row and board on a bare /tasks during the server render", async () => {
    const { renderToString } = await import("react-dom/server");
    const html = renderToString(
      <ViewAsProvider realRole="admin">
        <TasksView
          initialTasks={TASKS}
          projectOptions={projectOptions}
          activeProjectOptions={projectOptions}
          initiativeOptions={initiativeOptions}
          projectInitiativeIds={projectInitiativeIds}
          profiles={[SHIV, SRINI]}
          currentUserId={SHIV.id}
          currentUserName={SHIV.name}
          initialState={DEFAULT_TASKS_STATE}
          hasQuery={false}
        />
      </ViewAsProvider>,
    );

    expect(html).toContain("New task");
    expect(html).not.toContain("All initiatives");
    expect(html).not.toContain("Rack the servers");
  });

  it("restores the signed in user's saved state on a bare /tasks and writes it to the URL", () => {
    window.localStorage.setItem(
      storageKey(SHIV.id),
      JSON.stringify({ v: 1, ...state({ view: "gantt", statuses: ["done"] }) }),
    );

    renderView("admin", { hasQuery: false });

    expectVisibleTasks(["Fix the typos"]);
    expectGantt();
    expect(window.location.search).toBe("?view=gantt&status=done");
  });

  it("shows defaults on a bare /tasks with nothing saved", () => {
    renderView("admin", { hasQuery: false });

    expectVisibleTasks(ALL_NAMES);
    expect(window.location.search).toBe("");
  });

  it("never applies another user's saved state", async () => {
    window.localStorage.setItem(storageKey(SRINI.id), JSON.stringify({ v: 1, ...state({ statuses: ["done"] }) }));

    renderView("admin", { hasQuery: false });
    expectVisibleTasks(ALL_NAMES);

    await check(user, "Owners", ["Shiv Mehra"]);
    expect(saved(SHIV.id)).toMatchObject({ owners: [SHIV.id] });
    expect(saved(SRINI.id)).toMatchObject({ statuses: ["done"], owners: [] });
  });

  it("drops unknown saved values and saves the cleaned state", () => {
    window.localStorage.setItem(
      storageKey(SHIV.id),
      JSON.stringify({
        v: 1,
        view: "table",
        initiative: "i1",
        projects: ["p1", "p3", "gone"],
        owners: [],
        statuses: ["archived"],
      }),
    );

    renderView("admin", { hasQuery: false });

    expect(window.location.search).toBe("?initiative=i1&projects=p1");
    expect(saved(SHIV.id)).toMatchObject({ view: "kanban", initiative: "i1", projects: ["p1"], statuses: [] });
  });

  it("cleans a URL that held values the server dropped", () => {
    window.history.replaceState(null, "", "/tasks?status=done,archived&projects=gone");

    renderView("admin", { initialState: state({ statuses: ["done"] }) });

    expect(window.location.search).toBe("?status=done");
  });

  it("clears the filters in the page, URL and saved state but keeps the view", async () => {
    renderView("admin", { initialState: state({ view: "gantt", owners: [SRINI.id], statuses: ["to_do"] }) });

    await user.click(clearFilters()!);

    expectVisibleTasks(ALL_NAMES);
    expectGantt();
    expect(window.location.search).toBe("?view=gantt");
    expect(saved(SHIV.id)).toMatchObject({ view: "gantt", owners: [], statuses: [] });
  });

  it("still works when browser storage throws", async () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("quota");
    });

    renderView("admin", { hasQuery: false });
    expectVisibleTasks(ALL_NAMES);

    await check(user, "Status", ["Done"]);
    expect(window.location.search).toBe("?status=done");
    vi.restoreAllMocks();
  });

  it("still works when the saved value is bad JSON", () => {
    window.localStorage.setItem(storageKey(SHIV.id), "{oops");

    renderView("admin", { hasQuery: false });

    expectVisibleTasks(ALL_NAMES);
  });
});

describe("TasksView empty states and subtitle", () => {
  it("shows the unfiltered empty state with no button when there are no tasks", () => {
    renderView("admin", { tasks: [] });

    expect(screen.getByText("No tasks yet")).toBeInTheDocument();
    expect(screen.getByText("Create a task to get started.")).toBeInTheDocument();
    expect(clearFilters()).not.toBeInTheDocument();
  });

  it("offers Clear filters in the filtered empty state", async () => {
    renderView("admin", { initialState: state({ owners: [SHIV.id], statuses: ["in_progress"] }) });

    expect(screen.getByText("Try removing a filter or clearing them all.")).toBeInTheDocument();
    const buttons = screen.getAllByRole("button", { name: "Clear filters" });
    await user.click(buttons[buttons.length - 1]);

    expectVisibleTasks(ALL_NAMES);
  });

  it("counts the filtered set against the View As scope", async () => {
    renderView();
    expect(screen.getByText("4 tasks across your projects")).toBeInTheDocument();

    await check(user, "Owners", ["Srinivas Neerukonda"]);
    expect(screen.getByText("Showing 2 of 4 tasks")).toBeInTheDocument();
  });

  it("uses the singular for one task", () => {
    renderView("admin", { tasks: [TASKS[0]], initialState: state({ statuses: ["done"] }) });

    expect(screen.getByText("Showing 0 of 1 task")).toBeInTheDocument();
  });

  it("keeps the filters when View As changes and brings the result back when it changes again", async () => {
    renderView("admin", { initialState: state({ owners: [SRINI.id] }) });
    expectVisibleTasks(["Book the demo room", "Write the intro"]);

    await user.click(screen.getByRole("button", { name: "view as user" }));
    expect(screen.getByText("No tasks match these filters")).toBeInTheDocument();
    expect(trigger("Owners")).toHaveTextContent("Srinivas Neerukonda");

    await user.click(screen.getByRole("button", { name: "view as admin" }));
    expectVisibleTasks(["Book the demo room", "Write the intro"]);
  });
});

describe("TasksView hidden tasks", () => {
  function realtimeHandler() {
    const call = vi.mocked(insforge.realtime.on).mock.calls.find(([event]) => event === "task_changed");
    return call![1] as (payload: TaskChangedPayload) => void;
  }

  const row = (status: TaskStatus): TaskChangedPayload => ({
    op: "insert",
    id: "t9",
    project_id: "p1",
    name: "Cable the rack",
    status,
    start_date: "2026-11-02",
    end_date: "2026-11-10",
    delivery_date: null,
    progress: 0,
    blocker_owner: null,
    flagged: false,
    owner: SHIV.id,
  });

  it("keeps a realtime task hidden until it matches the filters", () => {
    renderView("admin", { initialState: state({ statuses: ["to_do"] }) });
    const onTaskChanged = realtimeHandler();

    act(() => onTaskChanged(row("done")));
    expect(screen.queryByText("Cable the rack")).not.toBeInTheDocument();

    act(() => onTaskChanged({ ...row("to_do"), op: "update" }));
    expect(screen.getByText("Cable the rack")).toBeInTheDocument();
  });

  async function createTaskThroughModal(container: HTMLElement) {
    vi.mocked(createTask).mockResolvedValue({ ok: true, taskId: "t9", createdAt: "2026-11-03T10:00:00Z" });
    await user.click(screen.getByRole("button", { name: "New task" }));
    await user.type(screen.getByPlaceholderText("e.g. Record onboarding walkthrough"), "Cable the rack");
    await user.selectOptions(screen.getByDisplayValue("Select a project…"), "p1");
    fireEvent.change(container.querySelectorAll('input[type="date"]')[1], { target: { value: "2026-11-30" } });
    await user.click(screen.getByRole("button", { name: "Create task" }));
  }

  it("tells the user when a created task is hidden by the filters, with a working Clear filters", async () => {
    const { container } = renderView("admin", { initialState: state({ statuses: ["done"] }) });

    await createTaskThroughModal(container);

    const toast = await screen.findByText("Task created. Hidden by your filters.");
    expect(screen.queryByText("Cable the rack")).not.toBeInTheDocument();

    await user.click(within(toast).getByRole("button", { name: "Clear filters" }));
    expect(screen.getByText("Cable the rack")).toBeInTheDocument();
    expect(screen.queryByText("Task created. Hidden by your filters.")).not.toBeInTheDocument();
  });

  it("shows the usual toast when the created task is visible", async () => {
    const { container } = renderView();

    await createTaskThroughModal(container);

    expect(await screen.findByText("Task created")).toBeInTheDocument();
    expect(screen.getByText("Cable the rack")).toBeInTheDocument();
  });

  // covers: AC-13 (the check uses the filters in place when the create finishes)
  it("judges a created task against the filters in place when the create finishes", async () => {
    let finishCreate!: (value: Awaited<ReturnType<typeof createTask>>) => void;
    vi.mocked(createTask).mockReturnValue(new Promise((resolve) => (finishCreate = resolve)));
    const { container } = renderView("admin", { initialState: state({ statuses: ["done"] }) });
    await user.click(screen.getByRole("button", { name: "New task" }));
    await user.type(screen.getByPlaceholderText("e.g. Record onboarding walkthrough"), "Cable the rack");
    await user.selectOptions(screen.getByDisplayValue("Select a project…"), "p1");
    fireEvent.change(container.querySelectorAll('input[type="date"]')[1], { target: { value: "2026-11-30" } });
    await user.click(screen.getByRole("button", { name: "Create task" }));

    // While the create is still in flight, the user closes the modal and clears the Status filter.
    await user.click(screen.getByRole("button", { name: "Cancel" }));
    await user.click(clearFilters()!);
    await act(async () => finishCreate({ ok: true, taskId: "t9", createdAt: "2026-11-03T10:00:00Z" }));

    expect(screen.getByText("Task created")).toBeInTheDocument();
    expect(screen.queryByText("Task created. Hidden by your filters.")).not.toBeInTheDocument();
    expect(screen.getByText("Cable the rack")).toBeInTheDocument();
  });

  // covers: AC-13 (the hidden toast lasts 6 seconds)
  it("keeps the hidden toast up for six seconds", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    try {
      user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      const { container } = renderView("admin", { initialState: state({ statuses: ["done"] }) });
      await createTaskThroughModal(container);
      await screen.findByText("Task created. Hidden by your filters.");

      act(() => vi.advanceTimersByTime(5800));
      expect(screen.getByText("Task created. Hidden by your filters.")).toBeInTheDocument();

      act(() => vi.advanceTimersByTime(400));
      expect(screen.queryByText("Task created. Hidden by your filters.")).not.toBeInTheDocument();
    } finally {
      vi.useRealTimers();
    }
  });
});

describe("TasksView filter analytics", () => {
  const filterEvents = () =>
    vi
      .mocked(posthog.capture)
      .mock.calls.filter(([event]) => event === "task_filter_selected")
      .map(([, props]) => props);

  it("sends task_filter_selected for each user change and for Clear filters", async () => {
    renderView();

    await pickInitiative(user, "Hands On Lab");
    await check(user, "Owners", ["Shiv Mehra", "Srinivas Neerukonda"]);
    await user.click(clearFilters()!);

    expect(filterEvents()).toEqual([
      { filter: "initiative", count: 1 },
      { filter: "owners", count: 1 },
      { filter: "owners", count: 2 },
      { filter: "clear", count: 0 },
    ]);
  });

  it("sends nothing when state is restored or read from the URL", () => {
    window.localStorage.setItem(storageKey(SHIV.id), JSON.stringify({ v: 1, ...state({ statuses: ["done"] }) }));
    renderView("admin", { hasQuery: false });
    renderView("admin", { initialState: state({ owners: [SHIV.id] }) });

    expect(filterEvents()).toEqual([]);
  });
});
