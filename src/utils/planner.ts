import { format } from "date-fns";
import { z } from "zod";
import {
  FlightChunkSchema,
  FlightOutlineSchema,
  HotelChunkSchema,
  HotelOutlineSchema,
  TimelineChunkSchema,
  type FlightChunk,
  type FlightOutline,
  type HotelChunk,
  type HotelOutline,
  type TimelineChunk,
} from "@/schemas/travel";
import {
  TripCreatePayloadSchema,
  type TripCreatePayload,
} from "@/api/trips";
import {
  CreateSharedTravelPlanRequestSchema,
  type CreateSharedTravelPlanRequest,
  type SharedTravelChunk,
  type SharedTravelOutlineChunk,
} from "@/schemas/shared-travel";

export interface PlannerResult {
  readonly outlines: Array<FlightOutline | HotelOutline>;
  readonly planChunks: Array<FlightChunk | HotelChunk>;
}

const normalizeDate = (value: string | null | undefined): string | null => {
  if (!value) {
    return null;
  }
  const trimmed = value.trim();
  if (!/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(trimmed)) {
    return null;
  }
  return trimmed;
};

const getTimelineDates = (timelineItems: TimelineChunk[]): string[] => {
  const dates: string[] = [];

  timelineItems.forEach((item) => {
    switch (item.type) {
      case "flight":
        dates.push(item.date);
        if (item.returnDate) {
          dates.push(item.returnDate);
        }
        break;
      case "flightOutline":
        dates.push(item.date);
        break;
      case "hotel":
        dates.push(item.checkIn, item.checkOut);
        break;
      case "hotelOutline":
        dates.push(item.checkIn);
        if (item.checkOut) {
          dates.push(item.checkOut);
        }
        break;
      default:
        break;
    }
  });

  return dates
    .map((value) => normalizeDate(value))
    .filter((value): value is string => Boolean(value))
    .sort();
};

const fallbackDate = (): string => format(new Date(), "yyyy-MM-dd");

export const splitTimeline = (
  timelineItems: unknown[]
): PlannerResult => {
  const outlines: Array<FlightOutline | HotelOutline> = [];
  const planChunks: Array<FlightChunk | HotelChunk> = [];

  timelineItems.forEach((item) => {
    const parsedOutline = z
      .union([FlightOutlineSchema, HotelOutlineSchema])
      .safeParse(item);
    if (parsedOutline.success) {
      outlines.push(parsedOutline.data);
      return;
    }

    const parsedPlan = z
      .union([FlightChunkSchema, HotelChunkSchema])
      .safeParse(item);
    if (parsedPlan.success) {
      planChunks.push(parsedPlan.data);
    }
  });

  return { outlines, planChunks };
};

export const buildTripPayloadFromTimeline = (
  timelineItems: TimelineChunk[],
  titleHint: string
): TripCreatePayload => {
  const dates = getTimelineDates(timelineItems);
  const startDate = dates[0] ?? fallbackDate();
  const endDate = dates[dates.length - 1] ?? startDate;

  const { outlines, planChunks } = splitTimeline(timelineItems);

  const outlineFlights = outlines.filter(
    (item): item is FlightOutline => item.type === "flightOutline"
  );
  const outlineHotels = outlines.filter(
    (item): item is HotelOutline => item.type === "hotelOutline"
  );

  const plannedFlights = planChunks.filter(
    (item): item is FlightChunk => item.type === "flight"
  );
  const plannedHotels = planChunks.filter(
    (item): item is HotelChunk => item.type === "hotel"
  );

  const flights =
    plannedFlights.length > 0
      ? plannedFlights.map((flight) => ({
          departureAirport: flight.origin,
          arrivalAirport: flight.destination,
          departureDate: flight.date,
          arrivalDate: flight.returnDate ?? flight.date,
          flightNumber: flight.flightNumber,
          airline: flight.airline,
          passengers: [],
          status: "confirmed" as const,
        }))
      : outlineFlights.map((flight) => ({
          departureAirport: flight.origin,
          arrivalAirport: flight.destination,
          departureDate: flight.date,
          arrivalDate: flight.date,
          passengers: [],
          status: "confirmed" as const,
        }));

  const hotels =
    plannedHotels.length > 0
      ? plannedHotels.map((hotel) => ({
          name: hotel.location,
          city: hotel.cityCode ?? hotel.location,
          checkInDate: hotel.checkIn,
          checkOutDate: hotel.checkOut,
          confirmationNumber: undefined,
        }))
      : outlineHotels.map((hotel) => ({
          name: hotel.location,
          city: hotel.location,
          checkInDate: hotel.checkIn,
          checkOutDate: hotel.checkOut ?? hotel.checkIn,
          confirmationNumber: undefined,
        }));

  const payload = TripCreatePayloadSchema.parse({
    title:
      titleHint.trim().length > 0
        ? titleHint.trim()
        : "AI planned trip",
    description: "Planned with Pack",
    startDate,
    endDate,
    flights,
    hotels,
    activities: [],
    tags: ["ai-planned"],
    status: "normal" as const,
  });

  return payload;
};

export const buildSharePayload = (
  timelineItems: TimelineChunk[],
  title: string,
  description?: string
): CreateSharedTravelPlanRequest => {
  const { outlines, planChunks } = splitTimeline(timelineItems);

  const shareableOutlines: SharedTravelOutlineChunk[] = outlines.map(
    (item) => {
      if (item.type === "flightOutline") {
        return {
          id: item.id,
          type: "flightOutline",
          origin: item.origin,
          destination: item.destination,
          date: item.date,
          earliestDeparture: item.earliestDeparture,
          latestDeparture: undefined,
          earliestArrival: undefined,
          latestArrival: item.latestArrival,
          alreadyBooked: item.alreadyBooked ?? false,
        };
      }

      return {
        id: item.id,
        type: "hotelOutline",
        location: item.location,
        checkIn: item.checkIn,
        checkOut: item.checkOut ?? item.checkIn,
        nights: item.nights ?? 1,
        eventList: item.eventList ?? [],
      };
    }
  );

  const shareableChunks: SharedTravelChunk[] = planChunks.map((item) => {
    if (item.type === "flight") {
      return {
        id: item.id,
        type: "flight",
        origin: item.origin,
        destination: item.destination,
        date: item.date,
        departureTime: item.departureTime,
        arrivalTime: item.arrivalTime,
        airline: item.airline,
        flightNumber: item.flightNumber,
      };
    }

    return {
      id: item.id,
      type: "hotel",
      location: item.location,
      checkIn: item.checkIn,
      checkOut: item.checkOut,
      name: item.eventTitle ?? item.location,
      nights: item.nights,
      eventList: item.eventList ?? [],
    };
  });

  return CreateSharedTravelPlanRequestSchema.parse({
    title: title.trim().length > 0 ? title.trim() : "Travel plan",
    description,
    chunks: shareableChunks,
    outlineChunks: shareableOutlines,
  });
};
