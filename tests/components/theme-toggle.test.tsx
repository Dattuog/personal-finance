/** @vitest-environment jsdom */

import { act } from "react";
import { hydrateRoot, type Root } from "react-dom/client";
import { renderToString } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ThemeToggle } from "@/components/layout/theme-toggle";

const reactTestEnvironment = globalThis as typeof globalThis & {
  IS_REACT_ACT_ENVIRONMENT: boolean;
};

describe("ThemeToggle", () => {
  beforeEach(() => {
    reactTestEnvironment.IS_REACT_ACT_ENVIRONMENT = true;
    window.localStorage.clear();
    document.documentElement.className = "";
    document.documentElement.style.colorScheme = "";
    vi.stubGlobal(
      "matchMedia",
      vi.fn().mockImplementation((query: string) => ({
        matches: query === "(prefers-color-scheme: dark)",
        media: query,
        onchange: null,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        addListener: vi.fn(),
        removeListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("hydrates with stable markup before resolving the client theme", async () => {
    const container = document.createElement("div");
    container.innerHTML = renderToString(<ThemeToggle />);
    document.body.append(container);
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});
    let root: Root | undefined;

    await act(async () => {
      root = hydrateRoot(container, <ThemeToggle />);
    });

    expect(consoleError).not.toHaveBeenCalled();
    expect(container.querySelector("button")).toHaveAttribute(
      "aria-label",
      "Use light theme",
    );
    expect(document.documentElement.style.colorScheme).toBe("dark");

    await act(async () => root?.unmount());
    consoleError.mockRestore();
    container.remove();
  });
});
