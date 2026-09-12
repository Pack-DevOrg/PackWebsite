import React from "react";
import { render, screen } from "@testing-library/react";
import { HelmetProvider } from "react-helmet-async";
import { MemoryRouter } from "react-router-dom";

import NonHomeRoutes from "./NonHomeRoutes";
import { I18nProvider } from "@/i18n/I18nProvider";
import { ThemeProvider } from "@/styles/ThemeProvider";

jest.mock("@/auth/AuthContext", () => ({
  useAuth: () => ({
    status: "unauthenticated",
    user: null,
    login: jest.fn(),
    logout: jest.fn(),
    getAccessToken: async () => null,
    tokens: null,
  }),
  AuthProvider: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
}));

jest.mock("@/components/VerifyPhoneCta", () => ({
  VerifyPhoneCta: () => <div data-testid="verify-phone-cta">Text Pack</div>,
}));

function renderAt(path: string) {
  return render(
    <HelmetProvider>
      <MemoryRouter initialEntries={[path]}>
        <I18nProvider>
          <ThemeProvider>
            <NonHomeRoutes />
          </ThemeProvider>
        </I18nProvider>
      </MemoryRouter>
    </HelmetProvider>,
  );
}

describe("NonHomeRoutes /onboard", () => {
  it("renders /onboard auth-first instead of NotFoundPage", async () => {
    renderAt("/onboard");

    // The step token is present (land-smoke + deploy verifier key on it) but
    // carries no app screen identifier (OnboardPage.test forbids data-step).
    expect(await screen.findByTestId("onboard-step")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Welcome to Pack" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: "Page not found" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: "Photos" }),
    ).not.toBeInTheDocument();
  });
});
