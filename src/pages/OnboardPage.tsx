/* eslint-disable react-refresh/only-export-components -- sequence constants are the /onboard contract */
import { useState } from "react";
import { Helmet } from "react-helmet-async";
import styled from "styled-components";
import { useApiClient } from "@/api/useApiClient";
import { AuthProvider, useAuth } from "@/auth/AuthContext";
import { VerifyPhoneCta } from "@/components/VerifyPhoneCta";
import { VerifyPhoneStep } from "@/components/VerifyPhoneStep";

export const ONBOARD_PATH = "/onboard";

/**
 * Web SMS `/onboard` sequence. Auth first, then verify number, then
 * mail+calendar, then browser Notification API. No PhotosConnectScreen
 * (native PHPhotoLibrary).
 */
export const ONBOARDING_SEQUENCE = [
  "SignupLoginScreen",
  "VerifyPhoneScreen",
  "ConnectedAccountsScreen",
  "NotificationsSetupScreen",
  "OnboardingCompleteScreen",
] as const;

export type OnboardingScreenName = (typeof ONBOARDING_SEQUENCE)[number];

const STEP_LABELS: Record<OnboardingScreenName, string> = {
  SignupLoginScreen: "Sign up / log in",
  VerifyPhoneScreen: "Verify number",
  ConnectedAccountsScreen: "Connect accounts",
  NotificationsSetupScreen: "Browser notifications",
  OnboardingCompleteScreen: "Complete",
};

const VERIFY_PHONE_ISSUE_PATH = "/verify-phone/issue";
const VERIFY_PHONE_CONFIRM_PATH = "/verify-phone/confirm";

const FIRST_STEP: OnboardingScreenName = ONBOARDING_SEQUENCE[0];

export function firstOnboardingStepBecauseAppParity(): OnboardingScreenName {
  return FIRST_STEP;
}

function emailLooksValidBecauseAtSign(value: string): boolean {
  const trimmed = value.trim();
  const at = trimmed.indexOf("@");
  return at > 0 && at < trimmed.length - 1;
}

function nextStepIndexBecauseSequence(index: number): number {
  const last = ONBOARDING_SEQUENCE.length - 1;
  if (index >= last) {
    return last;
  }
  return index + 1;
}

function verifyPhoneIndexBecauseSequence(): number {
  return ONBOARDING_SEQUENCE.indexOf("VerifyPhoneScreen");
}

function browserNotificationApiOrMissing(): {
  requestPermission: () => Promise<NotificationPermission>;
} | undefined {
  if (typeof window === "undefined") {
    return undefined;
  }
  if (!("Notification" in window)) {
    return undefined;
  }
  return window.Notification;
}

function keepConnectMailContractBecauseSettingsOAuthUnwired(): void {
  return;
}

function keepConnectCalendarContractBecauseSettingsOAuthUnwired(): void {
  return;
}

const Page = styled.main`
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: clamp(1.25rem, 4vw, 2.5rem);
  background: ${({ theme }) => theme.colors.background.primary};
  color: ${({ theme }) => theme.colors.text.primary};
`;

const Shell = styled.section`
  width: min(720px, 100%);
  display: grid;
  gap: 1.25rem;
`;

const Card = styled.div`
  display: grid;
  gap: 1.1rem;
  padding: clamp(1.4rem, 4vw, 2.4rem);
  border-radius: 28px;
  border: 1px solid ${({ theme }) => theme.colors.border.light};
  background: ${({ theme }) => theme.colors.background.card};
  box-shadow: ${({ theme }) => theme.colors.shadow.dark};
`;

const Eyebrow = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.colors.text.secondary};
  font-size: 0.76rem;
  font-weight: 800;
  letter-spacing: 0.16em;
  text-transform: uppercase;
`;

const Title = styled.h1`
  margin: 0;
  font-size: clamp(1.6rem, 3vw, 2.2rem);
  letter-spacing: -0.03em;
`;

const Body = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.colors.text.secondary};
  line-height: 1.5;
`;

const StepList = styled.ol`
  display: grid;
  gap: 0.35rem;
  margin: 0;
  padding: 0;
  list-style: none;
`;

const StepItem = styled.li<{ $current: boolean }>`
  display: flex;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 0.45rem 0.7rem;
  border-radius: 12px;
  color: ${({ $current, theme }) =>
    $current ? theme.colors.text.primary : theme.colors.text.secondary};
  background: ${({ $current }) =>
    $current ? "rgba(243, 210, 122, 0.12)" : "transparent"};
  font-weight: ${({ $current }) => ($current ? 700 : 500)};
`;

const Field = styled.label`
  display: grid;
  gap: 0.35rem;
  font-weight: 600;
  font-size: 0.9rem;

  input {
    padding: 0.85rem 1rem;
    border-radius: 16px;
    border: 1px solid ${({ theme }) => theme.colors.border.medium};
    background: ${({ theme }) => theme.colors.background.input};
    color: ${({ theme }) => theme.colors.text.primary};
    font-size: 1rem;
  }
`;

const Actions = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.7rem;
`;

const PrimaryButton = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.85rem 1.2rem;
  border-radius: 999px;
  border: none;
  background: ${({ theme }) => theme.colors.gradients.primaryButton};
  color: ${({ theme }) => theme.colors.background.primary};
  font-weight: 700;
  cursor: pointer;
`;

const GhostButton = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.85rem 1.2rem;
  border-radius: 999px;
  border: 1px solid ${({ theme }) => theme.colors.border.medium};
  background: transparent;
  color: ${({ theme }) => theme.colors.text.primary};
  font-weight: 700;
  cursor: pointer;
`;

function sessionEmailBecauseAuthenticated(
  status: ReturnType<typeof useAuth>["status"],
  email: string | undefined,
): string | undefined {
  if (status !== "authenticated") {
    return undefined;
  }
  if (email === undefined || email.length === 0) {
    return undefined;
  }
  return email;
}

function AuthStep({
  onContinueAuthenticated,
}: {
  readonly onContinueAuthenticated: () => void;
}) {
  const { status, user, login } = useAuth();
  const [email, setEmail] = useState("");
  const sessionEmail = sessionEmailBecauseAuthenticated(status, user?.email);
  const canSubmitEmail = emailLooksValidBecauseAtSign(email);

  const startHostedLogin = () => {
    void login({ redirectPath: ONBOARD_PATH });
  };

  return (
    <>
      <Eyebrow>Welcome</Eyebrow>
      <Title>Welcome to Pack</Title>
      <Body>
        For security, log in. Use email or verify your phone, then connect
        mail and calendar and choose browser notifications.
      </Body>
      {sessionEmail !== undefined ? (
        <Body>Signed in as {sessionEmail}</Body>
      ) : null}
      {status === "authenticated" ? (
        <Actions>
          <PrimaryButton type="button" onClick={onContinueAuthenticated}>
            Continue
          </PrimaryButton>
        </Actions>
      ) : (
        <>
          <Field>
            Email
            <input
              type="email"
              name="email"
              autoComplete="email"
              value={email}
              onChange={(event) => {
                setEmail(event.target.value);
              }}
            />
          </Field>
          <Actions>
            <PrimaryButton
              type="button"
              disabled={!canSubmitEmail}
              onClick={startHostedLogin}
            >
              Continue with email
            </PrimaryButton>
            <GhostButton type="button" onClick={startHostedLogin}>
              Continue with Google
            </GhostButton>
          </Actions>
          <Body>Or verify by text:</Body>
          <VerifyPhoneCta />
        </>
      )}
    </>
  );
}

function VerifyPhoneOnboardStep({
  onVerified,
  onSkip,
}: {
  readonly onVerified: () => void;
  readonly onSkip: () => void;
}) {
  const apiClient = useApiClient();

  const issueVerifyCode = async (phone: string): Promise<void> => {
    await apiClient.request({
      path: VERIFY_PHONE_ISSUE_PATH,
      method: "POST",
      body: { phone },
    });
  };

  const confirmVerifyCode = async (code: string): Promise<void> => {
    await apiClient.request({
      path: VERIFY_PHONE_CONFIRM_PATH,
      method: "POST",
      body: { code },
    });
  };

  return (
    <>
      <Eyebrow>Verify</Eyebrow>
      <VerifyPhoneStep
        issueVerifyCode={issueVerifyCode}
        confirmVerifyCode={confirmVerifyCode}
        onVerified={onVerified}
        onSkip={onSkip}
      />
    </>
  );
}

function ConnectedAccountsStep({
  onContinue,
  onReaskVerifyPhone,
}: {
  readonly onContinue: () => void;
  readonly onReaskVerifyPhone: () => void;
}) {
  return (
    <>
      <Eyebrow>Accounts</Eyebrow>
      <Title>Connect accounts</Title>
      <Body>
        Connect email and calendar so Pack can find your trips and
        preferences.
      </Body>
      <Actions>
        <GhostButton
          type="button"
          onClick={keepConnectMailContractBecauseSettingsOAuthUnwired}
        >
          Connect mail
        </GhostButton>
        <GhostButton
          type="button"
          onClick={keepConnectCalendarContractBecauseSettingsOAuthUnwired}
        >
          Connect calendar
        </GhostButton>
        <GhostButton type="button" onClick={onReaskVerifyPhone}>
          Verify number
        </GhostButton>
        <PrimaryButton type="button" onClick={onContinue}>
          Continue
        </PrimaryButton>
      </Actions>
    </>
  );
}

function NotificationsSetupStep({
  onContinue,
}: {
  readonly onContinue: () => void;
}) {
  const notificationApi = browserNotificationApiOrMissing();

  const requestBrowserNotifications = () => {
    if (notificationApi === undefined) {
      onContinue();
      return;
    }
    void notificationApi.requestPermission().then(() => {
      onContinue();
    });
  };

  return (
    <>
      <Eyebrow>Alerts</Eyebrow>
      <Title>Browser notifications</Title>
      <Body>
        Turn on browser notifications so Pack can reach you in this tab when
        plans change. These are web notifications for this browser.
      </Body>
      {notificationApi === undefined ? (
        <Body>
          This browser does not support web notifications. You can skip and
          continue.
        </Body>
      ) : null}
      <Actions>
        {notificationApi === undefined ? null : (
          <PrimaryButton type="button" onClick={requestBrowserNotifications}>
            Enable browser notifications
          </PrimaryButton>
        )}
        <GhostButton type="button" onClick={onContinue}>
          Skip
        </GhostButton>
      </Actions>
    </>
  );
}

function CompleteStep() {
  return (
    <>
      <Eyebrow>Done</Eyebrow>
      <Title>You are in</Title>
      <Body>Onboarding is complete. Pack is ready.</Body>
    </>
  );
}

function OnboardFlow() {
  const [stepIndex, setStepIndex] = useState(0);
  const step = ONBOARDING_SEQUENCE[stepIndex];

  const goNext = () => {
    setStepIndex((current) => nextStepIndexBecauseSequence(current));
  };

  const goToVerifyPhoneBecauseReask = () => {
    setStepIndex(verifyPhoneIndexBecauseSequence());
  };

  return (
    <Page>
      <Helmet>
        <title>Onboard | Pack</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      <Shell>
        <nav aria-label="Onboarding steps">
          <StepList data-testid="onboard-sequence">
            {ONBOARDING_SEQUENCE.map((screen) => (
              <StepItem
                key={screen}
                data-screen={screen}
                $current={screen === step}
                aria-current={screen === step ? "step" : undefined}
              >
                <span>{STEP_LABELS[screen]}</span>
                <span>{screen}</span>
              </StepItem>
            ))}
          </StepList>
        </nav>
        <Card data-testid="onboard-step" data-step={step}>
          {step === "SignupLoginScreen" ? (
            <AuthStep onContinueAuthenticated={goNext} />
          ) : null}
          {step === "VerifyPhoneScreen" ? (
            <VerifyPhoneOnboardStep onVerified={goNext} onSkip={goNext} />
          ) : null}
          {step === "ConnectedAccountsScreen" ? (
            <ConnectedAccountsStep
              onContinue={goNext}
              onReaskVerifyPhone={goToVerifyPhoneBecauseReask}
            />
          ) : null}
          {step === "NotificationsSetupScreen" ? (
            <NotificationsSetupStep onContinue={goNext} />
          ) : null}
          {step === "OnboardingCompleteScreen" ? <CompleteStep /> : null}
        </Card>
      </Shell>
    </Page>
  );
}

export function OnboardPage() {
  return (
    <AuthProvider>
      <OnboardFlow />
    </AuthProvider>
  );
}

export default OnboardPage;
