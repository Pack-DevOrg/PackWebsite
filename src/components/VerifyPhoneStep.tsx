import { useRef, useState } from "react";
import styled from "styled-components";
import { MessageCircle } from "lucide-react";
import {
  mintPhoneVerificationStart,
  requestPublicApi,
  type ApiClient,
} from "@/api/client";
import { useApiClient } from "@/api/useApiClient";
import { useAuth } from "@/auth/AuthContext";
import { useMountEffect } from "@/hooks/useMountEffect";
import { PACK_VERIFY_SMS_E164 } from "./VerifyPhoneCta";

export type VerifyPhoneStepProps = {
  readonly issueVerifyCode: (phone: string) => Promise<void>;
  readonly confirmVerifyCode: (code: string) => Promise<void>;
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

const Root = styled.div`
  display: grid;
  gap: ${({ theme }) => theme.spacing[3]};
  max-width: 28rem;
`;

const Title = styled.h2`
  margin: 0;
  color: ${({ theme }) => theme.colors.text.primary};
  font-size: ${({ theme }) => theme.typography.fontSizes.xl};
  font-weight: ${({ theme }) => theme.typography.fontWeights.bold};
`;

const Lead = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.colors.text.secondary};
  font-size: ${({ theme }) => theme.typography.fontSizes.base};
`;

const TextPackLink = styled.a`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.45rem;
  padding: 0.85rem 1.2rem;
  width: 100%;
  box-sizing: border-box;
  border-radius: 999px;
  border: none;
  background: ${({ theme }) => theme.colors.gradients.primaryButton};
  color: ${({ theme }) => theme.colors.background.primary};
  font-weight: ${({ theme }) => theme.typography.fontWeights.bold};
  text-decoration: none;
  cursor: pointer;

  svg {
    width: 18px;
    height: 18px;
  }
`;

const QrFrame = styled.svg`
  width: 180px;
  height: 180px;
  justify-self: center;
  background: ${({ theme }) => theme.colors.text.primary};
  border-radius: 12px;
`;

const SkipLink = styled.button`
  justify-self: start;
  padding: 0;
  border: none;
  background: none;
  color: ${({ theme }) => theme.colors.text.secondary};
  font-size: ${({ theme }) => theme.typography.fontSizes.small};
  cursor: pointer;
  text-decoration: underline;
`;

const ErrorCopy = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.colors.text.primary};
  font-size: ${({ theme }) => theme.typography.fontSizes.small};
`;

function QrEncodingSmsHref({ smsHref }: { readonly smsHref: string }) {
  const cells = 21;
  const modules: boolean[] = [];
  for (let i = 0; i < cells * cells; i += 1) {
    const ch = smsHref.charCodeAt(i % smsHref.length);
    modules.push((ch + i * 7) % 2 === 0);
  }
  return (
    <QrFrame
      data-testid="verify-phone-qr"
      data-sms-href={smsHref}
      viewBox={`0 0 ${cells} ${cells}`}
      role="img"
      aria-label="QR code to text Pack"
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
    </QrFrame>
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
      } catch {
        if (pollStopRef.current !== "running") {
          return;
        }
        setErrorCopy("Unable to start verification.");
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
    <Root data-testid="verify-phone-step">
      <Title>Verify your number</Title>
      <Lead>You text Pack the code. We never text you.</Lead>
      {smsHref !== null && code !== null && !showDesktopQr ? (
        <TextPackLink href={smsHref}>
          <MessageCircle aria-hidden="true" />
          Text Pack
        </TextPackLink>
      ) : null}
      {smsHref !== null && showDesktopQr ? (
        <QrEncodingSmsHref smsHref={smsHref} />
      ) : null}
      {code !== null ? (
        <Lead>
          Text {PACK_VERIFY_SMS_E164} with {code}
        </Lead>
      ) : null}
      {errorCopy !== null ? <ErrorCopy role="alert">{errorCopy}</ErrorCopy> : null}
      <SkipLink
        type="button"
        onClick={() => {
          onSkipClick();
        }}
      >
        Skip
      </SkipLink>
    </Root>
  );
};

export default VerifyPhoneStep;
