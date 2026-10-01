import React from "react";
import {render, screen} from "@testing-library/react";
import {QueryClient, QueryClientProvider} from "@tanstack/react-query";
import {HelmetProvider} from "react-helmet-async";
import {MemoryRouter} from "react-router-dom";

import {SportsPage} from "./SportsPage";
import {I18nProvider} from "@/i18n/I18nProvider";
import {ThemeProvider} from "@/styles/ThemeProvider";

const useAuthMock = jest.fn();

jest.mock("@/config/appConfig", () => ({
  appConfig: {
    apiBaseUrl: "https://api.example.com/dev",
    environment: "prod",
    apiKey: undefined,
  },
}));

jest.mock("@/auth/AuthContext", () => ({
  useAuth: () => useAuthMock(),
}));

const AS_OF = "2026-09-30T20:00:00.000Z";

function sportsPayload() {
  return {
    success: true as const,
    data: {
      generatedAt: AS_OF,
      occasionRecaps: [
        {
          occasionId: "seahawks-49ers|2026-09-30",
          fact: {
            value: "Seahawks won",
            asOf: "2026-09-30T19:05:00.000Z",
            sourceUrl: "https://example.com/result",
          },
        },
      ],
      recommendations: [],
    },
  };
}

describe("SportsPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => JSON.stringify(sportsPayload()),
    });
    useAuthMock.mockReturnValue({
      status: "authenticated",
      user: {sub: "user-1"},
      getAccessToken: async () => "synth-access-token",
      tokens: {tokenType: "Bearer"},
    });
  });

  const renderPage = () => {
    const queryClient = new QueryClient({
      defaultOptions: {queries: {retry: false}},
    });
    return render(
      <QueryClientProvider client={queryClient}>
        <HelmetProvider>
          <MemoryRouter initialEntries={["/sports"]}>
            <I18nProvider>
              <ThemeProvider>
                <SportsPage />
              </ThemeProvider>
            </I18nProvider>
          </MemoryRouter>
        </HelmetProvider>
      </QueryClientProvider>,
    );
  };

  it("shows one recap from the deployed recommendations read", async () => {
    renderPage();

    expect(
      await screen.findByText("seahawks-49ers|2026-09-30. Seahawks won"),
    ).toBeInTheDocument();
    expect(screen.queryByText("Final")).not.toBeInTheDocument();
    expect(global.fetch).toHaveBeenCalledWith(
      "https://api.example.com/dev/user/trips/recommendations",
      expect.objectContaining({
        method: "GET",
        headers: expect.objectContaining({
          Authorization: "Bearer synth-access-token",
        }),
      }),
    );
    const init = (global.fetch as jest.Mock).mock.calls[0][1] as RequestInit;
    expect(init.headers).not.toHaveProperty("x-pack-user");
  });

  it("asks a signed-out visitor to sign in", () => {
    useAuthMock.mockReturnValue({
      status: "unauthenticated",
      user: null,
      getAccessToken: async () => null,
      tokens: null,
    });

    renderPage();

    expect(screen.getByText("Sign in to see your teams.")).toBeInTheDocument();
    expect(global.fetch).not.toHaveBeenCalled();
  });
});
