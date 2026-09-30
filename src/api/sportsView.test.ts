import type {ApiClient} from "./client";
import {ApiRequestError} from "./client";
import {
  projectSportsView,
  readUserSportsView,
  SportsViewEnvelopeError,
  USER_SPORTS_VIEW_PATH,
  type SportsFact,
  type SportsViewSource,
} from "./sportsView";

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
  it("reads GET /user/sports-view and drops an ended game to one recap", async () => {
    const {client, paths} = clientReturning({
      success: true,
      data: {
        asOf: AS_OF,
        occasions: [
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
                sourceUrl: "https://example.com/score",
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
        ],
        interests: [{occasionId: "game-ended"}],
        teams: [],
        fantasyMatchups: [
          {
            id: "matchup-1",
            provider: "sleeper",
            leagueName: "Work League",
            label: "Week 4",
            opponent: "Casey",
            myScore: "112",
            theirScore: "98",
          },
        ],
      },
    });

    const view = await readUserSportsView(client);

    expect(paths).toEqual([USER_SPORTS_VIEW_PATH]);
    expect(view.games).toEqual([]);
    expect(view.recaps).toEqual([
      {
        identityKey: "game-ended",
        title: "Seahawks vs 49ers",
        recap: "Seahawks won",
      },
    ]);
    expect(view.fantasyMatchups[0]?.opponent).toBe("Casey");
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

  it("rejects a fact whose role is only a display-string prefix", async () => {
    const {client} = clientReturning({
      success: true,
      data: {
        asOf: AS_OF,
        occasions: [
          {
            kind: "game",
            identityKey: "game-ended",
            start: "2026-09-30T16:00:00.000Z",
            end: "2026-09-30T19:00:00.000Z",
            participants: ["Seahawks", "49ers"],
            facts: [
              {
                value: "result: Seahawks won",
                asOf: "2026-09-30T19:05:00.000Z",
                sourceUrl: "https://example.com/result",
              },
            ],
            validFrom: "2026-09-30T16:00:00.000Z",
            validUntil: "2026-10-01T19:00:00.000Z",
          },
        ],
        interests: [{occasionId: "game-ended"}],
        teams: [],
        fantasyMatchups: [],
      },
    });

    await expect(readUserSportsView(client)).rejects.toBeInstanceOf(SportsViewEnvelopeError);
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
