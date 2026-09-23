import { render, screen, waitFor } from "@testing-library/react";
import { HelmetProvider } from "react-helmet-async";
import { MemoryRouter } from "react-router-dom";

import { LiveViewConnectPage } from "./LiveViewConnectPage";
import { I18nProvider } from "@/i18n/I18nProvider";
import { ThemeProvider } from "@/styles/ThemeProvider";

const NOW_MS = 1_714_000_000_000;
const VALID_LIVE_VIEW_URL = "https://live.pack.test/view";
const MERCHANT_HOST = "shop.example.test";
const JOB_ID = "job-synthetic-1";
const EXPIRED_HEADING = "Pack needs your help — this link expired";

const originalFetch = global.fetch;
let fetchMock: jest.Mock;

function renderPage(search: string) {
  return render(
    <HelmetProvider>
      <MemoryRouter initialEntries={[`/live-view${search}`]}>
        <I18nProvider>
          <ThemeProvider>
            <LiveViewConnectPage />
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
});
