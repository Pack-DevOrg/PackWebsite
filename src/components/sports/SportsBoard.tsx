import {z} from 'zod';

export const SportsFactRoleSchema = z.enum(['score', 'odds', 'result']);

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
  summary: z.string().min(1),
});

export const SportsViewSourceSchema = z.object({
  asOf: z.string().datetime(),
  games: z.array(SportsGameSchema),
  fantasyMatchups: z.array(FantasyMatchupSchema),
});

export type SportsFact = z.infer<typeof SportsFactSchema>;
export type SportsGame = z.infer<typeof SportsGameSchema>;
export type FantasyMatchup = z.infer<typeof FantasyMatchupSchema>;
export type SportsViewSource = z.infer<typeof SportsViewSourceSchema>;

export type SportsBoardGame = {
  occasionId: string;
  title: string;
  status: 'upcoming' | 'live' | 'final';
  score?: string;
  odds?: string;
  result?: string;
};

export type SportsBoardModel = {
  games: SportsBoardGame[];
  fantasyMatchups: FantasyMatchup[];
};

function validAt(fact: SportsFact, now: number): boolean {
  return Date.parse(fact.validFrom) <= now && now < Date.parse(fact.validUntil);
}

function statusAt(game: SportsGame, now: number): SportsBoardGame['status'] {
  if (now < Date.parse(game.startsAt)) return 'upcoming';
  return now < Date.parse(game.endsAt) ? 'live' : 'final';
}

/** Pure projection shared by web and RN surfaces; facts outside their validity window drop off. */
export function projectSportsBoard(source: SportsViewSource): SportsBoardModel {
  const parsed = SportsViewSourceSchema.parse(source);
  const now = Date.parse(parsed.asOf);
  const games = parsed.games
    .map((game): SportsBoardGame => {
      const board: SportsBoardGame = {
        occasionId: game.occasionId,
        title: game.title,
        status: statusAt(game, now),
      };
      for (const fact of game.facts) {
        if (validAt(fact, now)) board[fact.role] = fact.text;
      }
      return board;
    })
    .sort(
      (a, b) =>
        Number(b.status === 'live') - Number(a.status === 'live') ||
        a.title.localeCompare(b.title),
    );
  return {games, fantasyMatchups: parsed.fantasyMatchups};
}

export function SportsBoard({model}: {model: SportsBoardModel}) {
  if (model.games.length === 0 && model.fantasyMatchups.length === 0) {
    return <p>No games on your board right now.</p>;
  }
  return (
    <section aria-label="Your sports">
      <ul>
        {model.games.map((game) => (
          <li key={game.occasionId}>
            <strong>{game.title}</strong> <span>{game.status}</span>
            {game.score ? <span> {game.score}</span> : null}
            {game.odds ? <span> {game.odds}</span> : null}
            {game.result ? <span> {game.result}</span> : null}
          </li>
        ))}
      </ul>
      <ul aria-label="Fantasy">
        {model.fantasyMatchups.map((m) => (
          <li key={`${m.leagueName}|${m.opponent}`}>
            {m.leagueName} vs {m.opponent}: {m.summary}
          </li>
        ))}
      </ul>
    </section>
  );
}
