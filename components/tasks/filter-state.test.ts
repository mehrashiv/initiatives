import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  DEFAULT_TASKS_STATE,
  matchesFilters,
  parseTasksQuery,
  readSavedState,
  sanitizeState,
  serializeState,
  storageKey,
  writeSavedState,
  type TasksPageState,
} from "./filter-state";

const VALID = {
  projectIds: ["p1", "p2", "p3"],
  initiativeIds: ["i1", "i2"],
  ownerIds: ["u1", "u2"],
  projectInitiativeIds: { p1: "i1", p2: "i1", p3: "i2" },
};

const state = (overrides: Partial<TasksPageState>): TasksPageState => ({ ...DEFAULT_TASKS_STATE, ...overrides });

describe("serializeState", () => {
  it("is empty for the default state", () => {
    expect(serializeState(DEFAULT_TASKS_STATE)).toBe("");
  });

  it("writes keys in a fixed order with comma separated lists and leaves defaults out", () => {
    const full = state({
      statuses: ["in_progress", "done"],
      owners: ["u2"],
      projects: ["p1", "p2"],
      initiative: "i1",
      view: "gantt",
    });
    expect(serializeState(full)).toBe("?view=gantt&initiative=i1&projects=p1,p2&owners=u2&status=in_progress,done");
    expect(serializeState(state({ statuses: ["done"] }))).toBe("?status=done");
  });

  it("round trips through parse and sanitize", () => {
    const original = state({
      view: "gantt",
      initiative: "i2",
      projects: ["p3"],
      owners: ["u1", "u2"],
      statuses: ["blocked"],
    });
    const { raw, hasQuery } = parseTasksQuery(new URLSearchParams(serializeState(original)));

    expect(hasQuery).toBe(true);
    expect(sanitizeState(raw, VALID)).toEqual(original);
  });
});

describe("parseTasksQuery", () => {
  it("reports no query when none of the five keys is present", () => {
    expect(parseTasksQuery({}).hasQuery).toBe(false);
    expect(parseTasksQuery({ utm_source: "mail" }).hasQuery).toBe(false);
  });

  it("counts a present key even when its value is invalid", () => {
    expect(parseTasksQuery({ view: "nope" }).hasQuery).toBe(true);
  });

  it("takes the first value of a repeated key", () => {
    expect(parseTasksQuery({ view: ["gantt", "kanban"] }).raw.view).toBe("gantt");
  });
});

describe("sanitizeState", () => {
  it("drops an unknown view, ids and statuses", () => {
    const { raw } = parseTasksQuery({
      view: "table",
      initiative: "gone",
      projects: "p1,deleted",
      owners: "u1,left",
      status: "done,archived",
    });

    expect(sanitizeState(raw, VALID)).toEqual(state({ projects: ["p1"], owners: ["u1"], statuses: ["done"] }));
  });

  it("drops selected projects outside the chosen initiative", () => {
    const { raw } = parseTasksQuery({ initiative: "i1", projects: "p1,p3" });

    expect(sanitizeState(raw, VALID)).toEqual(state({ initiative: "i1", projects: ["p1"] }));
  });

  it("removes duplicates and tolerates wrong types", () => {
    expect(sanitizeState({ projects: ["p1", "p1", 7], owners: "u1", view: 3 }, VALID)).toEqual(
      state({ projects: ["p1"] }),
    );
    expect(sanitizeState(null, VALID)).toEqual(DEFAULT_TASKS_STATE);
    expect(sanitizeState("junk", VALID)).toEqual(DEFAULT_TASKS_STATE);
  });
});

describe("matchesFilters", () => {
  const task = { projectId: "p1", ownerId: "u1", status: "to_do" as const };

  it("matches everything with no filters", () => {
    expect(matchesFilters(task, DEFAULT_TASKS_STATE, VALID.projectInitiativeIds)).toBe(true);
  });

  it("ORs values inside one filter and ANDs across filters", () => {
    expect(matchesFilters(task, state({ statuses: ["to_do", "done"] }), VALID.projectInitiativeIds)).toBe(true);
    expect(matchesFilters(task, state({ statuses: ["to_do"], owners: ["u2"] }), VALID.projectInitiativeIds)).toBe(
      false,
    );
    expect(matchesFilters(task, state({ initiative: "i2" }), VALID.projectInitiativeIds)).toBe(false);
  });
});

describe("saved state", () => {
  beforeEach(() => window.localStorage.clear());
  afterEach(() => vi.restoreAllMocks());

  it("stores state per user under a versioned key", () => {
    writeSavedState("u1", state({ view: "gantt" }));

    expect(JSON.parse(window.localStorage.getItem(storageKey("u1"))!)).toMatchObject({ v: 1, view: "gantt" });
    expect(readSavedState("u1")).toMatchObject({ view: "gantt" });
    expect(readSavedState("u2")).toBeNull();
  });

  it("treats bad JSON or a wrong version as nothing saved", () => {
    window.localStorage.setItem(storageKey("u1"), "{not json");
    expect(readSavedState("u1")).toBeNull();

    window.localStorage.setItem(storageKey("u1"), JSON.stringify({ v: 2, view: "gantt" }));
    expect(readSavedState("u1")).toBeNull();
  });

  it("never throws when storage is unavailable", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("quota");
    });

    expect(readSavedState("u1")).toBeNull();
    expect(() => writeSavedState("u1", DEFAULT_TASKS_STATE)).not.toThrow();
  });
});
