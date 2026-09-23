import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { HelmetProvider } from "react-helmet-async";
import { MemoryRouter, Route, Routes } from "react-router-dom";

import {
  accountConnectWindow,
  GOOGLE_REDIRECT_URI,
  GOOGLE_WEB_CLIENT_ID,
  markOnboardConnectionsReturn,
  writeConnectedMailboxSnapshot,
} from "@/auth/accountConnect";
import { ONBOARD_PATH, OnboardPage } from "./OnboardPage";
import { I18nProvider } from "@/i18n/I18nProvider";
import { DEFAULT_SHARE_IMAGE_URL, SITE_ORIGIN } from "@/seo/pageSeo";
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
    sessionStorage.clear();
    global.fetch = jest.fn(async () => ({
      ok: true,
      status: 200,
      text: async () =>
        JSON.stringify({ success: true, data: { accounts: [] } }),
      clone() {
        return this;
      },
    })) as unknown as typeof fetch;
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

  it("walks Signup → What Pack does → Verify → Connections → Complete without internal identifiers", () => {
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
    expect(loginMock).toHaveBeenCalledWith({
      identityProvider: "Google",
      redirectPath: "/onboard",
    });
    expectNoInternalIdentifiers(view.container);

    mockAuthenticatedSession();
    view.rerender(tree(ONBOARD_PATH));

    expect(screen.getByRole("heading", { name: "Past" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Skip" }));
    expect(
      screen.getByRole("heading", { name: "Verify your number" }),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Skip" }));
    expect(screen.getByRole("heading", { name: "Connections" }))
      .toBeInTheDocument();
    expectNoInternalIdentifiers(view.container);
    fireEvent.click(screen.getByRole("button", { name: "Skip for now" }));

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

  it("locks /onboard to the dynamic viewport with no page-level 100vh", () => {
    renderAt(ONBOARD_PATH);
    const viewport = screen.getByTestId("onboard-viewport");
    const css = Array.from(document.querySelectorAll("style"))
      .map((node) => node.textContent ?? "")
      .join("\n");
    const viewportRules = Array.from(viewport.classList)
      .map((cls) => {
        const escaped = cls.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        return css.match(new RegExp(`\\.${escaped}[^{]*\\{[^}]*\\}`, "g")) ?? [];
      })
      .flat()
      .join("\n");
    expect(viewport).toBeInTheDocument();
    expect(css).toContain("100dvh");
    expect(css).toContain("env(safe-area-inset-top");
    expect(viewportRules).toContain("100dvh");
    expect(viewportRules).not.toMatch(/min-height:\s*100vh\b/);
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

  it("declares absolute apple-touch icons so iMessage never fetches /error", async () => {
    const touchIconUrl = `${SITE_ORIGIN}/apple-touch-icon.png`;
    const touchSizes = ["120x120", "152x152", "167x167", "180x180"] as const;

    renderAt(ONBOARD_PATH);

    await waitFor(() => {
      expect(
        document.head
          .querySelector('link[rel="apple-touch-icon"]:not([sizes])')
          ?.getAttribute("href"),
      ).toBe(touchIconUrl);
    });

    const previewAssetUrls = [
      document.head
        .querySelector('meta[property="og:image"]')
        ?.getAttribute("content"),
      document.head
        .querySelector('meta[property="og:image:secure_url"]')
        ?.getAttribute("content"),
      document.head
        .querySelector('meta[name="twitter:image"]')
        ?.getAttribute("content"),
      document.head
        .querySelector('link[rel="apple-touch-icon"]:not([sizes])')
        ?.getAttribute("href"),
      document.head
        .querySelector('link[rel="apple-touch-icon-precomposed"]:not([sizes])')
        ?.getAttribute("href"),
      ...touchSizes.flatMap((size) => [
        document.head
          .querySelector(`link[rel="apple-touch-icon"][sizes="${size}"]`)
          ?.getAttribute("href"),
        document.head
          .querySelector(
            `link[rel="apple-touch-icon-precomposed"][sizes="${size}"]`,
          )
          ?.getAttribute("href"),
      ]),
    ];

    expect(previewAssetUrls).toHaveLength(13);
    for (const url of previewAssetUrls) {
      expect(url).toEqual(expect.any(String));
      expect(url).toMatch(/^https:\/\/www\.trypackai\.com\//);
      expect(url === "/error" || url?.includes("/error")).toBe(false);
      const path = new URL(url as string).pathname;
      expect(
        path.startsWith("/images/") || path === "/apple-touch-icon.png",
      ).toBe(true);
    }

    expect(
      document.head.querySelectorAll('link[rel="apple-touch-icon"]'),
    ).toHaveLength(touchSizes.length + 1);
    expect(
      document.head.querySelectorAll('link[rel="apple-touch-icon-precomposed"]'),
    ).toHaveLength(touchSizes.length + 1);
  });

  async function openConnections() {
    mockAuthenticatedSession();
    renderAt(ONBOARD_PATH);
    fireEvent.click(await screen.findByRole("button", { name: "Skip" }));
    fireEvent.click(await screen.findByRole("button", { name: "Skip" }));
    expect(
      await screen.findByRole("heading", { name: "Connections" }),
    ).toBeInTheDocument();
  }

  it("pressing Connect Google starts the Gmail and Calendar consent redirect", async () => {
    const assign = jest
      .spyOn(accountConnectWindow, "assign")
      .mockImplementation(() => undefined);

    await openConnections();
    fireEvent.click(screen.getByTestId("connect-google-button"));

    expect(assign).toHaveBeenCalledTimes(1);
    const url = new URL(String(assign.mock.calls[0]?.[0]));
    expect(url.origin + url.pathname).toBe(
      "https://accounts.google.com/o/oauth2/v2/auth",
    );
    expect(url.searchParams.get("client_id")).toBe(GOOGLE_WEB_CLIENT_ID);
    expect(url.searchParams.get("redirect_uri")).toBe(GOOGLE_REDIRECT_URI);
    expect(url.searchParams.get("scope")).toContain(
      "https://www.googleapis.com/auth/gmail.modify",
    );
    expect(url.searchParams.get("scope")).toContain(
      "https://www.googleapis.com/auth/calendar.readonly",
    );
    assign.mockRestore();
  });

  it("returns to Connections with the Google account shown connected", async () => {
    markOnboardConnectionsReturn();
    writeConnectedMailboxSnapshot({
      googleEmail: "ada@pack.test",
      microsoftEmail: null,
    });
    mockAuthenticatedSession();
    renderAt(ONBOARD_PATH);

    expect(
      await screen.findByRole("heading", { name: "Connections" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Connected: ada@pack.test")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Continue" }),
    ).toBeEnabled();
  });
});
