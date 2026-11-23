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
import {
  airportPageH1,
  faaBannerSentence,
  resolveAirportCountryCode,
} from "@/pages/tsa/tsaAirportCopy";
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

  it("shows Live status unavailable and official airport link when live FAA status is absent on a US airport", async () => {
    const originalFetch = globalThis.fetch;
    const fetchMock = jest.fn();
    globalThis.fetch = fetchMock;
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
    try {
      renderAt("/tsa/ewr");
      expect((await screen.findAllByText(/Live status unavailable/)).length).toBeGreaterThan(0);
      expect(
        screen.queryByText("No held departures or arrivals are listed for this airport right now."),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByText(/EWR is open\. No FAA ground stop/),
      ).not.toBeInTheDocument();
      const officialLinks = screen.getAllByRole("link", {
        name: /Newark Liberty International Airport official website/i,
      });
      expect(officialLinks.length).toBeGreaterThan(0);
      expect(officialLinks[0]?.getAttribute("href")).toContain("newarkairport.com");
      expect(screen.queryByText("UA123")).not.toBeInTheDocument();
      expect(fetchMock).not.toHaveBeenCalled();
      const parsed = AirportWaitTimePublicAirportSchema.parse({
        ...ewrAirport,
        faaStatus: undefined,
        heldFlights: undefined,
      });
      expect(parsed.heldFlights).toBeUndefined();
      expect(parsed.faaStatus).toBeUndefined();
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it("preserves TSA and FAA copy on US airports (DEN, JFK) when live FAA status is present and maps Do not show to Unavailable", async () => {
    fetchSummary.mockResolvedValue({
      generatedAt: "2026-11-22T18:00:00.000Z",
      refreshIntervalMinutes: 15,
      airports: [
        {
          airportCode: "DEN",
          airportName: "Denver International Airport",
          cityName: "Denver",
          regionName: "CO",
          countryCode: "US",
          countryName: "United States",
          officialUrl: "https://www.flydenver.com/",
          latitude: 39.8561,
          longitude: -104.6737,
          faaStatus: {
            active: false,
            kind: "none",
          },
          snapshot: {
            fetchStatus: "available",
            observedAt: "2026-11-22T17:58:00.000Z",
            fetchedAt: "2026-11-22T17:59:00.000Z",
            refreshIntervalMinutes: 15,
            observations: [
              {
                terminalDisplayName: "Jeppesen Terminal",
                checkpointDisplayName: "South Security",
                locationDisplayName: "South Security",
                screeningProgram: "general",
                laneStatus: "open",
                displayWaitText: "14 min",
                exactWaitMinutes: 14,
              },
              {
                terminalDisplayName: "Jeppesen Terminal",
                checkpointDisplayName: "North Security Standard",
                locationDisplayName: "North Security Standard",
                screeningProgram: "general",
                laneStatus: "open",
                displayWaitText: "Do not show",
              },
            ],
          },
        },
        {
          airportCode: "JFK",
          airportName: "John F. Kennedy International Airport",
          cityName: "New York",
          regionName: "NY",
          countryCode: "US",
          countryName: "United States",
          latitude: 40.6413,
          longitude: -73.7781,
          snapshot: null,
        },
      ],
    });

    const denRender = renderAt("/tsa/den");
    expect(
      await screen.findByRole("heading", {
        level: 1,
        name: "Denver International Airport TSA wait times and delays right now",
      }),
    ).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByTestId("faa-banner")).toHaveTextContent(
        "DEN is open. No FAA ground stop or airport closure.",
      );
    });
    expect(
      screen.getByText("No FAA delay program is posted for Denver International Airport right now."),
    ).toBeInTheDocument();
    expect(screen.getByText("Jeppesen Terminal South Security: 14 min")).toBeInTheDocument();
    expect(screen.getByText("Jeppesen Terminal North Security Standard: Unavailable")).toBeInTheDocument();
    expect(screen.queryByText(/Do not show/i)).not.toBeInTheDocument();
    expect(
      screen.queryByText("No held departures or arrivals are listed for this airport right now."),
    ).not.toBeInTheDocument();
    expect(screen.getAllByText(/Live status unavailable/).length).toBeGreaterThan(0);
    const denLinks = screen.getAllByRole("link", {
      name: /Denver International Airport official website/i,
    });
    expect(denLinks[0]).toHaveAttribute("href", "https://www.flydenver.com/");
    denRender.unmount();

    renderAt("/tsa/jfk");
    expect(
      await screen.findByRole("heading", {
        level: 1,
        name: /John F\.? Kennedy International Airport TSA wait times and delays right now/,
      }),
    ).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByTestId("faa-banner")).toHaveTextContent(/Live status unavailable/);
    });
    expect(
      screen.getAllByRole("link", {
        name: /John F\.? Kennedy International Airport official website/i,
      })[0]?.getAttribute("href"),
    ).toContain("jfkairport.com");
  });

  it.each([
    {
      slug: "/tsa/ber",
      code: "BER",
      name: "Berlin Brandenburg Airport",
      expectedHost: "ber.berlin-airport.de",
    },
    {
      slug: "/tsa/edi",
      code: "EDI",
      name: "Edinburgh Airport",
      expectedHost: "edinburghairport.com",
    },
    {
      slug: "/tsa/lhr",
      code: "LHR",
      name: "London Heathrow Airport",
      expectedHost: "heathrow.com",
    },
    {
      slug: "/tsa/nrt",
      code: "NRT",
      name: "Narita International Airport",
      expectedHost: "narita-airport.jp",
    },
    {
      slug: "/tsa/yyz",
      code: "YYZ",
      name: "Lester B. Pearson International Airport",
      expectedHost: "gtaa.com",
    },
  ])(
    "renders Airport security, Live status unavailable, official website link, and zero TSA/FAA copy on non-US route $slug ($code)",
    async ({ slug, code, name, expectedHost }) => {
      fetchSummary.mockResolvedValue({
        generatedAt: "2026-11-22T18:00:00.000Z",
        refreshIntervalMinutes: 15,
        airports: [
          {
            airportCode: code,
            airportName: name,
            cityName: "City",
            regionName: "Region",
            latitude: 50,
            longitude: 10,
            snapshot: {
              fetchStatus: "available",
              observedAt: "2026-11-22T17:58:00.000Z",
              fetchedAt: "2026-11-22T17:59:00.000Z",
              refreshIntervalMinutes: 15,
              observations: [
                {
                  terminalDisplayName: "Terminal 1",
                  checkpointDisplayName: "Central security",
                  locationDisplayName: "Central security",
                  screeningProgram: "general",
                  laneStatus: "open",
                  displayWaitText: "9 min",
                  exactWaitMinutes: 9,
                },
              ],
            },
          },
        ],
      });

      renderAt(slug);

      expect(
        (await screen.findAllByText("Terminal 1 Central security: 9 min")).length,
      ).toBeGreaterThan(0);
      const h1 = await screen.findByRole("heading", { level: 1 });
      expect(h1.textContent).toContain("Airport security");
      expect(h1.textContent).toContain(name);
      await waitFor(() => {
        expect(document.title).toContain("Airport Security");
        expect(document.title).not.toMatch(/\bTSA\b/i);
        expect(document.title).not.toMatch(/\bFAA\b/i);

        const metaDescription =
          document.head.querySelector("meta[name='description']")?.getAttribute("content") ?? "";
        expect(metaDescription).toContain("Airport security");
        expect(metaDescription).not.toMatch(/\bTSA\b/i);
        expect(metaDescription).not.toMatch(/\bFAA\b/i);

        const rawLdJson =
          document.head.querySelector("script[type='application/ld+json']")?.textContent ?? "{}";
        const parsedLd = JSON.parse(rawLdJson) as {
          "@graph"?: {
            "@type"?: string;
            name?: string;
            description?: string;
            mainEntity?: { name: string; acceptedAnswer: { text: string } }[];
          }[];
        };
        const webPageNode = parsedLd["@graph"]?.find((node) => node["@type"] === "WebPage");
        const faqNode = parsedLd["@graph"]?.find((node) => node["@type"] === "FAQPage");
        const structuredCopy = JSON.stringify({
          name: webPageNode?.name,
          description: webPageNode?.description,
          faq: faqNode?.mainEntity,
        });
        expect(structuredCopy).toContain("Airport security");
        expect(structuredCopy).not.toMatch(/\bTSA\b/i);
        expect(structuredCopy).not.toMatch(/\bFAA\b/i);
      });

      const bodyText = document.body.textContent ?? "";
      expect(bodyText).toContain("Airport security");
      expect(bodyText).toContain("Live status unavailable");
      expect(bodyText).not.toContain("No held departures or arrivals");
      expect(bodyText).not.toMatch(/\bTSA\b/i);
      expect(bodyText).not.toMatch(/\bFAA\b/i);

      const officialLinks = screen.getAllByRole("link", {
        name: new RegExp(`${name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")} official website`, "i"),
      });
      expect(officialLinks.length).toBeGreaterThan(0);
      expect(officialLinks[0]?.getAttribute("href")).toContain(expectedHost);
    },
  );

  it("treats unknown countryCode as non-US rather than defaulting to TSA/FAA", () => {
    expect(resolveAirportCountryCode(undefined, undefined)).toBe("");
    expect(airportPageH1("Unlisted Island Airfield", "")).toBe(
      "Airport security wait times at Unlisted Island Airfield",
    );
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

  it("prerenders non-US BER and EDI HTML with Airport security, Live status unavailable, and zero TSA/FAA", () => {
    for (const [loc, host] of [
      ["/tsa/ber", "ber.berlin-airport.de"],
      ["/tsa/edi", "edinburghairport.com"],
    ] as const) {
      const html = renderToString(
        <HelmetProvider>
          <StaticRouter location={loc}>
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
      expect(html).toContain("Airport security");
      expect(html).toContain("Live status unavailable");
      expect(html).toContain(host);
      expect(html).not.toContain("No held departures or arrivals");
      const visibleText = html.replace(/<[^>]+>/g, " ");
      expect(visibleText).not.toMatch(/\bTSA\b/i);
      expect(visibleText).not.toMatch(/\bFAA\b/i);
    }
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
