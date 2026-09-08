import {useEffect, useState, type FormEvent} from "react";
import styled from "styled-components";
import {Helmet} from "react-helmet-async";
import {useApiClient} from "@/api/useApiClient";
import {
  listFriends,
  respondToFriendRequest,
  sendFriendRequest,
  type Friend,
  type FriendRespondAction,
} from "@/api/social";
import {useAuth} from "@/auth/AuthContext";
import {
  Button,
  Card,
  IconDisc,
  MicroLabel,
  PageHeader,
} from "@/components/ui/Chrome";

function emptyFriendsBecauseNoServerListYet(): Friend[] {
  return [];
}

function emptyPhoneBecauseBlankField(): string {
  return "";
}

function liveAccessTokenOrMissing(token: string | null): string | null {
  if (token === null) {
    return null;
  }
  if (token.length === 0) {
    return null;
  }
  return token;
}

function friendLabelBecauseDisplayNameOptional(friend: Friend): string {
  if (friend.displayName !== undefined && friend.displayName.length > 0) {
    return friend.displayName;
  }
  return friend.friendSub;
}

function pendingReceivedFriends(friends: Friend[]): Friend[] {
  return friends.filter(
    (friend) =>
      friend.status === "pending" && friend.requestDirection === "received",
  );
}

function activeListedFriends(friends: Friend[]): Friend[] {
  return friends.filter((friend) => friend.status === "active");
}

function initialsBecauseLabel(label: string): string {
  const words = label.trim().split(/\s+/).filter((part) => part.length > 0);
  if (words.length === 0) {
    return "?";
  }
  if (words.length === 1) {
    const only = words[0];
    if (only === undefined) {
      return "?";
    }
    return only.slice(0, 2).toUpperCase();
  }
  const first = words[0];
  const last = words[words.length - 1];
  if (first === undefined || last === undefined) {
    return "?";
  }
  return `${first.slice(0, 1)}${last.slice(0, 1)}`.toUpperCase();
}

function personColorBecauseLabel(label: string): string {
  const key = label.trim().toUpperCase();
  let hash = 0;
  for (let index = 0; index < key.length; index += 1) {
    hash = (hash * 31 + key.charCodeAt(index)) >>> 0;
  }
  const colors = [
    "var(--color-accent)",
    "var(--color-secondary-accent)",
    "var(--color-success)",
    "var(--color-info)",
  ] as const;
  const color = colors[hash % colors.length];
  if (color === undefined) {
    return "var(--color-accent)";
  }
  return color;
}

function friendSubFromPhoneBecauseSocialClient(phone: string): string {
  return phone.trim();
}

function friendShareUrlBecauseAppFriendsPath(): string {
  return `${window.location.origin}/app/friends`;
}

const Page = styled.main`
  display: grid;
  gap: var(--space-4);
  padding: var(--space-3) 0 var(--space-5);
`;

const Columns = styled.div`
  display: grid;
  gap: var(--space-4);

  @media (min-width: 900px) {
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
    align-items: start;
  }
`;

const Stack = styled.div`
  display: grid;
  gap: var(--space-3);
  padding: var(--space-4);
`;

const FriendRow = styled.div`
  display: flex;
  align-items: center;
  gap: var(--space-2);
`;

const FriendCopy = styled.div`
  display: grid;
  gap: var(--space-1);
  min-width: 0;
  flex: 1;
`;

const FriendName = styled.strong`
  color: var(--color-text-primary);
  font-size: var(--font-size-base);
`;

const FriendHint = styled.span`
  color: var(--color-text-secondary);
  font-size: var(--font-size-small);
`;

const ActionRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
`;

const PhoneField = styled.input`
  width: 100%;
  box-sizing: border-box;
  background: var(--color-background-subtle);
  color: var(--color-text-primary);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-l);
  padding: var(--space-2) var(--space-3);
  min-height: 2.5rem;
  font: inherit;
`;

const EmptyCopy = styled.p`
  margin: 0;
  color: var(--color-text-secondary);
  font-size: var(--font-size-base);
`;

const AddForm = styled.form`
  display: grid;
  gap: var(--space-3);
  padding: var(--space-4);
`;

export function FriendsPage() {
  const {status, getAccessToken} = useAuth();
  const apiClient = useApiClient();
  const [friends, setFriends] = useState(emptyFriendsBecauseNoServerListYet);
  const [phone, setPhone] = useState(emptyPhoneBecauseBlankField());
  const [respondingSub, setRespondingSub] = useState<string | null>(null);
  const isAuthenticated = status === "authenticated";

  useEffect(() => {
    if (!isAuthenticated) {
      setFriends(emptyFriendsBecauseNoServerListYet());
      return;
    }

    let cancelled = false;

    void (async () => {
      const token = liveAccessTokenOrMissing(await getAccessToken());
      if (cancelled) {
        return;
      }
      if (token === null) {
        return;
      }
      try {
        const listed = await listFriends(apiClient, {accessToken: token});
        if (cancelled) {
          return;
        }
        setFriends(listed);
      } catch {
        if (cancelled) {
          return;
        }
        setFriends(emptyFriendsBecauseNoServerListYet());
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [apiClient, getAccessToken, isAuthenticated]);

  const pending = pendingReceivedFriends(friends);
  const active = activeListedFriends(friends);
  const showEmpty = pending.length === 0 && active.length === 0;

  const respondToPending = (
    friendSub: string,
    action: FriendRespondAction,
  ) => {
    if (respondingSub !== null) {
      return;
    }
    setRespondingSub(friendSub);
    void (async () => {
      const token = liveAccessTokenOrMissing(await getAccessToken());
      if (token === null) {
        setRespondingSub(null);
        return;
      }
      const session = {accessToken: token};
      try {
        await respondToFriendRequest(apiClient, session, friendSub, action);
        const listed = await listFriends(apiClient, session);
        setFriends(listed);
      } catch {
        setRespondingSub(null);
        return;
      }
      setRespondingSub(null);
    })();
  };

  const addFriendFromPhone = () => {
    void (async () => {
      const token = liveAccessTokenOrMissing(await getAccessToken());
      if (token === null) {
        return;
      }
      const friendSub = friendSubFromPhoneBecauseSocialClient(phone);
      if (friendSub.length === 0) {
        return;
      }
      const session = {accessToken: token};
      try {
        await sendFriendRequest(apiClient, session, {friendSub});
        const listed = await listFriends(apiClient, session);
        setFriends(listed);
        setPhone(emptyPhoneBecauseBlankField());
      } catch {
        return;
      }
    })();
  };

  const copyShareLink = () => {
    const url = friendShareUrlBecauseAppFriendsPath();
    if (typeof navigator.clipboard === "undefined") {
      return;
    }
    if (typeof navigator.clipboard.writeText !== "function") {
      return;
    }
    void navigator.clipboard.writeText(url);
  };

  return (
    <>
      <Helmet>
        <title>Friends | Pack</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      <Page>
        <PageHeader
          title="Friends"
          subtitle="People you plan trips with."
          discColor="var(--color-accent)">
          F
        </PageHeader>
        <Columns>
          <Card>
            <Stack>
              {pending.length > 0 ? (
                <>
                  <MicroLabel>Requests</MicroLabel>
                  {pending.map((friend) => {
                    const label = friendLabelBecauseDisplayNameOptional(friend);
                    return (
                      <FriendRow key={`pending-${friend.friendSub}`}>
                        <IconDisc color={personColorBecauseLabel(label)}>
                          {initialsBecauseLabel(label)}
                        </IconDisc>
                        <FriendCopy>
                          <FriendName>{label}</FriendName>
                          <FriendHint>Wants to be friends.</FriendHint>
                        </FriendCopy>
                        <ActionRow>
                          <Button
                            type="button"
                            variant="primary"
                            disabled={respondingSub !== null}
                            onClick={() => {
                              respondToPending(friend.friendSub, "accept");
                            }}>
                            Accept
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            disabled={respondingSub !== null}
                            onClick={() => {
                              respondToPending(friend.friendSub, "decline");
                            }}>
                            Ignore
                          </Button>
                        </ActionRow>
                      </FriendRow>
                    );
                  })}
                </>
              ) : null}

              <MicroLabel>Friends</MicroLabel>
              {active.map((friend) => {
                const label = friendLabelBecauseDisplayNameOptional(friend);
                return (
                  <FriendRow key={`active-${friend.friendSub}`}>
                    <IconDisc color={personColorBecauseLabel(label)}>
                      {initialsBecauseLabel(label)}
                    </IconDisc>
                    <FriendCopy>
                      <FriendName>{label}</FriendName>
                      <FriendHint>Active friend.</FriendHint>
                    </FriendCopy>
                  </FriendRow>
                );
              })}
              {showEmpty ? (
                <EmptyCopy>
                  Add a friend to start planning together.
                </EmptyCopy>
              ) : null}
            </Stack>
          </Card>

          <Card>
            <AddForm
              onSubmit={(event: FormEvent<HTMLFormElement>) => {
                event.preventDefault();
                addFriendFromPhone();
              }}>
              <MicroLabel>Add a friend</MicroLabel>
              <PhoneField
                id="friend-phone"
                name="phone"
                type="tel"
                autoComplete="tel"
                inputMode="tel"
                placeholder="Phone number"
                aria-label="Phone number"
                value={phone}
                onChange={(event) => {
                  setPhone(event.target.value);
                }}
              />
              <ActionRow>
                <Button type="submit" variant="primary">
                  Add a friend
                </Button>
                <Button type="button" variant="ghost" onClick={copyShareLink}>
                  Copy share link
                </Button>
              </ActionRow>
            </AddForm>
          </Card>
        </Columns>
      </Page>
    </>
  );
}
