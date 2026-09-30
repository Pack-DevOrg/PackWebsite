import type {ApiClient} from "./client";
import {readUserSportsView, USER_SPORTS_VIEW_PATH} from "./sportsView";

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
