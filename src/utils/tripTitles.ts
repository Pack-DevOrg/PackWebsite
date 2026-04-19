import type { Trip } from "@/api/trips";
import { getAirportCatalogEntryByIata } from "@pack/schemas/locality-catalog";
import { differenceInCalendarDays } from "date-fns";
import { getTripNamingDisplay } from "@/utils/tripNaming";

interface StayCandidate {
  readonly label: string;
  readonly nights: number;
  readonly order: number;
  readonly source: "hotel" | "flight";
}

type OvernightStay = StayCandidate;

const normalizeCode = (value?: string | null): string | null => {
  if (!value) {
    return null;
  }
  const trimmed = value.trim();
  return trimmed ? trimmed.toUpperCase() : null;
};

const formatLocationParts = (
  parts: Array<string | undefined | null>
): string | null => {
  const filtered = parts
    .map((part) => (part ? part.trim() : ""))
    .filter((part) => part.length > 0);
  if (filtered.length === 0) {
    return null;
  }
  return filtered.join(", ");
};

export const getAirportCityName = (iataCode: string | undefined | null): string | null => {
  const code = normalizeCode(iataCode);
  if (!code) {
    return null;
  }

  const airport = getAirportCatalogEntryByIata(code);
  if (!airport) {
    return null;
  }

  const location = formatLocationParts([airport.cityName, airport.regionName]);
  return location ?? airport.name ?? null;
};

const formatHotelLocation = (
  city?: string | null,
  state?: string | null,
  _country?: string | null,
  fallbackName?: string | null
): string | null => {
  return (
    formatLocationParts([city, state]) ??
    (fallbackName ? fallbackName.trim() : null)
  );
};

const parseDate = (value: string | undefined | null): Date | null => {
  if (!value) {
    return null;
  }

  const isoOnlyDateMatch = value.match(/^\d{4}-\d{2}-\d{2}$/);
  if (isoOnlyDateMatch) {
    return new Date(`${value}T00:00:00Z`);
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const collectHotelStays = (trip: Trip): StayCandidate[] => {
  if (!trip.hotels || trip.hotels.length === 0) {
    return [];
  }

  const candidates: StayCandidate[] = [];

  trip.hotels.forEach((hotel, index) => {
    const label = formatHotelLocation(
      hotel.city,
      hotel.state,
      hotel.country,
      hotel.name
    );

    if (!label) {
      return;
    }

    const checkIn = parseDate(hotel.checkInDate);
    const checkOut = parseDate(hotel.checkOutDate);
    const reportedNights = typeof hotel.nights === "number" ? hotel.nights : null;

    let nights = reportedNights ?? null;
    if (nights === null && checkIn && checkOut) {
      nights = differenceInCalendarDays(checkOut, checkIn);
    }

    if ((nights ?? 0) < 1) {
      return;
    }

    const order =
      checkIn?.getTime() ??
      checkOut?.getTime() ??
      (index + 1) * 1_000;

    candidates.push({
      label,
      nights: nights ?? 1,
      order,
      source: "hotel",
    });
  });

  return candidates;
};

const collectFlightStays = (trip: Trip): StayCandidate[] => {
  if (!trip.flights || trip.flights.length === 0) {
    return [];
  }

  const sortedFlights = [...trip.flights].sort((a, b) => {
    const aDate = parseDate(a.departureDate) ?? parseDate(a.arrivalDate) ?? new Date(0);
    const bDate = parseDate(b.departureDate) ?? parseDate(b.arrivalDate) ?? new Date(0);
    return aDate.getTime() - bDate.getTime();
  });

  const candidates: StayCandidate[] = [];

  sortedFlights.forEach((flight, index) => {
    const arrivalCode = flight.arrivalAirport ?? flight.destination;
    if (!arrivalCode) {
      return;
    }

    const arrivalDate = parseDate(flight.arrivalDate) ?? parseDate(flight.departureDate);
    if (!arrivalDate) {
      return;
    }

    const nextFlight = sortedFlights[index + 1];
    const nextDepartureDate =
      (nextFlight &&
        (parseDate(nextFlight.departureDate) ?? parseDate(nextFlight.arrivalDate))) ??
      parseDate(trip.endDate) ??
      null;

    if (!nextDepartureDate) {
      return;
    }

    const nights = differenceInCalendarDays(nextDepartureDate, arrivalDate);
    if (nights < 1) {
      return;
    }

    const label = getAirportCityName(arrivalCode) ?? arrivalCode.trim();
    if (!label) {
      return;
    }

    candidates.push({
      label,
      nights,
      order: arrivalDate.getTime(),
      source: "flight",
    });
  });

  return candidates;
};

const summarizeOvernightStays = (trip: Trip): OvernightStay[] => {
  const aggregate = new Map<string, OvernightStay>();

  const upsert = (candidate: StayCandidate) => {
    const existing = aggregate.get(candidate.label);
    if (existing) {
      aggregate.set(candidate.label, {
        ...existing,
        nights: existing.nights + candidate.nights,
        order: Math.min(existing.order, candidate.order),
        source: existing.source === "hotel" ? "hotel" : candidate.source,
      });
    } else {
      aggregate.set(candidate.label, { ...candidate });
    }
  };

  collectHotelStays(trip).forEach(upsert);
  collectFlightStays(trip).forEach(upsert);

  return Array.from(aggregate.values());
};

export const getOvernightLocations = (trip: Trip): string[] => {
  const stays = summarizeOvernightStays(trip);
  if (stays.length === 0) {
    return [];
  }

  return stays
    .slice()
    .sort((a, b) => a.order - b.order)
    .map((stay) => stay.label);
};

export const getTripDisplayTitle = (
  trip: Trip,
  fallbackTitle: string
): string => {
  return getTripNamingDisplay(trip, { fallbackTitle }).routeTitle;
};
