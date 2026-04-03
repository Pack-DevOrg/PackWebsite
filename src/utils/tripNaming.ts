import type { Trip } from "@/api/trips";
import { computeFlightRoute, formatAirlines } from "@/utils/tripMetrics";

const normalizeDisplayString = (value?: string | null): string => {
  if (!value) {
    return "";
  }

  return value
    .replace(/↔/g, "<->")
    .replace(/→/g, "->")
    .replace(/•/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
};

const convertArrowsToUnicode = (value: string): string => {
  return value
    .replace(/<\s*-\s*>/g, "↔")
    .replace(/<->/g, "↔")
    .replace(/->/g, "→");
};

export const formatTripTitleForDisplay = (value: string): string => {
  const unicodeValue = convertArrowsToUnicode(value);
  const segments = unicodeValue
    .split("→")
    .map((part) => part.trim())
    .filter(Boolean);

  if (segments.length === 3 && segments[0] === segments[2]) {
    return `${segments[0]} ↔ ${segments[1]}`;
  }

  return unicodeValue;
};

interface TripNamingOptions {
  readonly fallbackTitle?: string;
}

export interface TripNamingDisplay {
  readonly routeTitle: string;
  readonly subtitle?: string;
  readonly routeOnlyDisplay?: string;
}

const buildRouteDisplay = (
  trip: Trip,
  fallbackTitle: string
): { readonly display: string; readonly routeOnly?: string } => {
  const flights = Array.isArray(trip.flights) ? trip.flights : null;
  const hotels = Array.isArray(trip.hotels) ? trip.hotels : null;
  const flightCount = flights?.length ?? 0;
  const hotelCount = hotels?.length ?? 0;
  const primaryFlight = flightCount > 0 ? flights?.[0] : null;
  const primaryHotel = hotelCount > 0 ? hotels?.[0] : null;

  if (flightCount > 0) {
    const airlineSummary = formatAirlines(trip);
    let routeOnlyDisplay = computeFlightRoute(trip);

    if (!routeOnlyDisplay && primaryFlight) {
      const origin =
        primaryFlight.departureAirport ||
        (typeof (primaryFlight as { origin?: string }).origin === "string"
          ? (primaryFlight as { origin?: string }).origin
          : null) ||
        "Origin";
      const destination =
        primaryFlight.arrivalAirport ||
        primaryFlight.destination ||
        "Destination";

      routeOnlyDisplay = `${origin} → ${destination}`;
    }

    if (routeOnlyDisplay || airlineSummary) {
      const segments: string[] = [];
      if (airlineSummary) {
        segments.push(airlineSummary);
      }
      if (routeOnlyDisplay) {
        segments.push(routeOnlyDisplay);
      }

      const display = segments.length > 0 ? segments.join(" ") : fallbackTitle;
      return { display, routeOnly: routeOnlyDisplay ?? undefined };
    }
  }

  if (primaryHotel) {
    const hotelLabel =
      primaryHotel.city ||
      primaryHotel.address ||
      primaryHotel.name ||
      fallbackTitle;
    return { display: hotelLabel, routeOnly: hotelLabel };
  }

  if (trip.title && trip.title.trim().length > 0) {
    const formatted = formatTripTitleForDisplay(trip.title);
    return { display: formatted, routeOnly: formatted };
  }

  return { display: fallbackTitle, routeOnly: fallbackTitle };
};

export const getTripNamingDisplay = (
  trip: Trip,
  options?: TripNamingOptions
): TripNamingDisplay => {
  const fallbackTitle = options?.fallbackTitle?.trim() || "Upcoming Adventure";
  const routeDetails = buildRouteDisplay(trip, fallbackTitle);
  const comparisonRoute = routeDetails.routeOnly ?? routeDetails.display;
  const normalizedRoute = normalizeDisplayString(comparisonRoute);
  const sanitizedTripTitle =
    trip.title && trip.title.trim().length > 0
      ? formatTripTitleForDisplay(trip.title)
      : undefined;
  const normalizedTitle = normalizeDisplayString(sanitizedTripTitle);
  const subtitle =
    sanitizedTripTitle && normalizedTitle !== normalizedRoute
      ? sanitizedTripTitle
      : undefined;

  return {
    routeTitle: routeDetails.display,
    subtitle,
    routeOnlyDisplay: comparisonRoute,
  };
};
