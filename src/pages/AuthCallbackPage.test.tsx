import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { HelmetProvider } from "react-helmet-async";
import { MemoryRouter, Route, Routes } from "react-router-dom";

import { AuthCallbackPage } from "./AuthCallbackPage";
import { I18nProvider } from "@/i18n/I18nProvider";
import { ThemeProvider } from "@/styles/ThemeProvider";

jest.mock("@/assets/logo.png", () => "logo.png");

const completeLoginMock = jest.fn();
const loginMock = jest.fn();
const trackConversionMock = jest.fn();
const navigateMock = jest.fn();
const replaceStateMock = jest.spyOn(window.history, "replaceState");
const fetchMock = jest.fn();

jest.mock("@/auth/AuthContext", () => ({
  useAuth: () => ({
    completeLogin: completeLoginMock,
    login: loginMock,
  }),
}));

jest.mock("@/hooks/useConversionTracking", () => ({
  useConversionTracking: () => ({
    trackConversion: trackConversionMock,
  }),
}));

jest.mock("react-router-dom", () => {
  const actual = jest.requireActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => navigateMock,
  };
});

describe("AuthCallbackPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    fetchMock.mockReset();
    replaceStateMock.mockClear();
    (global as typeof globalThis & { fetch: typeof fetch }).fetch =
      fetchMock as unknown as typeof fetch;
  });

  const renderPage = (initialEntry = "/oauth/callback?code=test-code&state=test-state") =>
    render(
      <HelmetProvider>
        <MemoryRouter initialEntries={[initialEntry]}>
          <I18nProvider>
            <ThemeProvider>
              <Routes>
                <Route path="/oauth/callback" element={<AuthCallbackPage />} />
              </Routes>
            </ThemeProvider>
          </I18nProvider>
        </MemoryRouter>
      </HelmetProvider>,
    );

  it("bootstraps user information with the id token before redirecting", async () => {
    completeLoginMock.mockResolvedValue({
      redirectPath: "/app",
      accessToken: "access-token-value",
      idToken: "id-token-value",
      tokenType: "Bearer",
    });
    fetchMock.mockResolvedValue({
      ok: true,
      text: async () => "",
    });

    renderPage();

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        "https://test-api-endpoint.com/api/user/information",
        expect.objectContaining({
          method: "GET",
          headers: expect.objectContaining({
            Authorization: "Bearer access-token-value",
          }),
        }),
      );
    });

    await waitFor(() => {
      expect(navigateMock).toHaveBeenCalledWith("/app", { replace: true });
    });
  });

  it("renders the branded finalizing copy while processing", () => {
    completeLoginMock.mockImplementation(() => new Promise(() => {}));

    renderPage();

    expect(
      screen.getByText("We're getting your travel profile ready so your next page feels like it already knows you."),
    ).toBeInTheDocument();
    expect(screen.getByText("Built with ❤️ for travellers.")).toBeInTheDocument();
    expect(screen.getByAltText("Pack")).toBeInTheDocument();
  });
});
