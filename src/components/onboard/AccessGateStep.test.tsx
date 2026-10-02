import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { HelmetProvider } from "react-helmet-async";
import { MemoryRouter, Route, Routes } from "react-router-dom";

import { ONBOARD_PATH, OnboardPage } from "@/pages/OnboardPage";
import { I18nProvider } from "@/i18n/I18nProvider";
import { ThemeProvider } from "@/styles/ThemeProvider";

const loginMock = jest.fn();
const useAuthMock = jest.fn();

jest.mock("@/auth/AuthContext", () => ({
  useAuth: () => useAuthMock(),
  AuthProvider: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
}));

function mockAuthenticatedSession(): void {
  useAuthMock.mockReturnValue({
    status: "authenticated",
    user: {
      sub: "signed-in-user",
      email: "signed-in@trypackai.com",
      name: "Pat Pack",
    },
    login: loginMock,
    logout: jest.fn(),
    getAccessToken: async () => "synth-access-token",
    tokens: { tokenType: "Bearer" },
  });
}

function renderOnboard(): void {
  render(
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
    </HelmetProvider>,
  );
}

async function skipToAccessGate(): Promise<void> {
  mockAuthenticatedSession();
  renderOnboard();
  fireEvent.click(await screen.findByRole("button", { name: "Skip" }));
  fireEvent.click(await screen.findByRole("button", { name: "Skip" }));
}

describe("onboarding access gate", () => {
  let access: "waitlisted" | "active";

  beforeEach(() => {
    access = "active";
    sessionStorage.clear();
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
  });

  it("waitlisted stops on the waitlist screen and cannot reach connections", async () => {
    access = "waitlisted";
    await skipToAccessGate();

    expect(
      await screen.findByRole("heading", { name: "You're on the waitlist" }),
    ).toBeInTheDocument();
    expect(screen.getByText(/we'll text you when it's your turn/i))
      .toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Continue" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Skip" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Skip for now" })).toBeNull();
    expect(screen.queryByRole("heading", { name: "Connections" })).toBeNull();
    expect(screen.queryByRole("heading", { name: "You're in" })).toBeNull();
  });

  it("after approval the same route shows You're in and then connections", async () => {
    access = "waitlisted";
    await skipToAccessGate();
    expect(
      await screen.findByRole("heading", { name: "You're on the waitlist" }),
    ).toBeInTheDocument();

    access = "active";
    window.dispatchEvent(new Event("focus"));

    expect(
      await screen.findByRole("heading", { name: "You're in" }),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    expect(
      await screen.findByRole("heading", { name: "Connections" }),
    ).toBeInTheDocument();
  });

  it("an active user sees no waitlist screen", async () => {
    access = "active";
    await skipToAccessGate();

    expect(
      await screen.findByRole("heading", { name: "Connections" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: "You're on the waitlist" }),
    ).toBeNull();
    expect(screen.queryByRole("heading", { name: "You're in" })).toBeNull();
  });
});
