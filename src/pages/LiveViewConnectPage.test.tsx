import { readFileSync } from "node:fs";
import { join } from "node:path";

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { HelmetProvider } from "react-helmet-async";
import { MemoryRouter, Route, Routes } from "react-router-dom";

import {
  clearLiveViewHandoffBecauseApiClient,
  LiveViewConnectView,
  type LiveViewLinkQuery,
} from "./LiveViewConnectPage";
import type { ApiClient } from "../api/client";
import { I18nProvider } from "@/i18n/I18nProvider";
import { ThemeProvider } from "@/styles/ThemeProvider";

const NOW_MS = 1_714_000_000_000;
const MERCHANT_HOST = "shop.example.test";
const JOB_ID = "job-synthetic-1";
const TICKET = "ticket-opaque";
const RELAY_URL = "wss://relay.pack.test/live";
const INSTALL_ID = "install-web-1";
const EXPIRED_HEADING = "Pack needs your help — this link expired";
const CLOUDFLARE_VIEWER =
  "https://live.browser.run/ui/view?mode=tab&wss=live.browser.run/api/devtools/browser/sess-1?jwt=SIGNED";

const originalFetch = global.fetch;
let fetchMock: jest.Mock;
const socketUrls: string[] = [];

class FakeSocket {
  url: string;
  onopen: (() => void) | null = null;
  onmessage: ((event: { data: string }) => void) | null = null;
  onclose: (() => void) | null = null;
  onerror: (() => void) | null = null;
  readyState = 0;
  constructor(url: string) {
    this.url = url;
    socketUrls.push(url);
  }
  send(): void {}
  close(): void {
    this.readyState = 3;
  }
  addEventListener(): void {}
  removeEventListener(): void {}
}

/** Stands in for the authenticated API client: same URL, the test's fetch mock. */
async function fetchResolver(query: LiveViewLinkQuery, signal: AbortSignal): Promise<unknown> {
  const params = new URLSearchParams("token" in query ? { token: query.token } : { lv: query.lv });
  const response = await fetch(`https://api.pack.test/live-view?${params.toString()}`, {
    method: "GET",
    signal,
  });
  if (!response.ok) {
    throw new Error(`live-view ${response.status}`);
  }
  return response.json();
}

async function fetchClearer(query: LiveViewLinkQuery): Promise<unknown> {
  const params = new URLSearchParams("token" in query ? { token: query.token } : { lv: query.lv });
  const response = await fetch(`https://api.pack.test/live-view?${params.toString()}`, {
    method: "POST",
  });
  if (!response.ok) {
    throw new Error(`live-view ${response.status}`);
  }
  return response.json();
}

function renderPage(search: string) {
  return render(
    <HelmetProvider>
      <MemoryRouter initialEntries={[`/live-view${search}`]}>
        <I18nProvider>
          <ThemeProvider>
            <LiveViewConnectView
              resolveHandoff={fetchResolver}
              clearHandoff={fetchClearer}
              installId={INSTALL_ID}
            />
          </ThemeProvider>
        </I18nProvider>
      </MemoryRouter>
    </HelmetProvider>,
  );
}

function okTicket(overrides: Record<string, unknown> = {}) {
  return {
    jobId: JOB_ID,
    merchantHost: MERCHANT_HOST,
    expiresAtMs: NOW_MS + 60_000,
    ticket: TICKET,
    relayUrl: RELAY_URL,
    ...overrides,
  };
}

function jsonOk(body: unknown) {
  return {
    ok: true,
    status: 200,
    json: () => Promise.resolve(body),
  };
}

describe("LiveViewConnectPage", () => {
  beforeEach(() => {
    jest.spyOn(Date, "now").mockReturnValue(NOW_MS);
    fetchMock = jest.fn();
    global.fetch = fetchMock;
    socketUrls.length = 0;
    // @ts-expect-error test double for the viewer's relay socket
    global.WebSocket = FakeSocket;
  });

  afterEach(() => {
    jest.restoreAllMocks();
    global.fetch = originalFetch;
  });

  it("mounts the shared viewer for a ticket and does not iframe Cloudflare", async () => {
    const source = readFileSync(join(process.cwd(), "src/pages/LiveViewConnectPage.tsx"), "utf8");
    expect(source).toContain('from "./liveViewer"');
    expect(source).not.toContain("<iframe");
    expect(source).not.toContain("styled.iframe");

    fetchMock.mockResolvedValue(
      jsonOk({
        success: true,
        data: {
          ...okTicket(),
          liveViewUrl: CLOUDFLARE_VIEWER,
        },
        requestId: "r1",
      }),
    );

    renderPage("?token=tok-ok");

    expect(await screen.findByTestId("live-viewer")).toBeInTheDocument();
    expect(document.querySelector("iframe")).toBeNull();
    expect(document.body.innerHTML).not.toContain("live.browser.run");
    expect(document.body.innerHTML).not.toContain(CLOUDFLARE_VIEWER);
    await waitFor(() => {
      expect(socketUrls.some((url) => url.includes(`ticket=${encodeURIComponent(TICKET)}`))).toBe(true);
    });
    expect(socketUrls.some((url) => url.startsWith(RELAY_URL))).toBe(true);
    expect(
      screen.queryByRole("heading", { name: EXPIRED_HEADING }),
    ).not.toBeInTheDocument();
  });

  it("renders the expired heading and does not fetch when the token query is missing", async () => {
    renderPage("");

    expect(await screen.findByRole("heading", { name: EXPIRED_HEADING })).toBeInTheDocument();
    expect(document.querySelector("iframe")).toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
    expect(screen.queryByTestId("live-viewer")).toBeNull();
  });

  it("renders the expired heading and no iframe when the token GET is 404", async () => {
    fetchMock.mockResolvedValue({ ok: false, status: 404 });

    renderPage("?token=tok-missing");

    expect(await screen.findByRole("heading", { name: EXPIRED_HEADING })).toBeInTheDocument();
    expect(document.querySelector("iframe")).toBeNull();
  });

  it("renders no viewer when the server body expiresAtMs is at the mocked now", async () => {
    fetchMock.mockResolvedValue(jsonOk(okTicket({ expiresAtMs: NOW_MS })));

    renderPage("?token=tok-expired");

    expect(await screen.findByRole("heading", { name: EXPIRED_HEADING })).toBeInTheDocument();
    expect(document.querySelector("iframe")).toBeNull();
    expect(screen.queryByTestId("live-viewer")).toBeNull();
  });

  it("refuses a ticket that lasts longer than 10 minutes", async () => {
    fetchMock.mockResolvedValue(jsonOk(okTicket({ expiresAtMs: NOW_MS + 10 * 60 * 1000 + 1 })));

    renderPage("?token=tok-long");

    expect(await screen.findByRole("heading", { name: EXPIRED_HEADING })).toBeInTheDocument();
    expect(screen.queryByTestId("live-viewer")).toBeNull();
    expect(document.querySelector("iframe")).toBeNull();
  });

  it("ignores liveViewUrl query params: expired heading, no iframe, no fetch", async () => {
    renderPage(`?liveViewUrl=${encodeURIComponent(CLOUDFLARE_VIEWER)}`);

    expect(await screen.findByRole("heading", { name: EXPIRED_HEADING })).toBeInTheDocument();
    expect(document.querySelector("iframe")).toBeNull();
    expect(document.querySelector(`iframe[src="${CLOUDFLARE_VIEWER}"]`)).toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("does not iframe a Cloudflare URL when the body has no relay ticket", async () => {
    fetchMock.mockResolvedValue(
      jsonOk({
        liveViewUrl: CLOUDFLARE_VIEWER,
        merchantHost: MERCHANT_HOST,
        jobId: JOB_ID,
        expiresAtMs: NOW_MS + 60_000,
      }),
    );

    renderPage("?token=tok-cf");

    expect(await screen.findByRole("heading", { name: EXPIRED_HEADING })).toBeInTheDocument();
    expect(document.querySelector("iframe")).toBeNull();
    expect(document.body.innerHTML).not.toContain("live.browser.run");
  });

  it("does not iframe a relay URL on the Cloudflare host", async () => {
    fetchMock.mockResolvedValue(
      jsonOk(okTicket({ relayUrl: "wss://live.browser.run/api/devtools/browser/sess-1" })),
    );

    renderPage("?token=tok-cf-relay");

    expect(await screen.findByRole("heading", { name: EXPIRED_HEADING })).toBeInTheDocument();
    expect(document.querySelector("iframe")).toBeNull();
  });

  it("the SMS short link /lv/<id> resolves by short id and mounts the viewer", async () => {
    fetchMock.mockResolvedValue(jsonOk(okTicket()));

    render(
      <HelmetProvider>
        <MemoryRouter initialEntries={["/lv/AbC123xy"]}>
          <I18nProvider>
            <ThemeProvider>
              <Routes>
                <Route
                  path="/lv/:shortId"
                  element={
                    <LiveViewConnectView
                      resolveHandoff={fetchResolver}
                      clearHandoff={fetchClearer}
                      installId={INSTALL_ID}
                    />
                  }
                />
              </Routes>
            </ThemeProvider>
          </I18nProvider>
        </MemoryRouter>
      </HelmetProvider>,
    );

    expect(await screen.findByTestId("live-viewer")).toBeInTheDocument();
    expect(String(fetchMock.mock.calls[0][0])).toContain("lv=AbC123xy");
    expect(String(fetchMock.mock.calls[0][0])).not.toContain("token=");
    expect(document.querySelector("iframe")).toBeNull();
  });

  it("Done posts the owner clear for this link, so the same agent resumes", async () => {
    fetchMock.mockResolvedValue(jsonOk({ success: true, data: okTicket(), requestId: "r1" }));

    renderPage("?token=tok-cf");

    fireEvent.click(await screen.findByRole("button", { name: "Done, keep going" }));

    expect(await screen.findByRole("status")).toHaveTextContent("Pack is picking it back up.");
    const posts = fetchMock.mock.calls
      .filter((call) => (call[1] as RequestInit | undefined)?.method === "POST")
      .map((call) => String(call[0]));
    expect(posts).toEqual(["https://api.pack.test/live-view?token=tok-cf"]);
    expect(screen.queryByRole("button", { name: "Done, keep going" })).toBeNull();
    expect(document.querySelector("iframe")).toBeNull();
  });

  it("a clear the server refuses says so and keeps the button", async () => {
    fetchMock.mockImplementation((_input: RequestInfo | URL, init?: RequestInit) => {
      if (init?.method === "POST") {
        return Promise.resolve({ ok: false, status: 404, json: () => Promise.resolve({}) });
      }
      return Promise.resolve(jsonOk(okTicket()));
    });

    renderPage("?token=tok-cf");

    fireEvent.click(await screen.findByRole("button", { name: "Done, keep going" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("That didn't reach Pack. Tap again.");
    expect(screen.getByRole("button", { name: "Done, keep going" })).toBeEnabled();
  });

  it("the prod clear is an authenticated POST to /live-view with the link query", async () => {
    const request = jest.fn().mockResolvedValue({ jobId: JOB_ID, event: "cleared" });
    const clear = clearLiveViewHandoffBecauseApiClient({ request } as unknown as ApiClient);

    await clear({ lv: "w7pIQA37" });
    await clear({ token: "tok-1" });

    expect(request.mock.calls).toEqual([
      [{ path: "/live-view?lv=w7pIQA37", method: "POST" }],
      [{ path: "/live-view?token=tok-1", method: "POST" }],
    ]);
  });
});
