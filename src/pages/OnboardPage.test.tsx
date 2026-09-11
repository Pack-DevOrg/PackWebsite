import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { HelmetProvider } from "react-helmet-async";
import { MemoryRouter, Route, Routes } from "react-router-dom";

import { ONBOARD_PATH, OnboardPage } from "./OnboardPage";
import { I18nProvider } from "@/i18n/I18nProvider";
import { DEFAULT_SHARE_IMAGE_URL } from "@/seo/pageSeo";
import { ThemeProvider } from "@/styles/ThemeProvider";

const loginMock = jest.fn();
const useAuthMock = jest.fn();

const INTERNAL_IDENTIFIERS =
  /SignupLoginScreen|ConnectedAccountsScreen|NotificationsSetupScreen|OnboardingCompleteScreen|PhotosConnectScreen|VerifyPhoneScreen|data-step/;

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

function tree(path: string) {
  return (
    <HelmetProvider>
      <MemoryRouter initialEntries={[path]}>
        <I18nProvider>
          <ThemeProvider>
            <Routes>
              <Route path={ONBOARD_PATH} element={<OnboardPage />} />
              <Route path="*" element={<h1>Page not found</h1>} />
            </Routes>
          </ThemeProvider>
        </I18nProvider>
      </MemoryRouter>
    </HelmetProvider>
  );
}

function renderAt(path: string) {
  return render(tree(path));
}

function expectNoInternalIdentifiers(container: HTMLElement): void {
  expect(container.textContent ?? "").not.toMatch(INTERNAL_IDENTIFIERS);
  expect(container.innerHTML).not.toMatch(INTERNAL_IDENTIFIERS);
  expect(container.querySelector("[data-step]")).toBeNull();
}

describe("OnboardPage /onboard five-step app flow", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useAuthMock.mockReturnValue({
      status: "unauthenticated",
      user: null,
      login: loginMock,
      logout: jest.fn(),
      getAccessToken: async () => null,
      tokens: null,
    });
  });

  it("renders /onboard instead of 404 and does not leak PII while unauthenticated", () => {
    useAuthMock.mockReturnValue({
      status: "unauthenticated",
      user: {
        sub: "leaked-user",
        email: "hidden@trypackai.com",
        name: "Should Not Render",
      },
      login: loginMock,
      logout: jest.fn(),
      getAccessToken: async () => null,
      tokens: null,
    });

    renderAt(ONBOARD_PATH);

    expect(screen.queryByRole("heading", { name: "Page not found" })).not
      .toBeInTheDocument();
    expect(screen.queryByText("hidden@trypackai.com")).not.toBeInTheDocument();
    expect(screen.queryByText("Should Not Render")).not.toBeInTheDocument();
    expect(screen.queryByText(/Signed in as/)).not.toBeInTheDocument();
    expect(loginMock).not.toHaveBeenCalled();
  });

  it("walks Signup → Connections → Photos → Notifications → Complete without internal identifiers", () => {
    const view = renderAt(ONBOARD_PATH);
    const pageText = () => view.container.textContent ?? "";

    expect(screen.getByRole("heading", { name: "Welcome to Pack" }))
      .toBeInTheDocument();
    expect(pageText()).toContain("Choose your preferred sign-in method");
    const googleAt = pageText().indexOf("Continue with Google");
    const appleAt = pageText().indexOf("Continue with Apple");
    expect(googleAt).toBeGreaterThanOrEqual(0);
    expect(googleAt).toBeLessThan(appleAt);
    expect(screen.queryByTestId("onboard-progress-dots")).toBeNull();
    expect(screen.queryAllByTestId("onboard-progress-dot")).toHaveLength(0);
    fireEvent.click(
      screen.getByRole("button", { name: "Continue with Google" }),
    );
    expect(loginMock).not.toHaveBeenCalled();
    expectNoInternalIdentifiers(view.container);

    mockAuthenticatedSession();
    view.rerender(tree(ONBOARD_PATH));

    expect(screen.getByRole("heading", { name: "Connections" }))
      .toBeInTheDocument();
    expectNoInternalIdentifiers(view.container);

    fireEvent.click(screen.getByRole("button", { name: "Skip for now" }));

    expect(pageText()).toContain("places you've been");
    expectNoInternalIdentifiers(view.container);

    fireEvent.click(
      screen.getByRole("button", {
        name: "Skip connecting Photos for now",
      }),
    );

    expect(screen.getByRole("heading", { name: "Turn on trip alerts" }))
      .toBeInTheDocument();
    expectNoInternalIdentifiers(view.container);

    fireEvent.click(screen.getByRole("button", { name: "Not now" }));

    expect(pageText()).toContain("You're all set!");
    expectNoInternalIdentifiers(view.container);
  });

  it("auth step has no progress dots and no phone field even with a phone query", () => {
    const view = renderAt("/onboard?phone=+15551212");

    expect(screen.getByRole("heading", { name: "Welcome to Pack" }))
      .toBeInTheDocument();
    expect(screen.queryByLabelText("Phone number")).toBeNull();
    expect(screen.queryByTestId("onboard-progress-dots")).toBeNull();
    expect(screen.queryAllByTestId("onboard-progress-dot")).toHaveLength(0);
    expectNoInternalIdentifiers(view.container);
  });

  it("sets og:image and twitter:image to the homepage gold share asset", async () => {
    renderAt(ONBOARD_PATH);

    await waitFor(() => {
      expect(
        document.head
          .querySelector('meta[property="og:image"]')
          ?.getAttribute("content"),
      ).toBe(DEFAULT_SHARE_IMAGE_URL);
    });

    expect(DEFAULT_SHARE_IMAGE_URL.endsWith("/images/og-image.jpg")).toBe(
      true,
    );
    expect(
      document.head
        .querySelector('meta[name="twitter:image"]')
        ?.getAttribute("content"),
    ).toBe(DEFAULT_SHARE_IMAGE_URL);
  });
});
