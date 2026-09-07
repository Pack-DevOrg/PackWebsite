import { useState } from "react";
import styled from "styled-components";
import { Helmet } from "react-helmet-async";
import { Calendar, LogOut, Mail } from "lucide-react";
import { useAuth } from "@/auth/AuthContext";
import { VerifyPhoneCta } from "@/components/VerifyPhoneCta";

export type AppSettingsAccountAction = () => void;

export type AppSettingsPageProps = {
  readonly mailConnected?: boolean;
  readonly calendarConnected?: boolean;
  readonly onConnectMail?: AppSettingsAccountAction;
  readonly onDisconnectMail?: AppSettingsAccountAction;
  readonly onConnectCalendar?: AppSettingsAccountAction;
  readonly onDisconnectCalendar?: AppSettingsAccountAction;
};

const Page = styled.div`
  display: grid;
  gap: clamp(1rem, 2vw, 1.5rem);
  padding: clamp(0.25rem, 1vw, 0.7rem) 0 clamp(1rem, 2.4vw, 1.5rem);
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
  padding: clamp(1rem, 2.2vw, 1.35rem);
  border-radius: 28px;
  border: 1px solid var(--color-border);
  background:
    radial-gradient(circle at 0% 0%, rgba(231, 35, 64, 0.12), transparent 28%),
    radial-gradient(circle at 100% 0%, rgba(243, 210, 122, 0.1), transparent 40%),
    linear-gradient(135deg, rgba(22, 17, 13, 0.84), rgba(27, 21, 16, 0.78));
  box-shadow: var(--shadow-soft);
  backdrop-filter: blur(18px);
`;

const TitleGroup = styled.div`
  display: grid;
  gap: 0.4rem;

  h1 {
    margin: 0;
    font-size: clamp(1.5rem, 2.6vw, 2.3rem);
    letter-spacing: -0.03em;
    line-height: 0.98;
  }

  p {
    margin: 0;
    color: var(--color-text-secondary);
  }
`;

const Layout = styled.div`
  display: grid;
  gap: 1.25rem;
  grid-template-columns: 1.5fr 1fr;

  @media (max-width: 1100px) {
    grid-template-columns: 1fr;
  }
`;

const Card = styled.section`
  background:
    radial-gradient(circle at 0% 0%, rgba(231, 35, 64, 0.12), transparent 24%),
    radial-gradient(circle at 100% 0%, rgba(243, 210, 122, 0.12), transparent 38%),
    linear-gradient(135deg, rgba(27, 21, 16, 0.78), rgba(32, 25, 19, 0.72));
  border: 1px solid var(--color-border);
  border-radius: 26px;
  box-shadow: var(--shadow-soft);
  padding: clamp(1rem, 2vw, 1.5rem);
  backdrop-filter: blur(16px);
  display: grid;
  gap: 1rem;
`;

const PanelHeading = styled.h2`
  margin: 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  min-height: 2rem;
  font-size: 1.05rem;
  font-weight: 700;
  letter-spacing: -0.01em;
  color: var(--color-text-primary);
`;

const AccountRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
  padding: 0.85rem 1rem;
  border-radius: 20px;
  border: 1px solid var(--color-border);
  background: var(--color-surface);
`;

const AccountCopy = styled.div`
  display: grid;
  gap: 0.2rem;

  strong {
    font-size: 0.95rem;
  }

  span {
    color: var(--color-text-secondary);
    font-size: 0.88rem;
  }
`;

const ActionRow = styled.div`
  display: inline-flex;
  gap: 0.55rem;
  flex-wrap: wrap;
`;

const PrimaryButton = styled.button<{ $ghost?: boolean }>`
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  padding: 0.85rem 1.2rem;
  border-radius: 999px;
  border: ${({ $ghost, theme }) =>
    $ghost ? `1px solid ${theme.colors.border.medium}` : "none"};
  background: ${({ $ghost, theme }) =>
    $ghost ? "var(--color-surface)" : theme.colors.gradients.primaryButton};
  color: ${({ $ghost, theme }) =>
    $ghost ? theme.colors.text.primary : theme.colors.background.primary};
  font-weight: 700;
  cursor: pointer;
  transition:
    transform 0.15s ease,
    box-shadow 0.15s ease,
    opacity 0.12s ease;

  &:hover {
    transform: translateY(-1px);
    box-shadow: ${({ $ghost }) =>
      $ghost ? "var(--shadow-soft)" : "0 16px 32px rgba(243, 210, 122, 0.22)"};
  }

  svg {
    width: 18px;
    height: 18px;
  }
`;

const SignedOutCard = styled(Card)`
  max-width: 42rem;
`;

const SignedOutCopy = styled.p`
  margin: 0;
  color: var(--color-text-secondary);
`;

const defaultDisconnectedBecauseUncontrolled = (): boolean => false;

const resolveConnectedState = (
  controlled: boolean | undefined,
  internal: boolean,
): boolean => {
  if (controlled === undefined) {
    return internal;
  }
  return controlled;
};

const emailOnSessionOrMissing = (email: string | undefined): string => {
  if (email === undefined) {
    return "No email on this session.";
  }
  return email;
};

const useConnectedState = (
  controlled: boolean | undefined,
): [boolean, (next: boolean) => void] => {
  const [internal, setInternal] = useState(() =>
    controlled === undefined
      ? defaultDisconnectedBecauseUncontrolled()
      : controlled,
  );
  const connected = resolveConnectedState(controlled, internal);
  return [connected, setInternal];
};

export const AppSettingsPage: React.FC<AppSettingsPageProps> = ({
  mailConnected,
  calendarConnected,
  onConnectMail,
  onDisconnectMail,
  onConnectCalendar,
  onDisconnectCalendar,
}) => {
  const { user, status, logout } = useAuth();
  const [mailIsConnected, setMailIsConnected] = useConnectedState(mailConnected);
  const [calendarIsConnected, setCalendarIsConnected] =
    useConnectedState(calendarConnected);
  const isAuthenticated = status === "authenticated";

  const connectMail = () => {
    onConnectMail?.();
    if (mailConnected === undefined) {
      setMailIsConnected(true);
    }
  };

  const disconnectMail = () => {
    onDisconnectMail?.();
    if (mailConnected === undefined) {
      setMailIsConnected(false);
    }
  };

  const connectCalendar = () => {
    onConnectCalendar?.();
    if (calendarConnected === undefined) {
      setCalendarIsConnected(true);
    }
  };

  const disconnectCalendar = () => {
    onDisconnectCalendar?.();
    if (calendarConnected === undefined) {
      setCalendarIsConnected(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>Settings | Pack</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      <Page>
        <Header>
          <TitleGroup>
            <h1>Settings</h1>
            <p>
              {isAuthenticated
                ? "Connect travel accounts and manage this Pack session."
                : "Sign in from the app landing to manage connected accounts."}
            </p>
          </TitleGroup>
        </Header>

        {isAuthenticated ? (
          <Layout>
            <Card aria-labelledby="connected-accounts-heading">
              <PanelHeading id="connected-accounts-heading">
                Connected accounts
              </PanelHeading>
              <AccountRow>
                <AccountCopy>
                  <strong>Google mail</strong>
                  <span>
                    {mailIsConnected
                      ? "Connected for booking confirmations."
                      : "Not connected."}
                  </span>
                </AccountCopy>
                <ActionRow>
                  <PrimaryButton type="button" onClick={connectMail}>
                    <Mail aria-hidden="true" />
                    Connect mail
                  </PrimaryButton>
                  {mailIsConnected ? (
                    <PrimaryButton type="button" $ghost onClick={disconnectMail}>
                      Disconnect mail
                    </PrimaryButton>
                  ) : null}
                </ActionRow>
              </AccountRow>
              <AccountRow>
                <AccountCopy>
                  <strong>Google calendar</strong>
                  <span>
                    {calendarIsConnected
                      ? "Connected for trip alerts."
                      : "Not connected."}
                  </span>
                </AccountCopy>
                <ActionRow>
                  <PrimaryButton type="button" onClick={connectCalendar}>
                    <Calendar aria-hidden="true" />
                    Connect calendar
                  </PrimaryButton>
                  {calendarIsConnected ? (
                    <PrimaryButton
                      type="button"
                      $ghost
                      onClick={disconnectCalendar}
                    >
                      Disconnect calendar
                    </PrimaryButton>
                  ) : null}
                </ActionRow>
              </AccountRow>
            </Card>

            <Card aria-labelledby="account-settings-heading">
              <PanelHeading id="account-settings-heading">
                Account settings
              </PanelHeading>
              <AccountCopy>
                <strong>Signed in as</strong>
                <span>{emailOnSessionOrMissing(user?.email)}</span>
              </AccountCopy>
              <PrimaryButton type="button" $ghost onClick={() => void logout()}>
                <LogOut aria-hidden="true" />
                Sign out
              </PrimaryButton>
              <VerifyPhoneCta />
            </Card>
          </Layout>
        ) : (
          <SignedOutCard>
            <PanelHeading>No account on this session</PanelHeading>
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
