import type { Trip } from "../api/trips";
import { dedupeTripsById, uniquePastTripsByTitle } from "./tripDedup";

const buildTrip = (overrides: Partial<Trip> = {}): Trip => ({
  sub: "user-1",
  tripId: "trip-1",
  title: "Base Trip",
  description: "Test trip",
  startDate: "2024-01-01",
  endDate: "2024-01-05",
  status: "normal",
  flights: [],
  hotels: [],
  activities: [],
  currency: "USD",
  tags: [],
  confirmationCodes: [],
  isCancelled: false,
  isChanged: false,
  createdAt: "2024-01-01T00:00:00.000Z",
  updatedAt: "2024-01-01T00:00:00.000Z",
  ...overrides,
});

describe("dedupeTripsById", () => {
  it("keeps the most recently updated trip when duplicate ids are present", () => {
    const original = buildTrip({
      tripId: "abc",
      title: "",
      confirmationCodes: ["ABC123"],
      updatedAt: "2024-01-02T00:00:00.000Z",
    });
    const updated = buildTrip({
      tripId: "abc",
      title: "Updated Title",
      confirmationCodes: ["ABC123"],
      updatedAt: "2024-01-04T00:00:00.000Z",
    });

    const result = dedupeTripsById([original, updated]);

    expect(result).toHaveLength(1);
    expect(result[0].title).toBe("Updated Title");
  });

  it("retains other unique trips while deduping by tripId", () => {
    const tripA = buildTrip({
      tripId: "abc",
      title: "",
      confirmationCodes: ["XYZ789"],
    });
    const tripB = buildTrip({ tripId: "def", title: "Trip B" });
    const tripAUpdated = buildTrip({
      tripId: "abc",
      title: "Trip A Latest",
      confirmationCodes: ["XYZ789"],
      updatedAt: "2024-01-05T00:00:00.000Z",
    });

    const result = dedupeTripsById([tripA, tripB, tripAUpdated]);

    expect(result.map((trip) => trip.tripId).sort()).toEqual(["abc", "def"]);
    expect(result.find((trip) => trip.tripId === "abc")?.title).toBe(
      "Trip A Latest"
    );
    expect(result.find((trip) => trip.tripId === "def")?.title).toBe("Trip B");
  });

  it("prefers the trip with a name when duplicates share route and dates", () => {
    const unnamed = buildTrip({
      tripId: "no-name",
      title: "",
      startDate: "2024-10-14",
      endDate: "2024-10-16",
      flights: [
        {
          departureAirport: "LAX",
          arrivalAirport: "AUS",
          departureDate: "2024-10-14",
          arrivalDate: "2024-10-14",
        },
      ],
    });

    const named = buildTrip({
      tripId: "named",
      title: "Austin quick trip",
      startDate: "2024-10-14",
      endDate: "2024-10-16",
      flights: [
        {
          departureAirport: "LAX",
          arrivalAirport: "AUS",
          departureDate: "2024-10-14",
          arrivalDate: "2024-10-14",
        },
      ],
      updatedAt: "2024-10-10T00:00:00.000Z",
    });

    const result = dedupeTripsById([unnamed, named]);

    expect(result).toHaveLength(1);
    expect(result[0].title).toBe("Austin quick trip");
    expect(result[0].tripId).toBe("named");
  });
});

describe("uniquePastTripsByTitle", () => {
  it("drops trips without a title and keeps uniquely titled entries", () => {
    const unnamed = buildTrip({ tripId: "1", title: "" });
    const named = buildTrip({ tripId: "2", title: "Named Trip" });

    const result = uniquePastTripsByTitle([unnamed, named]);

    expect(result).toHaveLength(1);
    expect(result[0].tripId).toBe("2");
  });

  it("keeps only one per title, preferring the most recently updated", () => {
    const older = buildTrip({
      tripId: "1",
      title: "Austin quick trip",
      updatedAt: "2024-10-01T00:00:00.000Z",
    });
    const newer = buildTrip({
      tripId: "2",
      title: "Austin quick trip",
      updatedAt: "2024-10-05T00:00:00.000Z",
    });

    const result = uniquePastTripsByTitle([older, newer]);

    expect(result).toHaveLength(1);
    expect(result[0].tripId).toBe("2");
  });
});
