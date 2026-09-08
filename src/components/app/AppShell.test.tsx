import {readFileSync} from "node:fs";
import {join} from "node:path";
import React from "react";
import {act, render, screen} from "@testing-library/react";
import {MemoryRouter, Route, Routes} from "react-router-dom";

import {AppShell} from "./AppShell";
import {ThemeProvider} from "@/styles/ThemeProvider";

const loginMock = jest.fn();
const logoutMock = jest.fn();
const useAuthMock = jest.fn();

jest.mock("@/auth/AuthContext", () => ({
  useAuth: () => useAuthMock(),
}));

const SOURCE_PATH = join(process.cwd(), "src/components/app/AppShell.tsx");
const HEX_COLOR = /#[0-9a-fA-F]{3,8}\b/;
const NAV_EXPECTATIONS = [
  {name: "Home", href: "/app"},
  {name: "Trips", href: "/app/trips"},
  {name: "Friends", href: "/app/friends"},
  {name: "Stats", href: "/app/stats"},
  {name: "Settings", href: "/app/settings"},
] as const;

type MediaListener = (event: MediaQueryListEvent) => void;

function stylesheetText(): string {
  return Array.from(document.querySelectorAll("style"))
    .map((node) => node.textContent ?? "")
    .join("\n");
}

function rulesFor(element: Element): string {
  const all = stylesheetText();
  const chunks: string[] = [];
  for (const cls of Array.from(element.classList)) {
    const escaped = cls.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const matches = all.match(new RegExp(`\\.${escaped}[^{]*\\{[^}]*\\}`, "g"));
    if (matches === null) {
      continue;
    }
    chunks.push(
      ...matches.map((rule) =>
        rule.replace(new RegExp(`\\.${escaped}`, "g"), "._"),
      ),
    );
  }
  return chunks.join("\n");
}

function installViewport(width: number) {
  const listeners = new Set<MediaListener>();

  Object.defineProperty(window, "innerWidth", {
    configurable: true,
    writable: true,
    value: width,
  });

  window.matchMedia = (query: string) => {
    const media = {
      get matches() {
        return window.innerWidth >= 1100 && query.includes("1100");
      },
      media: query,
      onchange: null,
      addEventListener: (_type: string, listener: EventListener) => {
        listeners.add(listener as MediaListener);
      },
      removeEventListener: (_type: string, listener: EventListener) => {
        listeners.delete(listener as MediaListener);
      },
      addListener: (listener: MediaListener) => {
        listeners.add(listener);
      },
      removeListener: (listener: MediaListener) => {
        listeners.delete(listener);
      },
      dispatchEvent: () => true,
    };
    return media as MediaQueryList;
  };

  return {
    setWidth(next: number) {
      Object.defineProperty(window, "innerWidth", {
        configurable: true,
        writable: true,
        value: next,
      });
      const event = {matches: next >= 1100} as MediaQueryListEvent;
      listeners.forEach((listener) => {
        listener(event);
      });
      window.dispatchEvent(new Event("resize"));
    },
  };
}

function renderShell(path: string) {
  return render(
    <ThemeProvider>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/app" element={<AppShell />}>
            <Route index element={<div>home outlet</div>} />
            <Route path="trips" element={<div>trips outlet</div>} />
            <Route path="friends" element={<div>friends outlet</div>} />
            <Route path="stats" element={<div>stats outlet</div>} />
            <Route path="settings" element={<div>settings outlet</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    </ThemeProvider>,
  );
}

describe("AppShell nav", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    installViewport(1200);
    useAuthMock.mockReturnValue({
      status: "authenticated",
      user: {
        sub: "user-1",
        email: "tests@trypackai.com",
        name: "Pack Tester",
      },
      login: loginMock,
      logout: logoutMock,
      getAccessToken: async () => "synth-access-token",
      tokens: {tokenType: "Bearer"},
    });
  });

  it("renders Home, Trips, Friends, Stats, and Settings with app hrefs", () => {
    renderShell("/app");

    for (const item of NAV_EXPECTATIONS) {
      const link = screen.getByRole("link", {name: item.name});
      expect(link).toHaveAttribute("href", item.href);
    }
  });

  it("uses a left rail at 1100px and a bottom tab bar below that width", () => {
    const viewport = installViewport(1100);
    renderShell("/app");

    expect(screen.getByRole("navigation", {name: "App"})).toHaveAttribute(
      "data-nav-layout",
      "rail",
    );

    act(() => {
      viewport.setWidth(1099);
    });

    expect(screen.getByRole("navigation", {name: "App"})).toHaveAttribute(
      "data-nav-layout",
      "tabs",
    );

    act(() => {
      viewport.setWidth(1400);
    });

    expect(screen.getByRole("navigation", {name: "App"})).toHaveAttribute(
      "data-nav-layout",
      "rail",
    );
  });

  it("AppShell source has no raw hex or neutral rgba, and the active tab uses text-on-accent", () => {
    const source = readFileSync(SOURCE_PATH, "utf8");
    expect(source).not.toMatch(HEX_COLOR);
    expect(source).not.toMatch(/rgba\(/i);

    renderShell("/app/friends");
    const friends = screen.getByRole("link", {name: "Friends"});
    const css = rulesFor(friends);

    expect(css).toContain("var(--color-accent)");
    expect(css).toContain("var(--color-text-on-accent)");
    expect(css).not.toMatch(/#fff(?:fff)?\b/i);
    expect(css).not.toMatch(/rgb\(\s*255\s*,\s*255\s*,\s*255\s*\)/i);
    expect(css).not.toMatch(/(?:^|[:\s])white(?:\s|;|$)/i);
    expect(friends).toHaveStyle({color: "var(--color-text-on-accent)"});
  });

  it("AppShell source has no backdrop-filter and no box-shadow on app chrome", () => {
    const source = readFileSync(SOURCE_PATH, "utf8");
    expect(source).not.toMatch(/backdrop-filter/i);
    expect(source).not.toMatch(/box-shadow/i);
  });
});
