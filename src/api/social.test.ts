import {
  listFriends,
  removeFriend,
  respondToFriendRequest,
  sendFriendRequest,
  SocialEnvelopeError,
  SocialSessionRequiredError,
  updateFriendPlanningAccess,
} from './social';
import {createApiClient, type ApiClient, type ApiRequestOptions} from './client';

jest.mock('@/config/appConfig', () => ({
  appConfig: {
    apiBaseUrl: 'https://api.example.test',
    environment: 'prod',
    apiKey: undefined,
  },
}));

const TIMESTAMP = '2026-04-24T12:00:00.000Z';
const LIVE_SESSION = {accessToken: 'cognito-access-token-test'};
const LIVE_AUTHORIZATION = {
  Authorization: 'Bearer cognito-access-token-test',
};
const FRIEND_SUB = 'subject-alpha';

const NO_PLANNING_ACCESS = {
  profile: 'none' as const,
  availability: 'none' as const,
  bookedTravel: 'none' as const,
};

const PLAN_WITH_ME_ACCESS = {
  profile: 'basics' as const,
  availability: 'availability_windows' as const,
  bookedTravel: 'travel_facts' as const,
};

function friendRecord(overrides: Record<string, unknown> = {}) {
  return {
    ownerSub: 'subject-owner',
    friendSub: FRIEND_SUB,
    status: 'active',
    requestDirection: 'received',
    requestedBySub: FRIEND_SUB,
    displayName: 'Traveler Alpha',
    planningAccess: PLAN_WITH_ME_ACCESS,
    createdAt: TIMESTAMP,
    updatedAt: TIMESTAMP,
    ...overrides,
  };
}

function okEnvelope(data: unknown) {
  return {
    success: true as const,
    data,
  };
}

function recordingClient(payload: unknown = okEnvelope({friend: friendRecord()})): {
  client: ApiClient;
  calls: Array<{
    path: string;
    method?: string;
    body?: unknown;
    headers?: Record<string, string>;
  }>;
} {
  const calls: Array<{
    path: string;
    method?: string;
    body?: unknown;
    headers?: Record<string, string>;
  }> = [];
  const client: ApiClient = {
    request: async <Response, Body = unknown>(
      options: ApiRequestOptions<Body>,
    ): Promise<Response> => {
      calls.push({
        path: options.path,
        method: options.method,
        body: options.body,
        headers: options.headers,
      });
      await fetch(`https://api.example.test${options.path}`, {
        method: options.method,
        headers: options.headers,
        body:
          options.body !== undefined ? JSON.stringify(options.body) : undefined,
      });
      return payload as Response;
    },
  };
  return {client, calls};
}

describe('social api grants', () => {
  beforeEach(() => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => '{}',
    });
  });

  it('makes zero network calls when the Cognito session is missing', async () => {
    const {client} = recordingClient();

    await expect(listFriends(client, null)).rejects.toMatchObject({
      name: 'SocialSessionRequiredError',
      message: 'A live Cognito session is required for friend grants.',
      code: 'SOCIAL_SESSION_REQUIRED',
    });
    await expect(listFriends(client, null)).rejects.toBeInstanceOf(
      SocialSessionRequiredError,
    );
    await expect(
      sendFriendRequest(client, null, {friendSub: FRIEND_SUB}),
    ).rejects.toBeInstanceOf(SocialSessionRequiredError);
    await expect(
      respondToFriendRequest(client, null, FRIEND_SUB, 'accept'),
    ).rejects.toBeInstanceOf(SocialSessionRequiredError);
    await expect(removeFriend(client, null, FRIEND_SUB)).rejects.toBeInstanceOf(
      SocialSessionRequiredError,
    );
    await expect(
      updateFriendPlanningAccess(client, null, FRIEND_SUB, PLAN_WITH_ME_ACCESS),
    ).rejects.toBeInstanceOf(SocialSessionRequiredError);
    await expect(
      respondToFriendRequest(
        client,
        {accessToken: ''},
        FRIEND_SUB,
        'decline',
      ),
    ).rejects.toBeInstanceOf(SocialSessionRequiredError);

    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('sends status active on POST /friends/:sub/accept', async () => {
    const {client, calls} = recordingClient(
      okEnvelope({
        friend: friendRecord({
          status: 'active',
          respondedAt: '2026-04-24T12:05:00.000Z',
        }),
      }),
    );

    const friend = await respondToFriendRequest(
      client,
      LIVE_SESSION,
      FRIEND_SUB,
      'accept',
    );

    expect(calls).toEqual([
      {
        path: `/friends/${FRIEND_SUB}/accept`,
        method: 'POST',
        body: {status: 'active'},
        headers: LIVE_AUTHORIZATION,
      },
    ]);
    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(friend.status).toBe('active');
  });

  it('sends the live Cognito bearer token through the authenticated client', async () => {
    const envelope = okEnvelope({
      friend: friendRecord({
        status: 'active',
        respondedAt: '2026-04-24T12:05:00.000Z',
      }),
    });
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => JSON.stringify(envelope),
    });
    const client = createApiClient(
      async () => LIVE_SESSION.accessToken,
      () => 'Bearer',
    );

    const friend = await respondToFriendRequest(
      client,
      LIVE_SESSION,
      FRIEND_SUB,
      'accept',
    );

    expect(global.fetch).toHaveBeenCalledWith(
      `https://api.example.test/friends/${FRIEND_SUB}/accept`,
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({status: 'active'}),
        headers: expect.objectContaining({
          Authorization: LIVE_AUTHORIZATION.Authorization,
        }),
      }),
    );
    expect(friend.status).toBe('active');
  });

  it('sends status declined on POST /friends/:sub/decline', async () => {
    const {client, calls} = recordingClient(
      okEnvelope({
        friend: friendRecord({status: 'declined'}),
      }),
    );

    await respondToFriendRequest(client, LIVE_SESSION, FRIEND_SUB, 'decline');

    expect(calls[0]).toEqual({
      path: `/friends/${FRIEND_SUB}/decline`,
      method: 'POST',
      body: {status: 'declined'},
      headers: LIVE_AUTHORIZATION,
    });
  });

  it('throws a typed envelope error for a malformed friend mutation payload', async () => {
    const {client} = recordingClient({success: true, data: {notAFriend: true}});

    await expect(
      respondToFriendRequest(client, LIVE_SESSION, FRIEND_SUB, 'accept'),
    ).rejects.toMatchObject({
      name: 'SocialEnvelopeError',
      message: 'Malformed friends envelope.',
      code: 'SOCIAL_ENVELOPE_INVALID',
    });
    await expect(
      respondToFriendRequest(client, LIVE_SESSION, FRIEND_SUB, 'accept'),
    ).rejects.toBeInstanceOf(SocialEnvelopeError);
    await expect(
      respondToFriendRequest(client, LIVE_SESSION, FRIEND_SUB, 'accept'),
    ).rejects.not.toBeInstanceOf(TypeError);
  });

  it('throws a typed envelope error when the standard wrapper is missing', async () => {
    const {client} = recordingClient({not: 'an envelope'});

    await expect(
      respondToFriendRequest(client, LIVE_SESSION, FRIEND_SUB, 'accept'),
    ).rejects.toMatchObject({
      message: 'Malformed friends envelope.',
    });
    await expect(
      respondToFriendRequest(client, LIVE_SESSION, FRIEND_SUB, 'accept'),
    ).rejects.not.toBeInstanceOf(TypeError);
  });

  it('surfaces the server error message when a grant envelope fails', async () => {
    const withMessage = recordingClient({
      success: false,
      error: {message: 'Unable to update friend request.'},
    });
    await expect(
      respondToFriendRequest(
        withMessage.client,
        LIVE_SESSION,
        FRIEND_SUB,
        'accept',
      ),
    ).rejects.toMatchObject({
      name: 'ApiRequestError',
      message: 'Unable to update friend request.',
      status: 500,
    });

    const withoutMessage = recordingClient({
      success: false,
      error: {message: ''},
    });
    await expect(
      respondToFriendRequest(
        withoutMessage.client,
        LIVE_SESSION,
        FRIEND_SUB,
        'accept',
      ),
    ).rejects.toMatchObject({
      message: 'Friend request failed.',
    });
  });

  it('lists an empty friends envelope and a full friends envelope', async () => {
    const empty = recordingClient(okEnvelope({friends: []}));
    await expect(listFriends(empty.client, LIVE_SESSION)).resolves.toEqual([]);
    expect(empty.calls[0]).toEqual({
      path: '/friends',
      method: 'GET',
      body: undefined,
      headers: LIVE_AUTHORIZATION,
    });

    const full = recordingClient(
      okEnvelope({
        friends: [friendRecord()],
      }),
    );
    const friends = await listFriends(full.client, LIVE_SESSION);
    expect(friends).toHaveLength(1);
    expect(friends[0]?.friendSub).toBe(FRIEND_SUB);
    expect(friends[0]?.planningAccess).toEqual(PLAN_WITH_ME_ACCESS);
  });

  it('defaults omitted planningAccess on a list row to none, matching FriendSchema', async () => {
    const {planningAccess: _omitPlanningAccess, ...rowWithoutPlanningAccess} =
      friendRecord();
    const {client} = recordingClient(
      okEnvelope({friends: [rowWithoutPlanningAccess]}),
    );

    const friends = await listFriends(client, LIVE_SESSION);
    expect(friends).toHaveLength(1);
    expect(friends[0]?.planningAccess).toEqual(NO_PLANNING_ACCESS);
  });

  it('schema-skip mints an empty list when every friend row is invalid', async () => {
    const {client} = recordingClient(
      okEnvelope({
        friends: [{friendSub: 'subject-invalid'}],
      }),
    );

    await expect(listFriends(client, LIVE_SESSION)).resolves.toEqual([]);
  });

  it('keeps valid friends when one list row fails FriendSchema', async () => {
    const {client} = recordingClient(
      okEnvelope({
        friends: [friendRecord(), {friendSub: 'subject-invalid'}],
      }),
    );

    const friends = await listFriends(client, LIVE_SESSION);
    expect(friends).toHaveLength(1);
    expect(friends[0]?.friendSub).toBe(FRIEND_SUB);
  });

  it('throws a typed envelope error when the list payload has no friends array', async () => {
    const {client} = recordingClient(okEnvelope({people: []}));

    await expect(listFriends(client, LIVE_SESSION)).rejects.toBeInstanceOf(
      SocialEnvelopeError,
    );
    await expect(listFriends(client, LIVE_SESSION)).rejects.not.toBeInstanceOf(
      TypeError,
    );
  });

  it('throws a typed envelope error when list data is missing', async () => {
    const {client} = recordingClient({success: true});

    await expect(listFriends(client, LIVE_SESSION)).rejects.toBeInstanceOf(
      SocialEnvelopeError,
    );
    await expect(listFriends(client, LIVE_SESSION)).rejects.not.toBeInstanceOf(
      TypeError,
    );
  });

  it('throws a typed envelope error when list data is an array', async () => {
    const {client} = recordingClient(okEnvelope([]));

    await expect(listFriends(client, LIVE_SESSION)).rejects.toMatchObject({
      message: 'Malformed friends envelope.',
    });
  });

  it('throws a typed envelope error when list data is a primitive', async () => {
    const {client} = recordingClient(okEnvelope(5));

    await expect(listFriends(client, LIVE_SESSION)).rejects.toBeInstanceOf(
      SocialEnvelopeError,
    );
    await expect(listFriends(client, LIVE_SESSION)).rejects.not.toBeInstanceOf(
      TypeError,
    );
  });

  it('throws a typed envelope error when list data is null', async () => {
    const {client} = recordingClient({success: true, data: null});

    await expect(listFriends(client, LIVE_SESSION)).rejects.toBeInstanceOf(
      SocialEnvelopeError,
    );
    await expect(listFriends(client, LIVE_SESSION)).rejects.not.toBeInstanceOf(
      TypeError,
    );
  });

  it('rejects an empty friendSub without calling the network', async () => {
    const {client} = recordingClient();

    await expect(
      sendFriendRequest(client, LIVE_SESSION, {friendSub: ''}),
    ).rejects.toBeInstanceOf(SocialEnvelopeError);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('rejects invalid planning access without calling the network', async () => {
    const {client} = recordingClient();

    await expect(
      updateFriendPlanningAccess(
        client,
        LIVE_SESSION,
        FRIEND_SUB,
        {profile: 'nope'} as never,
      ),
    ).rejects.toBeInstanceOf(SocialEnvelopeError);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('throws a typed envelope error for a malformed remove payload', async () => {
    const {client} = recordingClient({success: true, data: {removed: false}});

    await expect(
      removeFriend(client, LIVE_SESSION, FRIEND_SUB),
    ).rejects.toBeInstanceOf(SocialEnvelopeError);
  });

  it('posts a friend request to /friends', async () => {
    const {client, calls} = recordingClient(
      okEnvelope({
        friend: friendRecord({
          status: 'pending',
          requestDirection: 'sent',
          requestedBySub: 'subject-owner',
          planningAccess: NO_PLANNING_ACCESS,
        }),
      }),
    );

    await sendFriendRequest(client, LIVE_SESSION, {
      friendSub: FRIEND_SUB,
      displayName: 'Traveler Alpha',
      planningAccess: NO_PLANNING_ACCESS,
    });

    expect(calls[0]).toEqual({
      path: '/friends',
      method: 'POST',
      body: {
        friendSub: FRIEND_SUB,
        displayName: 'Traveler Alpha',
        planningAccess: NO_PLANNING_ACCESS,
      },
      headers: LIVE_AUTHORIZATION,
    });
  });

  it('removes a friend with DELETE /friends/:sub', async () => {
    const {client, calls} = recordingClient(
      okEnvelope({friendSub: FRIEND_SUB, removed: true}),
    );

    const result = await removeFriend(client, LIVE_SESSION, FRIEND_SUB);

    expect(calls[0]).toEqual({
      path: `/friends/${FRIEND_SUB}`,
      method: 'DELETE',
      body: undefined,
      headers: LIVE_AUTHORIZATION,
    });
    expect(result).toEqual({friendSub: FRIEND_SUB, removed: true});
  });

  it('puts planning access on /friends/:sub/planning-access', async () => {
    const {client, calls} = recordingClient(
      okEnvelope({
        friend: friendRecord({planningAccess: PLAN_WITH_ME_ACCESS}),
      }),
    );

    await updateFriendPlanningAccess(
      client,
      LIVE_SESSION,
      FRIEND_SUB,
      PLAN_WITH_ME_ACCESS,
    );

    expect(calls[0]).toEqual({
      path: `/friends/${FRIEND_SUB}/planning-access`,
      method: 'PUT',
      body: {planningAccess: PLAN_WITH_ME_ACCESS},
      headers: LIVE_AUTHORIZATION,
    });
  });

  it('encodes friendSub on grant paths', async () => {
    const sub = 'subject/alpha';
    const {client, calls} = recordingClient(
      okEnvelope({
        friend: friendRecord({friendSub: sub}),
      }),
    );

    await respondToFriendRequest(client, LIVE_SESSION, sub, 'accept');

    expect(calls[0]?.path).toBe(`/friends/${encodeURIComponent(sub)}/accept`);
  });
});
