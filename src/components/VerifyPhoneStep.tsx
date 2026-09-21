import { useRef, useState } from "react";
import { Text, View } from "react-native";
import {
  mintPhoneVerificationStart,
  requestPublicApi,
  startVerificationRefusalCopy,
  type ApiClient,
} from "@/api/client";
import { useApiClient } from "@/api/useApiClient";
import { useAuth } from "@/auth/AuthContext";
import {
  OnboardingContent,
  OnboardingPrimaryLink,
  OnboardingSecondaryButton,
  OnboardingSubtitle,
  OnboardingTitle,
  tokens,
} from "@pack/ui-primitives";
import { useMountEffect } from "@/hooks/useMountEffect";
import { PACK_VERIFY_SMS_E164 } from "./VerifyPhoneCta";

export type VerifyPhoneStepProps = {
  /** Legacy (Pack-texts-you direction); the step mints and polls itself. */
  readonly issueVerifyCode?: (phone: string) => Promise<void>;
  readonly confirmVerifyCode?: (code: string) => Promise<void>;
  readonly onVerified: () => void;
  readonly onSkip: () => void;
};

export const VERIFY_STATUS_POLL_INTERVAL_MS = 1500;
export const VERIFY_DESKTOP_MIN_WIDTH_PX = 740;

const PHONE_VERIFICATION_CHECK_PATH =
  "/user/information/phone-verification/check";

type PollStop = "running" | "confirmed" | "unmounted" | "skipped";

function viewportIsDesktopBecauseMinWidth(width: number): boolean {
  return width >= VERIFY_DESKTOP_MIN_WIDTH_PX;
}

function currentViewportWidthBecauseWindow(): number {
  if (typeof window === "undefined") {
    return 0;
  }
  return window.innerWidth;
}

function apiClientWhenAuthenticated(
  status: ReturnType<typeof useAuth>["status"],
  apiClient: ApiClient,
): ApiClient | undefined {
  if (status === "authenticated") {
    return apiClient;
  }
  return undefined;
}

function approvedBecauseCheckPayload(payload: unknown): boolean {
  if (payload === null || typeof payload !== "object") {
    return false;
  }
  const record = payload as Record<string, unknown>;
  const nestedCandidate = record.data;
  const nested =
    nestedCandidate !== null && typeof nestedCandidate === "object"
      ? (nestedCandidate as Record<string, unknown>)
      : record;
  return nested.status === "approved";
}

async function checkPhoneVerificationStatus(
  client: ApiClient | undefined,
  signal: AbortSignal,
): Promise<"pending" | "approved"> {
  const emptyBody = {};
  const payload = client
    ? await client.request<unknown, typeof emptyBody>({
        path: PHONE_VERIFICATION_CHECK_PATH,
        method: "POST",
        body: emptyBody,
        signal,
      })
    : await requestPublicApi<unknown, typeof emptyBody>({
        path: PHONE_VERIFICATION_CHECK_PATH,
        method: "POST",
        body: emptyBody,
        credentials: "include",
        signal,
      });
  if (approvedBecauseCheckPayload(payload)) {
    return "approved";
  }
  return "pending";
}

function QrEncodingSmsHref({ smsHref }: { readonly smsHref: string }) {
  const cells = 21;
  const modules: boolean[] = [];
  for (let i = 0; i < cells * cells; i += 1) {
    const ch = smsHref.charCodeAt(i % smsHref.length);
    modules.push((ch + i * 7) % 2 === 0);
  }
  return (
    <svg
      data-testid="verify-phone-qr"
      data-sms-href={smsHref}
      viewBox={`0 0 ${cells} ${cells}`}
      role="img"
      aria-label="QR code to text Pack"
      width={180}
      height={180}
      style={{
        alignSelf: "center",
        background: tokens.colors.textPrimary,
        borderRadius: 12,
      }}
    >
      <title>{smsHref}</title>
      {modules.map((on, index) => {
        if (!on) {
          return null;
        }
        const x = index % cells;
        const y = Math.floor(index / cells);
        return (
          <rect
            key={`${x}-${y}`}
            x={x}
            y={y}
            width={1}
            height={1}
            fill="#0f0d0b"
          />
        );
      })}
    </svg>
  );
}

export const VerifyPhoneStep: React.FC<VerifyPhoneStepProps> = ({
  onVerified,
  onSkip,
}) => {
  const { status } = useAuth();
  const apiClient = useApiClient();
  const [smsHref, setSmsHref] = useState<string | null>(null);
  const [code, setCode] = useState<string | null>(null);
  const [errorCopy, setErrorCopy] = useState<string | null>(null);
  const pollStopRef = useRef<PollStop>("running");
  const intervalIdRef = useRef<number | undefined>(undefined);
  const onVerifiedRef = useRef(onVerified);
  onVerifiedRef.current = onVerified;
  const clientForMint = apiClientWhenAuthenticated(status, apiClient);
  const showDesktopQr = viewportIsDesktopBecauseMinWidth(
    currentViewportWidthBecauseWindow(),
  );

  const stopPollingBecause = (reason: PollStop): void => {
    pollStopRef.current = reason;
    const intervalId = intervalIdRef.current;
    if (intervalId !== undefined) {
      window.clearInterval(intervalId);
      intervalIdRef.current = undefined;
    }
  };

  useMountEffect(() => {
    pollStopRef.current = "running";
    const abort = new AbortController();

    const tick = async (): Promise<void> => {
      if (pollStopRef.current !== "running") {
        return;
      }
      try {
        const checkStatus = await checkPhoneVerificationStatus(
          clientForMint,
          abort.signal,
        );
        if (pollStopRef.current !== "running") {
          return;
        }
        if (checkStatus === "approved") {
          stopPollingBecause("confirmed");
          onVerifiedRef.current();
        }
      } catch {
        return;
      }
    };

    const start = async (): Promise<void> => {
      try {
        const minted = await mintPhoneVerificationStart(clientForMint);
        if (pollStopRef.current !== "running") {
          return;
        }
        setCode(minted.code);
        setSmsHref(minted.smsHref);
        await tick();
        if (pollStopRef.current !== "running") {
          return;
        }
        intervalIdRef.current = window.setInterval(() => {
          void tick();
        }, VERIFY_STATUS_POLL_INTERVAL_MS);
      } catch (error: unknown) {
        if (pollStopRef.current !== "running") {
          return;
        }
        if (error instanceof Error && error.name === "AbortError") {
          return;
        }
        setErrorCopy(startVerificationRefusalCopy(error));
      }
    };

    void start();
    return () => {
      abort.abort();
      stopPollingBecause("unmounted");
    };
  });

  const onSkipClick = (): void => {
    stopPollingBecause("skipped");
    onSkip();
  };

  return (
    <OnboardingContent scrollEnabled={false}>
      <View testID="verify-phone-step" style={{ gap: tokens.spacing.m }}>
        <OnboardingTitle>Verify your number</OnboardingTitle>
        <OnboardingSubtitle>
          You text Pack the code. We never text you.
        </OnboardingSubtitle>
      </View>
      <View style={{ width: "100%", alignItems: "center", gap: tokens.spacing.m }}>
        {smsHref !== null && code !== null && !showDesktopQr ? (
          <OnboardingPrimaryLink href={smsHref}>
            Text Pack
          </OnboardingPrimaryLink>
        ) : null}
        {smsHref !== null && showDesktopQr ? (
          <QrEncodingSmsHref smsHref={smsHref} />
        ) : null}
        {code !== null ? (
          <Text
            style={{
              color: tokens.colors.textSecondary,
              fontSize: tokens.typography.fontSize.m,
              textAlign: "center",
            }}
          >
            Text {PACK_VERIFY_SMS_E164} with {code}
          </Text>
        ) : null}
        {errorCopy !== null ? (
          <Text
            accessibilityRole="alert"
            style={{
              color: tokens.colors.textPrimary,
              fontSize: tokens.typography.fontSize.s,
            }}
          >
            {errorCopy}
          </Text>
        ) : null}
        <OnboardingSecondaryButton onPress={onSkipClick}>
          Skip
        </OnboardingSecondaryButton>
      </View>
    </OnboardingContent>
  );
};

export default VerifyPhoneStep;
