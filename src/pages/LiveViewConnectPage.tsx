import { Helmet } from "react-helmet-async";
import { useSearchParams } from "react-router-dom";
import styled from "styled-components";
import { z } from "zod";

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

function expiresAtMsFromSearchParam(raw: string | null): number | undefined {
  if (raw === null) {
    return undefined;
  }
  return Number(raw);
}

function parseHandoffFromSearchParams(searchParams: URLSearchParams) {
  try {
    const parsed = LiveViewHandoffSchema.safeParse({
      liveViewUrl: searchParams.get("liveViewUrl"),
      merchantHost: searchParams.get("merchantHost"),
      jobId: searchParams.get("jobId"),
      expiresAtMs: expiresAtMsFromSearchParam(searchParams.get("expiresAtMs")),
    });
    if (!parsed.success) {
      return null;
    }
    return parsed.data;
  } catch {
    return null;
  }
}

export function LiveViewConnectPage() {
  const [searchParams] = useSearchParams();
  const handoff = parseHandoffFromSearchParams(searchParams);
  const embedLiveViewUrl =
    handoff !== null && handoff.expiresAtMs > Date.now()
      ? handoff.liveViewUrl
      : null;

  return (
    <>
      <Helmet>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      <PageContainer>
        {embedLiveViewUrl !== null ? (
          <LiveViewFrame
            title="Merchant checkout live view"
            src={embedLiveViewUrl}
            sandbox="allow-scripts allow-same-origin allow-forms"
          />
        ) : (
          <FallbackHeading>live view unavailable</FallbackHeading>
        )}
      </PageContainer>
    </>
  );
}

export default LiveViewConnectPage;
