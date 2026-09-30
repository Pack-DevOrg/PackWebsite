import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { HelmetProvider } from "react-helmet-async";
import { MemoryRouter, Route, Routes } from "react-router-dom";

import { LIVE_VIEW_BEAM_CLASS } from "../components/LiveViewBeam";
import {
  CLOUDFLARE_VIEWER_HEIGHT_PX,
  CLOUDFLARE_VIEWER_WIDTH_PX,
  clearLiveViewHandoffBecauseApiClient,
  LiveViewConnectView,
  type LiveViewLinkQuery,
} from "./LiveViewConnectPage";
import type { ApiClient } from "../api/client";
import { I18nProvider } from "@/i18n/I18nProvider";
import { ThemeProvider } from "@/styles/ThemeProvider";

const NOW_MS = 1_714_000_000_000;
const VALID_LIVE_VIEW_URL = "https://live.pack.test/view";
const MERCHANT_HOST = "shop.example.test";
const JOB_ID = "job-synthetic-1";
const EXPIRED_HEADING = "Pack needs your help — this link expired";

const originalFetch = global.fetch;
let fetchMock: jest.Mock;

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

/** Stands in for the authenticated POST /live-view: same URL, the test's fetch mock. */
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
            <LiveViewConnectView resolveHandoff={fetchResolver} clearHandoff={fetchClearer} />
          </ThemeProvider>
        </I18nProvider>
      </MemoryRouter>
    </HelmetProvider>,
  );
}

function okFetchBody(overrides: {
  liveViewUrl?: string;
  merchantHost?: string;
  jobId?: string;
  expiresAtMs?: number;
  headline?: string;
} = {}) {
  return {
    liveViewUrl: VALID_LIVE_VIEW_URL,
    merchantHost: MERCHANT_HOST,
    jobId: JOB_ID,
    expiresAtMs: NOW_MS + 60_000,
    ...overrides,
  };
}

describe("LiveViewConnectPage", () => {
  beforeEach(() => {
    jest.spyOn(Date, "now").mockReturnValue(NOW_MS);
    fetchMock = jest.fn();
    global.fetch = fetchMock;
  });

  afterEach(() => {
    jest.restoreAllMocks();
    global.fetch = originalFetch;
  });

  it("shows the checkout frame after a token GET returns a valid https cross-host unexpired handoff", async () => {
    fetchMock.mockImplementation((input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes("/latest")) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () =>
            Promise.resolve({
              seq: 1,
              ts: NOW_MS,
              url: VALID_LIVE_VIEW_URL,
              paused: false,
            }),
        });
      }
      if (url.includes("/status")) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve({ progressItems: [] }),
        });
      }
      return Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve(okFetchBody()),
      });
    });

    renderPage("?token=tok-ok");

    const frame = await screen.findByTitle("Merchant checkout live view");
    expect(frame.tagName).toBe("IMG");
    expect(frame).toHaveAttribute("src", VALID_LIVE_VIEW_URL);
    expect(
      screen.queryByRole("heading", { name: EXPIRED_HEADING }),
    ).not.toBeInTheDocument();
    expect(document.querySelector("input")).toBeNull();

    expect(fetchMock).toHaveBeenCalled();
    const calledUrl = String(fetchMock.mock.calls[0][0]);
    expect(calledUrl).toContain("token=tok-ok");
    expect(calledUrl).not.toContain("liveViewUrl=");
  });

  it("renders the expired heading and does not fetch when the token query is missing", async () => {
    renderPage("");

    expect(
      await screen.findByRole("heading", { name: EXPIRED_HEADING }),
    ).toBeInTheDocument();
    expect(document.querySelector("iframe")).toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("renders the expired heading and no iframe when the token GET is 404", async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      status: 404,
    });

    renderPage("?token=tok-missing");

    expect(
      await screen.findByRole("heading", { name: EXPIRED_HEADING }),
    ).toBeInTheDocument();
    expect(document.querySelector("iframe")).toBeNull();
  });

  it("renders no iframe when the server body expiresAtMs is at the mocked now", async () => {
    expect(Date.now()).toBe(NOW_MS);

    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve(okFetchBody({ expiresAtMs: NOW_MS })),
    });

    renderPage("?token=tok-expired");

    expect(
      await screen.findByRole("heading", { name: EXPIRED_HEADING }),
    ).toBeInTheDocument();
    expect(document.querySelector("iframe")).toBeNull();
  });

  it("ignores liveViewUrl query params: expired heading, no iframe, no fetch", async () => {
    renderPage(
      `?liveViewUrl=${encodeURIComponent(VALID_LIVE_VIEW_URL)}&merchantHost=${encodeURIComponent(MERCHANT_HOST)}&jobId=${encodeURIComponent(JOB_ID)}&expiresAtMs=${NOW_MS + 60_000}`,
    );

    expect(
      await screen.findByRole("heading", { name: EXPIRED_HEADING }),
    ).toBeInTheDocument();
    expect(document.querySelector("iframe")).toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
    expect(document.querySelector(`iframe[src="${VALID_LIVE_VIEW_URL}"]`)).toBeNull();
  });

  it("renders no iframe when the server liveViewUrl hostname equals merchantHost", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      json: () =>
        Promise.resolve(
          okFetchBody({
            liveViewUrl: "https://shop.example.test/checkout",
            merchantHost: "shop.example.test",
          }),
        ),
    });

    renderPage("?token=tok-same-host");

    expect(
      await screen.findByRole("heading", { name: EXPIRED_HEADING }),
    ).toBeInTheDocument();
    expect(document.querySelector("iframe")).toBeNull();
    expect(screen.queryByText(JOB_ID)).not.toBeInTheDocument();
  });

  it("renders no iframe when the server liveViewUrl is http", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      json: () =>
        Promise.resolve(
          okFetchBody({ liveViewUrl: "http://live.pack.test/view" }),
        ),
    });

    renderPage("?token=tok-http");

    expect(
      await screen.findByRole("heading", { name: EXPIRED_HEADING }),
    ).toBeInTheDocument();
    expect(document.querySelector("iframe")).toBeNull();
  });

  const TEXT_CODE = "482913";

  function jsonOk(body: unknown) {
    return {
      ok: true,
      status: 200,
      json: () => Promise.resolve(body),
    };
  }

  function routeOtpPause(field: { autocomplete?: string; name?: string; id?: string }) {
    fetchMock.mockImplementation((input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes("/hitl")) {
        return Promise.resolve(jsonOk({ ok: true }));
      }
      if (url.includes("/latest")) {
        return Promise.resolve(
          jsonOk({
            seq: 1,
            ts: NOW_MS,
            url: "https://live.pack.test/frame.png",
            paused: true,
            pauseForHelp: true,
            field,
          }),
        );
      }
      if (url.includes("/status")) {
        return Promise.resolve(
          jsonOk({
            paused: true,
            pauseForHelp: true,
            progressItems: [{ label: "Code" }],
          }),
        );
      }
      if (url.includes("/live-view")) {
        return Promise.resolve(jsonOk(okFetchBody()));
      }
      return Promise.resolve(jsonOk({}));
    });
  }

  function installWebOtp(get: jest.Mock) {
    Object.defineProperty(navigator, "credentials", {
      configurable: true,
      value: { get },
    });
  }

  function hitlBodies(): string[] {
    const bodies: string[] = [];
    for (const call of fetchMock.mock.calls) {
      const url = String(call[0]);
      if (!url.includes("/hitl")) {
        continue;
      }
      const init = call[1] as RequestInit | undefined;
      bodies.push(String(init?.body ?? ""));
    }
    return bodies;
  }

  it("OTP-kind pause renders one input with autocomplete=one-time-code; merchant codes use the platform suggestion because Pack does not write merchant SMS", async () => {
    installWebOtp(jest.fn().mockReturnValue(new Promise(() => undefined)));
    routeOtpPause({ autocomplete: "one-time-code" });

    renderPage("?token=tok-otp");

    const input = await screen.findByLabelText("Texted code");
    expect(document.querySelectorAll("input")).toHaveLength(1);
    expect(input).toHaveAttribute("autocomplete", "one-time-code");
    expect(input).toHaveAttribute("inputmode", "numeric");
  });

  it("WebOTP resolve fills and submits a Pack-sent code when the SMS last line is @www.trypackai.com #code; merchant codes are not WebOTP", async () => {
    const get = jest.fn().mockResolvedValue({ code: TEXT_CODE });
    installWebOtp(get);
    routeOtpPause({ autocomplete: "one-time-code", name: "otp", id: "otp" });

    renderPage("?token=tok-webotp");

    const input = await screen.findByLabelText("Texted code");
    await waitFor(() => {
      expect(input).toHaveValue(TEXT_CODE);
    });
    expect(get).toHaveBeenCalled();
    const request = get.mock.calls[0][0] as { otp: { transport: string[] } };
    expect(request.otp).toEqual({ transport: ["sms"] });
    await waitFor(() => {
      const bodies = hitlBodies();
      expect(bodies.some((body) => body.includes(TEXT_CODE))).toBe(true);
    });
    const posted = hitlBodies().find((body) => body.includes(TEXT_CODE));
    expect(posted).toBeDefined();
    const payload = JSON.parse(String(posted)) as {
      type: string;
      key: string;
    };
    expect(payload.type).toBe("key");
    expect(payload.key).toBe(TEXT_CODE);
    for (const call of fetchMock.mock.calls) {
      expect(String(call[0])).not.toContain(TEXT_CODE);
    }
  });

  it("the texted code is not in any log or storage write", async () => {
    const get = jest.fn().mockResolvedValue({ code: TEXT_CODE });
    installWebOtp(get);
    routeOtpPause({ id: "otp-code" });
    const log = jest.spyOn(console, "log");
    const info = jest.spyOn(console, "info");
    const debug = jest.spyOn(console, "debug");
    const warn = jest.spyOn(console, "warn");
    const error = jest.spyOn(console, "error");
    const setItem = jest.spyOn(Storage.prototype, "setItem");

    renderPage("?token=tok-quiet");

    await waitFor(() => {
      expect(hitlBodies().some((body) => body.includes(TEXT_CODE))).toBe(true);
    });

    const written = JSON.stringify([
      log.mock.calls,
      info.mock.calls,
      debug.mock.calls,
      warn.mock.calls,
      error.mock.calls,
      setItem.mock.calls,
    ]);
    expect(written).not.toContain(TEXT_CODE);
  });

  const CLOUDFLARE_VIEWER =
    "https://live.browser.run/ui/view?mode=tab&wss=live.browser.run/api/devtools/browser/sess-1?jwt=SIGNED";

  it("iframes the Cloudflare viewer for take-over, sized to the phone viewport, and polls no frames", async () => {
    fetchMock.mockResolvedValue(
      jsonOk({ success: true, data: okFetchBody({ liveViewUrl: CLOUDFLARE_VIEWER }), requestId: "r1" }),
    );

    renderPage("?token=tok-cf");

    const frame = await screen.findByTitle("Merchant checkout live view");
    expect(frame.tagName).toBe("IFRAME");
    expect(frame).toHaveAttribute("src", CLOUDFLARE_VIEWER);
    expect(frame).toHaveAttribute("referrerpolicy", "no-referrer");
    expect(fetchMock).toHaveBeenCalledTimes(1);
    for (const call of fetchMock.mock.calls) {
      expect(String(call[0])).not.toContain("/latest");
    }
  });

  /** The styled-components rules that apply to this element's classes. */
  function cssRulesFor(element: Element): string {
    const classes = Array.from(element.classList);
    const sheet = Array.from(document.querySelectorAll("style"))
      .map((style) => style.textContent ?? "")
      .join("\n");
    const rules = sheet.match(/[^{}]+\{[^{}]*\}/g) ?? [];
    return rules
      .filter((rule) => classes.some((cls) => rule.split("{")[0].includes(`.${cls}`)))
      .join("\n")
      .replace(/\s+/g, "");
  }

  it("the Cloudflare live view is one phone screen: 100dvh stage, no page scroll", async () => {
    fetchMock.mockResolvedValue(jsonOk(okFetchBody({ liveViewUrl: CLOUDFLARE_VIEWER })));

    const { unmount } = renderPage("?token=tok-cf");

    await screen.findByTitle("Merchant checkout live view");
    const stage = screen.getByTestId("live-view-stage");
    const css = cssRulesFor(stage);
    expect(css).toContain("height:100dvh");
    expect(css).toContain("overflow:hidden");
    expect(document.body.style.overflow).toBe("hidden");
    expect(document.documentElement.style.overflow).toBe("hidden");

    unmount();
    expect(document.body.style.overflow).toBe("");
  });

  it("tells the user what to do above the viewer, and uses the handoff's own headline when it has one", async () => {
    fetchMock.mockResolvedValueOnce(jsonOk(okFetchBody({ liveViewUrl: CLOUDFLARE_VIEWER })));
    const first = renderPage("?token=tok-cf");
    expect(
      await screen.findByRole("heading", { name: "Tap and type here to log in, then tap Done" }),
    ).toBeInTheDocument();
    first.unmount();

    fetchMock.mockResolvedValueOnce(
      jsonOk(okFetchBody({ liveViewUrl: CLOUDFLARE_VIEWER, headline: "Enter the code Uber Eats sent, then tap Done" })),
    );
    renderPage("?token=tok-cf-2");
    expect(
      await screen.findByRole("heading", { name: "Enter the code Uber Eats sent, then tap Done" }),
    ).toBeInTheDocument();
  });

  it("the control toggle sits in the bar pinned under the viewer, clear of the home indicator", async () => {
    fetchMock.mockResolvedValue(jsonOk(okFetchBody({ liveViewUrl: CLOUDFLARE_VIEWER })));

    renderPage("?token=tok-cf");

    const done = await screen.findByRole("button", { name: "Pack is controlling" });
    const bar = screen.getByTestId("live-view-done-bar");
    const stage = screen.getByTestId("live-view-stage");
    expect(bar).toContainElement(done);
    expect(bar.parentElement).toBe(stage);
    expect(stage.lastElementChild).toBe(bar);
    expect(cssRulesFor(bar)).toContain("flex:none");
    expect(cssRulesFor(bar)).toContain("env(safe-area-inset-bottom)");
    // The viewer takes the rest and may shrink; it never pushes Done off screen.
    const fitCss = cssRulesFor(screen.getByTestId("live-view-fit"));
    expect(fitCss).toContain("min-height:0");
    expect(fitCss).toContain("overflow:hidden");
  });

  it("scales the whole remote screen down to fit the space on an iPhone 15", async () => {
    fetchMock.mockResolvedValue(jsonOk(okFetchBody({ liveViewUrl: CLOUDFLARE_VIEWER })));
    // Space between the instruction line and the Done bar on a 393x852 phone.
    jest.spyOn(HTMLElement.prototype, "clientWidth", "get").mockReturnValue(393);
    jest.spyOn(HTMLElement.prototype, "clientHeight", "get").mockReturnValue(560);

    renderPage("?token=tok-cf");

    const frame = await screen.findByTitle("Merchant checkout live view");
    const scale = Number(/scale\(([0-9.]+)\)/.exec(frame.parentElement?.style.transform ?? "")?.[1]);
    expect(scale).toBeCloseTo(Math.min(393 / CLOUDFLARE_VIEWER_WIDTH_PX, 560 / CLOUDFLARE_VIEWER_HEIGHT_PX), 5);
    expect(CLOUDFLARE_VIEWER_HEIGHT_PX * scale).toBeLessThanOrEqual(560);
    expect(CLOUDFLARE_VIEWER_WIDTH_PX * scale).toBeLessThanOrEqual(393);
  });

  it("the SMS short link /lv/<id> resolves by short id", async () => {
    fetchMock.mockResolvedValue(jsonOk(okFetchBody({ liveViewUrl: CLOUDFLARE_VIEWER })));

    render(
      <HelmetProvider>
        <MemoryRouter initialEntries={["/lv/AbC123xy"]}>
          <I18nProvider>
            <ThemeProvider>
              <Routes>
                <Route path="/lv/:shortId" element={<LiveViewConnectView resolveHandoff={fetchResolver} clearHandoff={fetchClearer} />} />
              </Routes>
            </ThemeProvider>
          </I18nProvider>
        </MemoryRouter>
      </HelmetProvider>,
    );

    expect(await screen.findByTitle("Merchant checkout live view")).toHaveAttribute("src", CLOUDFLARE_VIEWER);
    expect(String(fetchMock.mock.calls[0][0])).toContain("lv=AbC123xy");
    expect(String(fetchMock.mock.calls[0][0])).not.toContain("token=");
  });

  it("a non-Cloudflare viewer keeps the frames fallback", async () => {
    fetchMock.mockImplementation((input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes("/latest")) {
        return Promise.resolve(jsonOk({ seq: 1, ts: NOW_MS, url: VALID_LIVE_VIEW_URL, paused: false }));
      }
      if (url.includes("/status")) {
        return Promise.resolve(jsonOk({ progressItems: [] }));
      }
      return Promise.resolve(jsonOk({ success: true, data: okFetchBody() }));
    });

    renderPage("?token=tok-frames");

    const frame = await screen.findByTitle("Merchant checkout live view");
    expect(frame.tagName).toBe("IMG");
    expect(document.querySelector("iframe")).toBeNull();
  });
  function postCalls(): string[] {
    return fetchMock.mock.calls
      .filter((call) => (call[1] as RequestInit | undefined)?.method === "POST")
      .map((call) => String(call[0]));
  }

  it("handing the Cloudflare viewer back to Pack posts the owner clear for this link, so the same agent resumes", async () => {
    fetchMock.mockResolvedValue(
      jsonOk({ success: true, data: okFetchBody({ liveViewUrl: CLOUDFLARE_VIEWER }), requestId: "r1" }),
    );

    renderPage("?token=tok-cf");

    fireEvent.click(await screen.findByRole("button", { name: "Pack is controlling" }));
    expect(screen.getByRole("button", { name: "You're controlling" })).toBeInTheDocument();
    expect(postCalls()).toEqual([]);

    fireEvent.click(screen.getByRole("button", { name: "You're controlling" }));

    expect(await screen.findByRole("status")).toHaveTextContent("Pack is picking it back up.");
    expect(postCalls()).toEqual(["https://api.pack.test/live-view?token=tok-cf"]);
    expect(screen.getByRole("button", { name: "Pack is controlling" })).toBeInTheDocument();
  });

  it("Done on the SMS short link posts the clear by short id", async () => {
    fetchMock.mockResolvedValue(jsonOk(okFetchBody({ liveViewUrl: CLOUDFLARE_VIEWER })));

    render(
      <HelmetProvider>
        <MemoryRouter initialEntries={["/lv/w7pIQA37"]}>
          <I18nProvider>
            <ThemeProvider>
              <Routes>
                <Route
                  path="/lv/:shortId"
                  element={<LiveViewConnectView resolveHandoff={fetchResolver} clearHandoff={fetchClearer} />}
                />
              </Routes>
            </ThemeProvider>
          </I18nProvider>
        </MemoryRouter>
      </HelmetProvider>,
    );

    fireEvent.click(await screen.findByRole("button", { name: "Pack is controlling" }));
    fireEvent.click(screen.getByRole("button", { name: "You're controlling" }));

    await screen.findByRole("status");
    expect(postCalls()).toEqual(["https://api.pack.test/live-view?lv=w7pIQA37"]);
  });

  it("a clear the server refuses says so and keeps the button", async () => {
    fetchMock.mockImplementation((_input: RequestInfo | URL, init?: RequestInit) => {
      if (init?.method === "POST") {
        return Promise.resolve({ ok: false, status: 404, json: () => Promise.resolve({}) });
      }
      return Promise.resolve(jsonOk(okFetchBody({ liveViewUrl: CLOUDFLARE_VIEWER })));
    });

    renderPage("?token=tok-cf");

    fireEvent.click(await screen.findByRole("button", { name: "Pack is controlling" }));
    fireEvent.click(screen.getByRole("button", { name: "You're controlling" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("That didn't reach Pack. Tap again.");
    expect(screen.getByRole("button", { name: "You're controlling" })).toBeEnabled();
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

  it("has one control toggle, and its label is only Pack is controlling or You're controlling", async () => {
    fetchMock.mockResolvedValue(jsonOk(okFetchBody({ liveViewUrl: CLOUDFLARE_VIEWER })));

    renderPage("?token=tok-toggle");

    const pack = await screen.findByRole("button", { name: "Pack is controlling" });
    expect(screen.getAllByRole("button")).toEqual([pack]);
    expect(screen.queryByRole("button", { name: "Done, keep going" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Resume" })).toBeNull();
    expect(screen.queryByText("Take over")).toBeNull();

    fireEvent.click(pack);

    const you = screen.getByRole("button", { name: "You're controlling" });
    expect(screen.getAllByRole("button")).toEqual([you]);
    expect(screen.queryByRole("button", { name: "Pack is controlling" })).toBeNull();
  });

  it("a tap while Pack is controlling pauses for the user, and the next tap posts the existing clear", async () => {
    fetchMock.mockResolvedValue(jsonOk(okFetchBody({ liveViewUrl: CLOUDFLARE_VIEWER })));

    renderPage("?token=tok-handlers");

    fireEvent.click(await screen.findByRole("button", { name: "Pack is controlling" }));
    expect(postCalls()).toEqual([]);
    expect(screen.getByRole("button", { name: "You're controlling" })).toBeEnabled();

    fireEvent.click(screen.getByRole("button", { name: "You're controlling" }));

    await screen.findByRole("status");
    expect(postCalls()).toEqual(["https://api.pack.test/live-view?token=tok-handlers"]);
    expect(screen.getByRole("button", { name: "Pack is controlling" })).toBeInTheDocument();
  });

  it("shows the yellow beam class only while Pack is controlling", async () => {
    fetchMock.mockResolvedValue(jsonOk(okFetchBody({ liveViewUrl: CLOUDFLARE_VIEWER })));

    renderPage("?token=tok-beam");

    await screen.findByRole("button", { name: "Pack is controlling" });
    expect(document.querySelector(`.${LIVE_VIEW_BEAM_CLASS}`)).not.toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Pack is controlling" }));

    expect(screen.getByRole("button", { name: "You're controlling" })).toBeInTheDocument();
    expect(document.querySelector(`.${LIVE_VIEW_BEAM_CLASS}`)).toBeNull();
  });

  it("a server pause is You're controlling with no beam, and the tap posts the clear", async () => {
    fetchMock.mockImplementation((input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes("/latest")) {
        return Promise.resolve(jsonOk({ seq: 1, ts: NOW_MS, url: VALID_LIVE_VIEW_URL, paused: true }));
      }
      if (url.includes("/status")) {
        return Promise.resolve(jsonOk({ paused: true, progressItems: [] }));
      }
      return Promise.resolve(jsonOk(okFetchBody()));
    });

    renderPage("?token=tok-paused");

    await screen.findByRole("button", { name: "You're controlling" });
    expect(document.querySelector(`.${LIVE_VIEW_BEAM_CLASS}`)).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "You're controlling" }));

    await screen.findByRole("status");
    expect(postCalls()).toEqual(["https://api.pack.test/live-view?token=tok-paused"]);
  });
});
