import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

afterEach(() => cleanup());

// jsdom does not implement scrolling; GanttChart scrolls itself to today on mount.
if (!Element.prototype.scrollTo) Element.prototype.scrollTo = () => {};
