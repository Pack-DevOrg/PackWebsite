import React from "react";
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { HelmetProvider } from "react-helmet-async";
import { MemoryRouter, Route, Routes } from "react-router-dom";

import { ONBOARD_PATH, OnboardPage } from "./OnboardPage";
import { I18nProvider } from "@/i18n/I18nProvider";
import { ThemeProvider } from "@/styles/ThemeProvider";

// PackApp's onboarding components resolve their own copy of the safe-area
// library, so the provider must come from that same copy.
function packAppModule(name: string, entry: string): any {
  const fs = jest.requireActual("node:fs");
  const path = jest.requireActual("node:path");
  const { createRequire } = jest.requireActual("node:module");
  const root = ["PackApp", "../PackApp", "../../PackApp", "../../../PackApp"]
    .map((dir) => path.resolve(process.cwd(), dir))
    .find((dir) => fs.existsSync(path.join(dir, "src")));
  const from = createRequire(path.join(root, "src/components/onboarding/x.js"));
  const pkg = from.resolve(`${name}/package.json`);
  return jest.requireActual(path.join(path.dirname(pkg), entry));
}

const { SafeAreaProvider } = packAppModule(
  "react-native-safe-area-context",
  "lib/commonjs/index.js",
);
const { NavigationContainer } = packAppModule(
  "@react-navigation/native",
  "lib/module/index.js",
);
const initialMetrics = {
  frame: { x: 0, y: 0, width: 390, height: 844 },
  insets: { top: 0, right: 0, bottom: 0, left: 0 },
};

const useAuthMock = jest.fn();

jest.mock("@/auth/AuthContext", () => ({
  useAuth: () => useAuthMock(),
  AuthProvider: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
}));

let access: "waitlisted" | "active" | "error" = "active";

function mockFetch(): void {
  global.fetch = jest.fn(async (input: RequestInfo | URL) => {
    if (String(input).includes("/user/information")) {
      if (access === "error") {
        throw new Error("network");
      }
      const body = {
        success: true,
        data: access === "waitlisted" ? { access } : {},
      };
      return {
        ok: true,
        status: 200,
        text: async () => JSON.stringify(body),
        clone() {
          return this;
        },
      };
    }
    return {
      ok: true,
      status: 200,
      text: async () =>
        JSON.stringify({ success: true, data: { accounts: [] } }),
      clone() {
        return this;
      },
    };
  }) as unknown as typeof fetch;
}

function renderRoute() {
  return render(
    <SafeAreaProvider initialMetrics={initialMetrics}>
    <NavigationContainer>
    <HelmetProvider>
      <MemoryRouter initialEntries={[ONBOARD_PATH]}>
        <I18nProvider>
          <ThemeProvider>
            <Routes>
              <Route path={ONBOARD_PATH} element={<OnboardPage />} />
            </Routes>
          </ThemeProvider>
        </I18nProvider>
      </MemoryRouter>
    </HelmetProvider>
    </NavigationContainer>
    </SafeAreaProvider>
  );
}

async function reachAccessStep(): Promise<void> {
  renderRoute();
  fireEvent.click(await screen.findByRole("button", { name: "Skip" }));
  fireEvent.click(await screen.findByRole("button", { name: "Skip" }));
}

describe("OnboardPage access gate", () => {
  beforeEach(() => {
    sessionStorage.clear();
    useAuthMock.mockReturnValue({
      status: "authenticated",
      user: { sub: "u", email: "u@trypackai.com", name: "U" },
      login: jest.fn(),
      logout: jest.fn(),
      getAccessToken: async () => "tok",
      tokens: { tokenType: "Bearer" },
    });
    mockFetch();
  });

  it("shows the waitlist on the page route, then You are in once approved", async () => {
    access = "waitlisted";
    await reachAccessStep();
    expect(await screen.findByText("Before you're in")).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Connections" })).toBeNull();

    access = "active";
    act(() => {
      window.dispatchEvent(new Event("focus"));
    });
    expect(await screen.findByText("You are in")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    expect(
      await screen.findByRole("heading", { name: "Connections" })
    ).toBeInTheDocument();
  });

  it("skips straight to Connections for a never-waitlisted active user", async () => {
    access = "active";
    await reachAccessStep();
    expect(
      await screen.findByRole("heading", { name: "Connections" })
    ).toBeInTheDocument();
    expect(screen.queryByText("You are in")).toBeNull();
  });

  it("fails closed to the waitlist when the read errors", async () => {
    access = "error";
    await reachAccessStep();
    await waitFor(() => {
      expect(screen.getByText("Before you're in")).toBeInTheDocument();
    });
  });
});
