import { differenceInCalendarDays, formatDistanceToNowStrict } from "date-fns";
import type { Trip } from "@/api/trips";
import { formatLocalizedDate } from "@/i18n/format";
import { getAirportByIata } from "@/utils/airportCatalog";

interface AirportCoordinate {
  readonly lat: number;
  readonly lon: number;
}

const toRadians = (value: number) => (value * Math.PI) / 180;

const haversineDistanceMiles = (from: AirportCoordinate, to: AirportCoordinate): number => {
  const EARTH_RADIUS_MILES = 3958.8;
  const dLat = toRadians(to.lat - from.lat);
  const dLon = toRadians(to.lon - from.lon);
  const lat1 = toRadians(from.lat);
  const lat2 = toRadians(to.lat);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_MILES * c;
};

const getAirportCoordinate = (code?: string | null): AirportCoordinate | null => {
  if (!code) {
    return null;
  }
  const airport = getAirportByIata(code.trim().toUpperCase());
  if (!airport) {
    return null;
  }
  return {
    lat: airport.latitude,
    lon: airport.longitude,
  };
};

const computeFlightDistanceFromAirports = (flight: Trip["flights"][number]): number => {
  const departure = getAirportCoordinate(flight?.departureAirport);
  const arrival = getAirportCoordinate(flight?.arrivalAirport);
  if (!departure || !arrival) {
    return 0;
  }
  return haversineDistanceMiles(departure, arrival);
};

const estimateTripDistance = (trip: Trip): number => {
  const flights = sortFlightsChronologically(trip.flights);
  if (flights.length === 0) {
    return 0;
  }
  return flights.reduce((total, flight) => total + computeFlightDistanceFromAirports(flight), 0);
};

export const formatDateRange = (start: string, end: string): string => {
  const startDate = new Date(`${start}T00:00:00Z`);
  const endDate = new Date(`${end}T00:00:00Z`);
  const startLabel = formatLocalizedDate(startDate, {
    month: "short",
    day: "numeric",
  });
  if (start === end) {
    return startLabel;
  }
  const endLabel = formatLocalizedDate(endDate, {
    month: "short",
    day: "numeric",
  });
  return `${startLabel} – ${endLabel}`;
};

const parseDateSafely = (value?: string | null): Date | null => {
  if (!value) {
    return null;
  }
  const timestamp = Date.parse(`${value}T00:00:00Z`);
  if (Number.isNaN(timestamp)) {
    return null;
  }
  return new Date(timestamp);
};

const normalizeTimeForSort = (time?: string | null): string => {
  if (!time) {
    return "00:00";
  }
  const trimmed = time.trim();
  if (/^\d{2}:\d{2}$/.test(trimmed)) {
    return trimmed;
  }
  const amPmMatch = trimmed.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!amPmMatch) {
    return "00:00";
  }
  const [, hour, minute, period] = amPmMatch;
  let normalizedHour = parseInt(hour, 10);
  if (period.toUpperCase() === "AM") {
    if (normalizedHour === 12) {
      normalizedHour = 0;
    }
  } else if (normalizedHour !== 12) {
    normalizedHour += 12;
  }
  return `${normalizedHour.toString().padStart(2, "0")}:${minute}`;
};

const getFlightDepartureTimestamp = (flight: Trip["flights"][number]): number => {
  if (!flight?.departureDate) {
    return Number.MAX_SAFE_INTEGER;
  }
  const datePart = flight.departureDate.trim();
  if (!datePart) {
    return Number.MAX_SAFE_INTEGER;
  }
  const timePart = normalizeTimeForSort(flight.departureTime);
  const isoCandidate = `${datePart}T${timePart}`;
  const timestamp = Date.parse(isoCandidate);
  if (!Number.isNaN(timestamp)) {
    return timestamp;
  }
  const fallback = Date.parse(datePart);
  return Number.isNaN(fallback) ? Number.MAX_SAFE_INTEGER : fallback;
};

export const computeFlightRoute = (trip: Trip): string | null => {
  const flights = sortFlightsChronologically(trip.flights);
  if (flights.length === 0) {
    return null;
  }

  const airportSequence: string[] = [];
  flights.forEach((flight) => {
    const departure = flight?.departureAirport?.trim();
    const arrival = flight?.arrivalAirport?.trim();

    if (departure && (airportSequence.length === 0 || airportSequence[airportSequence.length - 1] !== departure)) {
      airportSequence.push(departure);
    }
    if (arrival && (airportSequence.length === 0 || airportSequence[airportSequence.length - 1] !== arrival)) {
      airportSequence.push(arrival);
    }
  });

  if (airportSequence.length < 2) {
    return null;
  }

  const origin = airportSequence[0];
  const finalStop = airportSequence[airportSequence.length - 1];

  if (airportSequence.length === 3 && origin && finalStop && origin === finalStop) {
    return `${origin} ↔ ${airportSequence[1]}`;
  }

  const uniqueAirports = Array.from(new Set(airportSequence));
  if (origin && finalStop && origin === finalStop && uniqueAirports.length === 2) {
    return `${uniqueAirports[0]} ↔ ${uniqueAirports[1]}`;
  }

  return airportSequence.join(" → ");
};

export const sortFlightsChronologically = (
  flights?: Trip["flights"]
): NonNullable<Trip["flights"][number]>[] => {
  if (!Array.isArray(flights)) {
    return [];
  }

  return flights
    .filter((flight): flight is NonNullable<Trip["flights"][number]> => Boolean(flight))
    .slice()
    .sort((a, b) => getFlightDepartureTimestamp(a) - getFlightDepartureTimestamp(b));
};

export const formatAirlines = (trip: Trip): string | null => {
  const airlines =
    trip.flights
      ?.map((flight) => flight?.airline)
      .filter((value): value is string => Boolean(value))
      .filter((value, index, array) => array.indexOf(value) === index) ?? [];

  if (airlines.length === 0) {
    return null;
  }
  if (airlines.length === 1) {
    return airlines[0];
  }
  if (airlines.length === 2) {
    return `${airlines[0]} • ${airlines[1]}`;
  }
  const displayNames = airlines.slice(0, 2);
  return `${displayNames.join(" • ")} +${airlines.length - displayNames.length} more`;
};

interface CountdownInfo {
  readonly text: string;
  readonly isUpcoming: boolean;
  readonly referenceDate?: Date;
}

export const getCountdownInfo = (trip: Trip): CountdownInfo => {
  const start = parseDateSafely(trip.startDate);
  const end = parseDateSafely(trip.endDate);
  const now = new Date();

  if (start && now < start) {
    const days = differenceInCalendarDays(start, now);
    if (days === 0) {
      return { text: "Departing today", isUpcoming: true, referenceDate: start };
    }
    if (days === 1) {
      return { text: "Departing tomorrow", isUpcoming: true, referenceDate: start };
    }
    if (days <= 7) {
      return { text: `Departing in ${days} days`, isUpcoming: true, referenceDate: start };
    }
    return {
      text: formatDistanceToNowStrict(start, { addSuffix: true }),
      isUpcoming: true,
      referenceDate: start,
    };
  }

  if (start && end && now >= start && now <= end) {
    return { text: "Currently traveling", isUpcoming: true, referenceDate: start };
  }

  if (end) {
    const daysAgo = differenceInCalendarDays(now, end);
    if (daysAgo <= 7) {
      return {
        text: `${daysAgo} day${daysAgo === 1 ? "" : "s"} ago`,
        isUpcoming: false,
        referenceDate: end,
      };
    }
    return {
      text: formatDistanceToNowStrict(end, { addSuffix: true }),
      isUpcoming: false,
      referenceDate: end,
    };
  }

  return { text: "Schedule pending", isUpcoming: true };
};

export const calculateNights = (start: string, end: string): number => {
  const startDate = new Date(`${start}T00:00:00Z`);
  const endDate = new Date(`${end}T00:00:00Z`);
  return Math.max(1, differenceInCalendarDays(endDate, startDate));
};

export const getTripDistance = (trip: Trip): number | null => {
  if (
    trip.metadata &&
    typeof trip.metadata === "object" &&
    "distanceMiles" in trip.metadata
  ) {
    const value = Number(
      (trip.metadata as Record<string, unknown>).distanceMiles
    );
    if (Number.isFinite(value) && value > 0) {
      return value;
    }
  }
  const estimated = estimateTripDistance(trip);
  return estimated > 0 ? estimated : null;
};

