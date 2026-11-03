import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { FilterMultiSelect, FilterSelect, type FilterPickerOption } from "./filter-pickers";

const projects: FilterPickerOption[] = [
  { id: "p1", label: "HOL Infrastructure", hint: "Hands On Lab" },
  { id: "p2", label: "Reservation System", hint: "Hands On Lab" },
  { id: "p3", label: "Tech Docs Cleanup", hint: "Documentation" },
];

// Controlled wrappers so the tests drive the pickers the way TasksView does.
function MultiHarness({ initial = [], options = projects }: { initial?: string[]; options?: FilterPickerOption[] }) {
  const [values, setValues] = useState<string[]>(initial);
  return (
    <FilterMultiSelect
      label="Projects"
      menuTitle="Projects · pick any"
      noun="projects"
      values={values}
      options={options}
      onChange={setValues}
    />
  );
}

function SingleHarness({ onChange }: { onChange?: (id: string) => void }) {
  const [value, setValue] = useState("");
  return (
    <FilterSelect
      label="Initiative"
      menuTitle="Initiative · pick one"
      allLabel="All initiatives"
      allHint="3 projects"
      value={value}
      options={[
        { id: "i1", label: "Hands On Lab", hint: "2 projects" },
        { id: "i2", label: "Documentation", hint: "1 project" },
      ]}
      onChange={(id) => {
        setValue(id);
        onChange?.(id);
      }}
    />
  );
}

const trigger = (label: string) => screen.getByRole("button", { name: new RegExp(`^${label}`) });

describe("FilterMultiSelect", () => {
  it("summarizes an empty selection as all of the noun", () => {
    render(<MultiHarness />);
    expect(trigger("Projects")).toHaveTextContent("All projects");
  });

  it("starts closed and opens its menu on click, reflecting aria-expanded", async () => {
    const user = userEvent.setup();
    render(<MultiHarness />);

    expect(trigger("Projects")).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByRole("menuitemcheckbox")).not.toBeInTheDocument();

    await user.click(trigger("Projects"));

    expect(trigger("Projects")).toHaveAttribute("aria-expanded", "true");
    expect(screen.getAllByRole("menuitemcheckbox")).toHaveLength(3);
    expect(screen.getByText("Projects · pick any")).toBeInTheDocument();
  });

  it("shows the single selected name when one option is checked", async () => {
    const user = userEvent.setup();
    render(<MultiHarness />);

    await user.click(trigger("Projects"));
    await user.click(screen.getByRole("menuitemcheckbox", { name: /HOL Infrastructure/ }));

    expect(trigger("Projects")).toHaveTextContent("HOL Infrastructure");
    expect(screen.getByRole("menuitemcheckbox", { name: /HOL Infrastructure/ })).toHaveAttribute("aria-checked", "true");
  });

  it("shows a count summary and badge once two or more are checked, and stays open while toggling", async () => {
    const user = userEvent.setup();
    render(<MultiHarness />);

    await user.click(trigger("Projects"));
    await user.click(screen.getByRole("menuitemcheckbox", { name: /HOL Infrastructure/ }));
    await user.click(screen.getByRole("menuitemcheckbox", { name: /Reservation System/ }));

    expect(trigger("Projects")).toHaveTextContent(/2 projects\s*2/);
    expect(screen.getAllByRole("menuitemcheckbox")).toHaveLength(3);
  });

  it("unchecks an option when it is clicked again", async () => {
    const user = userEvent.setup();
    render(<MultiHarness initial={["p1"]} />);

    await user.click(trigger("Projects"));
    await user.click(screen.getByRole("menuitemcheckbox", { name: /HOL Infrastructure/ }));

    expect(trigger("Projects")).toHaveTextContent("All projects");
  });

  it("offers a Clear action in the menu only when something is selected", async () => {
    const user = userEvent.setup();
    render(<MultiHarness initial={["p1", "p3"]} />);

    await user.click(trigger("Projects"));
    await user.click(screen.getByRole("button", { name: "Clear" }));

    expect(trigger("Projects")).toHaveTextContent("All projects");
    expect(screen.queryByRole("button", { name: "Clear" })).not.toBeInTheDocument();
  });

  it("ignores selected ids that are not among the options when summarizing", () => {
    render(<MultiHarness initial={["gone"]} />);
    expect(trigger("Projects")).toHaveTextContent("All projects");
  });

  it("tells the user when there is nothing to pick", async () => {
    const user = userEvent.setup();
    render(<MultiHarness options={[]} />);

    await user.click(trigger("Projects"));

    expect(screen.getByText("Nothing to pick")).toBeInTheDocument();
  });

  it("is reachable and toggleable from the keyboard", async () => {
    const user = userEvent.setup();
    render(<MultiHarness />);

    await user.tab();
    expect(trigger("Projects")).toHaveFocus();
    await user.keyboard("{Enter}");
    await user.tab();
    await user.keyboard(" ");

    expect(screen.getByRole("menuitemcheckbox", { name: /HOL Infrastructure/ })).toHaveAttribute("aria-checked", "true");
  });
});

describe("FilterSelect", () => {
  it("shows the all label by default and lists every option with its hint", async () => {
    const user = userEvent.setup();
    render(<SingleHarness />);

    expect(trigger("Initiative")).toHaveTextContent("All initiatives");
    await user.click(trigger("Initiative"));

    expect(screen.getByRole("button", { name: /^All initiatives\s*3 projects$/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^Hands On Lab\s*2 projects$/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^Documentation\s*1 project$/ })).toBeInTheDocument();
  });

  it("reports the picked id, shows its name on the trigger, and closes", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<SingleHarness onChange={onChange} />);

    await user.click(trigger("Initiative"));
    await user.click(screen.getByRole("button", { name: /^Hands On Lab/ }));

    expect(onChange).toHaveBeenCalledWith("i1");
    expect(trigger("Initiative")).toHaveTextContent("Hands On Lab");
    expect(trigger("Initiative")).toHaveAttribute("aria-expanded", "false");
  });

  it("goes back to no filter when All is picked", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<SingleHarness onChange={onChange} />);

    await user.click(trigger("Initiative"));
    await user.click(screen.getByRole("button", { name: /^Hands On Lab/ }));
    await user.click(trigger("Initiative"));
    await user.click(screen.getByRole("button", { name: /^All initiatives/ }));

    expect(onChange).toHaveBeenLastCalledWith("");
    expect(trigger("Initiative")).toHaveTextContent("All initiatives");
  });
});
