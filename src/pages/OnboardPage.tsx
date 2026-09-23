/* eslint-disable react-refresh/only-export-components -- sequence constants are the /onboard contract */
import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import {
  consumeOnboardConnectionsReturn,
  mailboxesFromAccountsPayload,
  accountConnectWindow,
  readConnectedMailboxSnapshot,
  startGoogleAccountConnect,
  startMicrosoftAccountConnect,
  USER_ACCOUNTS_PATH,
  type ConnectedMailboxSnapshot,
} from "@/auth/accountConnect";
import { AuthProvider, useAuth } from "@/auth/AuthContext";
import { createApiClient } from "@/api/client";
import { env } from "@/utils/env";
import { CompleteStep } from "@/components/onboard/CompleteStep";
import { ConnectionsStep } from "@/components/onboard/ConnectionsStep";
import {
  OnboardViewport,
  OnboardViewportLock,
} from "@/components/onboard/OnboardPrimitives";
import { OnboardingContainer } from "@pack/ui-primitives";
import { SignupLoginStep } from "@/components/onboard/SignupLoginStep";
import { WhatPackDoesStep } from "@/components/onboard/WhatPackDoesStep";
import { VerifyPhoneStep } from "@/components/VerifyPhoneStep";
import { DEFAULT_SHARE_IMAGE_URL, SITE_ORIGIN } from "@/seo/pageSeo";

// iOS HEAD-probes this URL instead of missing *-precomposed.png paths that 200 as /error HTML.
const APPLE_TOUCH_ICON_URL = `${SITE_ORIGIN}/apple-touch-icon.png`;

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
const CONNECTIONS_INDEX = ONBOARDING_SEQUENCE.indexOf("connections");
const LAST_STEP_INDEX = ONBOARDING_SEQUENCE.length - 1;

function optionalEnv(value: unknown): string | undefined {
  if (typeof value !== "string") {
    return undefined;
  }
  const trimmed = value.trim();
  if (trimmed.length === 0) {
    return undefined;
  }
  return trimmed;
}

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

function OnboardFlow() {
  const { status, getAccessToken, tokens } = useAuth();
  const [stepIndex, setStepIndex] = useState(SIGNUP_INDEX);
  const [mailboxes, setMailboxes] = useState<ConnectedMailboxSnapshot>(
    readConnectedMailboxSnapshot,
  );
  const step = ONBOARDING_SEQUENCE[stepIndex];

  useEffect(() => {
    if (shouldAdvanceSignupBecauseAuthenticated(status, stepIndex)) {
      setStepIndex(whatPackDoesIndexBecauseAfterSignup());
    }
  }, [status, stepIndex]);

  // OAuth returns as a full load of /onboard. Land on Connections after the
  // signup auto-advance so the connected mailbox is the screen they come back to.
  useEffect(() => {
    if (status !== "authenticated") {
      return;
    }
    if (!consumeOnboardConnectionsReturn()) {
      return;
    }
    setStepIndex(CONNECTIONS_INDEX);
  }, [status]);

  useEffect(() => {
    if (step !== "connections" || status !== "authenticated") {
      return;
    }
    let cancelled = false;
    const client = createApiClient(
      getAccessToken,
      () => tokens?.tokenType ?? "Bearer",
    );
    void client
      .request<unknown>({ path: USER_ACCOUNTS_PATH, method: "GET" })
      .then((payload) => {
        if (cancelled) {
          return;
        }
        const rows = mailboxesFromAccountsPayload(payload);
        const google = rows.find((row) => row.provider === "google");
        const microsoft = rows.find((row) => row.provider === "microsoft");
        setMailboxes((current) => ({
          googleEmail: google?.email ?? current.googleEmail,
          microsoftEmail: microsoft?.email ?? current.microsoftEmail,
        }));
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [getAccessToken, status, step, tokens?.tokenType]);

  const goNext = () => {
    setStepIndex((current) => nextStepIndexBecauseSequence(current));
  };

  const connectGoogle = () => {
    accountConnectWindow.assign(
      startGoogleAccountConnect(optionalEnv(env.VITE_GOOGLE_WEB_CLIENT_ID)),
    );
  };

  const connectMicrosoft = () => {
    void startMicrosoftAccountConnect(
      optionalEnv(env.VITE_MICROSOFT_CLIENT_ID),
    ).then((url) => {
      accountConnectWindow.assign(url);
    });
  };

  return (
    <OnboardViewport data-testid="onboard-viewport">
      <OnboardViewportLock />
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
        <link rel="apple-touch-icon" href={APPLE_TOUCH_ICON_URL} />
        <link rel="apple-touch-icon-precomposed" href={APPLE_TOUCH_ICON_URL} />
        <link
          rel="apple-touch-icon"
          sizes="120x120"
          href={APPLE_TOUCH_ICON_URL}
        />
        <link
          rel="apple-touch-icon-precomposed"
          sizes="120x120"
          href={APPLE_TOUCH_ICON_URL}
        />
        <link
          rel="apple-touch-icon"
          sizes="152x152"
          href={APPLE_TOUCH_ICON_URL}
        />
        <link
          rel="apple-touch-icon-precomposed"
          sizes="152x152"
          href={APPLE_TOUCH_ICON_URL}
        />
        <link
          rel="apple-touch-icon"
          sizes="167x167"
          href={APPLE_TOUCH_ICON_URL}
        />
        <link
          rel="apple-touch-icon-precomposed"
          sizes="167x167"
          href={APPLE_TOUCH_ICON_URL}
        />
        <link
          rel="apple-touch-icon"
          sizes="180x180"
          href={APPLE_TOUCH_ICON_URL}
        />
        <link
          rel="apple-touch-icon-precomposed"
          sizes="180x180"
          href={APPLE_TOUCH_ICON_URL}
        />
      </Helmet>
      <OnboardingContainer showBack={false} showGlobe>
        {/* data-testid="onboard-step" is the land-smoke + deploy verifier
            token for /onboard (scripts/land-smoke.mjs, deploy-app-origin.mjs).
            No data-step: the DOM carries no app screen identifiers (see
            OnboardPage.test). Dropped in the sequence rewrite → every website
            land went red on SMOKE-FAIL route=/onboard (2026-09-12). */}
        <div data-testid="onboard-step" />
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
          <ConnectionsStep
            onContinue={goNext}
            onSkip={goNext}
            onConnectGoogle={connectGoogle}
            onConnectMicrosoft={connectMicrosoft}
            googleConnected={mailboxes.googleEmail !== null}
            microsoftConnected={mailboxes.microsoftEmail !== null}
            googleEmail={mailboxes.googleEmail}
            microsoftEmail={mailboxes.microsoftEmail}
          />
        ) : null}
        {step === "complete" ? <CompleteStep /> : null}
      </OnboardingContainer>
    </OnboardViewport>
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
