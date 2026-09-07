// Synthetic fixtures for pack-security.yaml. No PII. Not product code.

export function leakLiveViewUrlToQuery(
  searchParams: URLSearchParams,
  liveViewUrl: string,
  debuggerUrl: string,
): string {
  // ruleid: pack-liveviewurl-in-query
  searchParams.set("liveViewUrl", liveViewUrl);
  // ruleid: pack-liveviewurl-in-query
  searchParams.append("liveViewUrl", liveViewUrl);
  // ruleid: pack-liveviewurl-in-query
  searchParams.set("debuggerUrl", debuggerUrl);
  // ruleid: pack-liveviewurl-in-query
  const fromTemplate = `/connect?liveViewUrl=${liveViewUrl}`;
  // ruleid: pack-liveviewurl-in-query
  const fromConcat = "/connect" + "?liveViewUrl=" + liveViewUrl;
  return fromTemplate + fromConcat;
}

export function okReadLiveViewUrl(searchParams: URLSearchParams): string | null {
  // ok: pack-liveviewurl-in-query
  return searchParams.get("liveViewUrl");
}

export function okReadMerchantHost(searchParams: URLSearchParams): string | null {
  // ok: pack-liveviewurl-in-query
  return searchParams.get("merchantHost");
}

export function okPostLiveViewUrl(liveViewUrl: string): BodyInit {
  // ok: pack-liveviewurl-in-query
  return JSON.stringify({ liveViewUrl });
}

const LiveViewFrame = (props: {
  src: string;
  title?: string;
  sandbox?: string;
}) => <iframe title={props.title} src={props.src} sandbox={props.sandbox} />;

export function merchantHostIframe(merchantHost: string) {
  // ruleid: pack-iframe-merchant-host
  return <iframe src={merchantHost} />;
}

export function styledMerchantHostIframe(merchantHost: string) {
  // ruleid: pack-iframe-merchant-host
  return (
    <LiveViewFrame
      title="Merchant checkout live view"
      src={merchantHost}
      sandbox="allow-scripts allow-same-origin allow-forms"
    />
  );
}

export function handoffMerchantHostIframe(handoff: { merchantHost: string }) {
  // ruleid: pack-iframe-merchant-host
  return <iframe src={handoff.merchantHost} />;
}

export function okStaticHostIframe() {
  // ok: pack-iframe-merchant-host
  return <iframe src="https://static.example.test/embed" />;
}

export function okLiveViewIframe(embedLiveViewUrl: string) {
  // ok: pack-iframe-merchant-host
  return (
    <LiveViewFrame
      title="Merchant checkout live view"
      src={embedLiveViewUrl}
      sandbox="allow-scripts allow-same-origin allow-forms"
    />
  );
}
