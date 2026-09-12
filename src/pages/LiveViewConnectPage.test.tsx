import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { HelmetProvider } from "react-helmet-async";
import { MemoryRouter } from "react-router-dom";

import { LiveViewConnectPage } from "./LiveViewConnectPage";
import { I18nProvider } from "@/i18n/I18nProvider";
import { ThemeProvider } from "@/styles/ThemeProvider";

const NOW_MS = 1_714_000_000_000;
const VALID_LIVE_VIEW_URL = "https://live.pack.test/view";
const MERCHANT_HOST = "shop.example.test";
const JOB_ID = "job-synthetic-1";
const FRAME_SRC = "https://frames.pack.test/synthetic/3.png";
const FRAME_ALT = "Merchant checkout live view";
const EXPIRED_HEADING = "Pack needs your help — this link expired";
const STALE_FRAME_BADGE = "Stale frame";

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

function jsonOk(body: unknown) {
  return {
    ok: true,
    status: 200,
    json: () => Promise.resolve(body),
  };
}

function latestPointerBody(overrides: {
  seq?: number;
  ts?: number;
  url?: string;
  paused?: boolean;
  pauseForHelp?: boolean;
} = {}) {
  return {
    seq: 3,
    ts: NOW_MS,
    url: FRAME_SRC,
    ...overrides,
  };
}

function jobStatusBody() {
  return {
    progressItems: [
      {
        id: "step-synthetic-open",
        label: "Opening merchant checkout",
        status: "processing",
        order: 0,
      },
    ],
  };
}

function stubTokenThenLiveViewFetches(options: {
  latest?: ReturnType<typeof latestPointerBody>;
} = {}) {
  fetchMock.mockImplementation((input: RequestInfo | URL) => {
    const url = String(input);
    if (url.includes("/live-view/") && url.includes("/latest")) {
      return Promise.resolve(jsonOk(options.latest ?? latestPointerBody()));
    }
    if (url.includes(`/jobs/${JOB_ID}/status`)) {
      return Promise.resolve(jsonOk(jobStatusBody()));
    }
    if (url.includes(`/live-view/${JOB_ID}/hitl`)) {
      return Promise.resolve(jsonOk({ accepted: true }));
    }
    if (url.includes(`/live-view/${JOB_ID}/resume`)) {
      return Promise.resolve(jsonOk({ accepted: true }));
    }
    if (url.includes("/live-view") && url.includes("token=")) {
      return Promise.resolve(jsonOk(okFetchBody()));
    }
    return Promise.resolve({
      ok: false,
      status: 404,
      json: () => Promise.resolve({}),
    });
  });
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

  it("shows the newest frame after a token GET returns a valid https cross-host unexpired handoff", async () => {
    stubTokenThenLiveViewFetches();

    renderPage("?token=tok-ok");

    const frameImage = await screen.findByAltText(FRAME_ALT);
    expect(frameImage.tagName).toBe("IMG");
    expect(frameImage).toHaveAttribute("src", FRAME_SRC);
    expect(document.querySelector("iframe")).toBeNull();
    expect(
      screen.queryByRole("heading", { name: EXPIRED_HEADING }),
    ).not.toBeInTheDocument();

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

  describe("watch frames and take-over", () => {
    beforeEach(() => {
      jest.useFakeTimers({ advanceTimers: true });
      jest.spyOn(Date, "now").mockReturnValue(NOW_MS);
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it("renders the newest screencast frame after a valid token handoff, not a debugger iframe", async () => {
      stubTokenThenLiveViewFetches();

      renderPage("?token=tok-ok");

      const frameImage = await screen.findByAltText(FRAME_ALT);
      expect(frameImage.tagName).toBe("IMG");
      expect(frameImage).toHaveAttribute("src", FRAME_SRC);
      expect(document.querySelector("iframe")).toBeNull();
      expect(
        screen.queryByRole("heading", { name: EXPIRED_HEADING }),
      ).not.toBeInTheDocument();
    });

    it("strips OTP-flagged keystrokes from the HITL POST body in take-over", async () => {
      stubTokenThenLiveViewFetches({
        latest: latestPointerBody({ paused: true }),
      });

      renderPage("?token=tok-ok");

      await screen.findByAltText(FRAME_ALT);
      await screen.findByRole("button", { name: "Resume" });

      const otpInput = document.createElement("input");
      otpInput.setAttribute("autocomplete", "one-time-code");
      otpInput.setAttribute("name", "otp");
      otpInput.setAttribute("id", "totp");
      document.body.appendChild(otpInput);
      otpInput.focus();
      fireEvent.keyDown(otpInput, { key: "4", code: "Digit4" });

      await waitFor(() => {
        const hitlPosts = fetchMock.mock.calls.filter(([requestUrl, init]) => {
          return (
            String(requestUrl).includes(`/live-view/${JOB_ID}/hitl`) &&
            Boolean(init) &&
            (init as RequestInit).method === "POST"
          );
        });
        expect(hitlPosts.length).toBeGreaterThan(0);
        const bodyText = String((hitlPosts[0][1] as RequestInit).body);
        expect(bodyText).not.toContain("4");
        expect(bodyText).not.toContain("Digit4");
      });
    });

    it("Resume POSTs resume and returns the UI to watch mode", async () => {
      let paused = true;
      fetchMock.mockImplementation((input: RequestInfo | URL, init?: RequestInit) => {
        const url = String(input);
        if (url.includes(`/live-view/${JOB_ID}/resume`)) {
          paused = false;
          return Promise.resolve(jsonOk({ accepted: true }));
        }
        if (url.includes("/live-view/") && url.includes("/latest")) {
          return Promise.resolve(jsonOk(latestPointerBody({ paused })));
        }
        if (url.includes(`/jobs/${JOB_ID}/status`)) {
          return Promise.resolve(jsonOk(jobStatusBody()));
        }
        if (url.includes(`/live-view/${JOB_ID}/hitl`)) {
          return Promise.resolve(jsonOk({ accepted: true }));
        }
        if (url.includes("/live-view") && url.includes("token=")) {
          return Promise.resolve(jsonOk(okFetchBody()));
        }
        return Promise.resolve({
          ok: false,
          status: 404,
          json: () => Promise.resolve({}),
        });
      });

      renderPage("?token=tok-ok");

      const resume = await screen.findByRole("button", { name: "Resume" });
      fireEvent.click(resume);

      await waitFor(() => {
        const resumePosts = fetchMock.mock.calls.filter(([requestUrl, init]) => {
          return (
            String(requestUrl).includes(`/live-view/${JOB_ID}/resume`) &&
            Boolean(init) &&
            (init as RequestInit).method === "POST"
          );
        });
        expect(resumePosts.length).toBeGreaterThan(0);
        expect(
          screen.queryByRole("button", { name: "Resume" }),
        ).not.toBeInTheDocument();
      });
      expect(screen.getByAltText(FRAME_ALT)).toBeInTheDocument();
    });

    it("shows a stale-frame badge when latest.ts is more than 5s older than mocked now", async () => {
      stubTokenThenLiveViewFetches({
        latest: latestPointerBody({ ts: NOW_MS - 6_000 }),
      });

      renderPage("?token=tok-ok");

      expect(Date.now()).toBe(NOW_MS);
      expect(await screen.findByText(STALE_FRAME_BADGE)).toBeInTheDocument();
    });
  });
});
