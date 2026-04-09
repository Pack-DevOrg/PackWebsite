import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import styled, { keyframes } from "styled-components";
import { AlertTriangle, Loader2 } from "lucide-react";
import { useAuth } from "@/auth/AuthContext";
import { appConfig } from "@/config/appConfig";
import { clearLogoutIntent, hasLogoutIntent } from "@/auth/tokenStorage";
import { useMountEffect } from "@/hooks/useMountEffect";
import { useConversionTracking } from "@/hooks/useConversionTracking";
import { useI18n } from "@/i18n/I18nProvider";
import packLogo from "@/assets/logo.png";

const Container = styled.div`
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
  padding: clamp(1.25rem, 4vw, 2.5rem);
  background: var(--page-gradient);
  color: ${({ theme }) => theme.colors.text.primary};

  &::before {
    content: "";
    position: absolute;
    inset: 0;
    background:
      radial-gradient(circle at 18% 20%, rgba(231, 35, 64, 0.12), transparent 24%),
      radial-gradient(circle at 82% 12%, rgba(243, 210, 122, 0.16), transparent 26%),
      radial-gradient(circle at 50% 100%, rgba(243, 210, 122, 0.08), transparent 30%);
    pointer-events: none;
  }
`;

const GridVeil = styled.div`
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgba(255, 248, 236, 0.03) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255, 248, 236, 0.03) 1px, transparent 1px);
  background-size: 40px 40px;
  mask-image: linear-gradient(180deg, rgba(0, 0, 0, 0.36), transparent 78%);
  pointer-events: none;
`;

const Shell = styled.section`
  position: relative;
  z-index: 1;
  width: min(760px, 100%);
  display: grid;
  gap: 1rem;
`;

const Card = styled.div`
  background:
    linear-gradient(180deg, rgba(255, 248, 236, 0.08), rgba(255, 248, 236, 0.03)),
    radial-gradient(circle at top right, rgba(231, 35, 64, 0.16), transparent 28%),
    rgba(12, 9, 7, 0.88);
  border: 1px solid ${({ theme }) => theme.colors.border.light};
  border-radius: 28px;
  padding: clamp(1.4rem, 4vw, 2.4rem);
  display: grid;
  gap: 1.4rem;
  box-shadow: ${({ theme }) => theme.colors.shadow.dark};
  position: relative;
  overflow: hidden;

  &::before {
    content: "";
    position: absolute;
    inset: 0;
    background: linear-gradient(180deg, rgba(255, 255, 255, 0.04), transparent 28%);
    pointer-events: none;
  }
`;

const Header = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;

  @media (max-width: 640px) {
    flex-direction: column;
  }
`;

const LogoBadge = styled.div`
  width: 88px;
  height: 88px;
  border-radius: 28px;
  display: grid;
  place-items: center;
  background:
    radial-gradient(circle at top, rgba(243, 210, 122, 0.2), transparent 60%),
    linear-gradient(180deg, rgba(255, 248, 236, 0.12), rgba(255, 248, 236, 0.04));
  border: 1px solid ${({ theme }) => theme.colors.border.medium};
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.08),
    0 20px 40px rgba(0, 0, 0, 0.24);
`;

const Logo = styled.img`
  width: 52px;
  height: 52px;
  object-fit: contain;
`;

const Eyebrow = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.colors.text.secondary};
  font-size: 0.76rem;
  font-weight: 800;
  letter-spacing: 0.16em;
  text-transform: uppercase;
`;

const StatusPill = styled.div<{ $state: CallbackState }>`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.55rem 0.85rem;
  border-radius: 999px;
  border: 1px solid
    ${({ $state, theme }) =>
      $state === "error" ? "rgba(231, 35, 64, 0.32)" : theme.colors.border.medium};
  background:
    ${({ $state }) =>
      $state === "error"
        ? "rgba(231, 35, 64, 0.12)"
        : "linear-gradient(180deg, rgba(243, 210, 122, 0.14), rgba(243, 210, 122, 0.06))"};
  color: ${({ theme }) => theme.colors.text.primary};
  font-size: 0.82rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
`;

const StatusDot = styled.span<{ $state: CallbackState }>`
  width: 0.55rem;
  height: 0.55rem;
  border-radius: 999px;
  background: ${({ $state, theme }) =>
    $state === "error" ? theme.colors.secondary.main : theme.colors.primary.main};
  box-shadow: 0 0 18px
    ${({ $state, theme }) =>
      $state === "error" ? "rgba(231, 35, 64, 0.45)" : "rgba(243, 210, 122, 0.45)"};
`;

const spin = keyframes`
  to {
    transform: rotate(360deg);
  }
`;

const LoadingIcon = styled(Loader2)`
  width: 38px;
  height: 38px;
  animation: ${spin} 1.2s linear infinite;
  color: ${({ theme }) => theme.colors.primary.main};
`;

const ErrorIcon = styled(AlertTriangle)`
  width: 38px;
  height: 38px;
  color: ${({ theme }) => theme.colors.secondary.main};
`;

const Heading = styled.h1`
  margin: 0;
  font-size: clamp(2rem, 4.6vw, 3.5rem);
  line-height: 0.98;
  letter-spacing: -0.03em;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.text.primary};
`;

const Message = styled.p`
  margin: 0;
  font-size: 1rem;
  line-height: 1.6;
  color: ${({ theme }) => theme.colors.text.secondary};
`;

const HeroCopy = styled.div`
  display: grid;
  gap: 0.75rem;
  max-width: 34rem;
`;

const MessageStack = styled.div`
  display: grid;
  gap: 0.7rem;
`;

const SupportPanel = styled.div`
  display: grid;
  gap: 0.85rem;
  padding: 1rem 1.05rem;
  border-radius: 20px;
  background:
    linear-gradient(180deg, rgba(255, 248, 236, 0.05), rgba(255, 248, 236, 0.02)),
    rgba(255, 248, 236, 0.02);
  border: 1px solid rgba(255, 248, 236, 0.08);
`;

const SupportTitle = styled.p`
  margin: 0;
  font-size: 0.95rem;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.text.primary};
`;

const SupportList = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.65rem;
`;

const SupportChip = styled.span`
  display: inline-flex;
  align-items: center;
  padding: 0.45rem 0.72rem;
  border-radius: 999px;
  background: rgba(255, 248, 236, 0.04);
  border: 1px solid rgba(255, 248, 236, 0.08);
  color: ${({ theme }) => theme.colors.text.secondary};
  font-size: 0.84rem;
  line-height: 1.2;
`;

const FooterNote = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.colors.text.tertiary};
  font-size: 0.9rem;
  line-height: 1.5;
`;

const RetryButton = styled.button`
  width: fit-content;
  padding: 0.9rem 1.3rem;
  border-radius: 999px;
  border: none;
  background: ${({ theme }) => theme.colors.gradients.primaryButton};
  color: ${({ theme }) => theme.colors.background.primary};
  font-weight: 700;
  cursor: pointer;
  box-shadow: 0 18px 42px rgba(243, 210, 122, 0.18);
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease;

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 22px 48px rgba(243, 210, 122, 0.24);
  }
`;

type CallbackState = "processing" | "error";
type AuthCallbackSurfaceProps = {
  readonly state: CallbackState;
  readonly detailMessage: string;
  readonly onRetry?: (() => void) | undefined;
};

const processedCallbackKeys = new Set<string>();

const isAbsoluteRedirectUrl = (value: string): boolean =>
  /^https?:\/\//i.test(value);

const bootstrapAuthenticatedUser = async (
  accessToken: string,
  tokenType: string,
): Promise<void> => {
  const response = await fetch(`${appConfig.apiBaseUrl}/user/information`, {
    method: "GET",
    headers: {
      Accept: "application/json",
      Authorization: `${tokenType || "Bearer"} ${accessToken}`,
    },
  });

  if (!response.ok) {
    const details = await response.text().catch(() => "");
    throw new Error(
      details?.trim() ||
        "We couldn't finish preparing your account. Please try again.",
    );
  }
};

export const AuthCallbackSurface: React.FC<AuthCallbackSurfaceProps> = ({
  state,
  detailMessage,
  onRetry,
}) => {
  if (state === "processing") {
    return (
      <Container>
        <GridVeil aria-hidden="true" />
        <Shell>
          <Card>
            <Header>
              <LogoBadge>
                <Logo src={packLogo} alt="Pack" />
              </LogoBadge>
              <StatusPill $state="processing">
                <StatusDot $state="processing" />
                Secure sign-in
              </StatusPill>
            </Header>
            <HeroCopy>
              <Eyebrow>Pack account handoff</Eyebrow>
              <LoadingIcon aria-hidden="true" />
              <Heading>Welcome back. We&apos;re setting your trip space.</Heading>
              <Message>
                We&apos;re getting your travel profile ready so your next page
                feels like it already knows you.
              </Message>
            </HeroCopy>
            <SupportPanel>
              <SupportTitle>{detailMessage}</SupportTitle>
              <SupportList aria-label="Sign-in progress">
                <SupportChip>Confirming your account</SupportChip>
                <SupportChip>Syncing your travel profile</SupportChip>
                <SupportChip>Preparing the app view</SupportChip>
              </SupportList>
            </SupportPanel>
            <FooterNote>
              Built with care for travellers who hate messy travel days.
            </FooterNote>
          </Card>
        </Shell>
      </Container>
    );
  }

  return (
    <Container>
      <GridVeil aria-hidden="true" />
      <Shell>
        <Card>
          <Header>
            <LogoBadge>
              <Logo src={packLogo} alt="Pack" />
            </LogoBadge>
            <StatusPill $state="error">
              <StatusDot $state="error" />
              Sign-in interrupted
            </StatusPill>
          </Header>
          <HeroCopy>
            <Eyebrow>Pack account handoff</Eyebrow>
            <ErrorIcon aria-hidden="true" />
            <Heading>We hit a snag finishing your sign-in.</Heading>
            <MessageStack>
              <Message>{detailMessage}</Message>
              <Message>
                Nothing about your trip data has been lost. Start the sign-in
                again and we&apos;ll bring you back to the app.
              </Message>
            </MessageStack>
          </HeroCopy>
          <SupportPanel>
            <SupportTitle>What you can do next</SupportTitle>
            <SupportList aria-label="Recovery options">
              <SupportChip>Retry the secure handoff</SupportChip>
              <SupportChip>Return directly to your app workspace</SupportChip>
              <SupportChip>Use the same Google account as before</SupportChip>
            </SupportList>
          </SupportPanel>
          <FooterNote>
            Pack keeps the handoff tight so your travel context stays intact.
          </FooterNote>
          {onRetry ? <RetryButton onClick={onRetry}>Try Again</RetryButton> : null}
        </Card>
      </Shell>
    </Container>
  );
};

const AuthCallbackPageInstance: React.FC<{ readonly search: string }> = ({
  search,
}) => {
  const navigate = useNavigate();
  const { pathFor } = useI18n();
  const { completeLogin, login } = useAuth();
  const { trackConversion } = useConversionTracking();

  const [state, setState] = useState<CallbackState>("processing");
  const [errorMessage, setErrorMessage] = useState<string>(
    "Attempting to complete your sign-in. This should only take a moment."
  );

  useMountEffect(() => {
    if (hasLogoutIntent()) {
      clearLogoutIntent();
      navigate(pathFor("/"), { replace: true });
      return;
    }

    const searchParams = new URLSearchParams(search);
    const code = searchParams.get("code");
    const oauthState = searchParams.get("state");
    const error = searchParams.get("error");
    const description =
      searchParams.get("error_description") ?? "Authentication failed.";

    if (error) {
      setState("error");
      setErrorMessage(decodeURIComponent(description));
      return;
    }

    if (!code || !oauthState) {
      setState("error");
      setErrorMessage(
        "We couldn't complete the sign-in because the callback is missing required parameters. Please try signing in again."
      );
      return;
    }

    const callbackKey = `${code}:${oauthState}`;
    if (processedCallbackKeys.has(callbackKey)) {
      return;
    }
    processedCallbackKeys.add(callbackKey);

    void completeLogin(code, oauthState)
      .then(async ({ redirectPath, accessToken, tokenType }) => {
        if (accessToken) {
          await bootstrapAuthenticatedUser(accessToken, tokenType);
        }

        trackConversion('login', {
          auth_provider: 'google',
          event_category: 'conversion',
          event_label: 'oauth_callback_success',
        });
        window.history.replaceState({}, document.title, location.pathname);
        if (redirectPath && isAbsoluteRedirectUrl(redirectPath)) {
          window.location.replace(redirectPath);
          return;
        }
        navigate(redirectPath ?? pathFor("/app"), { replace: true });
      })
      .catch((errorCause) => {
        window.history.replaceState({}, document.title, location.pathname);
        setState("error");
        setErrorMessage(
          errorCause instanceof Error
            ? errorCause.message
            : "We couldn’t finish signing you in. Please try again."
        );
      });
  });

  if (state === "processing") {
    return <AuthCallbackSurface state={state} detailMessage={errorMessage} />;
  }

  return (
    <AuthCallbackSurface
      state={state}
      detailMessage={errorMessage}
      onRetry={() => login({ redirectPath: pathFor("/app") })}
    />
  );
};

export const AuthCallbackPage: React.FC = () => {
  const location = useLocation();
  const callbackKey = location.search || "__empty__";

  return <AuthCallbackPageInstance key={callbackKey} search={location.search} />;
};
