import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { HelmetProvider } from "react-helmet-async";
import { MemoryRouter } from "react-router-dom";

import { AppSettingsPage } from "./AppSettingsPage";
import { I18nProvider } from "@/i18n/I18nProvider";
import { ThemeProvider } from "@/styles/ThemeProvider";

const loginMock = jest.fn();
const logoutMock = jest.fn();
const useAuthMock = jest.fn();

jest.mock("@/auth/AuthContext", () => ({
  useAuth: () => useAuthMock(),
}));

describe("AppSettingsPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
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
      tokens: { tokenType: "Bearer" },
    });
  });

  const renderPage = () =>
    render(
      <HelmetProvider>
        <MemoryRouter initialEntries={["/app/settings"]}>
          <I18nProvider>
            <ThemeProvider>
              <AppSettingsPage />
            </ThemeProvider>
          </I18nProvider>
        </MemoryRouter>
      </HelmetProvider>,
    );

  it("renders connect and settings controls for an authenticated session without calling login", () => {
    renderPage();

    expect(
      screen.getByRole("button", { name: "Connect mail" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Connect calendar" }),
    ).toBeInTheDocument();
    expect(screen.getByText("tests@trypackai.com")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Sign out" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Text Pack" })).toBeInTheDocument();
    expect(loginMock).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "Connect mail" }));
    fireEvent.click(screen.getByRole("button", { name: "Connect calendar" }));
    fireEvent.click(screen.getByRole("button", { name: "Sign out" }));

    expect(loginMock).not.toHaveBeenCalled();
    expect(logoutMock).toHaveBeenCalledTimes(1);
  });

  it("renders no account data while unauthenticated and never calls login", () => {
    useAuthMock.mockReturnValue({
      status: "unauthenticated",
      user: {
        sub: "leaked-user",
        email: "hidden@trypackai.com",
        name: "Should Not Render",
      },
      login: loginMock,
      logout: logoutMock,
      getAccessToken: async () => null,
      tokens: null,
    });

    renderPage();

    expect(screen.queryByText("hidden@trypackai.com")).not.toBeInTheDocument();
    expect(screen.queryByText("Should Not Render")).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Connect mail" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Connect calendar" }),
    ).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Sign out" })).not.toBeInTheDocument();
    expect(screen.getByText("No account on this session")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Text Pack" })).toBeInTheDocument();
    expect(loginMock).not.toHaveBeenCalled();
  });
});
