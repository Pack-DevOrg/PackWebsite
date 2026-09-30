import {z} from 'zod';
import {
  projectSportsView,
  type FantasyMatchup,
  type SportsView,
  type SportsViewSource,
} from '@/components/sports/projectSportsView';
import {StandardApiResponseSchema} from '@/schemas/common';
import {ApiRequestError, type ApiClient} from './client';

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
  return source.data;
}

export async function readUserSportsView(client: ApiClient): Promise<SportsView> {
  const payload = await client.request<unknown>({
    path: USER_SPORTS_VIEW_PATH,
    method: 'GET',
  });
  return projectSportsView(parseSportsViewSource(payload));
}

export type {FantasyMatchup, SportsView, SportsViewSource};
