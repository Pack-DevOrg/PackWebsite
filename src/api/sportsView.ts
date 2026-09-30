import {z} from 'zod';
import {StandardApiResponseSchema} from '@/schemas/common';
import {ApiRequestError, type ApiClient} from './client';

/**
 * Logged-in sports read.
 * Public game occasions plus the user's private interest links, team names,
 * and fantasy matchups. Ended games leave the board as one recap.
 */

export type SportsFact = {
  readonly value: string;
  readonly asOf: string;
};

export type SportsGameOccasion = {
  readonly kind: string;
  readonly identityKey: string;
  readonly start: string;
  readonly end: string;
  readonly participants: readonly string[];
  readonly facts: readonly SportsFact[];
};

export type SportsInterestLink = {
  readonly occasionId: string;
};

export type FantasyProvider = 'espn' | 'yahoo' | 'sleeper';

export type FantasyMatchup = {
  readonly id: string;
  readonly provider: FantasyProvider;
  readonly leagueName: string;
  readonly label: string;
  readonly opponent: string;
  readonly myScore: string;
  readonly theirScore: string;
};

export type SportsViewSource = {
  readonly asOf: string;
  readonly occasions: readonly SportsGameOccasion[];
  readonly interests: readonly SportsInterestLink[];
  readonly teams: readonly string[];
  readonly fantasyMatchups: readonly FantasyMatchup[];
};

export type SportsGameCard = {
  readonly identityKey: string;
  readonly title: string;
  readonly status: 'live' | 'upcoming';
  readonly score: string | null;
  readonly odds: string | null;
  readonly result: string | null;
};

export type SportsRecapCard = {
  readonly identityKey: string;
  readonly title: string;
  readonly recap: string;
};

export type SportsView = {
  readonly games: readonly SportsGameCard[];
  readonly recaps: readonly SportsRecapCard[];
  readonly fantasyMatchups: readonly FantasyMatchup[];
};

type FactRole = 'score' | 'odds' | 'result';

function foldedName(value: string): string {
  return value.trim().toLowerCase();
}

function parsedInstant(value: string): number | null {
  const instant = Date.parse(value);
  if (!Number.isFinite(instant)) {
    return null;
  }
  return instant;
}

function factRole(value: string): {readonly role: FactRole; readonly text: string} | null {
  const trimmed = value.trim();
  const splitAt = trimmed.indexOf(':');
  if (splitAt <= 0) {
    return null;
  }
  const role = trimmed.slice(0, splitAt);
  if (role !== 'score' && role !== 'odds' && role !== 'result') {
    return null;
  }
  const text = trimmed.slice(splitAt + 1).trim();
  if (text.length === 0) {
    return null;
  }
  return {role, text};
}

function latestFact(facts: readonly SportsFact[], role: FactRole): string | null {
  let bestText: string | null = null;
  let bestInstant = Number.NEGATIVE_INFINITY;
  for (const fact of facts) {
    const parsed = factRole(fact.value);
    if (parsed === null || parsed.role !== role) {
      continue;
    }
    const instant = parsedInstant(fact.asOf);
    if (instant === null || instant < bestInstant) {
      continue;
    }
    bestInstant = instant;
    bestText = parsed.text;
  }
  return bestText;
}

function gameTitle(game: SportsGameOccasion): string {
  const names = game.participants
    .map((participant) => participant.trim())
    .filter((participant) => participant.length > 0);
  if (names.length === 0) {
    return game.identityKey;
  }
  return names.join(' vs ');
}

function userFollowsGame(
  game: SportsGameOccasion,
  interestIds: ReadonlySet<string>,
  teamNames: ReadonlySet<string>,
): boolean {
  if (interestIds.has(game.identityKey)) {
    return true;
  }
  for (const participant of game.participants) {
    const name = foldedName(participant);
    if (name.length > 0 && teamNames.has(name)) {
      return true;
    }
  }
  return false;
}

function oneRecapLine(facts: readonly SportsFact[]): string {
  return latestFact(facts, 'result') ?? latestFact(facts, 'score') ?? 'Final';
}

export function projectSportsView(source: SportsViewSource): SportsView {
  const asOf = parsedInstant(source.asOf);
  const interestIds = new Set(
    source.interests.map((interest) => interest.occasionId),
  );
  const teamNames = new Set(
    source.teams
      .map((team) => foldedName(team))
      .filter((team) => team.length > 0),
  );
  const games: SportsGameCard[] = [];
  const recaps: SportsRecapCard[] = [];
  const seen = new Set<string>();

  if (asOf === null) {
    return {games, recaps, fantasyMatchups: source.fantasyMatchups};
  }

  for (const occasion of source.occasions) {
    if (occasion.kind !== 'game' || seen.has(occasion.identityKey)) {
      continue;
    }
    const start = parsedInstant(occasion.start);
    const end = parsedInstant(occasion.end);
    if (start === null || end === null || !userFollowsGame(occasion, interestIds, teamNames)) {
      continue;
    }
    seen.add(occasion.identityKey);
    const title = gameTitle(occasion);
    if (asOf > end) {
      recaps.push({
        identityKey: occasion.identityKey,
        title,
        recap: oneRecapLine(occasion.facts),
      });
      continue;
    }
    games.push({
      identityKey: occasion.identityKey,
      title,
      status: asOf >= start ? 'live' : 'upcoming',
      score: latestFact(occasion.facts, 'score'),
      odds: latestFact(occasion.facts, 'odds'),
      result: latestFact(occasion.facts, 'result'),
    });
  }

  games.sort((left, right) => left.title.localeCompare(right.title));
  recaps.sort((left, right) => left.identityKey.localeCompare(right.identityKey));

  return {
    games,
    recaps,
    fantasyMatchups: source.fantasyMatchups,
  };
}

/** Logged-in read of the user's sports view. Server seat serves this path. */
export const USER_SPORTS_VIEW_PATH = '/user/sports-view';

const SportsFactSchema = z
  .object({
    value: z.string().min(1),
    asOf: z.string().datetime(),
    sourceUrl: z.string().url(),
  })
  .strict();

const SportsGameOccasionSchema = z
  .object({
    kind: z.string().min(1),
    identityKey: z.string().min(1).max(160),
    start: z.string().datetime(),
    end: z.string().datetime(),
    participants: z.array(z.string().min(1).max(80)).max(30),
    facts: z.array(SportsFactSchema).max(40),
    validFrom: z.string().datetime(),
    validUntil: z.string().datetime(),
  })
  .strict();

const SportsInterestLinkSchema = z
  .object({
    occasionId: z.string().min(1).max(160),
  })
  .strict();

const FantasyMatchupSchema = z
  .object({
    id: z.string().min(1),
    provider: z.enum(['espn', 'yahoo', 'sleeper']),
    leagueName: z.string().min(1),
    label: z.string().min(1),
    opponent: z.string().min(1),
    myScore: z.string().min(1),
    theirScore: z.string().min(1),
  })
  .strict();

const SportsViewSourceSchema = z
  .object({
    asOf: z.string().datetime(),
    occasions: z.array(SportsGameOccasionSchema),
    interests: z.array(SportsInterestLinkSchema),
    teams: z.array(z.string()),
    fantasyMatchups: z.array(FantasyMatchupSchema),
  })
  .strict();

export class SportsViewEnvelopeError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SportsViewEnvelopeError';
  }
}

function messageFromApiError(error: {message?: string} | undefined): string {
  if (error && typeof error.message === 'string' && error.message.length > 0) {
    return error.message;
  }
  return 'Sports view failed.';
}

function parseSportsViewSource(payload: unknown): SportsViewSource {
  const parsed = StandardApiResponseSchema.safeParse(payload);
  if (!parsed.success) {
    throw new SportsViewEnvelopeError('Malformed sports view envelope.');
  }
  if (!parsed.data.success) {
    throw new ApiRequestError(
      500,
      messageFromApiError(parsed.data.error),
      parsed.data.error,
    );
  }
  const source = SportsViewSourceSchema.safeParse(parsed.data.data);
  if (!source.success) {
    throw new SportsViewEnvelopeError('Malformed sports view envelope.');
  }
  const parsedSource: SportsViewSource = {
    asOf: source.data.asOf,
    occasions: source.data.occasions,
    interests: source.data.interests,
    teams: source.data.teams,
    fantasyMatchups: source.data.fantasyMatchups,
  };
  return parsedSource;
}

export async function readUserSportsView(client: ApiClient): Promise<SportsView> {
  const payload = await client.request<unknown>({
    path: USER_SPORTS_VIEW_PATH,
    method: 'GET',
  });
  return projectSportsView(parseSportsViewSource(payload));
}
