import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { useSearchParams } from "react-router-dom";
import styled from "styled-components";
import { z } from "zod";

import { appConfig } from "../config/appConfig";

const LIVE_VIEW_EXPIRED_HEADING = "Pack needs your help — this link expired";
const MERCHANT_CHECKOUT_LIVE_VIEW_ALT = "Merchant checkout live view";
const STALE_FRAME_BADGE = "Stale frame";
const STALE_FRAME_AGE_MS = 5000;
const LIVE_VIEW_POLL_MS = 1000;
const OTP_FIELD_RE = /otp|one-?time|2fa|totp/i;

const PageContainer = styled.main`
  min-height: 80vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem 1.5rem;
  gap: 1.25rem;
  background: ${({ theme }) => theme.colors.background.primary};
`;

const FallbackHeading = styled.h1`
  font-size: 1.75rem;
  color: ${({ theme }) => theme.colors.text.primary};
  text-align: center;
`;

const ScreenStage = styled.div`
  position: relative;
  width: 100%;
  max-width: 72rem;
`;

const LiveViewFrameImage = styled.img`
  display: block;
  width: 100%;
  min-height: 60vh;
  object-fit: contain;
  background: ${({ theme }) => theme.colors.background.secondary};
`;

const StaleBadge = styled.p`
  position: absolute;
  top: 0.75rem;
  left: 0.75rem;
  margin: 0;
  padding: 0.35rem 0.65rem;
  border-radius: 0.35rem;
  background: ${({ theme }) => theme.colors.error.dark};
  color: ${({ theme }) => theme.colors.text.white};
  font-size: 0.875rem;
`;

const ProgressList = styled.ul`
  width: 100%;
  max-width: 72rem;
  margin: 0;
  padding: 0;
  list-style: none;
  color: ${({ theme }) => theme.colors.text.secondary};
`;

const TakeOverBar = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  width: 100%;
  max-width: 72rem;
`;

const ResumeButton = styled.button`
  padding: 0.6rem 1.1rem;
  border: 0;
  border-radius: 0.4rem;
  background: ${({ theme }) => theme.colors.primary.main};
  color: ${({ theme }) => theme.colors.background.primary};
  font-size: 1rem;
  cursor: pointer;
`;

function emptyStringBecauseOptionalAttrMissing(): string {
  return "";
}

function liveViewHostnameBecauseUrlParse(liveViewUrl: string): string {
  return new URL(liveViewUrl).hostname;
}

function httpsLiveViewUrlBecauseMerchantHostIframeIsForbidden(
  value: string,
  ctx: z.RefinementCtx,
): void {
  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    ctx.addIssue({
      code: "custom",
      message: "liveViewUrl must be a URL",
    });
    return;
  }
  if (parsed.protocol !== "https:") {
    ctx.addIssue({
      code: "custom",
      message: "liveViewUrl must be https",
    });
  }
}

const LiveViewHandoffSchema = z
  .object({
    liveViewUrl: z
      .string()
      .min(1)
      .superRefine(httpsLiveViewUrlBecauseMerchantHostIframeIsForbidden),
    merchantHost: z.string().min(1),
    jobId: z.string().min(1),
    expiresAtMs: z.number().int().positive(),
  })
  .refine(
    (handoff) =>
      liveViewHostnameBecauseUrlParse(handoff.liveViewUrl) !==
      handoff.merchantHost,
    { message: "liveViewUrl hostname must not equal merchantHost" },
  );

const LatestPointerSchema = z.object({
  seq: z.number().int(),
  ts: z.number(),
  key: z.string().optional(),
  url: z.string().optional(),
  paused: z.boolean().optional(),
  pauseForHelp: z.boolean().optional(),
  progressItems: z
    .array(
      z.object({
        label: z.string().min(1),
      }),
    )
    .optional(),
});

const FrameBytesUrlSchema = z.object({
  url: z.string().min(1),
});

const JobStatusProgressSchema = z.object({
  progressItems: z
    .array(
      z.object({
        label: z.string().min(1),
      }),
    )
    .optional(),
  paused: z.boolean().optional(),
  pauseForHelp: z.boolean().optional(),
});

export type LiveViewLatestFrame = {
  src: string;
  ts: number;
  seq: number;
  paused?: boolean;
};

function pausedFlagFromPointerBecauseTakeOver(pointer: {
  paused?: boolean;
  pauseForHelp?: boolean;
}): boolean {
  if (pointer.paused === true) {
    return true;
  }
  if (pointer.pauseForHelp === true) {
    return true;
  }
  return false;
}

function frameIsStaleBecauseOlderThanFiveSeconds(
  ts: number,
  nowMs: number,
): boolean {
  return nowMs - ts > STALE_FRAME_AGE_MS;
}

function attrValueBecauseMissingIsEmpty(value: string | null): string {
  if (value === null) {
    return emptyStringBecauseOptionalAttrMissing();
  }
  return value;
}

function fieldIsOtpBecauseAutocompleteNameOrId(
  target: EventTarget | null,
): boolean {
  if (!(target instanceof HTMLElement)) {
    return false;
  }
  const autocomplete = attrValueBecauseMissingIsEmpty(
    target.getAttribute("autocomplete"),
  );
  if (autocomplete === "one-time-code") {
    return true;
  }
  const name = attrValueBecauseMissingIsEmpty(target.getAttribute("name"));
  const id = attrValueBecauseMissingIsEmpty(target.getAttribute("id"));
  if (OTP_FIELD_RE.test(autocomplete)) {
    return true;
  }
  if (OTP_FIELD_RE.test(name)) {
    return true;
  }
  if (OTP_FIELD_RE.test(id)) {
    return true;
  }
  return false;
}

function hitlKeyPayloadBecauseSynthetic(
  event: KeyboardEvent,
): { type: "key"; key?: string; code?: string } {
  if (fieldIsOtpBecauseAutocompleteNameOrId(event.target)) {
    return { type: "key" };
  }
  return { type: "key", key: event.key, code: event.code };
}

function hitlPointerPayloadBecauseSynthetic(event: PointerEvent): {
  type: "pointer";
  x: number;
  y: number;
} {
  return { type: "pointer", x: event.clientX, y: event.clientY };
}

function liveViewHandoffGetUrlBecauseTokenQuery(token: string): string {
  const url = new URL(`${appConfig.apiBaseUrl}/live-view`);
  url.searchParams.set("token", token);
  return url.toString();
}

function opaqueLiveViewTokenFromSearchParamsBecauseQueryMustNotCarryUrl(
  searchParams: URLSearchParams,
): string | null {
  const token = searchParams.get("token");
  if (token === null) {
    return null;
  }
  if (token.length === 0) {
    return null;
  }
  return token;
}

function jobIdFromHandoffBodyBecauseServerExpiry(body: unknown): string | null {
  const parsed = LiveViewHandoffSchema.safeParse(body);
  if (!parsed.success) {
    return null;
  }
  if (parsed.data.expiresAtMs <= Date.now()) {
    return null;
  }
  return parsed.data.jobId;
}

export async function fetchLatestFrame(
  apiBaseUrl: string,
  jobId: string,
  signal?: AbortSignal,
): Promise<LiveViewLatestFrame> {
  const pointerResponse = await fetch(
    `${apiBaseUrl}/live-view/${jobId}/latest`,
    {
      method: "GET",
      signal,
    },
  );
  if (!pointerResponse.ok) {
    throw new Error("live-view latest pointer failed");
  }
  const body: unknown = await pointerResponse.json();
  const parsed = LatestPointerSchema.safeParse(body);
  if (!parsed.success) {
    throw new Error("live-view latest pointer invalid");
  }
  const pointer = parsed.data;
  const paused = pausedFlagFromPointerBecauseTakeOver(pointer);
  const pointerUrl = pointer.url;
  if (typeof pointerUrl === "string" && pointerUrl.length > 0) {
    return { src: pointerUrl, ts: pointer.ts, seq: pointer.seq, paused };
  }
  const bytesResponse = await fetch(
    `${apiBaseUrl}/live-view/${jobId}/frames/${pointer.seq}`,
    {
      method: "GET",
      signal,
    },
  );
  if (!bytesResponse.ok) {
    throw new Error("live-view frame bytes failed");
  }
  const contentTypeHeader = bytesResponse.headers.get("content-type");
  const contentType = attrValueBecauseMissingIsEmpty(contentTypeHeader);
  if (contentType.includes("application/json")) {
    const bytesBody: unknown = await bytesResponse.json();
    const bytesParsed = FrameBytesUrlSchema.safeParse(bytesBody);
    if (bytesParsed.success) {
      return {
        src: bytesParsed.data.url,
        ts: pointer.ts,
        seq: pointer.seq,
        paused,
      };
    }
  }
  const blob = await bytesResponse.blob();
  return {
    src: URL.createObjectURL(blob),
    ts: pointer.ts,
    seq: pointer.seq,
    paused,
  };
}

type LiveViewPageState =
  | { kind: "pending" }
  | { kind: "expired" }
  | { kind: "session"; jobId: string };

type SessionViewState = {
  mode: "watch" | "take-over";
  frame: LiveViewLatestFrame | null;
  progressLabels: string[];
};

function initialLiveViewPageStateBecauseMissingTokenIsExpired(
  token: string | null,
): LiveViewPageState {
  if (token === null) {
    return { kind: "expired" };
  }
  return { kind: "pending" };
}

function initialSessionViewBecauseWatchUntilPause(): SessionViewState {
  return { mode: "watch", frame: null, progressLabels: [] };
}

export function LiveViewConnectPage() {
  const [searchParams] = useSearchParams();
  const token =
    opaqueLiveViewTokenFromSearchParamsBecauseQueryMustNotCarryUrl(
      searchParams,
    );
  const [pageState, setPageState] = useState<LiveViewPageState>(() =>
    initialLiveViewPageStateBecauseMissingTokenIsExpired(token),
  );
  const [sessionView, setSessionView] = useState<SessionViewState>(
    initialSessionViewBecauseWatchUntilPause,
  );
  const [pollGeneration, setPollGeneration] = useState(0);

  useEffect(() => {
    if (token === null) {
      setPageState({ kind: "expired" });
      return;
    }

    const abortController = new AbortController();
    setPageState({ kind: "pending" });
    setSessionView(initialSessionViewBecauseWatchUntilPause());

    const run = async () => {
      try {
        const response = await fetch(
          liveViewHandoffGetUrlBecauseTokenQuery(token),
          {
            method: "GET",
            signal: abortController.signal,
          },
        );
        if (abortController.signal.aborted) {
          return;
        }
        if (!response.ok) {
          setPageState({ kind: "expired" });
          return;
        }
        const body: unknown = await response.json();
        if (abortController.signal.aborted) {
          return;
        }
        const jobId = jobIdFromHandoffBodyBecauseServerExpiry(body);
        if (jobId === null) {
          setPageState({ kind: "expired" });
          return;
        }
        setPageState({ kind: "session", jobId });
      } catch {
        if (abortController.signal.aborted) {
          return;
        }
        setPageState({ kind: "expired" });
      }
    };

    void run();

    return () => {
      abortController.abort();
    };
  }, [token]);

  useEffect(() => {
    if (pageState.kind !== "session") {
      return;
    }
    const jobId = pageState.jobId;
    const abortController = new AbortController();
    let cancelled = false;

    const tick = async () => {
      try {
        const frame = await fetchLatestFrame(
          appConfig.apiBaseUrl,
          jobId,
          abortController.signal,
        );
        if (cancelled) {
          return;
        }
        setSessionView((prev) => ({
          mode: frame.paused === true ? "take-over" : "watch",
          frame,
          progressLabels: prev.progressLabels,
        }));
      } catch {
        if (cancelled) {
          return;
        }
      }

      try {
        const statusResponse = await fetch(
          `${appConfig.apiBaseUrl}/jobs/${jobId}/status`,
          {
            method: "GET",
            signal: abortController.signal,
          },
        );
        if (cancelled) {
          return;
        }
        if (!statusResponse.ok) {
          return;
        }
        const statusBody: unknown = await statusResponse.json();
        const statusParsed = JobStatusProgressSchema.safeParse(statusBody);
        if (!statusParsed.success) {
          return;
        }
        const progressItems = statusParsed.data.progressItems;
        const labels =
          progressItems === undefined
            ? []
            : progressItems.map((item) => item.label);
        const statusPaused = pausedFlagFromPointerBecauseTakeOver(
          statusParsed.data,
        );
        setSessionView((prev) => ({
          mode: statusPaused ? "take-over" : prev.mode,
          frame: prev.frame,
          progressLabels: labels.length > 0 ? labels : prev.progressLabels,
        }));
      } catch {
        // keep the last frame
      }
    };

    void tick();
    const intervalId = window.setInterval(() => {
      void tick();
    }, LIVE_VIEW_POLL_MS);

    return () => {
      cancelled = true;
      abortController.abort();
      window.clearInterval(intervalId);
    };
  }, [pageState, pollGeneration]);

  useEffect(() => {
    if (pageState.kind !== "session") {
      return;
    }
    if (sessionView.mode !== "take-over") {
      return;
    }
    const jobId = pageState.jobId;
    const hitlUrl = `${appConfig.apiBaseUrl}/live-view/${jobId}/hitl`;

    const postHitl = (payload: { type: "key" | "pointer" }) => {
      void fetch(hitlUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    };

    const onKeyDown = (event: KeyboardEvent) => {
      postHitl(hitlKeyPayloadBecauseSynthetic(event));
    };
    const onPointerDown = (event: PointerEvent) => {
      postHitl(hitlPointerPayloadBecauseSynthetic(event));
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("pointerdown", onPointerDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("pointerdown", onPointerDown);
    };
  }, [pageState, sessionView.mode]);

  const onResume = () => {
    if (pageState.kind !== "session") {
      return;
    }
    const jobId = pageState.jobId;
    const run = async () => {
      try {
        await fetch(`${appConfig.apiBaseUrl}/live-view/${jobId}/resume`, {
          method: "POST",
        });
      } catch {
        // return to watch even if resume ack fails
      }
      setPollGeneration((generation) => generation + 1);
      setSessionView((prev) => ({
        mode: "watch",
        frame: prev.frame,
        progressLabels: prev.progressLabels,
      }));
    };
    void run();
  };

  const frame = sessionView.frame;
  const showStale =
    frame !== null &&
    frameIsStaleBecauseOlderThanFiveSeconds(frame.ts, Date.now());

  return (
    <>
      <Helmet>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      <PageContainer>
        {pageState.kind === "session" ? (
          <>
            {sessionView.mode === "take-over" ? (
              <TakeOverBar>
                <span>Take over</span>
                <ResumeButton type="button" onClick={onResume}>
                  Resume
                </ResumeButton>
              </TakeOverBar>
            ) : null}
            {frame !== null ? (
              <ScreenStage>
                <LiveViewFrameImage
                  alt={MERCHANT_CHECKOUT_LIVE_VIEW_ALT}
                  title={MERCHANT_CHECKOUT_LIVE_VIEW_ALT}
                  src={frame.src}
                />
                {showStale ? <StaleBadge>{STALE_FRAME_BADGE}</StaleBadge> : null}
              </ScreenStage>
            ) : null}
            {sessionView.progressLabels.length > 0 ? (
              <ProgressList>
                {sessionView.progressLabels.map((label) => (
                  <li key={label}>{label}</li>
                ))}
              </ProgressList>
            ) : null}
          </>
        ) : pageState.kind === "expired" ? (
          <FallbackHeading>{LIVE_VIEW_EXPIRED_HEADING}</FallbackHeading>
        ) : null}
      </PageContainer>
    </>
  );
}

export default LiveViewConnectPage;
