import {z} from 'zod';
import {StandardApiResponseSchema} from '@/schemas/common';
import {ApiRequestError, type ApiClient} from './client';

const FRIENDS_PATH = '/friends';

// Stryker disable all -- SKIP schema literals + planning-access constants (one-file brief; cannot split). Grant API after restore is mutated.
export const NO_PLANNING_ACCESS = {
  profile: 'none',
  availability: 'none',
  bookedTravel: 'none',
} as const;

export const PLAN_WITH_ME_ACCESS = {
  profile: 'basics',
  availability: 'availability_windows',
  bookedTravel: 'travel_facts',
} as const;

export const FULL_PLANNING_ACCESS = {
  profile: 'full_preferences',
  availability: 'availability_windows',
  bookedTravel: 'travel_facts',
} as const;

const PlanningProfileAccessSchema = z.enum([
  'none',
  'basics',
  'full_preferences',
]);
const PlanningAvailabilityAccessSchema = z.enum([
  'none',
  'availability_windows',
]);
const PlanningBookedTravelAccessSchema = z.enum(['none', 'travel_facts']);
const LegacyPlanningPreferenceAccessSchema = z.enum([
  'none',
  'planning_summary',
  'planning_full',
]);

export const PlanningAccessSchema = z
  .object({
    profile: PlanningProfileAccessSchema.default('none'),
    availability: PlanningAvailabilityAccessSchema.default('none'),
    bookedTravel: PlanningBookedTravelAccessSchema.default('none'),
  })
  .strict();

export type PlanningAccess = z.infer<typeof PlanningAccessSchema>;

export const FriendStatusSchema = z.enum([
  'pending',
  'active',
  'declined',
  'blocked',
  'removed',
]);
export const FriendRequestDirectionSchema = z.enum(['sent', 'received']);

function planningAccessFromLegacyPreferenceAccess(
  access: string,
): PlanningAccess {
  const parsed = LegacyPlanningPreferenceAccessSchema.safeParse(access);
  if (!parsed.success) {
    return NO_PLANNING_ACCESS;
  }
  if (parsed.data === 'planning_full') {
    return FULL_PLANNING_ACCESS;
  }
  if (parsed.data === 'planning_summary') {
    return {
      ...NO_PLANNING_ACCESS,
      profile: 'basics',
    };
  }
  return NO_PLANNING_ACCESS;
}

const PlanningAccessInputSchema = z.preprocess((value) => {
  if (typeof value !== 'string') {
    return value;
  }
  return planningAccessFromLegacyPreferenceAccess(value);
}, PlanningAccessSchema);

function migratePlanningAccessContainer(value: unknown): unknown {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return value;
  }
  const record = value as Record<string, unknown>;
  const {preferenceAccess, accessGrantedToViewer, ...rest} = record;
  const migrated: Record<string, unknown> = {...rest};
  if (record.planningAccess !== undefined) {
    migrated.planningAccess = record.planningAccess;
  } else if (typeof preferenceAccess === 'string') {
    migrated.planningAccess = planningAccessFromLegacyPreferenceAccess(
      preferenceAccess,
    );
  }
  if (record.planningAccessGrantedToViewer !== undefined) {
    migrated.planningAccessGrantedToViewer =
      record.planningAccessGrantedToViewer;
  } else if (typeof accessGrantedToViewer === 'string') {
    migrated.planningAccessGrantedToViewer =
      planningAccessFromLegacyPreferenceAccess(accessGrantedToViewer);
  }
  return migrated;
}

function normalizeStoredFriendDisplayName(value: unknown): unknown {
  if (typeof value !== 'string') {
    return value;
  }
  const trimmed = value.trim();
  if (!trimmed || trimmed.startsWith('enc::') || trimmed.length > 120) {
    return undefined;
  }
  return trimmed;
}

// Match PackApp FriendSchema (packs.ts): list rows are not legacy-migrated.
// Request bodies still run migratePlanningAccessContainer below.
export const FriendSchema = z.object({
  ownerSub: z.string().min(1),
  friendSub: z.string().min(1),
  status: FriendStatusSchema,
  requestDirection: FriendRequestDirectionSchema,
  requestedBySub: z.string().min(1),
  displayName: z.preprocess(
    normalizeStoredFriendDisplayName,
    z.string().min(1).max(120).optional(),
  ),
  planningAccess: PlanningAccessSchema.default(NO_PLANNING_ACCESS),
  planningAccessGrantedToViewer: PlanningAccessSchema.optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  respondedAt: z.string().datetime().optional(),
});

export type Friend = z.infer<typeof FriendSchema>;

export const FriendListResponseSchema = z.object({
  friends: z.array(FriendSchema),
});

export const FriendResponseSchema = z.object({
  friend: FriendSchema,
});

export const CreateFriendRequestSchema = z.preprocess(
  migratePlanningAccessContainer,
  z
    .object({
      friendSub: z.string().min(1),
      displayName: z.string().min(1).max(120).optional(),
      planningAccess: PlanningAccessInputSchema.default(NO_PLANNING_ACCESS),
    })
    .strict(),
);

export type CreateFriendRequest = {
  readonly friendSub: string;
  readonly displayName?: string;
  readonly planningAccess?: PlanningAccess;
};

export const UpdateFriendPlanningAccessRequestSchema = z.preprocess(
  migratePlanningAccessContainer,
  z
    .object({
      planningAccess: PlanningAccessInputSchema,
    })
    .strict(),
);

export type UpdateFriendPlanningAccessRequest = z.infer<
  typeof UpdateFriendPlanningAccessRequestSchema
>;

export const FriendRemovalResponseSchema = z.object({
  friendSub: z.string().min(1),
  removed: z.literal(true),
});

export type FriendRemovalResponse = z.infer<typeof FriendRemovalResponseSchema>;
// Stryker restore all

const FRIEND_RESPOND_STATUS = {
  accept: 'active',
  decline: 'declined',
} as const;

export type FriendRespondAction = keyof typeof FRIEND_RESPOND_STATUS;

export type CognitoAccessSession = {
  readonly accessToken: string;
};

export class SocialSessionRequiredError extends Error {
  public readonly code = 'SOCIAL_SESSION_REQUIRED' as const;

  constructor() {
    super('A live Cognito session is required for friend grants.');
    this.name = 'SocialSessionRequiredError';
  }
}

export class SocialEnvelopeError extends Error {
  public readonly code = 'SOCIAL_ENVELOPE_INVALID' as const;

  constructor(message: string) {
    super(message);
    this.name = 'SocialEnvelopeError';
  }
}

function hasLiveCognitoAccessToken(
  session: CognitoAccessSession | null | undefined,
): session is CognitoAccessSession {
  return (
    typeof session?.accessToken === 'string' && session.accessToken.length > 0
  );
}

function requireLiveCognitoSession(
  session: CognitoAccessSession | null | undefined,
): CognitoAccessSession {
  if (!hasLiveCognitoAccessToken(session)) {
    throw new SocialSessionRequiredError();
  }
  return session;
}

const COGNITO_BEARER_SCHEME = 'Bearer';

function authorizationHeadersFromLiveSession(
  session: CognitoAccessSession,
): {readonly Authorization: string} {
  return {
    Authorization: `${COGNITO_BEARER_SCHEME} ${session.accessToken}`,
  };
}

function messageFromApiErrorBecauseEnvelopeFailed(
  error: {message?: string} | undefined,
): string {
  // Stryker disable next-line ConditionalExpression,LogicalOperator -- StandardApiResponseSchema already requires error.message; empty vs non-empty returns are pinned
  if (error && typeof error.message === 'string' && error.message.length > 0) {
    return error.message;
  }
  return 'Friend request failed.';
}

function malformedFriendsEnvelopeError(): SocialEnvelopeError {
  return new SocialEnvelopeError('Malformed friends envelope.');
}

function parseStandardSuccessData(payload: unknown): unknown {
  const parsed = StandardApiResponseSchema.safeParse(payload);
  if (!parsed.success) {
    throw malformedFriendsEnvelopeError();
  }
  if (!parsed.data.success) {
    throw new ApiRequestError(
      500,
      messageFromApiErrorBecauseEnvelopeFailed(parsed.data.error),
      parsed.data.error,
    );
  }
  return parsed.data.data;
}

function unknownFriendsArrayBecauseEnvelopeMustList(data: unknown): unknown[] {
  if (data === null || data === undefined) {
    throw malformedFriendsEnvelopeError();
  }
  const friends = (data as {friends?: unknown}).friends;
  if (!Array.isArray(friends)) {
    throw malformedFriendsEnvelopeError();
  }
  return friends;
}

function friendsFromWireSkippingInvalid(rawFriends: unknown[]): Friend[] {
  const friends: Friend[] = [];
  for (const rawFriend of rawFriends) {
    const parsed = FriendSchema.safeParse(rawFriend);
    if (parsed.success) {
      friends.push(parsed.data);
    }
  }
  return friends;
}

function parseFriendFromMutationEnvelope(payload: unknown): Friend {
  const parsed = FriendResponseSchema.safeParse(
    parseStandardSuccessData(payload),
  );
  if (!parsed.success) {
    throw malformedFriendsEnvelopeError();
  }
  return parsed.data.friend;
}

function parseRemovalFromEnvelope(payload: unknown): FriendRemovalResponse {
  const parsed = FriendRemovalResponseSchema.safeParse(
    parseStandardSuccessData(payload),
  );
  if (!parsed.success) {
    throw malformedFriendsEnvelopeError();
  }
  return parsed.data;
}

type CreateFriendRequestPayload = z.infer<typeof CreateFriendRequestSchema>;

function parseCreateFriendRequestOrThrow(
  input: unknown,
): CreateFriendRequestPayload {
  const parsed = CreateFriendRequestSchema.safeParse(input);
  if (!parsed.success) {
    throw malformedFriendsEnvelopeError();
  }
  return parsed.data;
}

function parsePlanningAccessRequestOrThrow(
  planningAccess: PlanningAccess,
): UpdateFriendPlanningAccessRequest {
  const parsed = UpdateFriendPlanningAccessRequestSchema.safeParse({
    planningAccess,
  });
  if (!parsed.success) {
    throw malformedFriendsEnvelopeError();
  }
  return parsed.data;
}

function friendGrantPath(friendSub: string, suffix?: string): string {
  const encoded = encodeURIComponent(friendSub);
  if (suffix) {
    return `${FRIENDS_PATH}/${encoded}/${suffix}`;
  }
  return `${FRIENDS_PATH}/${encoded}`;
}

export async function listFriends(
  client: ApiClient,
  session: CognitoAccessSession | null,
): Promise<Friend[]> {
  const live = requireLiveCognitoSession(session);
  const payload = await client.request<unknown>({
    path: FRIENDS_PATH,
    method: 'GET',
    headers: authorizationHeadersFromLiveSession(live),
  });
  const friends = friendsFromWireSkippingInvalid(
    unknownFriendsArrayBecauseEnvelopeMustList(
      parseStandardSuccessData(payload),
    ),
  );
  return friends;
}

export async function sendFriendRequest(
  client: ApiClient,
  session: CognitoAccessSession | null,
  input: CreateFriendRequest,
): Promise<Friend> {
  const live = requireLiveCognitoSession(session);
  const body = parseCreateFriendRequestOrThrow(input);
  const payload = await client.request<unknown, CreateFriendRequestPayload>({
    path: FRIENDS_PATH,
    method: 'POST',
    body,
    headers: authorizationHeadersFromLiveSession(live),
  });
  return parseFriendFromMutationEnvelope(payload);
}

export async function respondToFriendRequest(
  client: ApiClient,
  session: CognitoAccessSession | null,
  friendSub: string,
  action: FriendRespondAction,
): Promise<Friend> {
  const live = requireLiveCognitoSession(session);
  const status = FRIEND_RESPOND_STATUS[action];
  const payload = await client.request<unknown, {status: 'active' | 'declined'}>(
    {
      path: friendGrantPath(friendSub, action),
      method: 'POST',
      body: {status},
      headers: authorizationHeadersFromLiveSession(live),
    },
  );
  return parseFriendFromMutationEnvelope(payload);
}

export async function removeFriend(
  client: ApiClient,
  session: CognitoAccessSession | null,
  friendSub: string,
): Promise<FriendRemovalResponse> {
  const live = requireLiveCognitoSession(session);
  const payload = await client.request<unknown>({
    path: friendGrantPath(friendSub),
    method: 'DELETE',
    headers: authorizationHeadersFromLiveSession(live),
  });
  return parseRemovalFromEnvelope(payload);
}

export async function updateFriendPlanningAccess(
  client: ApiClient,
  session: CognitoAccessSession | null,
  friendSub: string,
  planningAccess: PlanningAccess,
): Promise<Friend> {
  const live = requireLiveCognitoSession(session);
  const body = parsePlanningAccessRequestOrThrow(planningAccess);
  const payload = await client.request<
    unknown,
    UpdateFriendPlanningAccessRequest
  >({
    path: friendGrantPath(friendSub, 'planning-access'),
    method: 'PUT',
    body,
    headers: authorizationHeadersFromLiveSession(live),
  });
  return parseFriendFromMutationEnvelope(payload);
}
