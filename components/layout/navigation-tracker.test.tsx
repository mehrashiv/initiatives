import { beforeEach, describe, expect, it, vi } from "vitest";
import { render } from "@testing-library/react";
import { NavigationTracker, hasInAppHistory } from "./navigation-tracker";

let mockPathname = "/tasks/t1";
vi.mock("next/navigation", () => ({ usePathname: () => mockPathname }));

describe("NavigationTracker", () => {
  beforeEach(() => {
    window.sessionStorage.clear();
    mockPathname = "/tasks/t1";
    vi.restoreAllMocks();
  });

  it("reports no in app history for a page opened directly", () => {
    render(<NavigationTracker />);

    expect(hasInAppHistory()).toBe(false);
  });

  it("reports in app history once the pathname changes", () => {
    const { rerender } = render(<NavigationTracker />);

    mockPathname = "/tasks";
    rerender(<NavigationTracker />);

    expect(hasInAppHistory()).toBe(true);
  });

  it("treats unreadable storage as no in app history", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("blocked");
    });

    expect(hasInAppHistory()).toBe(false);
  });
});
