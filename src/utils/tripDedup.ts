import type { Trip } from "@/api/trips";

const parseTimestamp = (value: string | undefined): number => {
  const parsed = value ? Date.parse(value) : NaN;
  return Number.isNaN(parsed) ? 0 : parsed;
};

const normalize = (value?: string | null): string =>
  (value ?? "").trim().toLowerCase();

const getRouteKey = (trip: Trip): string | undefined => {
  const flights = Array.isArray(trip.flights) ? trip.flights : [];

  if (flights.length > 0) {
    const first = flights[0];
    const last = flights[flights.length - 1];
    const origin =
      (first as { origin?: string }).origin ??
      first.departureAirport ??
      first.departureGate ??
      "";
    const destination =
      (last as { destination?: string }).destination ??
      last.arrivalAirport ??
      last.arrivalGate ??
      "";

    if (origin || destination) {
      return `${origin}→${destination}`;
    }
  }

  const hotels = Array.isArray(trip.hotels) ? trip.hotels : [];
  if (hotels.length > 0) {
    const primary = hotels[0];
    const location =
      primary.city ?? primary.address ?? primary.name ?? primary.country ?? "";
    if (location) {
      return location;
    }
  }

  return undefined;
};

const getSignature = (trip: Trip): string => {
  const confirmationKey =
    trip.confirmationCodes?.length && trip.confirmationCodes.length > 0
      ? trip.confirmationCodes.slice().sort().join("|")
      : undefined;
  if (confirmationKey) {
    return `conf:${confirmationKey}`;
  }

  if (trip.bookingReference) {
    return `book:${normalize(trip.bookingReference)}`;
  }

  const route = getRouteKey(trip);
  if (route) {
    return `route:${trip.startDate}|${trip.endDate}|${normalize(route)}`;
  }

  // Fall back to tripId to avoid collapsing unrelated items.
  return `id:${trip.tripId}`;
};

const isCandidateBetter = (candidate: Trip, existing: Trip): boolean => {
  const candidateHasTitle = Boolean(normalize(candidate.title));
  const existingHasTitle = Boolean(normalize(existing.title));

  if (candidateHasTitle && !existingHasTitle) {
    return true;
  }
  if (!candidateHasTitle && existingHasTitle) {
    return false;
  }

  const currentTimestamp = parseTimestamp(existing.updatedAt ?? existing.createdAt);
  const candidateTimestamp = parseTimestamp(candidate.updatedAt ?? candidate.createdAt);

  return candidateTimestamp >= currentTimestamp;
};

/**
 * When showing past trips, only keep entries with a usable title and ensure
 * each title is unique, preferring the most recently updated version.
 */
export const uniquePastTripsByTitle = (trips: Trip[]): Trip[] => {
  const byTitle = new Map<string, Trip>();

  for (const trip of trips) {
    const normalizedTitle = normalize(trip.title);
    if (!normalizedTitle) {
      continue;
    }

    const existing = byTitle.get(normalizedTitle);
    if (!existing || isCandidateBetter(trip, existing)) {
      byTitle.set(normalizedTitle, trip);
    }
  }

  return Array.from(byTitle.values());
};

/**
 * Deduplicate trips by confirmation codes, booking reference, or route/dates,
 * preferring the named/most recent version when duplicates exist.
 */
export const dedupeTripsById = (trips: Trip[]): Trip[] => {
  const deduped = new Map<string, Trip>();

  for (const trip of trips) {
    const signature = getSignature(trip);
    const existing = deduped.get(signature);

    if (!existing) {
      deduped.set(signature, trip);
      continue;
    }

    if (isCandidateBetter(trip, existing)) {
      deduped.set(signature, trip);
    }
  }

  return Array.from(deduped.values());
};
