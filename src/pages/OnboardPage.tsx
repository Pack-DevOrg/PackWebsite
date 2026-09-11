/* eslint-disable react-refresh/only-export-components -- sequence constants are the /onboard contract */
import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { useSearchParams } from "react-router-dom";
import styled from "styled-components";
import { AuthProvider, useAuth } from "@/auth/AuthContext";
import { CompleteStep } from "@/components/onboard/CompleteStep";
import { ConnectionsStep } from "@/components/onboard/ConnectionsStep";
import { NotificationsStep } from "@/components/onboard/NotificationsStep";
import { ProgressDots } from "@/components/onboard/OnboardPrimitives";
import { PhotosConnectStep } from "@/components/onboard/PhotosConnectStep";
import { SignupLoginStep } from "@/components/onboard/SignupLoginStep";

export const ONBOARD_PATH = "/onboard";

/**
 * Website `/onboard` matches the app: Signup → Connections → Photos →
 * Notifications → Complete. Verify-phone is not a page in this sequence.
 */
export const ONBOARDING_SEQUENCE = [
  "signup",
  "connections",
  "photos",
  "notifications",
  "complete",
] as const;

export type OnboardingScreenName = (typeof ONBOARDING_SEQUENCE)[number];

const SIGNUP_INDEX = 0;
const LAST_STEP_INDEX = ONBOARDING_SEQUENCE.length - 1;

export function firstOnboardingStepBecauseAppParity(): OnboardingScreenName {
  return ONBOARDING_SEQUENCE[SIGNUP_INDEX];
}

function connectionsIndexBecauseAfterSignup(): number {
  return SIGNUP_INDEX + 1;
}

function nextStepIndexBecauseSequence(index: number): number {
  if (index >= LAST_STEP_INDEX) {
    return LAST_STEP_INDEX;
  }
  return index + 1;
}

function leadingPlusBecauseQueryPlusIsSpace(value: string): string {
  if (value.startsWith(" ")) {
    return `+${value.slice(1)}`;
  }
  return value;
}

function prefillPhoneBecauseSearchParam(
  value: string | null,
): string | undefined {
  if (value === null) {
    return undefined;
  }
  const withPlus = leadingPlusBecauseQueryPlusIsSpace(value);
  if (withPlus.length === 0) {
    return undefined;
  }
  return withPlus;
}

function shouldAdvanceSignupBecauseAuthenticated(
  status: ReturnType<typeof useAuth>["status"],
  stepIndex: number,
): boolean {
  if (status !== "authenticated") {
    return false;
  }
  return stepIndex === SIGNUP_INDEX;
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

function OnboardFlow() {
  const { status } = useAuth();
  const [searchParams] = useSearchParams();
  const [stepIndex, setStepIndex] = useState(SIGNUP_INDEX);
  const prefillPhone = prefillPhoneBecauseSearchParam(
    searchParams.get("phone"),
  );
  const step = ONBOARDING_SEQUENCE[stepIndex];

  useEffect(() => {
    if (shouldAdvanceSignupBecauseAuthenticated(status, stepIndex)) {
      setStepIndex(connectionsIndexBecauseAfterSignup());
    }
  }, [status, stepIndex]);

  const goNext = () => {
    setStepIndex((current) => nextStepIndexBecauseSequence(current));
  };

  return (
    <Page>
      <Helmet>
        <title>Onboard | Pack</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      <Shell>
        <ProgressDots count={5} activeIndex={stepIndex} />
        {step === "signup" ? (
          <SignupLoginStep prefillPhone={prefillPhone} />
        ) : null}
        {step === "connections" ? (
          <ConnectionsStep onContinue={goNext} onSkip={goNext} />
        ) : null}
        {step === "photos" ? (
          <PhotosConnectStep onSkip={goNext} onContinue={goNext} />
        ) : null}
        {step === "notifications" ? (
          <NotificationsStep onContinue={goNext} />
        ) : null}
        {step === "complete" ? <CompleteStep /> : null}
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
