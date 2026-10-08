import React from "react";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { HelmetProvider } from "react-helmet-async";
import { MemoryRouter } from "react-router-dom";

import { OnboardPage } from "./OnboardPage";
import { WAITLIST_TITLE } from "@/components/onboard/WaitlistStep";
import { I18nProvider } from "@/i18n/I18nProvider";
import { ThemeProvider } from "@/styles/ThemeProvider";

jest.mock("@/auth/AuthContext", () => ({
  useAuth: () => ({
    status: "authenticated",
    user: { sub: "u", email: "u@trypackai.com", name: "U" },
    login: jest.fn(),
    logout: jest.fn(),
    getAccessToken: async () => "synth-access-token",
    tokens: { tokenType: "Bearer" },
  }),
  AuthProvider: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
}));

// PackApp's onboarding components can resolve their own copy of the safe-area
// library, so the provider comes from that same copy.
function packAppLibs(): {
  SafeAreaProvider: React.ComponentType<any>;
  NavigationContainer: React.ComponentType<any>;
} {
  const fs = jest.requireActual("node:fs");
  const path = jest.requireActual("node:path");
  const { createRequire } = jest.requireActual("node:module");
  const root = ["PackApp", "../PackApp", "../../PackApp", "../../../PackApp"]
    .map((dir) => path.resolve(process.cwd(), dir))
    .find((dir) => fs.existsSync(path.join(dir, "src")));
  const from = createRequire(path.join(root, "src/components/onboarding/x.js"));
  const pkg = from.resolve("react-native-safe-area-context/package.json");
  const SafeAreaProvider = jest.requireActual(
    path.join(path.dirname(pkg), "lib/commonjs/index.js"),
  ).SafeAreaProvider;
  const NavigationContainer = jest.requireActual(
    from.resolve("@react-navigation/native"),
  ).NavigationContainer;
  return { SafeAreaProvider, NavigationContainer };
}

const { SafeAreaProvider, NavigationContainer } = packAppLibs();
const initialMetrics = {
  frame: { x: 0, y: 0, width: 390, height: 844 },
  insets: { top: 0, right: 0, bottom: 0, left: 0 },
};

let access: "waitlisted" | "active" | undefined;

function mockInformation(): void {
  global.fetch = jest.fn(async (input: RequestInfo | URL) => {
    const url = String(input);
    const data = url.includes("/user/information")
      ? { access }
      : { accounts: [] };
    return {
      ok: true,
      status: 200,
      text: async () => JSON.stringify({ success: true, data }),
      clone() {
        return this;
      },
    };
  }) as unknown as typeof fetch;
}

async function reachAccessStep(url = "/onboard"): Promise<void> {
  render(
    <HelmetProvider>
      <MemoryRouter initialEntries={[url]}>
        <I18nProvider>
          <ThemeProvider>
            <SafeAreaProvider initialMetrics={initialMetrics}>
              <NavigationContainer>
                <OnboardPage />
              </NavigationContainer>
            </SafeAreaProvider>
          </ThemeProvider>
        </I18nProvider>
      </MemoryRouter>
    </HelmetProvider>,
  );
  fireEvent.click(await screen.findByRole("button", { name: "Skip" }));
  fireEvent.click(await screen.findByRole("button", { name: "Skip" }));
}

describe("OnboardPage access step", () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it("holds a waitlisted user on the waitlist, then shows You're in after focus re-poll", async () => {
    access = "waitlisted";
    mockInformation();
    await reachAccessStep();

    expect(await screen.findByText(WAITLIST_TITLE)).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Connections" })).toBeNull();

    access = "active";
    await act(async () => {
      window.dispatchEvent(new Event("focus"));
    });

    expect(await screen.findByText("You're in")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    expect(await screen.findByRole("heading", { name: "Connections" }))
      .toBeInTheDocument();
  });

  it("shows an invite code field, redeems a valid code and advances", async () => {
    access = "waitlisted";
    mockInformation();
    await reachAccessStep();
    const field = await screen.findByLabelText("Access code");
    fireEvent.change(field, { target: { value: "ABCD2345" } });
    fireEvent.click(screen.getByRole("button", { name: "Redeem code" }));
    expect(await screen.findByRole("heading", { name: "Connections" }))
      .toBeInTheDocument();
    const posted = (global.fetch as jest.Mock).mock.calls.find(([u]) =>
      String(u).includes("/access/redeem"),
    );
    expect(posted?.[1]?.method).toBe("POST");
    expect(String(posted?.[1]?.body)).toContain("ABCD2345");
  });

  it.each([
    ["CODE_UNKNOWN", 404, "That code isn't valid. Check it and try again."],
    ["CODE_EXPIRED", 410, "That code has expired."],
    ["CODE_USED_UP", 409, "That code has already been used."],
    ["INVALID_REQUEST", 400, "We couldn't redeem that code. Try again."],
    ["RATE_LIMITED", 429, "We couldn't redeem that code. Try again."],
  ])("maps redeem envelope code %s to its line", async (code, status, line) => {
    access = "waitlisted";
    mockInformation();
    const base = global.fetch as jest.Mock;
    global.fetch = jest.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      if (String(input).includes("/access/redeem")) {
        return {
          ok: false,
          status,
          text: async () =>
            JSON.stringify({ success: false, error: { code, message: "Code expired used invalid" } }),
          clone() {
            return this;
          },
        };
      }
      return base(input, init);
    }) as unknown as typeof fetch;
    await reachAccessStep();
    fireEvent.change(await screen.findByLabelText("Access code"), {
      target: { value: "BAD" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Redeem code" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(line);
    expect(screen.getByLabelText("Access code")).toBeInTheDocument();
  });

  it("pre-fills the field from ?code=", async () => {
    access = "waitlisted";
    mockInformation();
    await reachAccessStep("/onboard?code=ABCD2345");
    expect(await screen.findByLabelText("Access code")).toHaveValue("ABCD2345");
  });

  it("skips straight to Connections for a never-waitlisted active user", async () => {
    access = undefined;
    mockInformation();
    await reachAccessStep();

    expect(await screen.findByRole("heading", { name: "Connections" }))
      .toBeInTheDocument();
    expect(screen.queryByText("You're in")).toBeNull();
    expect(screen.queryByText(WAITLIST_TITLE)).toBeNull();
  });
});
