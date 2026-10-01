import { useEffect, useMemo, useState } from "react";
import { Helmet } from "react-helmet-async";
import { useLocation, useParams, useSearchParams } from "react-router-dom";
import styled from "styled-components";
import { z } from "zod";

import { LiveViewer, type LiveViewTicket } from "./liveViewer";

import type { ApiClient } from "../api/client";
import { useApiClient } from "../api/useApiClient";
import { AuthProvider, useAuth } from "../auth/AuthContext";

const LIVE_VIEW_EXPIRED_HEADING = "Pack needs your help — this link expired";
const LIVE_VIEW_SIGN_IN_HEADING = "Sign in to watch Pack work";
const LIVE_VIEW_SIGN_IN_BUTTON = "Sign in";
const LIVE_VIEW_CLEAR_SENT = "Pack is picking it back up.";
const LIVE_VIEW_CLEAR_FAILED = "That didn't reach Pack. Tap again.";
/** Cloudflare Browser Run host. The page never iframes it; the relay keeps that URL. */
const CLOUDFLARE_LIVE_VIEW_HOST = "live.browser.run";
const INSTALL_STORAGE_KEY = "pack-live-view-install-id";
/** Matches the relay ticket cap. A longer expiry is not a phone ticket. */
const MAX_TICKET_TTL_MS = 10 * 60 * 1000;

const PageContainer = styled.main`
  height: 100dvh;
  min-height: 100dvh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: ${({ theme }) => theme.colors.background.primary};
`;

const Centered = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1.25rem;
  padding: 1.5rem;
`;

const ViewerHost = styled.div`
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
`;

const FallbackHeading = styled.h1`
  font-size: 1.75rem;
  color: ${({ theme }) => theme.colors.text.primary};
  text-align: center;
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

const ClearStatus = styled.p`
  margin: 0;
  padding: 0.75rem 1rem;
  color: ${({ theme }) => theme.colors.text.secondary};
  font-size: 1rem;
`;

const ApiDataEnvelopeSchema = z.object({
  success: z.literal(true),
  data: z.unknown(),
});

const ViewerTicketSchema = z.object({
  jobId: z.string().min(1),
  merchantHost: z.string().min(1),
  expiresAtMs: z.number().int().positive(),
  ticket: z.string().min(1),
  relayUrl: z.string().min(1),
  ticketExpiresAtMs: z.number().int().positive().optional(),
  driver: z.enum(["agent", "user"]).optional(),
  headline: z.string().min(1).optional(),
});

type ResolvedViewer = {
  jobId: string;
  merchantHost: string;
  relayUrl: string;
  ticket: string;
  ticketExpiresAtMs: number;
  driver: "agent" | "user";
  headline: string;
};

/** GET /live-view answers `{success, data}`; tests and older fixtures send the bare body. */
function handoffBodyBecauseApiEnvelope(body: unknown): unknown {
  const envelope = ApiDataEnvelopeSchema.safeParse(body);
  if (envelope.success) {
    return envelope.data.data;
  }
  return body;
}

function relayUrlBecauseTicket(relayUrl: string): URL | null {
  try {
    return new URL(relayUrl);
  } catch {
    return null;
  }
}

/**
 * The phone ticket. A Cloudflare viewer URL in the body is ignored: this page
 * never embeds it.
 */
export function viewerBecauseServerTicket(
  body: unknown,
  nowMs: number,
): ResolvedViewer | null {
  const parsed = ViewerTicketSchema.safeParse(handoffBodyBecauseApiEnvelope(body));
  if (!parsed.success) {
    return null;
  }
  const ticketExpiresAtMs = parsed.data.ticketExpiresAtMs ?? parsed.data.expiresAtMs;
  const ttlMs = ticketExpiresAtMs - nowMs;
  if (ttlMs <= 0 || ttlMs > MAX_TICKET_TTL_MS) {
    return null;
  }
  const relay = relayUrlBecauseTicket(parsed.data.relayUrl);
  if (relay === null) {
    return null;
  }
  if (relay.protocol !== "wss:" && relay.protocol !== "https:") {
    return null;
  }
  if (relay.hostname === CLOUDFLARE_LIVE_VIEW_HOST) {
    return null;
  }
  return {
    jobId: parsed.data.jobId,
    merchantHost: parsed.data.merchantHost,
    relayUrl: parsed.data.relayUrl,
    ticket: parsed.data.ticket,
    ticketExpiresAtMs,
    driver: parsed.data.driver ?? "user",
    headline: parsed.data.headline ?? parsed.data.merchantHost,
  };
}

/** Stable install id. The relay ticket is bound to it. */
export function webInstallIdBecauseThisBrowser(): string {
  if (typeof window === "undefined") {
    return "";
  }
  const existing = window.localStorage.getItem(INSTALL_STORAGE_KEY);
  if (existing !== null && existing.trim().length > 0) {
    return existing.trim();
  }
  const created =
    typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
      ? crypto.randomUUID()
      : `web-${Date.now()}`;
  window.localStorage.setItem(INSTALL_STORAGE_KEY, created);
  return created;
}

function opaqueLiveViewTokenFromSearchParamsBecauseQueryMustNotCarryUrl(
  searchParams: URLSearchParams,
): string | null {
  const token = searchParams.get("token");
  if (token === null || token.length === 0) {
    return null;
  }
  return token;
}

/** The opaque link from the text (`?token=`) or the SMS short link (`/lv/<id>`). */
export type LiveViewLinkQuery = { token: string } | { lv: string };

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
  installId: string,
): ResolveLiveViewHandoff {
  return (query, signal) =>
    client.request<unknown>({
      path: liveViewResolvePathBecauseLinkQuery(query),
      method: "GET",
      signal,
      headers: { "x-pack-install-id": installId },
    });
}

export type ClearLiveViewHandoff = (query: LiveViewLinkQuery) => Promise<unknown>;

export function clearLiveViewHandoffBecauseApiClient(
  client: ApiClient,
): ClearLiveViewHandoff {
  return (query) =>
    client.request<unknown>({
      path: liveViewResolvePathBecauseLinkQuery(query),
      method: "POST",
    });
}

type ClearState = "idle" | "sending" | "sent" | "failed";

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

type LiveViewPageState =
  | { kind: "pending" }
  | { kind: "expired" }
  | { kind: "cleared" }
  | { kind: "session"; viewer: ResolvedViewer };

function initialLiveViewPageStateBecauseMissingTokenIsExpired(
  query: LiveViewLinkQuery | null,
): LiveViewPageState {
  if (query === null) {
    return { kind: "expired" };
  }
  return { kind: "pending" };
}

export function LiveViewConnectView({
  resolveHandoff,
  clearHandoff,
  installId,
}: {
  readonly resolveHandoff: ResolveLiveViewHandoff;
  readonly clearHandoff: ClearLiveViewHandoff;
  readonly installId: string;
}) {
  const [searchParams] = useSearchParams();
  const { shortId } = useParams<{ shortId?: string }>();
  const token =
    opaqueLiveViewTokenFromSearchParamsBecauseQueryMustNotCarryUrl(searchParams);
  const linkQuery = useMemo(
    () => linkQueryBecauseTokenOrShortId(token, shortId),
    [token, shortId],
  );
  const [pageState, setPageState] = useState<LiveViewPageState>(() =>
    initialLiveViewPageStateBecauseMissingTokenIsExpired(linkQuery),
  );
  const [clearState, setClearState] = useState<ClearState>("idle");

  const sendClear = async (): Promise<boolean> => {
    if (linkQuery === null) {
      return false;
    }
    setClearState("sending");
    try {
      await clearHandoff(linkQuery);
      setClearState("sent");
      return true;
    } catch {
      setClearState("failed");
      return false;
    }
  };

  useEffect(() => {
    if (linkQuery === null || installId.length === 0) {
      setPageState({ kind: "expired" });
      return;
    }

    const abortController = new AbortController();
    setPageState({ kind: "pending" });
    setClearState("idle");

    const run = async () => {
      try {
        const body = await resolveHandoff(linkQuery, abortController.signal);
        if (abortController.signal.aborted) {
          return;
        }
        const viewer = viewerBecauseServerTicket(body, Date.now());
        if (viewer === null) {
          setPageState({ kind: "expired" });
          return;
        }
        setPageState({ kind: "session", viewer });
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
  }, [installId, linkQuery, resolveHandoff]);

  const refreshTicket = useMemo(() => {
    if (linkQuery === null) {
      return undefined;
    }
    const query = linkQuery;
    return async (): Promise<LiveViewTicket> => {
      const body = await resolveHandoff(query, new AbortController().signal);
      const next = viewerBecauseServerTicket(body, Date.now());
      if (next === null) {
        throw new Error("live view expired");
      }
      return {
        relayUrl: next.relayUrl,
        ticket: next.ticket,
        ticketExpiresAtMs: next.ticketExpiresAtMs,
      };
    };
  }, [linkQuery, resolveHandoff]);

  const onDone = () => {
    const run = async () => {
      const ok = await sendClear();
      if (ok) {
        setPageState({ kind: "cleared" });
      }
    };
    void run();
  };

  const viewer = pageState.kind === "session" ? pageState.viewer : null;

  return (
    <>
      <Helmet>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      <PageContainer>
        {viewer !== null ? (
          <ViewerHost>
            {clearState === "failed" ? (
              <ClearStatus role="alert">{LIVE_VIEW_CLEAR_FAILED}</ClearStatus>
            ) : null}
            <LiveViewer
              relayUrl={viewer.relayUrl}
              ticket={viewer.ticket}
              ticketExpiresAtMs={viewer.ticketExpiresAtMs}
              installId={installId}
              driver={viewer.driver}
              headline={viewer.headline}
              merchantHost={viewer.merchantHost}
              refreshTicket={refreshTicket}
              onDone={onDone}
              doneBusy={clearState === "sending"}
            />
          </ViewerHost>
        ) : (
          <Centered>
            {pageState.kind === "expired" ? (
              <FallbackHeading>{LIVE_VIEW_EXPIRED_HEADING}</FallbackHeading>
            ) : null}
            {pageState.kind === "cleared" || clearState === "sent" ? (
              <ClearStatus role="status">{LIVE_VIEW_CLEAR_SENT}</ClearStatus>
            ) : null}
          </Centered>
        )}
      </PageContainer>
    </>
  );
}

function LiveViewAuthGate() {
  const { status, login } = useAuth();
  const client = useApiClient();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { shortId } = useParams<{ shortId?: string }>();
  const installId = useMemo(() => webInstallIdBecauseThisBrowser(), []);
  const resolveHandoff = useMemo(
    () => resolveLiveViewHandoffBecauseApiClient(client, installId),
    [client, installId],
  );
  const clearHandoff = useMemo(
    () => clearLiveViewHandoffBecauseApiClient(client),
    [client],
  );
  const hasLink =
    linkQueryBecauseTokenOrShortId(
      opaqueLiveViewTokenFromSearchParamsBecauseQueryMustNotCarryUrl(searchParams),
      shortId,
    ) !== null;
  if (status === "authenticated" || !hasLink) {
    return (
      <LiveViewConnectView
        resolveHandoff={resolveHandoff}
        clearHandoff={clearHandoff}
        installId={installId}
      />
    );
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
        <Centered>
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
        </Centered>
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
