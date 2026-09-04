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

function renderPage(search: string) {
  return render(
    <HelmetProvider>
      <MemoryRouter initialEntries={[`/live-view-connect${search}`]}>
        <I18nProvider>
          <ThemeProvider>
            <LiveViewConnectPage />
          </ThemeProvider>
        </I18nProvider>
      </MemoryRouter>
    </HelmetProvider>,
  );
}

function handoffSearch(overrides: {
  liveViewUrl?: string;
  merchantHost?: string;
  jobId?: string;
  expiresAtMs?: string;
}): string {
  const params = new URLSearchParams();
  if (Object.prototype.hasOwnProperty.call(overrides, "liveViewUrl")) {
    params.set("liveViewUrl", overrides.liveViewUrl as string);
  }
  if (Object.prototype.hasOwnProperty.call(overrides, "merchantHost")) {
    params.set("merchantHost", overrides.merchantHost as string);
  }
  if (Object.prototype.hasOwnProperty.call(overrides, "jobId")) {
    params.set("jobId", overrides.jobId as string);
  }
  if (Object.prototype.hasOwnProperty.call(overrides, "expiresAtMs")) {
    params.set("expiresAtMs", overrides.expiresAtMs as string);
  }
  const encoded = params.toString();
  if (encoded.length === 0) {
    return "";
  }
  return `?${encoded}`;
}

describe("LiveViewConnectPage", () => {
  beforeEach(() => {
    jest.spyOn(Date, "now").mockReturnValue(NOW_MS);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("embeds an iframe for a valid https cross-host unexpired handoff", () => {
    renderPage(
      handoffSearch({
        liveViewUrl: VALID_LIVE_VIEW_URL,
        merchantHost: MERCHANT_HOST,
        jobId: JOB_ID,
        expiresAtMs: String(NOW_MS + 60_000),
      }),
    );

    const iframe = screen.getByTitle("Merchant checkout live view");
    expect(iframe.tagName).toBe("IFRAME");
    expect(iframe).toHaveAttribute("src", VALID_LIVE_VIEW_URL);
    expect(iframe).toHaveAttribute(
      "sandbox",
      "allow-scripts allow-same-origin allow-forms",
    );
    expect(
      screen.queryByRole("heading", { name: "live view unavailable" }),
    ).not.toBeInTheDocument();
  });

  it("renders no iframe when liveViewUrl hostname equals merchantHost", () => {
    renderPage(
      handoffSearch({
        liveViewUrl: "https://shop.example.test/checkout",
        merchantHost: "shop.example.test",
        jobId: JOB_ID,
        expiresAtMs: String(NOW_MS + 60_000),
      }),
    );

    expect(document.querySelector("iframe")).toBeNull();
    expect(
      screen.getByRole("heading", { name: "live view unavailable" }),
    ).toBeInTheDocument();
    expect(screen.queryByText(JOB_ID)).not.toBeInTheDocument();
  });

  it("renders no iframe when liveViewUrl is http", () => {
    renderPage(
      handoffSearch({
        liveViewUrl: "http://live.pack.test/view",
        merchantHost: MERCHANT_HOST,
        jobId: JOB_ID,
        expiresAtMs: String(NOW_MS + 60_000),
      }),
    );

    expect(document.querySelector("iframe")).toBeNull();
    expect(
      screen.getByRole("heading", { name: "live view unavailable" }),
    ).toBeInTheDocument();
  });

  it("renders no iframe when expiresAtMs is at or before the mocked now", () => {
    expect(Date.now()).toBe(NOW_MS);

    renderPage(
      handoffSearch({
        liveViewUrl: VALID_LIVE_VIEW_URL,
        merchantHost: MERCHANT_HOST,
        jobId: JOB_ID,
        expiresAtMs: String(NOW_MS),
      }),
    );

    expect(document.querySelector("iframe")).toBeNull();
    expect(
      screen.getByRole("heading", { name: "live view unavailable" }),
    ).toBeInTheDocument();
  });

  it("renders the fallback heading and no iframe when params are missing, without throwing", () => {
    expect(() => renderPage("")).not.toThrow();

    expect(document.querySelector("iframe")).toBeNull();
    expect(
      screen.getByRole("heading", { name: "live view unavailable" }),
    ).toBeInTheDocument();
    expect(screen.queryByText(JOB_ID)).not.toBeInTheDocument();
  });
});
