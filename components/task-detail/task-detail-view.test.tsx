import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TaskDetailView } from "./task-detail-view";

// System boundaries only: the realtime socket, server actions and the router.
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
vi.mock("@/actions/tasks", () => ({}));
vi.mock("@/actions/activities", () => ({}));
const mockRouterBack = vi.fn();
const mockRouterPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockRouterPush, back: mockRouterBack, replace: vi.fn() }),
}));

function renderDetail() {
  render(
    <TaskDetailView
      taskId="t1"
      initialName="Rack the lab servers"
      initialDescription=""
      initialStatus="in_progress"
      initialStartDate="2026-11-01"
      initialEndDate="2026-11-10"
      initialDeliveryDate={null}
      initialProgress={0}
      initialBlockerOwner=""
      initialFlagged={false}
      initialOwnerId="u1"
      createdAt={new Date("2026-11-01T00:00:00")}
      updatedAt={new Date("2026-11-01T00:00:00")}
      initialProjectId="p1"
      projectOptions={[{ id: "p1", name: "HOL Infrastructure", initiativeName: "Hands On Lab" }]}
      ownerOptions={[{ id: "u1", name: "Shiv Mehra" }]}
      currentUserId="u1"
      currentUserName="Shiv Mehra"
      initialActivities={[]}
    />,
  );
}

describe("TaskDetailView Back button (AC-4)", () => {
  beforeEach(() => {
    window.sessionStorage.clear();
    mockRouterBack.mockClear();
    mockRouterPush.mockClear();
  });

  it("goes back in history when the user has moved between app pages", async () => {
    window.sessionStorage.setItem("app-nav", "1");
    renderDetail();

    await userEvent.click(screen.getByRole("button", { name: "Back" }));

    expect(mockRouterBack).toHaveBeenCalledOnce();
    expect(mockRouterPush).not.toHaveBeenCalled();
  });

  it("opens /tasks when the task was opened directly", async () => {
    renderDetail();

    await userEvent.click(screen.getByRole("button", { name: "Back" }));

    expect(mockRouterPush).toHaveBeenCalledWith("/tasks");
    expect(mockRouterBack).not.toHaveBeenCalled();
  });
});
