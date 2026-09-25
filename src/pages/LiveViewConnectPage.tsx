import {
  useEffect,
  useMemo,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";
import { Helmet } from "react-helmet-async";
import { useLocation, useParams, useSearchParams } from "react-router-dom";
import styled from "styled-components";
import { z } from "zod";

import type { ApiClient } from "../api/client";
import { useApiClient } from "../api/useApiClient";
import { AuthProvider, useAuth } from "../auth/AuthContext";
import { appConfig } from "../config/appConfig";

const LIVE_VIEW_EXPIRED_HEADING = "Pack needs your help — this link expired";
const MERCHANT_CHECKOUT_LIVE_VIEW_ALT = "Merchant checkout live view";
const STALE_FRAME_BADGE = "Stale frame";
const STALE_FRAME_AGE_MS = 5000;
const LIVE_VIEW_POLL_MS = 1000;
const OTP_FIELD_RE = /otp|one-?time|2fa|totp/i;
const LIVE_VIEW_OTP_INPUT_ID = "live-view-otp";
const OTP_DIGITS_RE = /^\d{4,8}$/;
/** Cloudflare Browser Run viewer host: the signed tab-mode viewer, iframed for take-over. */
const CLOUDFLARE_LIVE_VIEW_HOST = "live.browser.run";
const LIVE_VIEW_SIGN_IN_HEADING = "Sign in to watch Pack work";
const LIVE_VIEW_SIGN_IN_BUTTON = "Sign in";
/** The private session emulates a phone (iPhone 15 CSS viewport). */
const MOBILE_VIEWPORT_WIDTH_PX = 393;
const MOBILE_VIEWPORT_HEIGHT_PX = 659;

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

const LiveViewPhoneFrame = styled.iframe`
  display: block;
  width: min(100%, ${MOBILE_VIEWPORT_WIDTH_PX}px);
  aspect-ratio: ${MOBILE_VIEWPORT_WIDTH_PX} / ${MOBILE_VIEWPORT_HEIGHT_PX};
  margin: 0 auto;
  border: 0;
  border-radius: 1.25rem;
  background: ${({ theme }) => theme.colors.background.secondary};
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

const OtpForm = styled.form`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  width: 100%;
  max-width: 24rem;
`;

const OtpLabel = styled.label`
  color: ${({ theme }) => theme.colors.text.primary};
  font-size: 1rem;
`;

const OtpInput = styled.input`
  padding: 0.75rem 1rem;
  font-size: 1.5rem;
  border-radius: 0.4rem;
  border: 1px solid ${({ theme }) => theme.colors.text.secondary};
  background: ${({ theme }) => theme.colors.background.primary};
  color: ${({ theme }) => theme.colors.text.primary};
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

const PauseFieldSchema = z
  .object({
    autocomplete: z.string().optional(),
    name: z.string().optional(),
    id: z.string().optional(),
  })
  .optional();

const LatestPointerSchema = z.object({
  seq: z.number().int(),
  ts: z.number(),
  key: z.string().optional(),
  url: z.string().optional(),
  paused: z.boolean().optional(),
  pauseForHelp: z.boolean().optional(),
  field: PauseFieldSchema,
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
  field: PauseFieldSchema,
});

type PauseFieldAttrs = {
  autocomplete: string;
  name: string;
  id: string;
};

export type LiveViewLatestFrame = {
  src: string;
  ts: number;
  seq: number;
  paused?: boolean;
  field: PauseFieldAttrs | null;
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

function pauseFieldAttrsBecauseParsed(field: {
  autocomplete?: string;
  name?: string;
  id?: string;
} | undefined): PauseFieldAttrs | null {
  if (field === undefined) {
    return null;
  }
  return {
    autocomplete: field.autocomplete ?? emptyStringBecauseOptionalAttrMissing(),
    name: field.name ?? emptyStringBecauseOptionalAttrMissing(),
    id: field.id ?? emptyStringBecauseOptionalAttrMissing(),
  };
}

function fieldAttrsAreOtpBecauseAutocompleteNameOrId(
  attrs: PauseFieldAttrs,
): boolean {
  if (attrs.autocomplete === "one-time-code") {
    return true;
  }
  if (OTP_FIELD_RE.test(attrs.autocomplete)) {
    return true;
  }
  if (OTP_FIELD_RE.test(attrs.name)) {
    return true;
  }
  if (OTP_FIELD_RE.test(attrs.id)) {
    return true;
  }
  return false;
}

function fieldIsOtpBecauseAutocompleteNameOrId(
  target: EventTarget | null,
): boolean {
  if (!(target instanceof HTMLElement)) {
    return false;
  }
  return fieldAttrsAreOtpBecauseAutocompleteNameOrId({
    autocomplete: attrValueBecauseMissingIsEmpty(
      target.getAttribute("autocomplete"),
    ),
    name: attrValueBecauseMissingIsEmpty(target.getAttribute("name")),
    id: attrValueBecauseMissingIsEmpty(target.getAttribute("id")),
  });
}

function completeOtpDigitsBecauseKey(key: string): string | null {
  if (OTP_DIGITS_RE.test(key)) {
    return key;
  }
  return null;
}

function hitlKeyPayloadBecauseSynthetic(
  event: KeyboardEvent,
): { type: "key"; key?: string; code?: string } {
  if (fieldIsOtpBecauseAutocompleteNameOrId(event.target)) {
    const fromKey = completeOtpDigitsBecauseKey(event.key);
    if (fromKey !== null) {
      return { type: "key", key: fromKey, code: event.code };
    }
    if (event.key === "Enter" && event.target instanceof HTMLInputElement) {
      const fromValue = completeOtpDigitsBecauseKey(event.target.value);
      if (fromValue !== null) {
        return { type: "key", key: fromValue, code: event.code };
      }
    }
    return { type: "key" };
  }
  return { type: "key", key: event.key, code: event.code };
}

type SmsOtpCredential = Credential & { code?: string };

function credentialsContainerBecauseNavigator(): CredentialsContainer | null {
  if (typeof navigator === "undefined") {
    return null;
  }
  const credentials = navigator.credentials;
  if (credentials === undefined || credentials === null) {
    return null;
  }
  if (typeof credentials.get !== "function") {
    return null;
  }
  return credentials;
}

async function smsCodeBecauseWebOtp(signal: AbortSignal): Promise<string | null> {
  const credentials = credentialsContainerBecauseNavigator();
  if (credentials === null) {
    return null;
  }
  try {
    const request = {
      otp: { transport: ["sms"] },
      signal,
    } as CredentialRequestOptions;
    const credential = await credentials.get(request);
    if (signal.aborted) {
      return null;
    }
    if (credential === null) {
      return null;
    }
    const code = (credential as SmsOtpCredential).code;
    if (typeof code !== "string") {
      return null;
    }
    if (code.length === 0) {
      return null;
    }
    return code;
  } catch {
    return null;
  }
}

function submitOtpCodeBecauseHitlKey(code: string): void {
  const input = document.getElementById(LIVE_VIEW_OTP_INPUT_ID);
  if (!(input instanceof HTMLInputElement)) {
    return;
  }
  input.dispatchEvent(
    new KeyboardEvent("keydown", {
      key: code,
      code: "Enter",
      bubbles: true,
    }),
  );
}

function otpAskBecausePauseField(
  paused: boolean,
  field: PauseFieldAttrs | null,
  previous: boolean,
): boolean {
  if (paused !== true) {
    return false;
  }
  if (field === null) {
    return previous;
  }
  return fieldAttrsAreOtpBecauseAutocompleteNameOrId(field);
}

function otpAskBecauseStatus(
  status: {
    paused?: boolean;
    pauseForHelp?: boolean;
    field?: {
      autocomplete?: string;
      name?: string;
      id?: string;
    };
  },
  previous: boolean,
): boolean {
  const mentionedPause =
    status.paused !== undefined || status.pauseForHelp !== undefined;
  if (
    mentionedPause &&
    pausedFlagFromPointerBecauseTakeOver(status) !== true
  ) {
    return false;
  }
  const field = pauseFieldAttrsBecauseParsed(status.field);
  if (field === null) {
    return previous;
  }
  return fieldAttrsAreOtpBecauseAutocompleteNameOrId(field);
}

function hitlPointerPayloadBecauseSynthetic(event: PointerEvent): {
  type: "pointer";
  x: number;
  y: number;
} {
  return { type: "pointer", x: event.clientX, y: event.clientY };
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

const ApiDataEnvelopeSchema = z.object({
  success: z.literal(true),
  data: z.unknown(),
});

/** GET /live-view answers `{success, data}`; tests and older fixtures send the bare body. */
function handoffBodyBecauseApiEnvelope(body: unknown): unknown {
  const envelope = ApiDataEnvelopeSchema.safeParse(body);
  if (envelope.success) {
    return envelope.data.data;
  }
  return body;
}

type ResolvedLiveViewHandoff = { jobId: string; liveViewUrl: string };

function handoffBecauseServerExpiry(body: unknown): ResolvedLiveViewHandoff | null {
  const parsed = LiveViewHandoffSchema.safeParse(handoffBodyBecauseApiEnvelope(body));
  if (!parsed.success) {
    return null;
  }
  if (parsed.data.expiresAtMs <= Date.now()) {
    return null;
  }
  return { jobId: parsed.data.jobId, liveViewUrl: parsed.data.liveViewUrl };
}

function cloudflareViewerBecauseHost(liveViewUrl: string): boolean {
  try {
    return new URL(liveViewUrl).hostname === CLOUDFLARE_LIVE_VIEW_HOST;
  } catch {
    return false;
  }
}

/** The opaque link from the text (`?token=`) or the SMS short link (`/lv/<id>`). */
export type LiveViewLinkQuery = { token: string } | { lv: string };

/**
 * Resolves the owner's handoff. Prod: the authenticated API client
 * (GET /live-view is owner-checked). Rejects or returns an invalid body when
 * the link is unknown, expired, or someone else's.
 */
export type ResolveLiveViewHandoff = (
  query: LiveViewLinkQuery,
  signal: AbortSignal,
) => Promise<unknown>;

export function liveViewResolvePathBecauseLinkQuery(query: LiveViewLinkQuery): string {
  const params = new URLSearchParams();
  if ("token" in query) {
    params.set("token", query.token);
  } else {
    params.set("lv", query.lv);
  }
  return `/live-view?${params.toString()}`;
}

export function resolveLiveViewHandoffBecauseApiClient(
  client: ApiClient,
): ResolveLiveViewHandoff {
  return (query, signal) =>
    client.request<unknown>({
      path: liveViewResolvePathBecauseLinkQuery(query),
      method: "GET",
      signal,
    });
}

function linkQueryBecauseTokenOrShortId(
  token: string | null,
  shortId: string | undefined,
): LiveViewLinkQuery | null {
  if (token !== null) {
    return { token };
  }
  if (shortId !== undefined && shortId.length > 0) {
    return { lv: shortId };
  }
  return null;
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
  const field = pauseFieldAttrsBecauseParsed(pointer.field);
  const pointerUrl = pointer.url;
  if (typeof pointerUrl === "string" && pointerUrl.length > 0) {
    return { src: pointerUrl, ts: pointer.ts, seq: pointer.seq, paused, field };
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
        field,
      };
    }
  }
  const blob = await bytesResponse.blob();
  return {
    src: URL.createObjectURL(blob),
    ts: pointer.ts,
    seq: pointer.seq,
    paused,
    field,
  };
}

type LiveViewPageState =
  | { kind: "pending" }
  | { kind: "expired" }
  | { kind: "session"; jobId: string; liveViewUrl: string };

type SessionViewState = {
  mode: "watch" | "take-over";
  frame: LiveViewLatestFrame | null;
  progressLabels: string[];
  otpAsk: boolean;
};

function initialLiveViewPageStateBecauseMissingTokenIsExpired(
  query: LiveViewLinkQuery | null,
): LiveViewPageState {
  if (query === null) {
    return { kind: "expired" };
  }
  return { kind: "pending" };
}

function initialSessionViewBecauseWatchUntilPause(): SessionViewState {
  return { mode: "watch", frame: null, progressLabels: [], otpAsk: false };
}

export function LiveViewConnectView({
  resolveHandoff,
}: {
  readonly resolveHandoff: ResolveLiveViewHandoff;
}) {
  const [searchParams] = useSearchParams();
  const { shortId } = useParams<{ shortId?: string }>();
  const token =
    opaqueLiveViewTokenFromSearchParamsBecauseQueryMustNotCarryUrl(
      searchParams,
    );
  const linkQuery = useMemo(
    () => linkQueryBecauseTokenOrShortId(token, shortId),
    [token, shortId],
  );
  const [pageState, setPageState] = useState<LiveViewPageState>(() =>
    initialLiveViewPageStateBecauseMissingTokenIsExpired(linkQuery),
  );
  const [sessionView, setSessionView] = useState<SessionViewState>(
    initialSessionViewBecauseWatchUntilPause,
  );
  const [pollGeneration, setPollGeneration] = useState(0);
  const [otpDraft, setOtpDraft] = useState("");

  useEffect(() => {
    if (linkQuery === null) {
      setPageState({ kind: "expired" });
      return;
    }

    const abortController = new AbortController();
    setPageState({ kind: "pending" });
    setSessionView(initialSessionViewBecauseWatchUntilPause());

    const run = async () => {
      try {
        const body = await resolveHandoff(linkQuery, abortController.signal);
        if (abortController.signal.aborted) {
          return;
        }
        const handoff = handoffBecauseServerExpiry(body);
        if (handoff === null) {
          setPageState({ kind: "expired" });
          return;
        }
        setPageState({ kind: "session", ...handoff });
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
  }, [linkQuery, resolveHandoff]);

  useEffect(() => {
    if (pageState.kind !== "session") {
      return;
    }
    // The Cloudflare viewer is live and takes input itself; frames are the fallback.
    if (cloudflareViewerBecauseHost(pageState.liveViewUrl)) {
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
          otpAsk: otpAskBecausePauseField(
            frame.paused === true,
            frame.field,
            prev.otpAsk,
          ),
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
          otpAsk: otpAskBecauseStatus(statusParsed.data, prev.otpAsk),
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

  useEffect(() => {
    if (pageState.kind !== "session") {
      return;
    }
    if (sessionView.otpAsk !== true) {
      setOtpDraft("");
      return;
    }
    const abortController = new AbortController();
    const run = async () => {
      const code = await smsCodeBecauseWebOtp(abortController.signal);
      if (abortController.signal.aborted) {
        return;
      }
      if (code === null) {
        return;
      }
      setOtpDraft(code);
      submitOtpCodeBecauseHitlKey(code);
    };
    void run();
    return () => {
      abortController.abort();
    };
  }, [pageState, sessionView.otpAsk]);

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
        otpAsk: false,
      }));
    };
    void run();
  };

  const onOtpChange = (event: ChangeEvent<HTMLInputElement>) => {
    const next = event.target.value;
    setOtpDraft(next);
    if (/^\d{6}$/.test(next) !== true) {
      return;
    }
    event.target.dispatchEvent(
      new KeyboardEvent("keydown", {
        key: next,
        code: "Enter",
        bubbles: true,
      }),
    );
  };

  const onOtpSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
  };

  const frame = sessionView.frame;
  const cloudflareViewerUrl =
    pageState.kind === "session" &&
    cloudflareViewerBecauseHost(pageState.liveViewUrl)
      ? pageState.liveViewUrl
      : null;
  const showStale =
    frame !== null &&
    frameIsStaleBecauseOlderThanFiveSeconds(frame.ts, Date.now());

  return (
    <>
      <Helmet>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      <PageContainer>
        {cloudflareViewerUrl !== null ? (
          <ScreenStage>
            <LiveViewPhoneFrame
              title={MERCHANT_CHECKOUT_LIVE_VIEW_ALT}
              src={cloudflareViewerUrl}
              allow="clipboard-read; clipboard-write"
              referrerPolicy="no-referrer"
            />
          </ScreenStage>
        ) : pageState.kind === "session" ? (
          <>
            {sessionView.mode === "take-over" ? (
              <TakeOverBar>
                <span>Take over</span>
                <ResumeButton type="button" onClick={onResume}>
                  Resume
                </ResumeButton>
              </TakeOverBar>
            ) : null}
            {sessionView.mode === "take-over" && sessionView.otpAsk ? (
              <OtpForm onSubmit={onOtpSubmit}>
                <OtpLabel htmlFor={LIVE_VIEW_OTP_INPUT_ID}>Texted code</OtpLabel>
                <OtpInput
                  id={LIVE_VIEW_OTP_INPUT_ID}
                  autoComplete="one-time-code"
                  inputMode="numeric"
                  autoFocus
                  value={otpDraft}
                  onChange={onOtpChange}
                />
              </OtpForm>
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

/**
 * GET /live-view is owner-checked, so the page needs the user's session.
 * Signed out → one sign-in button that comes back to this same link.
 */
function LiveViewAuthGate() {
  const { status, login } = useAuth();
  const client = useApiClient();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { shortId } = useParams<{ shortId?: string }>();
  const resolveHandoff = useMemo(
    () => resolveLiveViewHandoffBecauseApiClient(client),
    [client],
  );
  const hasLink =
    linkQueryBecauseTokenOrShortId(
      opaqueLiveViewTokenFromSearchParamsBecauseQueryMustNotCarryUrl(searchParams),
      shortId,
    ) !== null;
  // No link → the expired page, without a sign-in round trip.
  if (status === "authenticated" || !hasLink) {
    return <LiveViewConnectView resolveHandoff={resolveHandoff} />;
  }
  if (status === "loading") {
    return null;
  }
  return (
    <>
      <Helmet>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      <PageContainer>
        <FallbackHeading>{LIVE_VIEW_SIGN_IN_HEADING}</FallbackHeading>
        <ResumeButton
          type="button"
          onClick={() => {
            void login({
              redirectPath: location.pathname + location.search + location.hash,
            });
          }}
        >
          {LIVE_VIEW_SIGN_IN_BUTTON}
        </ResumeButton>
      </PageContainer>
    </>
  );
}

export function LiveViewConnectPage() {
  return (
    <AuthProvider>
      <LiveViewAuthGate />
    </AuthProvider>
  );
}

export default LiveViewConnectPage;
