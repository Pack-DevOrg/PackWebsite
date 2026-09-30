import React from "react";
import {render, screen} from "@testing-library/react";
import {QueryClient, QueryClientProvider} from "@tanstack/react-query";
import {HelmetProvider} from "react-helmet-async";
import {MemoryRouter} from "react-router-dom";

import {SportsPage} from "./SportsPage";
import {I18nProvider} from "@/i18n/I18nProvider";
import {ThemeProvider} from "@/styles/ThemeProvider";

const useAuthMock = jest.fn();
const apiRequestMock = jest.fn();
const apiClientStub = {
  request: (options: unknown) => apiRequestMock(options),
};

jest.mock("@/auth/AuthContext", () => ({
  useAuth: () => useAuthMock(),
}));

jest.mock("@/api/useApiClient", () => ({
  useApiClient: () => apiClientStub,
}));

const AS_OF = "2026-09-30T20:00:00.000Z";

function sportsPayload() {
  return {
    success: true as const,
    data: {
      asOf: AS_OF,
      occasions: [
        {
          kind: "game",
          identityKey: "game-live",
          start: "2026-09-30T19:00:00.000Z",
          end: "2026-09-30T22:00:00.000Z",
          participants: ["Seahawks", "Packers"],
          facts: [
            {
              role: "score",
              value: "SEA 14, GB 7",
              asOf: "2026-09-30T20:00:00.000Z",
              sourceUrl: "https://example.com/live-score",
            },
            {
              role: "odds",
              value: "SEA -3",
              asOf: "2026-09-30T18:00:00.000Z",
              sourceUrl: "https://example.com/odds",
            },
          ],
          validFrom: "2026-09-30T18:00:00.000Z",
          validUntil: "2026-09-30T23:00:00.000Z",
        },
        {
          kind: "game",
          identityKey: "game-ended",
          start: "2026-09-30T16:00:00.000Z",
          end: "2026-09-30T19:00:00.000Z",
          participants: ["Seahawks", "49ers"],
          facts: [
            {
              role: "score",
              value: "SEA 24, SF 17",
              asOf: "2026-09-30T19:00:00.000Z",
              sourceUrl: "https://example.com/final-score",
            },
            {
              role: "result",
              value: "Seahawks won",
              asOf: "2026-09-30T19:05:00.000Z",
              sourceUrl: "https://example.com/result",
            },
          ],
          validFrom: "2026-09-30T16:00:00.000Z",
          validUntil: "2026-10-01T19:00:00.000Z",
        },
        {
          kind: "game",
          identityKey: "game-public",
          start: "2026-09-30T19:00:00.000Z",
          end: "2026-09-30T22:00:00.000Z",
          participants: ["Jets", "Bills"],
          facts: [
            {
              role: "score",
              value: "NYJ 3, BUF 10",
              asOf: "2026-09-30T20:00:00.000Z",
              sourceUrl: "https://example.com/other",
            },
          ],
          validFrom: "2026-09-30T18:00:00.000Z",
          validUntil: "2026-09-30T23:00:00.000Z",
        },
      ],
      interests: [{occasionId: "game-live"}, {occasionId: "game-ended"}],
      teams: ["Seahawks"],
      fantasyMatchups: [
        {
          id: "matchup-1",
          provider: "espn",
          leagueName: "Work League",
          label: "Week 4",
          opponent: "Casey",
          myScore: "112",
          theirScore: "98",
        },
      ],
    },
  };
}

describe("SportsPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    apiRequestMock.mockResolvedValue(sportsPayload());
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

  it("shows the user's live game, fantasy matchup, and one recap for the ended game", async () => {
    renderPage();

    expect(await screen.findByText("Seahawks vs Packers")).toBeInTheDocument();
    expect(screen.getByText("SEA 14, GB 7")).toBeInTheDocument();
    expect(screen.getByText("SEA -3")).toBeInTheDocument();
    expect(screen.getByText("Week 4 vs Casey")).toBeInTheDocument();
    expect(screen.getByText("112–98")).toBeInTheDocument();
    expect(screen.getByText("Seahawks vs 49ers. Seahawks won")).toBeInTheDocument();
    expect(screen.queryByText("SEA 24, SF 17")).not.toBeInTheDocument();
    expect(screen.queryByText("Jets vs Bills")).not.toBeInTheDocument();
    expect(screen.queryByText("NYJ 3, BUF 10")).not.toBeInTheDocument();
    expect(apiRequestMock).toHaveBeenCalledWith(
      expect.objectContaining({path: "/user/sports-view", method: "GET"}),
    );
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
    expect(apiRequestMock).not.toHaveBeenCalled();
  });
});
