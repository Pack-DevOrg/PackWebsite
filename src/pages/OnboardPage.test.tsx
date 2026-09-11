import React from "react";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { HelmetProvider } from "react-helmet-async";
import { MemoryRouter, Route, Routes } from "react-router-dom";

import {
  firstOnboardingStepBecauseAppParity,
  ONBOARD_PATH,
  ONBOARDING_SEQUENCE,
  OnboardPage,
} from "./OnboardPage";
import { I18nProvider } from "@/i18n/I18nProvider";
import { ThemeProvider } from "@/styles/ThemeProvider";

const loginMock = jest.fn();
const useAuthMock = jest.fn();
const apiRequestMock = jest.fn();

jest.mock("@/auth/AuthContext", () => ({
  useAuth: () => useAuthMock(),
  AuthProvider: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
}));

jest.mock("@/api/useApiClient", () => ({
  useApiClient: () => ({
    request: (...args: unknown[]) => apiRequestMock(...args),
  }),
}));

jest.mock("@/components/VerifyPhoneCta", () => ({
  VerifyPhoneCta: () => (
    <div data-testid="verify-phone-cta">Text Pack</div>
  ),
}));

function confirmVerifyPhonePosts(): unknown[] {
  return apiRequestMock.mock.calls.filter((call) => {
    const options = call[0] as { path?: string; method?: string };
    return (
      options.path === "/verify-phone/confirm" && options.method === "POST"
    );
  });
}

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

function renderAt(path: string) {
  return render(
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
    </HelmetProvider>,
  );
}

describe("OnboardPage /onboard auth-first", () => {
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

  it("renders the /onboard route with SignupLoginScreen as the first step", () => {
    renderAt(ONBOARD_PATH);

    expect(screen.queryByRole("heading", { name: "Page not found" })).not
      .toBeInTheDocument();
    expect(screen.getByTestId("onboard-step")).toHaveAttribute(
      "data-step",
      "SignupLoginScreen",
    );
    expect(firstOnboardingStepBecauseAppParity()).toBe("SignupLoginScreen");
    expect(screen.getByRole("heading", { name: "Welcome to Pack" })).toBeInTheDocument();
    expect(screen.getByLabelText("Email")).toBeInTheDocument();
    expect(screen.getByTestId("verify-phone-cta")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Continue with Google" }),
    ).toBeInTheDocument();
    expect(loginMock).not.toHaveBeenCalled();
  });

  it("uses the five web onboarding steps with VerifyPhoneScreen immediately before ConnectedAccountsScreen", () => {
    renderAt(ONBOARD_PATH);

    expect(ONBOARDING_SEQUENCE).toEqual([
      "SignupLoginScreen",
      "VerifyPhoneScreen",
      "ConnectedAccountsScreen",
      "NotificationsSetupScreen",
      "OnboardingCompleteScreen",
    ]);
    const verifyIndex = ONBOARDING_SEQUENCE.indexOf("VerifyPhoneScreen");
    const connectionsIndex = ONBOARDING_SEQUENCE.indexOf(
      "ConnectedAccountsScreen",
    );
    expect(verifyIndex).toBeGreaterThanOrEqual(0);
    expect(connectionsIndex).toBe(verifyIndex + 1);
    expect(ONBOARDING_SEQUENCE).not.toContain("PhotosConnectScreen");
    expect(ONBOARDING_SEQUENCE).not.toContain("ConnectedAccountsDemoScreen");
    const listed = screen
      .getAllByRole("listitem")
      .map((item) => item.getAttribute("data-screen"));
    expect(listed).toEqual([...ONBOARDING_SEQUENCE]);
    expect(screen.queryByText("PhotosConnectScreen")).not.toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: "Photos" }),
    ).not.toBeInTheDocument();
  });

  it("does not render leaked PII while unauthenticated", () => {
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

    expect(screen.queryByText("hidden@trypackai.com")).not.toBeInTheDocument();
    expect(screen.queryByText("Should Not Render")).not.toBeInTheDocument();
    expect(screen.queryByText(/Signed in as/)).not.toBeInTheDocument();
    expect(loginMock).not.toHaveBeenCalled();
  });

  it("starts hosted login from the auth step without skipping ahead", () => {
    renderAt(ONBOARD_PATH);

    fireEvent.click(screen.getByRole("button", { name: "Continue with Google" }));

    expect(loginMock).toHaveBeenCalledWith({ redirectPath: ONBOARD_PATH });
    expect(screen.getByTestId("onboard-step")).toHaveAttribute(
      "data-step",
      "SignupLoginScreen",
    );
  });

  it("shows VerifyPhoneStep in the Card after auth Continue, then connections after skip", () => {
    mockAuthenticatedSession();

    renderAt(ONBOARD_PATH);

    fireEvent.click(screen.getByRole("button", { name: "Continue" }));

    const verifyCard = screen.getByTestId("onboard-step");
    expect(verifyCard).toHaveAttribute("data-step", "VerifyPhoneScreen");
    expect(
      within(verifyCard).getByTestId("verify-phone-step"),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Skip for now" }));

    expect(confirmVerifyPhonePosts()).toHaveLength(0);
    expect(screen.getByTestId("onboard-step")).toHaveAttribute(
      "data-step",
      "ConnectedAccountsScreen",
    );
    expect(
      screen.getByRole("button", { name: "Connect mail" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Connect calendar" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: "Photos" }),
    ).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Continue" }));

    expect(screen.getByTestId("onboard-step")).toHaveAttribute(
      "data-step",
      "NotificationsSetupScreen",
    );
    expect(
      screen.getByRole("heading", { name: "Browser notifications" }),
    ).toBeInTheDocument();
    expect(screen.getAllByText(/web notifications/i).length).toBeGreaterThan(0);
    expect(screen.queryByText(/lock-screen/i)).not.toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: "Photos" }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Skip" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Skip" }));
    expect(screen.getByTestId("onboard-step")).toHaveAttribute(
      "data-step",
      "OnboardingCompleteScreen",
    );
  });

  it("skip from VerifyPhoneScreen does not POST /verify-phone/confirm", () => {
    mockAuthenticatedSession();

    renderAt(ONBOARD_PATH);
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    fireEvent.click(screen.getByRole("button", { name: "Skip for now" }));

    expect(confirmVerifyPhonePosts()).toHaveLength(0);
    expect(screen.getByTestId("onboard-step")).toHaveAttribute(
      "data-step",
      "ConnectedAccountsScreen",
    );
  });

  it("re-asks VerifyPhoneScreen from connections without posting confirm", () => {
    mockAuthenticatedSession();

    renderAt(ONBOARD_PATH);
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    fireEvent.click(screen.getByRole("button", { name: "Skip for now" }));

    expect(screen.getByTestId("onboard-step")).toHaveAttribute(
      "data-step",
      "ConnectedAccountsScreen",
    );

    fireEvent.click(screen.getByRole("button", { name: "Verify number" }));

    expect(confirmVerifyPhonePosts()).toHaveLength(0);
    const reasked = screen.getByTestId("onboard-step");
    expect(reasked).toHaveAttribute("data-step", "VerifyPhoneScreen");
    expect(
      within(reasked).getByTestId("verify-phone-step"),
    ).toBeInTheDocument();
  });
});
