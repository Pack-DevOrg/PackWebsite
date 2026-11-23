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

const AirportWaitTimeSnapshotSchema = z.object({
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
  countryCode: z.string().length(2).optional(),
  countryName: z.string().optional(),
  officialUrl: z.string().url().optional(),
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

const CLOSED_WAIT_SENTINEL_TOKENS: ReadonlySet<string> = new Set([
  "closed",
  "closure",
  "temporarily closed",
  "out of hours",
  "non-operating hours",
]);

const UNAVAILABLE_WAIT_SENTINEL_TOKENS: ReadonlySet<string> = new Set([
  "",
  "-",
  "--",
  "---",
  "do not show",
  "dont show",
  "don't show",
  "hide",
  "hidden",
  "n/a",
  "na",
  "none",
  "null",
  "undefined",
  "unavailable",
  "unavailable, service update",
  "wait time unavailable",
  "not available",
  "not available right now",
  "not currently available",
  "unknown",
  "no data",
  "tbd",
  "open",
]);

const SUB_MINUTE_WAIT_TOKENS: ReadonlySet<string> = new Set([
  "less than a min",
  "less than a min.",
  "less than a minute",
  "less than a minute.",
  "under 1 min",
  "under 1 min.",
  "under 1 minute",
  "under 1 minute.",
]);

const MINUTE_UNIT_TOKENS: ReadonlySet<string> = new Set([
  "",
  "m",
  "min",
  "min.",
  "mins",
  "mins.",
  "minute",
  "minute.",
  "minutes",
  "minutes.",
]);

const BOUND_PREFIXES = [
  "less than ",
  "greater than ",
  "more than ",
  "under ",
  "<",
  ">",
] as const;

const RANGE_SEPARATORS = [" to ", "-", "~", "/"] as const;

function collapseAsciiSpaces(value: string): string {
  let out = "";
  let previousWasSpace = false;
  for (let index = 0; index < value.length; index += 1) {
    const ch = value[index]!;
    const isSpace = ch === " " || ch === "\t" || ch === "\n" || ch === "\r";
    if (isSpace) {
      if (!previousWasSpace && out.length > 0) {
        out += " ";
      }
      previousWasSpace = true;
    } else {
      out += ch;
      previousWasSpace = false;
    }
  }
  return out.trim();
}

function readLeadingBoundedMinutes(text: string): {
  readonly valid: boolean;
  readonly rest: string;
} {
  let end = 0;
  while (end < text.length && end < 4) {
    const code = text.charCodeAt(end);
    if (code < 48 || code > 57) {
      break;
    }
    end += 1;
  }
  if (end === 0 || end > 3) {
    return { valid: false, rest: text };
  }
  const value = Number.parseInt(text.slice(0, end), 10);
  if (!Number.isFinite(value) || value < 0 || value > 600) {
    return { valid: false, rest: text };
  }
  return { valid: true, rest: text.slice(end).trim() };
}

function stripLeadingUnitIfBeforeSeparator(rest: string): string {
  for (const separator of RANGE_SEPARATORS) {
    const idx = rest.indexOf(separator);
    if (idx > 0) {
      const candidateUnit = rest.slice(0, idx).trim();
      if (MINUTE_UNIT_TOKENS.has(candidateUnit)) {
        return rest.slice(idx);
      }
    }
  }
  return rest;
}

function isValidNumericWaitDisplayText(rawText: string): boolean {
  const collapsed = collapseAsciiSpaces(rawText).toLowerCase();
  if (collapsed.length === 0) {
    return false;
  }
  if (SUB_MINUTE_WAIT_TOKENS.has(collapsed)) {
    return true;
  }

  let cursor = collapsed;
  for (const prefix of BOUND_PREFIXES) {
    if (cursor.startsWith(prefix)) {
      cursor = cursor.slice(prefix.length).trim();
      break;
    }
  }

  const first = readLeadingBoundedMinutes(cursor);
  if (!first.valid) {
    return false;
  }

  const afterFirst = stripLeadingUnitIfBeforeSeparator(first.rest);
  for (const separator of RANGE_SEPARATORS) {
    if (afterFirst.startsWith(separator)) {
      const rhs = afterFirst.slice(separator.length).trim();
      const second = readLeadingBoundedMinutes(rhs);
      return second.valid && MINUTE_UNIT_TOKENS.has(second.rest);
    }
  }

  return MINUTE_UNIT_TOKENS.has(first.rest);
}

export function normalizeAirportWaitObservation(
  observation: AirportWaitTimeObservation,
  fetchStatus?: string,
): AirportWaitTimeObservation {
  const rawDisplay = typeof observation.displayWaitText === "string"
    ? collapseAsciiSpaces(observation.displayWaitText)
    : "";
  const lowerDisplay = rawDisplay.toLowerCase();

  if (
    observation.laneStatus === "closed" ||
    CLOSED_WAIT_SENTINEL_TOKENS.has(lowerDisplay)
  ) {
    return {
      ...observation,
      laneStatus: "closed",
      displayWaitText: "Closed",
      exactWaitMinutes: undefined,
      minWaitMinutes: undefined,
      maxWaitMinutes: undefined,
    };
  }

  if (rawDisplay.length > 0 && UNAVAILABLE_WAIT_SENTINEL_TOKENS.has(lowerDisplay)) {
    return {
      ...observation,
      laneStatus: "unavailable",
      displayWaitText: "Unavailable",
      exactWaitMinutes: undefined,
      minWaitMinutes: undefined,
      maxWaitMinutes: undefined,
    };
  }

  if (fetchStatus === "guidance_only") {
    if (rawDisplay.length > 0) {
      return {
        ...observation,
        displayWaitText: rawDisplay,
      };
    }
    return {
      ...observation,
      laneStatus: "unavailable",
      displayWaitText: "Unavailable",
    };
  }

  if (rawDisplay.length > 0) {
    if (isValidNumericWaitDisplayText(rawDisplay)) {
      return {
        ...observation,
        laneStatus: "open",
        displayWaitText: rawDisplay,
      };
    }
    return {
      ...observation,
      laneStatus: "unavailable",
      displayWaitText: "Unavailable",
      exactWaitMinutes: undefined,
      minWaitMinutes: undefined,
      maxWaitMinutes: undefined,
    };
  }

  if (typeof observation.exactWaitMinutes === "number") {
    return {
      ...observation,
      laneStatus: "open",
      displayWaitText: `${observation.exactWaitMinutes} min`,
    };
  }

  if (
    typeof observation.minWaitMinutes === "number" &&
    typeof observation.maxWaitMinutes === "number"
  ) {
    return {
      ...observation,
      laneStatus: "open",
      displayWaitText: `${observation.minWaitMinutes}-${observation.maxWaitMinutes} min`,
    };
  }

  return {
    ...observation,
    laneStatus: "unavailable",
    displayWaitText: "Unavailable",
  };
}

export function normalizeAirportWaitCollectionResponse(
  payload: AirportWaitTimePublicCollectionResponse,
): AirportWaitTimePublicCollectionResponse {
  return {
    ...payload,
    airports: payload.airports.map((airport) => {
      if (!airport.snapshot) {
        return airport;
      }
      return {
        ...airport,
        snapshot: {
          ...airport.snapshot,
          observations: airport.snapshot.observations.map((observation) =>
            normalizeAirportWaitObservation(
              observation,
              airport.snapshot?.fetchStatus,
            ),
          ),
        },
      };
    }),
  };
}
