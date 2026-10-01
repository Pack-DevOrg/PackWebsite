import {appConfig} from "@/config/appConfig";
import type {ApiClient} from "./client";
import {ApiRequestError, createApiClient} from "./client";
import {
  projectSportsView,
  readUserSportsView,
  SportsViewEnvelopeError,
  TRIP_RECOMMENDATIONS_PATH,
  type SportsFact,
  type SportsViewSource,
} from "./sportsView";

jest.mock("@/config/appConfig", () => ({
  appConfig: {
    apiBaseUrl: "https://api.example.com/dev",
    environment: "prod",
    apiKey: undefined,
  },
}));

const AS_OF = "2026-09-30T20:00:00.000Z";

function clientReturning(payload: unknown): {client: ApiClient; paths: string[]} {
  const paths: string[] = [];
  const client: ApiClient = {
    request: async (options) => {
      paths.push(options.path);
      return payload;
    },
  };
  return {client, paths};
}

describe("readUserSportsView", () => {
  it("reads the deployed recommendations route and rolls each occasion recap into one line", async () => {
    const {client, paths} = clientReturning({
      success: true,
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
    });

    const view = await readUserSportsView(client);

    expect(paths).toEqual([TRIP_RECOMMENDATIONS_PATH]);
    expect(view.games).toEqual([]);
    expect(view.fantasyMatchups).toEqual([]);
    expect(view.recaps).toEqual([
      {
        identityKey: "seahawks-49ers|2026-09-30",
        title: "seahawks-49ers|2026-09-30",
        recap: "Seahawks won",
      },
    ]);
  });

  it("sends the Cognito bearer token to GET /user/trips/recommendations", async () => {
    appConfig.environment = "prod";
    appConfig.apiBaseUrl = "https://api.example.com/dev";
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () =>
        JSON.stringify({
          success: true,
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
          },
        }),
    });

    const client = createApiClient(
      async () => "access-token",
      () => "Bearer",
    );
    const view = await readUserSportsView(client);

    expect(global.fetch).toHaveBeenCalledWith(
      "https://api.example.com/dev/user/trips/recommendations",
      expect.objectContaining({
        method: "GET",
        headers: expect.objectContaining({
          Authorization: "Bearer access-token",
        }),
      }),
    );
    const init = (global.fetch as jest.Mock).mock.calls[0][1] as RequestInit;
    expect(init.headers).not.toHaveProperty("x-pack-user");
    expect(view.recaps.map((card) => card.recap)).toEqual(["Seahawks won"]);
    expect(view.games).toEqual([]);
  });

  it("keeps the envelope status and published error code", async () => {
    const {client} = clientReturning({
      success: false,
      status: 503,
      error: {message: "Sports view failed.", code: "SPORTS_VIEW_UNAVAILABLE"},
    });

    await expect(readUserSportsView(client)).rejects.toMatchObject({
      name: "ApiRequestError",
      status: 503,
      message: "Sports view failed.",
      details: {code: "SPORTS_VIEW_UNAVAILABLE"},
    });
  });

  it("does not invent status 500 when the failure envelope omits status", async () => {
    const {client} = clientReturning({
      success: false,
      error: {message: "Sports view failed.", code: "SPORTS_VIEW_UNAVAILABLE"},
    });

    await expect(readUserSportsView(client)).rejects.toBeInstanceOf(SportsViewEnvelopeError);
    await expect(readUserSportsView(client)).rejects.not.toBeInstanceOf(ApiRequestError);
  });

  it("rejects an occasion recap whose fact has no source url", async () => {
    const {client} = clientReturning({
      success: true,
      data: {
        generatedAt: AS_OF,
        occasionRecaps: [
          {
            occasionId: "seahawks-49ers|2026-09-30",
            fact: {
              value: "result: Seahawks won",
              asOf: "2026-09-30T19:05:00.000Z",
            },
          },
        ],
      },
    });

    await expect(readUserSportsView(client)).rejects.toBeInstanceOf(SportsViewEnvelopeError);
  });

  it("does not invent a Final recap when the recommendations payload has no occasion recaps", async () => {
    const {client} = clientReturning({
      success: true,
      data: {
        generatedAt: AS_OF,
        recommendations: [],
      },
    });

    const view = await readUserSportsView(client);

    expect(view).toEqual({games: [], recaps: [], fantasyMatchups: []});
  });
});

const LIVE_START = "2026-09-30T19:00:00.000Z";
const LIVE_END = "2026-09-30T22:00:00.000Z";
const ENDED_START = "2026-09-30T16:00:00.000Z";
const ENDED_END = "2026-09-30T19:00:00.000Z";
const FACT_AS_OF = "2026-09-30T19:30:00.000Z";
const FACT_URL = "https://example.com/fact";
const VALID_FROM = "2026-09-30T18:00:00.000Z";
const VALID_UNTIL = "2026-09-30T23:00:00.000Z";

function fact(
  role: SportsFact["role"],
  value: string,
): SportsFact {
  return {role, value, asOf: FACT_AS_OF, sourceUrl: FACT_URL};
}

function source(overrides: Partial<SportsViewSource> = {}): SportsViewSource {
  return {
    asOf: AS_OF,
    occasions: [],
    interests: [],
    teams: [],
    fantasyMatchups: [],
    ...overrides,
  };
}

function game(overrides: Record<string, unknown> = {}) {
  return {
    kind: "game",
    identityKey: "game-live",
    start: LIVE_START,
    end: LIVE_END,
    participants: ["Seahawks", "Packers"],
    facts: [fact("score", "SEA 14, GB 7"), fact("odds", "SEA -3")],
    validFrom: VALID_FROM,
    validUntil: VALID_UNTIL,
    ...overrides,
  };
}

describe("projectSportsView", () => {
  it("keeps a followed live game and rolls an ended game into one recap", () => {
    const view = projectSportsView(
      source({
        interests: [{occasionId: "game-live"}, {occasionId: "game-ended"}],
        occasions: [
          game(),
          game({
            identityKey: "game-ended",
            start: ENDED_START,
            end: ENDED_END,
            participants: ["Seahawks", "49ers"],
            facts: [fact("score", "SEA 24, SF 17"), fact("result", "Seahawks won")],
          }),
          game({
            kind: "fare",
            identityKey: "not-a-game",
            participants: ["Seahawks"],
          }),
          game({
            identityKey: "public-only",
            participants: ["Jets", "Bills"],
          }),
        ],
      }),
    );

    expect(view.games).toEqual([
      {
        identityKey: "game-live",
        title: "Seahawks vs Packers",
        status: "live",
        score: "SEA 14, GB 7",
        odds: "SEA -3",
        result: null,
      },
    ]);
    expect(view.recaps).toEqual([
      {
        identityKey: "game-ended",
        title: "Seahawks vs 49ers",
        recap: "Seahawks won",
      },
    ]);
    expect(view.games.map((card) => card.identityKey)).not.toContain("game-ended");
    expect(view.recaps.map((card) => card.recap).join(" ")).not.toContain("SEA 24, SF 17");
  });

  it("follows a team name and stays on the board through the end instant", () => {
    const view = projectSportsView(
      source({
        asOf: LIVE_END,
        teams: ["seahawks"],
        occasions: [game()],
      }),
    );

    expect(view.games).toHaveLength(1);
    expect(view.games[0]?.status).toBe("live");
    expect(view.recaps).toEqual([]);
  });

  it("keeps a colon inside the score text and does not recap a missing result as Final", () => {
    const view = projectSportsView(
      source({
        interests: [{occasionId: "game-live"}, {occasionId: "game-ended"}],
        occasions: [
          game({facts: [fact("score", "SEA: 14, GB: 7")]}),
          game({
            identityKey: "game-ended",
            start: ENDED_START,
            end: ENDED_END,
            participants: ["Seahawks", "49ers"],
            facts: [fact("odds", "SEA -3")],
          }),
        ],
      }),
    );

    expect(view.games[0]?.score).toBe("SEA: 14, GB: 7");
    expect(view.recaps).toEqual([]);
  });
});
