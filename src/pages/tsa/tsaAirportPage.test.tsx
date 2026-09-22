import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { HelmetProvider } from "react-helmet-async";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { renderToString } from "react-dom/server";
import { StaticRouter } from "react-router-dom";

import TsaAirportPage from "@/pages/TsaAirportPage";
import { I18nProvider } from "@/i18n/I18nProvider";
import { ThemeProvider } from "@/styles/ThemeProvider";
import { AirportWaitTimePublicAirportSchema } from "@/schemas/airport-security";
import { tsaAirportSitemapLocs, resolveTsaAirportSlug } from "@/pages/tsa/tsaAirportIndex";
import { faaBannerSentence } from "@/pages/tsa/tsaAirportCopy";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const fetchSummary = jest.fn();
const capturePosthog = jest.fn();

jest.mock("@/api/airportSecurity", () => ({
  fetchPublicAirportSecuritySummary: (...args: unknown[]) => fetchSummary(...args),
}));

jest.mock("@/tracking/posthog", () => ({
  capturePosthog: (...args: unknown[]) => capturePosthog(...args),
}));

const ewrAirport = {
  airportCode: "EWR",
  airportName: "Newark Liberty International Airport",
  cityName: "Newark",
  regionName: "NJ",
  countryName: "United States",
  latitude: 40.6895,
  longitude: -74.1745,
  faaStatus: {
    active: true,
    kind: "ground_stop" as const,
    reason: "equipment outage",
    endsAt: "2026-09-21T18:45:00.000Z",
    timeZone: "America/New_York",
  },
  heldFlights: [
    {
      flight: "UA123",
      airline: "United",
      scheduledTime: "2:10 pm EDT",
      status: "Held",
      direction: "departure" as const,
    },
  ],
  snapshot: {
    fetchStatus: "available" as const,
    observedAt: "2026-09-21T18:00:00.000Z",
    fetchedAt: "2026-09-21T18:00:00.000Z",
    refreshIntervalMinutes: 5,
    observations: [
      {
        terminalDisplayName: "Terminal C",
        checkpointDisplayName: "Main checkpoint",
        locationDisplayName: "Terminal C Main checkpoint",
        screeningProgram: "general" as const,
        laneStatus: "open" as const,
        displayWaitText: "12 min",
        exactWaitMinutes: 12,
      },
    ],
  },
};

function renderAt(path: string) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <HelmetProvider>
      <MemoryRouter initialEntries={[path]}>
        <I18nProvider>
          <ThemeProvider>
            <QueryClientProvider client={queryClient}>
              <Routes>
                <Route path="/tsa/:airportSlug" element={<TsaAirportPage />} />
              </Routes>
            </QueryClientProvider>
          </ThemeProvider>
        </I18nProvider>
      </MemoryRouter>
    </HelmetProvider>,
  );
}

describe("TsaAirportPage", () => {
  beforeEach(() => {
    fetchSummary.mockReset();
    capturePosthog.mockReset();
    fetchSummary.mockResolvedValue({
      generatedAt: "2026-09-22T07:00:00.153Z",
      refreshIntervalMinutes: 5,
      airports: [ewrAirport],
    });
  });

  it("renders EWR title, H1, banner, H2s, held flight, and FAQ from the fixture", async () => {
    renderAt("/tsa/ewr");

    expect(
      await screen.findByRole("heading", {
        level: 1,
        name: "Newark Liberty International Airport TSA wait times and delays right now",
      }),
    ).toBeInTheDocument();
    await waitFor(() => {
      expect(document.title).toBe(
        "Newark Liberty International Airport (EWR) TSA Wait Times, Delays & Ground Stop Status",
      );
    });
    expect(screen.getByTestId("faa-banner")).toHaveTextContent(
      "EWR is under an FAA ground stop until 2:45 pm EDT (equipment outage). No airport closure.",
    );
    expect(screen.getAllByRole("heading", { level: 2 }).map((heading) => heading.textContent)).toEqual([
      "Security wait times by checkpoint",
      "Delays today",
      "Ground stop and ground delay status",
      "Flights delayed or cancelled today",
      "Flight status",
    ]);
    expect(screen.getByText("UA123")).toBeInTheDocument();
    expect(screen.getByText("United")).toBeInTheDocument();
    expect(screen.getByText("2:10 pm EDT")).toBeInTheDocument();
    expect(screen.getByText("Held")).toBeInTheDocument();
    expect(screen.getAllByText("Terminal C Main checkpoint: 12 min").length).toBeGreaterThan(0);
    expect(screen.getByRole("heading", { name: "Is Newark Liberty International Airport closed today?" })).toBeInTheDocument();
    expect(screen.getByText(/No\. EWR is under an FAA ground stop until 2:45 pm EDT/)).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Is there a ground stop at Newark Liberty International Airport?" })).toBeInTheDocument();
    expect(screen.getByText(/Yes\. EWR is under an FAA ground stop until 2:45 pm EDT/)).toBeInTheDocument();
    await waitFor(() => {
      const schema = JSON.parse(
        document.head.querySelector("script[type='application/ld+json']")?.textContent ?? "{}",
      ) as { "@graph"?: { "@type"?: string; mainEntity?: { name: string; acceptedAnswer: { text: string } }[] }[] };
      const faq = schema["@graph"]?.find((node) => node["@type"] === "FAQPage");
      expect(faq?.mainEntity?.map((item) => item.name)).toEqual([
        "Is Newark Liberty International Airport closed today?",
        "Is there a ground stop at Newark Liberty International Airport?",
        "How long are TSA wait times at Newark Liberty International Airport right now?",
      ]);
      expect(faq?.mainEntity?.[2]?.acceptedAnswer.text).toContain("12 min");
    });
    await waitFor(() => {
      expect(capturePosthog).toHaveBeenCalledWith("tsa.airport-page.view", {
        iata: "EWR",
        faaKind: "ground_stop",
      });
    });
  });

  it("omits held flights and makes no AeroAPI fetch when the program field is absent", async () => {
    const fetchMock = jest.fn();
    (globalThis as { fetch?: typeof fetchMock }).fetch = fetchMock;
    fetchSummary.mockResolvedValue({
      generatedAt: "2026-09-22T07:00:00.153Z",
      refreshIntervalMinutes: 5,
      airports: [
        {
          ...ewrAirport,
          faaStatus: undefined,
          heldFlights: undefined,
        },
      ],
    });
    renderAt("/tsa/ewr");
    expect(
      await screen.findByText("No held departures or arrivals are listed for this airport right now."),
    ).toBeInTheDocument();
    expect(screen.queryByText("UA123")).not.toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
    const parsed = AirportWaitTimePublicAirportSchema.parse({
      ...ewrAirport,
      faaStatus: undefined,
      heldFlights: undefined,
    });
    expect(parsed.heldFlights).toBeUndefined();
    expect(parsed.faaStatus).toBeUndefined();
    delete (globalThis as { fetch?: unknown }).fetch;
  });

  it("renders the unknown airport 404 page", async () => {
    renderAt("/tsa/XXX");
    expect(await screen.findByRole("heading", { name: "Page not found" })).toBeInTheDocument();
  });

  it("redirects the newark-airport and jfk-airport aliases to the canonical IATA path", async () => {
    renderAt("/tsa/newark-airport");
    expect(
      await screen.findByRole("heading", {
        level: 1,
        name: "Newark Liberty International Airport TSA wait times and delays right now",
      }),
    ).toBeInTheDocument();
    expect(resolveTsaAirportSlug("jfk-airport").kind).toBe("page");
    if (resolveTsaAirportSlug("jfk-airport").kind === "page") {
      expect(resolveTsaAirportSlug("jfk-airport")).toMatchObject({
        canonicalPath: "/tsa/jfk",
      });
    }
    expect(resolveTsaAirportSlug("newark-airport")).toMatchObject({
      canonicalPath: "/tsa/ewr",
    });
  });

  it("filters the flight status search against the held-flight list", async () => {
    renderAt("/tsa/ewr");
    const input = await screen.findByRole("textbox", { name: "Search flight status" });
    await userEvent.type(input, "UA123");
    expect(screen.getByText("UA123 Held")).toBeInTheDocument();
    await userEvent.clear(input);
    await userEvent.type(input, "ZZ999");
    expect(screen.getByText("No matching flight status is in the held-flight list for this airport.")).toBeInTheDocument();
  });

  it("prerenders the EWR H1 into HTML", () => {
    const html = renderToString(
      <HelmetProvider>
        <StaticRouter location="/tsa/ewr">
          <I18nProvider>
            <ThemeProvider>
              <QueryClientProvider client={new QueryClient()}>
                <Routes>
                  <Route path="/tsa/:airportSlug" element={<TsaAirportPage />} />
                </Routes>
              </QueryClientProvider>
            </ThemeProvider>
          </I18nProvider>
        </StaticRouter>
      </HelmetProvider>,
    );
    expect(html).toContain("Newark Liberty International Airport TSA wait times and delays right now");
    expect(html).toContain("Checking the live FAA status for EWR.");
  });
});

describe("TSA airport sitemap", () => {
  it("contains /tsa/<code> for every board airport with the board generatedAt lastmod", () => {
    const locs = tsaAirportSitemapLocs();
    const sitemap = readFileSync(resolve(__dirname, "../../../public/sitemap.xml"), "utf8");
    const found = new Set(
      [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]),
    );
    expect(locs.length).toBeGreaterThan(3000);
    for (const entry of locs) {
      expect(found.has(entry.loc)).toBe(true);
    }
    expect(sitemap).toContain(`<lastmod>${locs[0]?.lastmod}</lastmod>`);
    expect(faaBannerSentence("EWR", {
      active: true,
      kind: "ground_stop",
      reason: "equipment outage",
      endsAt: "2026-09-21T18:45:00.000Z",
      timeZone: "America/New_York",
    })).toBe(
      "EWR is under an FAA ground stop until 2:45 pm EDT (equipment outage). No airport closure.",
    );
  });
});

describe("CloudFront TSA airport aliases", () => {
  it("301s name and IATA aliases to the lowercase canonical path", () => {
    const source = readFileSync(
      resolve(__dirname, "../../../scripts/cloudfront/app-origin-viewer-request.js"),
      "utf8",
    );
    const handler = new Function(`${source}; return handler;`)() as (event: {
      request: {
        uri: string;
        headers: { host: { value: string } };
        querystring: Record<string, never>;
      };
    }) => { statusCode?: number; headers?: { location?: { value?: string } } };
    const request = (uri: string) =>
      handler({
        request: {
          uri,
          headers: { host: { value: "www.trypackai.com" } },
          querystring: {},
        },
      });
    expect(request("/tsa/jfk-airport")).toMatchObject({
      statusCode: 301,
      headers: { location: { value: "https://www.trypackai.com/tsa/jfk" } },
    });
    expect(request("/tsa/newark-airport")).toMatchObject({
      statusCode: 301,
      headers: { location: { value: "https://www.trypackai.com/tsa/ewr" } },
    });
    expect(request("/tsa/EWR")).toMatchObject({
      statusCode: 301,
      headers: { location: { value: "https://www.trypackai.com/tsa/ewr" } },
    });
  });
});
