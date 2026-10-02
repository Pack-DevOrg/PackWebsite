import React from "react";
import { render, screen } from "@testing-library/react";
import {
  SportsBoard,
  SportsBoardSourceSchema,
  projectSportsBoard,
  type SportsBoardSource,
} from "@/components/sports/SportsBoard";

const H = 3600_000;
const T0 = Date.parse("2026-09-30T20:00:00.000Z");
const iso = (ms: number) => new Date(ms).toISOString();
const fact = (role: "score" | "odds" | "result", text: string, from: number, until: number) => ({
  role,
  text,
  sourceUrl: "https://example.test/src",
  validFrom: iso(from),
  validUntil: iso(until),
});

const source: SportsBoardSource = {
  games: [
    {
      occasionId: "sea-sf",
      title: "Seahawks at 49ers",
      startsAt: iso(T0),
      endsAt: iso(T0 + 3 * H),
      facts: [
        fact("score", "SEA 7, SF 3", T0, T0 + 3 * H),
        fact("odds", "SEA -2.5", T0 - H, T0 + 3 * H),
        fact("result", "Seahawks won 24 to 20", T0 + 3 * H, T0 + 30 * H),
      ],
    },
  ],
  fantasyMatchups: [
    { leagueName: "Office League", opponent: "Dana", myScore: 101.5, theirScore: 98, endsAt: iso(T0 + 3 * H) },
  ],
};

describe("projectSportsBoard", () => {
  it("shows score and odds, never the result, while the game is live", () => {
    const [game] = projectSportsBoard(source, new Date(T0 + H)).games;
    expect(game.ended).toBe(false);
    expect(game.facts.map((f) => f.role)).toEqual(["score", "odds"]);
  });

  it("shows only the typed result after the game ends", () => {
    const [game] = projectSportsBoard(source, new Date(T0 + 4 * H)).games;
    expect(game.ended).toBe(true);
    expect(game.facts.map((f) => f.text)).toEqual(["Seahawks won 24 to 20"]);
  });

  it("rolls the game and fantasy matchup off 24h after the end", () => {
    const model = projectSportsBoard(source, new Date(T0 + 3 * H + 25 * H));
    expect(model.games).toEqual([]);
    expect(model.fantasyMatchups).toEqual([]);
  });

  it("drops an ended game that has no result fact", () => {
    const noResult = { ...source, games: [{ ...source.games[0], facts: [source.games[0].facts[0]] }] };
    expect(projectSportsBoard(noResult, new Date(T0 + 4 * H)).games).toEqual([]);
  });

  it("rejects an untyped role or missing validity window", () => {
    const bad = { games: [{ ...source.games[0], facts: [{ role: "x", text: "t" }] }], fantasyMatchups: [] };
    expect(SportsBoardSourceSchema.safeParse(bad).success).toBe(false);
  });
});

describe("SportsBoard", () => {
  it("renders the game title, not the raw occasion id, plus fantasy", () => {
    render(React.createElement(SportsBoard, { source, asOf: new Date(T0 + H) }));
    expect(screen.getByText("Seahawks at 49ers")).toBeTruthy();
    expect(screen.queryByText("sea-sf")).toBeNull();
    expect(screen.getByText("SEA 7, SF 3")).toBeTruthy();
    expect(screen.getByText("Office League")).toBeTruthy();
  });

  it("renders the empty state when nothing is in window", () => {
    render(React.createElement(SportsBoard, { source, asOf: new Date(T0 + 100 * H) }));
    expect(screen.getByTestId("sports-board-empty")).toBeTruthy();
  });
});
