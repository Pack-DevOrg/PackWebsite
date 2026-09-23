import { z } from "zod";

const AirportWaitTimeProgramSchema = z.enum([
  "general",
  "tsa_precheck",
  "clear",
  "priority",
  "expedited_reservation",
  "unknown",
]);

const AirportWaitTimeLaneStatusSchema = z.enum([
  "open",
  "closed",
  "unavailable",
]);

export const AirportWaitTimeObservationSchema = z.object({
  terminalKey: z.string().optional(),
  terminalDisplayName: z.string().optional(),
  checkpointKey: z.string().optional(),
  checkpointDisplayName: z.string().optional(),
  locationDisplayName: z.string(),
  screeningProgram: AirportWaitTimeProgramSchema,
  laneStatus: AirportWaitTimeLaneStatusSchema,
  displayWaitText: z.string().optional(),
  exactWaitMinutes: z.number().int().optional(),
  minWaitMinutes: z.number().int().optional(),
  maxWaitMinutes: z.number().int().optional(),
});

const AirportWaitTimePublicSourceLabelSchema = z.enum([
  "public_airport",
  "estimated_third_party",
]);

export const FaaAirportStatusSchema = z.object({
  active: z.boolean(),
  kind: z.enum(["ground_stop", "ground_delay", "closure", "none"]),
  reason: z.string().optional(),
  endsAt: z.string().optional(),
  timeZone: z.string().optional(),
});

export const HeldFlightSchema = z.object({
  flight: z.string(),
  airline: z.string(),
  scheduledTime: z.string(),
  status: z.string(),
  direction: z.enum(["departure", "arrival"]).optional(),
});

export const AirportWaitTimeSnapshotSchema = z.object({
  fetchStatus: z.enum([
    "available",
    "guidance_only",
    "unparsed",
    "blocked",
    "redirected",
    "error",
  ]),
  observedAt: z.string(),
  fetchedAt: z.string(),
  refreshIntervalMinutes: z.number().int(),
  sourceLabel: AirportWaitTimePublicSourceLabelSchema.optional(),
  observations: z.array(AirportWaitTimeObservationSchema),
  exactWaitMinutes: z.number().int().optional(),
  minWaitMinutes: z.number().int().optional(),
  maxWaitMinutes: z.number().int().optional(),
  faaStatus: FaaAirportStatusSchema.optional(),
  heldFlights: z.array(HeldFlightSchema).optional(),
});

export const AirportWaitTimePublicAirportSchema = z.object({
  airportCode: z.string().length(3),
  airportName: z.string(),
  cityName: z.string(),
  regionName: z.string(),
  countryName: z.string().optional(),
  latitude: z.number(),
  longitude: z.number(),
  snapshot: AirportWaitTimeSnapshotSchema.nullable(),
  faaStatus: FaaAirportStatusSchema.optional(),
  heldFlights: z.array(HeldFlightSchema).optional(),
});

export const AirportWaitTimePublicCollectionResponseSchema = z.object({
  generatedAt: z.string(),
  refreshIntervalMinutes: z.number().int(),
  airports: z.array(AirportWaitTimePublicAirportSchema),
});

export type AirportWaitTimeObservation = z.infer<
  typeof AirportWaitTimeObservationSchema
>;
export type FaaAirportStatus = z.infer<typeof FaaAirportStatusSchema>;
export type HeldFlight = z.infer<typeof HeldFlightSchema>;
export type AirportWaitTimePublicAirport = z.infer<
  typeof AirportWaitTimePublicAirportSchema
>;
export type AirportWaitTimePublicCollectionResponse = z.infer<
  typeof AirportWaitTimePublicCollectionResponseSchema
>;
