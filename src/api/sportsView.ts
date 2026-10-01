import {z} from 'zod';
import {ApiRequestError, type ApiClient} from './client';

/**
 * Logged-in sports read.
 * Ended games this user follows are the occasion recaps on
 * GET /user/trips/recommendations (Cognito bearer, same ApiClient as other
 * user reads). The projection turns each of those into one recap. That route
 * does not carry live scores, odds, or fantasy matchups.
 */

export const SportsFactRoleSchema = z.enum(['score', 'odds', 'result']);

/** Codes this read publishes. Anything else is a malformed envelope. */
export const SportsViewErrorCodeSchema = z.enum([
  'UNAUTHENTICATED',
  'NOT_FOUND',
  'METHOD_NOT_ALLOWED',
  'SPORTS_VIEW_UNAVAILABLE',
]);

const SportsFactSchema = z
  .object({
    role: SportsFactRoleSchema,
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

const FantasyProviderSchema = z.enum(['espn', 'yahoo', 'sleeper']);

const FantasyMatchupSchema = z
  .object({
    id: z.string().min(1),
    provider: FantasyProviderSchema,
    leagueName: z.string().min(1),
    label: z.string().min(1),
    opponent: z.string().min(1),
    myScore: z.string().min(1),
    theirScore: z.string().min(1),
  })
  .strict();

export const SportsViewSourceSchema = z
  .object({
    asOf: z.string().datetime(),
    occasions: z.array(SportsGameOccasionSchema),
    interests: z.array(SportsInterestLinkSchema),
    teams: z.array(z.string()),
    fantasyMatchups: z.array(FantasyMatchupSchema),
  })
  .strict();

const SportsViewErrorBodySchema = z
  .object({
    message: z.string().min(1),
    code: SportsViewErrorCodeSchema,
    details: z.unknown().optional(),
  })
  .strict();

const SportsViewFailureSchema = z
  .object({
    success: z.literal(false),
    status: z.number().int().min(400).max(599),
    error: SportsViewErrorBodySchema,
    requestId: z.string().optional(),
  })
  .strict();

export type SportsFactRole = z.infer<typeof SportsFactRoleSchema>;
export type SportsFact = z.infer<typeof SportsFactSchema>;
export type SportsGameOccasion = z.infer<typeof SportsGameOccasionSchema>;
export type SportsInterestLink = z.infer<typeof SportsInterestLinkSchema>;
export type FantasyProvider = z.infer<typeof FantasyProviderSchema>;
export type FantasyMatchup = z.infer<typeof FantasyMatchupSchema>;
export type SportsViewSource = z.infer<typeof SportsViewSourceSchema>;
export type SportsViewErrorCode = z.infer<typeof SportsViewErrorCodeSchema>;

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

function latestFact(facts: readonly SportsFact[], role: SportsFactRole): string | null {
  let bestText: string | null = null;
  let bestInstant = Number.NEGATIVE_INFINITY;
  for (const fact of facts) {
    if (fact.role !== role) {
      continue;
    }
    const text = fact.value.trim();
    if (text.length === 0) {
      continue;
    }
    const instant = parsedInstant(fact.asOf);
    if (instant === null || instant < bestInstant) {
      continue;
    }
    bestInstant = instant;
    bestText = text;
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

function oneRecapLine(facts: readonly SportsFact[]): string | null {
  return latestFact(facts, 'result') ?? latestFact(facts, 'score');
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
      const recap = oneRecapLine(occasion.facts);
      if (recap === null) {
        continue;
      }
      recaps.push({
        identityKey: occasion.identityKey,
        title,
        recap,
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

/**
 * Deployed read that already joins public occasions to this user's
 * occasion-interest rows and returns one fact for each ended occasion.
 * Auth is the ApiClient bearer token, not a custom user header.
 */
export const TRIP_RECOMMENDATIONS_PATH = '/user/trips/recommendations';

const OccasionRecapWireSchema = z
  .object({
    occasionId: z.string().min(1).max(160),
    fact: z
      .object({
        value: z.string().min(1),
        asOf: z.string().datetime(),
        sourceUrl: z.string().url(),
      })
      .strict(),
  })
  .strict();

const RecommendationsDataSchema = z
  .object({
    generatedAt: z.string().datetime(),
    occasionRecaps: z.array(OccasionRecapWireSchema).max(20).optional(),
  })
  .passthrough();

const RecommendationsSuccessSchema = z
  .object({
    success: z.literal(true),
    data: RecommendationsDataSchema,
    requestId: z.string().optional(),
    metadata: z.unknown().optional(),
  })
  .strict();

export type OccasionRecapWire = z.infer<typeof OccasionRecapWireSchema>;

export class SportsViewEnvelopeError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SportsViewEnvelopeError';
  }
}

function endedWindow(asOf: string): {readonly start: string; readonly end: string} | null {
  const asOfMs = Date.parse(asOf);
  if (!Number.isFinite(asOfMs) || asOfMs < 1) {
    return null;
  }
  const end = new Date(asOfMs - 1).toISOString();
  return {start: end, end};
}

/**
 * Build the projection source from the deployed recap rows.
 * Each row is already this user's interest in an ended public occasion.
 * Fantasy matchups are not on this route, so that list stays empty.
 */
export function sportsSourceFromOccasionRecaps(
  asOf: string,
  recaps: readonly OccasionRecapWire[],
): SportsViewSource | null {
  const window = endedWindow(asOf);
  if (window === null) {
    return null;
  }
  const occasions: SportsGameOccasion[] = [];
  const interests: SportsInterestLink[] = [];
  const seen = new Set<string>();
  for (const recap of recaps) {
    if (seen.has(recap.occasionId)) {
      continue;
    }
    seen.add(recap.occasionId);
    occasions.push({
      kind: 'game',
      identityKey: recap.occasionId,
      start: window.start,
      end: window.end,
      participants: [],
      facts: [
        {
          role: 'result',
          value: recap.fact.value,
          asOf: recap.fact.asOf,
          sourceUrl: recap.fact.sourceUrl,
        },
      ],
      validFrom: window.start,
      validUntil: window.end,
    });
    interests.push({occasionId: recap.occasionId});
  }
  return {
    asOf,
    occasions,
    interests,
    teams: [],
    fantasyMatchups: [],
  };
}

export function parseRecommendationsSportsView(payload: unknown): SportsView {
  const failure = SportsViewFailureSchema.safeParse(payload);
  if (failure.success) {
    throw new ApiRequestError(
      failure.data.status,
      failure.data.error.message,
      failure.data.error,
    );
  }
  const success = RecommendationsSuccessSchema.safeParse(payload);
  if (!success.success) {
    throw new SportsViewEnvelopeError('Malformed sports view envelope.');
  }
  const source = sportsSourceFromOccasionRecaps(
    success.data.data.generatedAt,
    success.data.data.occasionRecaps ?? [],
  );
  if (source === null) {
    throw new SportsViewEnvelopeError('Malformed sports view envelope.');
  }
  return projectSportsView(source);
}

export async function readUserSportsView(client: ApiClient): Promise<SportsView> {
  const payload = await client.request<unknown>({
    path: TRIP_RECOMMENDATIONS_PATH,
    method: 'GET',
  });
  return parseRecommendationsSportsView(payload);
}
