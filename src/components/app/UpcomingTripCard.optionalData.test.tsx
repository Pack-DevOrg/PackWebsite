import fs from "node:fs";
import path from "node:path";
import React from "react";
import { render, screen } from "@testing-library/react";

import type { Trip } from "@/api/trips";
import { UpcomingTripCard } from "./UpcomingTripCard";

jest.mock(
  "@pack/schemas/locality-catalog",
  () => ({
    getAllAirportCatalogEntries: () => [],
  }),
  { virtual: true },
);

describe("UpcomingTripCard optional data handling", () => {
  it("renders when hotels are missing", () => {
    const trip = {
      tripId: "trip-1",
      sub: "user-1",
      title: "Test trip",
      startDate: "2025-01-10",
      endDate: "2025-01-12",
      flights: [],
      hotels: undefined,
      createdAt: "2025-01-01T00:00:00Z",
      updatedAt: "2025-01-01T00:00:00Z",
      version: 1,
    } as unknown as Trip;

    expect(() => render(<UpcomingTripCard trip={trip} />)).not.toThrow();
    expect(screen.getByText(/departing/i)).toBeInTheDocument();
    expect(screen.getByText(/returning/i)).toBeInTheDocument();
  });

  it("has no raw hex, box-shadow, drop-shadow, or backdrop-filter in source", () => {
    const source = fs.readFileSync(
      path.join(__dirname, "UpcomingTripCard.tsx"),
      "utf8",
    );

    expect(source).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
    expect(source).not.toMatch(/box-shadow/);
    expect(source).not.toMatch(/drop-shadow/);
    expect(source).not.toMatch(/backdrop-filter/);
  });
});
