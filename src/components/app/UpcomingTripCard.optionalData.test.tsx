import React from "react";
import { render, screen } from "@testing-library/react";

import type { Trip } from "@/api/trips";
import { UpcomingTripCard } from "./UpcomingTripCard";

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
});

