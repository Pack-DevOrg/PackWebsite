import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { useSearchParams } from "react-router-dom";
import styled from "styled-components";
import { z } from "zod";

import { appConfig } from "../config/appConfig";

const LIVE_VIEW_EXPIRED_HEADING = "Pack needs your help — this link expired";

const PageContainer = styled.main`
  min-height: 80vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 3rem 1.5rem;
  background: ${({ theme }) => theme.colors.background.primary};
`;

const FallbackHeading = styled.h1`
  font-size: 1.75rem;
  color: ${({ theme }) => theme.colors.text.primary};
  text-align: center;
`;

const LiveViewFrame = styled.iframe`
  width: 100%;
  min-height: 80vh;
  border: 0;
`;

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

function embedLiveViewUrlFromHandoffBodyBecauseServerExpiry(
  body: unknown,
): string | null {
  const parsed = LiveViewHandoffSchema.safeParse(body);
  if (!parsed.success) {
    return null;
  }
  if (parsed.data.expiresAtMs <= Date.now()) {
    return null;
  }
  return parsed.data.liveViewUrl;
}

type LiveViewPageState =
  | { kind: "pending" }
  | { kind: "expired" }
  | { kind: "embed"; liveViewUrl: string };

function initialLiveViewPageStateBecauseMissingTokenIsExpired(
  token: string | null,
): LiveViewPageState {
  if (token === null) {
    return { kind: "expired" };
  }
  return { kind: "pending" };
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

  useEffect(() => {
    if (token === null) {
      setPageState({ kind: "expired" });
      return;
    }

    const abortController = new AbortController();
    setPageState({ kind: "pending" });

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
        const embedLiveViewUrl =
          embedLiveViewUrlFromHandoffBodyBecauseServerExpiry(body);
        if (embedLiveViewUrl === null) {
          setPageState({ kind: "expired" });
          return;
        }
        setPageState({ kind: "embed", liveViewUrl: embedLiveViewUrl });
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

  return (
    <>
      <Helmet>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      <PageContainer>
        {pageState.kind === "embed" ? (
          <LiveViewFrame
            title="Merchant checkout live view"
            src={pageState.liveViewUrl}
            sandbox="allow-scripts allow-same-origin allow-forms"
          />
        ) : pageState.kind === "expired" ? (
          <FallbackHeading>{LIVE_VIEW_EXPIRED_HEADING}</FallbackHeading>
        ) : null}
      </PageContainer>
    </>
  );
}

export default LiveViewConnectPage;
