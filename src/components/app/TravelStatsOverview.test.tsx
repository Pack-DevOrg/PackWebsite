import { readFileSync } from "node:fs";
import { join } from "node:path";
import React from "react";
import { render, screen } from "@testing-library/react";

import type { Trip } from "@/api/trips";
import { TravelStatsOverview } from "./TravelStatsOverview";

jest.mock("./FlightRouteMap", () => ({
  FlightRouteMap: () => <div data-testid="flight-route-map-mock" />,
}));

jest.mock("@/utils/airportCatalog", () => ({
  getAirportByIata: (code?: string | null) => {
    const key = code?.trim().toUpperCase();
    if (key === "JFK") {
      return {
        iata: "JFK",
        name: "John F Kennedy",
        cityName: "New York",
        countryCode: "US",
        regionCode: "US-NY",
        regionName: "New York",
        latitude: 40.64,
        longitude: -73.78,
      };
    }
    if (key === "LAX") {
      return {
        iata: "LAX",
        name: "Los Angeles Intl",
        cityName: "Los Angeles",
        countryCode: "US",
        regionCode: "US-CA",
        regionName: "California",
        latitude: 33.94,
        longitude: -118.41,
      };
    }
    return null;
  },
  getCountryEntryByCode: (code?: string | null) => {
    if (code?.trim().toUpperCase() === "US") {
      return { code: "US", name: "United States", continentCode: "NA" };
    }
    return null;
  },
  resolveCountryEntry: (value?: string | null) => {
    const normalized = value?.trim().toUpperCase();
    if (normalized === "US" || normalized === "UNITED STATES") {
      return { code: "US", name: "United States", continentCode: "NA" };
    }
    return null;
  },
}));

const SOURCE_PATH = join(__dirname, "TravelStatsOverview.tsx");

const HEX_COLOR = /#[0-9a-fA-F]{3,8}\b/;

const FIXTURE: Trip[] = [
  {
    sub: "user-1",
    tripId: "trip-coast",
    title: "Coast hop",
    startDate: "2024-06-01",
    endDate: "2024-06-04",
    status: "normal",
    flights: [
      {
        departureAirport: "JFK",
        arrivalAirport: "LAX",
        departureDate: "2024-06-01",
        airline: "Demo Air",
      },
    ],
    hotels: [
      {
        name: "Test Inn",
        city: "Los Angeles",
        country: "US",
        checkInDate: "2024-06-01",
        checkOutDate: "2024-06-04",
        nights: 3,
      },
    ],
    activities: [],
    totalCost: 400,
    currency: "USD",
    tags: [],
    confirmationCodes: [],
    isCancelled: false,
    isChanged: false,
    metadata: { distanceMiles: 2500 },
    createdAt: "2024-01-15T00:00:00.000Z",
    updatedAt: "2024-01-15T00:00:00.000Z",
  },
];

function stylesheetText(): string {
  return Array.from(document.querySelectorAll("style"))
    .map((node) => node.textContent ?? "")
    .join("\n");
}

function rulesFor(element: Element): string {
  const all = stylesheetText();
  const chunks: string[] = [];
  for (const cls of Array.from(element.classList)) {
    const escaped = cls.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const matches = all.match(new RegExp(`\\.${escaped}[^{]*\\{[^}]*\\}`, "g"));
    if (matches === null) {
      continue;
    }
    chunks.push(
      ...matches.map((rule) =>
        rule.replace(new RegExp(`\\.${escaped}`, "g"), "._")
      )
    );
  }
  return chunks.join("\n");
}

function ancestorRules(element: Element): string {
  const chunks: string[] = [];
  let node: Element | null = element;
  while (node !== null) {
    chunks.push(rulesFor(node));
    node = node.parentElement;
  }
  return chunks.join("\n");
}

function declaredValue(css: string, property: string): string | undefined {
  const match = css.match(new RegExp(`${property}\\s*:\\s*([^;}]+)`, "i"));
  if (match === null) {
    return undefined;
  }
  const value = match[1];
  if (value === undefined) {
    return undefined;
  }
  return value.trim();
}

function isAbsentOrNone(value: string | undefined): boolean {
  if (value === undefined) {
    return true;
  }
  const normalized = value.toLowerCase();
  return (
    normalized === "none" ||
    normalized === "unset" ||
    normalized === "initial" ||
    normalized === ""
  );
}

async function renderStats() {
  const view = render(<TravelStatsOverview trips={FIXTURE} />);
  await screen.findByRole("heading", { name: "Overview" });
  return view;
}

describe("TravelStatsOverview chrome", () => {
  it("has no hex colors and no IconBubble; imports IconDisc from Chrome", () => {
    const source = readFileSync(SOURCE_PATH, "utf8");

    expect(source).not.toMatch(HEX_COLOR);
    expect(source).not.toMatch(/\bIconBubble\b/);
    expect(source).toMatch(/IconDisc/);
    expect(source).toMatch(/PageHeader/);
    expect(source).toMatch(/MicroLabel/);
    expect(source).toMatch(/from ["']\.\.\/ui\/Chrome["']/);
  });

  it("renders StatsHub section headers in product order", async () => {
    await renderStats();

    const overview = screen.getByRole("heading", { name: "Overview" });
    const places = screen.getByRole("heading", { name: "Places" });
    const timeInAir = screen.getByRole("heading", { name: "Time in the air" });
    const streaks = screen.getByRole("heading", { name: "Streaks/Badges" });

    expect(overview).toBeInTheDocument();
    expect(places).toBeInTheDocument();
    expect(timeInAir).toBeInTheDocument();
    expect(streaks).toBeInTheDocument();

    const body = document.body.textContent ?? "";
    expect(body.indexOf("Overview")).toBeLessThan(body.indexOf("Places"));
    expect(body.indexOf("Places")).toBeLessThan(body.indexOf("Time in the air"));
    expect(body.indexOf("Time in the air")).toBeLessThan(
      body.indexOf("Streaks/Badges")
    );

    expect(screen.queryByText("Hero Metrics")).not.toBeInTheDocument();
    expect(screen.queryByText("Travel Badges")).not.toBeInTheDocument();
    expect(screen.queryByText("Travel Activity")).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Cities Visited" })).toBeNull();
  });

  it("maps unlocked badges to success and locked badges to border-medium", async () => {
    await renderStats();

    const unlocked = screen.getByText(/Mileage Explorer/);
    const locked = screen.getByText(/Global Footprint/);

    expect(ancestorRules(unlocked)).toContain("var(--color-success)");
    expect(ancestorRules(locked)).toContain("var(--color-border-medium)");
  });

  it("sets number tiles to the mono font token", async () => {
    await renderStats();

    const css = stylesheetText();
    expect(css).toMatch(/font-family:\s*var\(--font-mono\)/);
  });

  it("fills progress bars with a success tint pair, not a hex gradient", async () => {
    await renderStats();

    const css = stylesheetText();
    expect(css).not.toMatch(/linear-gradient\(\s*90deg\s*,\s*#/i);
    expect(css).toContain("var(--color-success-tint)");
    expect(css).toMatch(/background:\s*var\(--color-success\)/);
  });

  it("keeps section surfaces free of box-shadow and backdrop-filter", async () => {
    const { container } = await renderStats();
    const sections = Array.from(container.querySelectorAll("section"));
    expect(sections.length).toBeGreaterThan(0);

    for (const section of sections) {
      const css = rulesFor(section);
      expect(isAbsentOrNone(declaredValue(css, "box-shadow"))).toBe(true);
      expect(isAbsentOrNone(declaredValue(css, "backdrop-filter"))).toBe(true);
    }
  });
});
