import type {ApiClient} from "./client";
import {
  projectSportsView,
  readUserSportsView,
  USER_SPORTS_VIEW_PATH,
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
                value: "score: SEA 24, SF 17",
                asOf: "2026-09-30T19:00:00.000Z",
                sourceUrl: "https://example.com/score",
              },
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
});

const LIVE_START = "2026-09-30T19:00:00.000Z";
const LIVE_END = "2026-09-30T22:00:00.000Z";
const ENDED_START = "2026-09-30T16:00:00.000Z";
const ENDED_END = "2026-09-30T19:00:00.000Z";
const FACT_AS_OF = "2026-09-30T19:30:00.000Z";

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
    facts: [
      {
        value: "score: SEA 14, GB 7",
        asOf: FACT_AS_OF,
      },
      {
        value: "odds: SEA -3",
        asOf: FACT_AS_OF,
      },
    ],
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
            facts: [
              {value: "score: SEA 24, SF 17", asOf: FACT_AS_OF},
              {value: "result: Seahawks won", asOf: FACT_AS_OF},
            ],
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
});
