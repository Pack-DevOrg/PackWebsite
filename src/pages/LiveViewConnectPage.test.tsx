import { render, screen } from "@testing-library/react";
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

  it("embeds an iframe after a token GET returns a valid https cross-host unexpired handoff", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve(okFetchBody()),
    });

    renderPage("?token=tok-ok");

    const iframe = await screen.findByTitle("Merchant checkout live view");
    expect(iframe.tagName).toBe("IFRAME");
    expect(iframe).toHaveAttribute("src", VALID_LIVE_VIEW_URL);
    expect(iframe).toHaveAttribute(
      "sandbox",
      "allow-scripts allow-same-origin allow-forms",
    );
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
});
