import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Toast } from "./toast";

describe("Toast", () => {
  it("shows the message with no button when there is no action", () => {
    render(<Toast message="Task created" />);

    expect(screen.getByText("Task created")).toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("shows the message for the error tone too", () => {
    render(<Toast message="Failed to create task." tone="error" />);

    expect(screen.getByText("Failed to create task.")).toBeInTheDocument();
  });

  // covers: AC-13 (the hidden toast carries a Clear filters button)
  it("renders the action as a named button that runs its handler on click", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(<Toast message="Task created. Hidden by your filters." action={{ label: "Clear filters", onClick }} />);

    await user.click(screen.getByRole("button", { name: "Clear filters" }));

    expect(onClick).toHaveBeenCalledOnce();
  });

  it("lets the keyboard reach and press the action", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(<Toast message="Task created. Hidden by your filters." action={{ label: "Clear filters", onClick }} />);

    await user.tab();
    expect(screen.getByRole("button", { name: "Clear filters" })).toHaveFocus();
    await user.keyboard("{Enter}");

    expect(onClick).toHaveBeenCalledOnce();
  });
});
