import React, { useEffect, useState, type ReactNode } from "react";
import styled from "styled-components";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { Calendar, LogOut, Mail, MessageCircle, Settings, Users } from "lucide-react";
import { useApiClient } from "@/api/useApiClient";
import {
  listFriends,
  respondToFriendRequest,
  type Friend,
  type FriendRespondAction,
} from "@/api/social";
import { useAuth } from "@/auth/AuthContext";
import { VerifyPhoneCta } from "@/components/VerifyPhoneCta";
import {
  Button,
  Card,
  IconDisc,
  MicroLabel,
  PageHeader,
} from "@/components/ui/Chrome";

export type AppSettingsAccountAction = () => void;

export type AppSettingsPageProps = {
  readonly mailConnected?: boolean;
  readonly calendarConnected?: boolean;
  readonly mailNeedsAttention?: boolean;
  readonly calendarNeedsAttention?: boolean;
  readonly phoneNeedsAttention?: boolean;
  readonly onConnectMail?: AppSettingsAccountAction;
  readonly onDisconnectMail?: AppSettingsAccountAction;
  readonly onConnectCalendar?: AppSettingsAccountAction;
  readonly onDisconnectCalendar?: AppSettingsAccountAction;
};

type ServiceStatus = "connected" | "disconnected" | "attention";
type StatusTone = "success" | "warning" | "neutral";
type DisconnectTarget = "mail" | "calendar";

const Page = styled.div`
  display: grid;
  gap: var(--space-4);
  padding: var(--space-2) 0 var(--space-4);
`;

const Layout = styled.div`
  display: grid;
  gap: var(--space-4);
  grid-template-columns: 1.5fr 1fr;
  align-items: start;

  @media (max-width: 1100px) {
    grid-template-columns: 1fr;
  }
`;

const SideColumn = styled.div`
  display: grid;
  gap: var(--space-4);
  align-content: start;
`;

const Panel = styled(Card)`
  display: grid;
  gap: var(--space-3);
  padding: var(--space-4);
`;

const SignedOutCard = styled(Panel)`
  max-width: 42rem;
`;

const SignedOutCopy = styled.p`
  margin: 0;
  color: var(--color-text-secondary);
  font-size: var(--font-size-small);
`;

const ServiceRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
  flex-wrap: wrap;
  padding: var(--space-3);
  border-radius: var(--radius-l);
  border: 1px solid var(--color-border);
  background: var(--color-background-subtle);
`;

const ServiceIdentity = styled.div`
  display: flex;
  align-items: center;
  gap: var(--space-3);
  min-width: 0;
`;

const ServiceCopy = styled.div`
  display: grid;
  gap: var(--space-1);
  min-width: 0;
`;

const ServiceNameRow = styled.div`
  display: flex;
  align-items: center;
  gap: var(--space-2);
  flex-wrap: wrap;
`;

const ServiceTitle = styled.div`
  font-size: var(--font-size-base);
  font-weight: 700;
  color: var(--color-text-primary);
`;

const ServiceLink = styled(Link)`
  color: var(--color-text-primary);
  font-weight: 700;
  font-size: var(--font-size-base);
  text-decoration: none;
`;

const LastSync = styled.span`
  color: var(--color-text-secondary);
  font-size: var(--font-size-small);
`;

const ActionRow = styled.div`
  display: inline-flex;
  gap: var(--space-2);
  flex-wrap: wrap;
  align-items: center;
`;

const StatusPill = styled.span<{ $tone: StatusTone }>`
  display: inline-flex;
  align-items: center;
  padding: var(--space-1) var(--space-2);
  border-radius: var(--radius-disc);
  font-size: var(--font-size-small);
  font-weight: 700;
  letter-spacing: var(--tracking-eyebrow);
  background: ${(props) => statusPillBackgroundBecauseTone(props.$tone)};
  color: ${(props) => statusPillForegroundBecauseTone(props.$tone)};
  border: 1px solid ${(props) => statusPillBorderBecauseTone(props.$tone)};
`;

const DiscGlyph = styled.span`
  display: inline-flex;

  svg {
    width: 1rem;
    height: 1rem;
  }
`;

const MAIL_CONNECTED_COPY = "Connected for booking confirmations.";
const MAIL_DISCONNECTED_COPY = "Not connected.";
const CALENDAR_CONNECTED_COPY = "Connected for trip alerts.";
const CALENDAR_DISCONNECTED_COPY = "Not connected.";
const PHONE_LAST_SYNC_COPY = "Text Pack from this browser.";
const EMAIL_FORWARDING_HREF = "/setup/email-forwarding";

const emailOnSessionOrMissing = (email: string | undefined): string => {
  if (email === undefined) {
    return "No email on this session.";
  }
  return email;
};

const booleanFlagFromProp = (flag: boolean | undefined): boolean => {
  if (flag === true) {
    return true;
  }
  return false;
};

const emptyFriendsBecauseNoServerListYet = (): Friend[] => [];

const idleDisconnectConfirmBecauseNoneOpen = (): DisconnectTarget | null => {
  return null;
};

const liveAccessTokenOrMissing = (token: string | null): string | null => {
  if (token === null) {
    return null;
  }
  if (token.length === 0) {
    return null;
  }
  return token;
};

const friendLabelBecauseDisplayNameOptional = (friend: Friend): string => {
  if (friend.displayName !== undefined && friend.displayName.length > 0) {
    return friend.displayName;
  }
  return friend.friendSub;
};

const pendingReceivedFriends = (friends: Friend[]): Friend[] =>
  friends.filter(
    (friend) =>
      friend.status === "pending" && friend.requestDirection === "received",
  );

const activeListedFriends = (friends: Friend[]): Friend[] =>
  friends.filter((friend) => friend.status === "active");

const serviceStatusFromFlags = (
  connected: boolean,
  needsAttention: boolean,
): ServiceStatus => {
  if (needsAttention === true) {
    return "attention";
  }
  if (connected === true) {
    return "connected";
  }
  return "disconnected";
};

const statusPillLabel = (status: ServiceStatus): string => {
  if (status === "connected") {
    return "Connected";
  }
  if (status === "attention") {
    return "Needs attention";
  }
  return "Not connected";
};

const statusPillTone = (status: ServiceStatus): StatusTone => {
  if (status === "connected") {
    return "success";
  }
  if (status === "attention") {
    return "warning";
  }
  return "neutral";
};

function statusPillBackgroundBecauseTone(tone: StatusTone): string {
  if (tone === "success") {
    return "var(--color-success-tint)";
  }
  if (tone === "warning") {
    return "var(--color-warning-tint)";
  }
  return "var(--color-background-subtle)";
}

function statusPillForegroundBecauseTone(tone: StatusTone): string {
  if (tone === "success") {
    return "var(--color-success)";
  }
  if (tone === "warning") {
    return "var(--color-warning)";
  }
  return "var(--color-text-secondary)";
}

function statusPillBorderBecauseTone(tone: StatusTone): string {
  if (tone === "success") {
    return "var(--color-success)";
  }
  if (tone === "warning") {
    return "var(--color-warning)";
  }
  return "var(--color-border)";
}

const lastSyncCopyBecauseConnected = (
  connected: boolean,
  connectedCopy: string,
  disconnectedCopy: string,
): string => {
  if (connected === true) {
    return connectedCopy;
  }
  return disconnectedCopy;
};

const settingsSubtitleBecauseAuth = (isAuthenticated: boolean): string => {
  if (isAuthenticated) {
    return "Connect travel accounts and manage this Pack session.";
  }
  return "Sign in from the app landing to manage connected accounts.";
};

const runAccountActionIfPresent = (
  action: AppSettingsAccountAction | undefined,
): void => {
  if (action === undefined) {
    return;
  }
  action();
};

function ServiceStatusRow({
  name,
  icon,
  status,
  lastSync,
  action,
}: {
  readonly name: ReactNode;
  readonly icon: ReactNode;
  readonly status: ServiceStatus;
  readonly lastSync: string;
  readonly action: ReactNode;
}) {
  const tone = statusPillTone(status);
  return (
    <ServiceRow>
      <ServiceIdentity>
        <IconDisc>
          <DiscGlyph>{icon}</DiscGlyph>
        </IconDisc>
        <ServiceCopy>
          <ServiceNameRow>
            <ServiceTitle>{name}</ServiceTitle>
            <StatusPill $tone={tone}>{statusPillLabel(status)}</StatusPill>
          </ServiceNameRow>
          <LastSync>{lastSync}</LastSync>
        </ServiceCopy>
      </ServiceIdentity>
      <ActionRow>{action}</ActionRow>
    </ServiceRow>
  );
}

function DisconnectConfirmPair({
  onCancel,
  onConfirm,
}: {
  readonly onCancel: () => void;
  readonly onConfirm: () => void;
}) {
  return (
    <>
      <Button type="button" variant="ghost" onClick={onCancel}>
        Cancel
      </Button>
      <Button type="button" variant="destructive" onClick={onConfirm}>
        Confirm
      </Button>
    </>
  );
}

export const AppSettingsPage: React.FC<AppSettingsPageProps> = ({
  mailConnected,
  calendarConnected,
  mailNeedsAttention,
  calendarNeedsAttention,
  phoneNeedsAttention,
  onConnectMail,
  onDisconnectMail,
  onConnectCalendar,
  onDisconnectCalendar,
}) => {
  const { user, status, logout, getAccessToken } = useAuth();
  const apiClient = useApiClient();
  const [friends, setFriends] = useState(emptyFriendsBecauseNoServerListYet);
  const [disconnectConfirm, setDisconnectConfirm] = useState(
    idleDisconnectConfirmBecauseNoneOpen,
  );
  const isAuthenticated = status === "authenticated";
  const mailIsConnected = booleanFlagFromProp(mailConnected);
  const calendarIsConnected = booleanFlagFromProp(calendarConnected);
  const mailAttention = booleanFlagFromProp(mailNeedsAttention);
  const calendarAttention = booleanFlagFromProp(calendarNeedsAttention);
  const phoneAttention = booleanFlagFromProp(phoneNeedsAttention);
  const mailStatus = serviceStatusFromFlags(mailIsConnected, mailAttention);
  const calendarStatus = serviceStatusFromFlags(
    calendarIsConnected,
    calendarAttention,
  );
  const phoneStatus = serviceStatusFromFlags(false, phoneAttention);

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
        const listed = await listFriends(apiClient, { accessToken: token });
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

  const connectMail = () => {
    runAccountActionIfPresent(onConnectMail);
  };

  const connectCalendar = () => {
    runAccountActionIfPresent(onConnectCalendar);
  };

  const closeDisconnectConfirm = () => {
    setDisconnectConfirm(idleDisconnectConfirmBecauseNoneOpen());
  };

  const confirmDisconnect = () => {
    if (disconnectConfirm === "mail") {
      runAccountActionIfPresent(onDisconnectMail);
    }
    if (disconnectConfirm === "calendar") {
      runAccountActionIfPresent(onDisconnectCalendar);
    }
    setDisconnectConfirm(idleDisconnectConfirmBecauseNoneOpen());
  };

  const respondToPending = (
    friendSub: string,
    action: FriendRespondAction,
  ) => {
    void (async () => {
      const token = liveAccessTokenOrMissing(await getAccessToken());
      if (token === null) {
        return;
      }
      const session = { accessToken: token };
      try {
        await respondToFriendRequest(apiClient, session, friendSub, action);
        const listed = await listFriends(apiClient, session);
        setFriends(listed);
      } catch {
        return;
      }
    })();
  };

  const mailAction =
    disconnectConfirm === "mail" ? (
      <DisconnectConfirmPair
        onCancel={closeDisconnectConfirm}
        onConfirm={confirmDisconnect}
      />
    ) : mailIsConnected ? (
      <Button
        type="button"
        variant="ghost"
        onClick={() => {
          setDisconnectConfirm("mail");
        }}
      >
        Disconnect mail
      </Button>
    ) : (
      <Button type="button" variant="primary" onClick={connectMail}>
        Connect mail
      </Button>
    );

  const calendarAction =
    disconnectConfirm === "calendar" ? (
      <DisconnectConfirmPair
        onCancel={closeDisconnectConfirm}
        onConfirm={confirmDisconnect}
      />
    ) : calendarIsConnected ? (
      <Button
        type="button"
        variant="ghost"
        onClick={() => {
          setDisconnectConfirm("calendar");
        }}
      >
        Disconnect calendar
      </Button>
    ) : (
      <Button type="button" variant="primary" onClick={connectCalendar}>
        Connect calendar
      </Button>
    );

  return (
    <>
      <Helmet>
        <title>Settings | Pack</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      <Page>
        <MicroLabel>Account</MicroLabel>
        <PageHeader
          title="Settings"
          subtitle={settingsSubtitleBecauseAuth(isAuthenticated)}
        >
          <DiscGlyph>
            <Settings aria-hidden="true" />
          </DiscGlyph>
        </PageHeader>

        {isAuthenticated ? (
          <Layout>
            <Panel aria-label="Connected accounts">
              <PageHeader title="Connected accounts">
                <DiscGlyph>
                  <Mail aria-hidden="true" />
                </DiscGlyph>
              </PageHeader>
              <ServiceStatusRow
                name="Google Calendar"
                icon={<Calendar aria-hidden="true" />}
                status={calendarStatus}
                lastSync={lastSyncCopyBecauseConnected(
                  calendarIsConnected,
                  CALENDAR_CONNECTED_COPY,
                  CALENDAR_DISCONNECTED_COPY,
                )}
                action={calendarAction}
              />
              <ServiceStatusRow
                name={
                  <ServiceLink to={EMAIL_FORWARDING_HREF}>
                    Gmail forwarding
                  </ServiceLink>
                }
                icon={<Mail aria-hidden="true" />}
                status={mailStatus}
                lastSync={lastSyncCopyBecauseConnected(
                  mailIsConnected,
                  MAIL_CONNECTED_COPY,
                  MAIL_DISCONNECTED_COPY,
                )}
                action={mailAction}
              />
              <ServiceStatusRow
                name="Text Pack"
                icon={<MessageCircle aria-hidden="true" />}
                status={phoneStatus}
                lastSync={PHONE_LAST_SYNC_COPY}
                action={<VerifyPhoneCta />}
              />
            </Panel>

            <SideColumn>
              <Panel aria-label="Friends">
                <PageHeader title="Friends">
                  <DiscGlyph>
                    <Users aria-hidden="true" />
                  </DiscGlyph>
                </PageHeader>
                {pendingReceivedFriends(friends).map((friend) => {
                  const label = friendLabelBecauseDisplayNameOptional(friend);
                  return (
                    <ServiceRow key={`pending-${friend.friendSub}`}>
                      <ServiceCopy>
                        <ServiceTitle>{label}</ServiceTitle>
                        <LastSync>Pending friend request.</LastSync>
                      </ServiceCopy>
                      <ActionRow>
                        <Button
                          type="button"
                          variant="primary"
                          onClick={() => {
                            respondToPending(friend.friendSub, "accept");
                          }}
                        >
                          Accept
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={() => {
                            respondToPending(friend.friendSub, "decline");
                          }}
                        >
                          Decline
                        </Button>
                      </ActionRow>
                    </ServiceRow>
                  );
                })}
                {activeListedFriends(friends).map((friend) => {
                  const label = friendLabelBecauseDisplayNameOptional(friend);
                  return (
                    <ServiceRow key={`active-${friend.friendSub}`}>
                      <ServiceCopy>
                        <ServiceTitle>{label}</ServiceTitle>
                        <LastSync>Active friend.</LastSync>
                      </ServiceCopy>
                    </ServiceRow>
                  );
                })}
                {friends.length === 0 ? (
                  <LastSync>No friends yet.</LastSync>
                ) : null}
              </Panel>

              <Panel aria-label="Account settings">
                <PageHeader title="Account settings">
                  <DiscGlyph>
                    <Settings aria-hidden="true" />
                  </DiscGlyph>
                </PageHeader>
                <ServiceCopy>
                  <MicroLabel>Signed in as</MicroLabel>
                  <LastSync>{emailOnSessionOrMissing(user?.email)}</LastSync>
                </ServiceCopy>
                <ActionRow>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => {
                      void logout();
                    }}
                  >
                    <DiscGlyph>
                      <LogOut aria-hidden="true" />
                    </DiscGlyph>
                    Sign out
                  </Button>
                </ActionRow>
              </Panel>
            </SideColumn>
          </Layout>
        ) : (
          <SignedOutCard>
            <PageHeader title="No account on this session" />
            <SignedOutCopy>
              Connected accounts and profile details stay hidden until you are
              signed in.
            </SignedOutCopy>
            <VerifyPhoneCta />
          </SignedOutCard>
        )}
      </Page>
    </>
  );
};

export default AppSettingsPage;
