/* eslint-disable react-refresh/only-export-components -- sequence constants are the /onboard contract */
import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import styled from "styled-components";
import { AuthProvider, useAuth } from "@/auth/AuthContext";
import { CompleteStep } from "@/components/onboard/CompleteStep";
import { ConnectionsStep } from "@/components/onboard/ConnectionsStep";
import { SignupLoginStep } from "@/components/onboard/SignupLoginStep";
import { WhatPackDoesStep } from "@/components/onboard/WhatPackDoesStep";
import { VerifyPhoneStep } from "@/components/VerifyPhoneStep";
import { DEFAULT_SHARE_IMAGE_URL } from "@/seo/pageSeo";

export const ONBOARD_PATH = "/onboard";

/**
 * Website `/onboard` is the app onboarding 1:1 minus device-only steps
 * (photos, notification permission), plus phone verification after the
 * info screen (Noah 2026-09-11): Signup → What Pack does → Verify phone
 * (Text Pack on mobile, QR on desktop, skippable) → Connections → Complete.
 */
export const ONBOARDING_SEQUENCE = [
  "signup",
  "what-pack-does",
  "verify-phone",
  "connections",
  "complete",
] as const;

export type OnboardingScreenName = (typeof ONBOARDING_SEQUENCE)[number];

const SIGNUP_INDEX = 0;
const LAST_STEP_INDEX = ONBOARDING_SEQUENCE.length - 1;

export function firstOnboardingStepBecauseAppParity(): OnboardingScreenName {
  return ONBOARDING_SEQUENCE[SIGNUP_INDEX];
}

function whatPackDoesIndexBecauseAfterSignup(): number {
  return SIGNUP_INDEX + 1;
}

function nextStepIndexBecauseSequence(index: number): number {
  if (index >= LAST_STEP_INDEX) {
    return LAST_STEP_INDEX;
  }
  return index + 1;
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
  const [stepIndex, setStepIndex] = useState(SIGNUP_INDEX);
  const step = ONBOARDING_SEQUENCE[stepIndex];

  useEffect(() => {
    if (shouldAdvanceSignupBecauseAuthenticated(status, stepIndex)) {
      setStepIndex(whatPackDoesIndexBecauseAfterSignup());
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
        <meta property="og:title" content="Onboard | Pack" />
        <meta property="og:image" content={DEFAULT_SHARE_IMAGE_URL} />
        <meta
          property="og:image:secure_url"
          content={DEFAULT_SHARE_IMAGE_URL}
        />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:image:alt" content="Pack" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:image" content={DEFAULT_SHARE_IMAGE_URL} />
      </Helmet>
      <Shell>
        {/* data-testid="onboard-step" is the land-smoke + deploy verifier
            token for /onboard (scripts/land-smoke.mjs, deploy-app-origin.mjs).
            It was dropped in the sequence rewrite and every website land
            went red on SMOKE-FAIL route=/onboard (2026-09-12). */}
        <div data-testid="onboard-step" data-step={step} />
        {step === "signup" ? (
          <SignupLoginStep />
        ) : null}
        {step === "what-pack-does" ? (
          <WhatPackDoesStep onNext={goNext} onSkip={goNext} />
        ) : null}
        {step === "verify-phone" ? (
          <VerifyPhoneStep onVerified={goNext} onSkip={goNext} />
        ) : null}
        {step === "connections" ? (
          <ConnectionsStep onContinue={goNext} onSkip={goNext} />
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
