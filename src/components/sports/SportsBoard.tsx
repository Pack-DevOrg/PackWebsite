import React from "react";
import { z } from "zod";

export const SportsFactRoleSchema = z.enum(["score", "odds", "result"]);

export const SportsFactSchema = z.object({
  role: SportsFactRoleSchema,
  text: z.string().min(1),
  sourceUrl: z.string().url(),
  validFrom: z.string().datetime(),
  validUntil: z.string().datetime(),
});

export const SportsGameSchema = z.object({
  occasionId: z.string().min(1),
  title: z.string().min(1),
  startsAt: z.string().datetime(),
  endsAt: z.string().datetime(),
  facts: z.array(SportsFactSchema),
});

export const FantasyMatchupSchema = z.object({
  leagueName: z.string().min(1),
  opponent: z.string().min(1),
  myScore: z.number(),
  theirScore: z.number(),
  endsAt: z.string().datetime(),
});

export const SportsBoardSourceSchema = z.object({
  games: z.array(SportsGameSchema),
  fantasyMatchups: z.array(FantasyMatchupSchema),
});

export type SportsFact = z.infer<typeof SportsFactSchema>;
export type SportsGame = z.infer<typeof SportsGameSchema>;
export type FantasyMatchup = z.infer<typeof FantasyMatchupSchema>;
export type SportsBoardSource = z.infer<typeof SportsBoardSourceSchema>;

export interface SportsBoardGame {
  occasionId: string;
  title: string;
  ended: boolean;
  facts: SportsFact[];
}

export interface SportsBoardModel {
  games: SportsBoardGame[];
  fantasyMatchups: FantasyMatchup[];
}

const RECAP_WINDOW_MS = 24 * 60 * 60 * 1000;

const within = (fact: SportsFact, now: number): boolean =>
  Date.parse(fact.validFrom) <= now && now < Date.parse(fact.validUntil);

/**
 * Pure projection: live games show score/odds, an ended game shows only its
 * result for 24h after the whistle, then rolls off. Facts outside their own
 * validity window never render.
 */
export function projectSportsBoard(
  source: SportsBoardSource,
  asOf: Date,
): SportsBoardModel {
  const now = asOf.getTime();
  const games: SportsBoardGame[] = [];
  for (const game of source.games) {
    const ended = now >= Date.parse(game.endsAt);
    if (ended && now >= Date.parse(game.endsAt) + RECAP_WINDOW_MS) continue;
    if (now < Date.parse(game.startsAt) - RECAP_WINDOW_MS) continue;
    const facts = game.facts.filter(
      (fact) =>
        within(fact, now) && (ended ? fact.role === "result" : fact.role !== "result"),
    );
    if (ended && facts.length === 0) continue;
    games.push({ occasionId: game.occasionId, title: game.title, ended, facts });
  }
  const fantasyMatchups = source.fantasyMatchups.filter(
    (matchup) => now < Date.parse(matchup.endsAt) + RECAP_WINDOW_MS,
  );
  return { games, fantasyMatchups };
}

export interface SportsBoardProps {
  source: SportsBoardSource;
  asOf: Date;
}

export const SportsBoard: React.FC<SportsBoardProps> = ({ source, asOf }) => {
  const model = projectSportsBoard(source, asOf);
  if (model.games.length === 0 && model.fantasyMatchups.length === 0) {
    return <p data-testid="sports-board-empty">No games on your board right now.</p>;
  }
  return (
    <section data-testid="sports-board">
      {model.games.map((game) => (
        <article key={game.occasionId} data-testid={`sports-game-${game.occasionId}`}>
          <h3>{game.title}</h3>
          {game.facts.map((fact) => (
            <p key={`${fact.role}-${fact.validFrom}`} data-role={fact.role}>
              {fact.text}
            </p>
          ))}
        </article>
      ))}
      {model.fantasyMatchups.map((m) => (
        <article key={`${m.leagueName}-${m.opponent}`} data-testid="sports-fantasy">
          <h3>{m.leagueName}</h3>
          <p>
            vs {m.opponent}: {m.myScore} to {m.theirScore}
          </p>
        </article>
      ))}
    </section>
  );
};

export default SportsBoard;
