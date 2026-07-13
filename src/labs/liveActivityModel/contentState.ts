// TypeScript mirror of the canonical Live Activity content-state schema
// (`PackServer/packages/schemas/src/notifications.ts` ->
// LiveActivityContentStateSchema) and the native Swift structs in
// `TripNextEventAttributes.swift`. The lab does Date math, so datetime fields
// are modeled as `Date` (not the ISO strings the wire schema carries).
//
// These are plain TS types — the lab is not wired to zod. Keep the shapes
// faithful to the schema so the ported derivation logic reads the same keys
// the native renderer does.

// Mirrors LiveActivityEventKindSchema. Older/generated payloads can still carry
// legacy strings such as `calendar_event`, which fall through to the default
// builders, so the union is widened to a plain string to stay faithful.
export type EventKind =
  | 'generic'
  | 'flight_departure'
  | 'flight_arrival'
  | 'flight_arrived'
  | 'hotel_checkin'
  | 'activity'
  | 'calendar_event'
  | (string & {});

export type DetailValueKind = 'text' | 'phone' | 'email' | 'url';

// Mirrors LiveActivityDetailRecordSchema. The widget looks values up by stable
// `sourceKey` (e.g. "gate", "seat", "terminal", "baggage_claim", "weather"); the
// `label`/`value` pair carries the display pieces.
export interface DetailRecord {
  sourceKey: string;
  label: string;
  value: string;
  valueKind?: DetailValueKind;
}

// Mirrors LiveActivityFlightInfoSchema. Present only for flight_* stops.
export interface FlightInfo {
  originAirportCode: string;
  destinationAirportCode: string;
  airlineName?: string;
  // Structured boarding instant driving the "Boards in" countdown; producers
  // stamp real boarding time when plausible, else departure − 35m.
  boardingAt?: Date;
  // Structured scheduled/estimated arrival instant; lets native synthesize the
  // in-flight phase card pre-takeoff. Producers stamp a real arrival datetime
  // when one exists, else forward clock-delta from departure.
  arrivalAt?: Date;
}

// Mirrors LiveActivityActionSchema.
export interface Action {
  id: string;
  title: string;
  url: string;
  appUrl?: string;
  subtitle?: string;
  icon?: string;
  style?: 'primary' | 'secondary';
}

// Mirrors LiveActivityEventStopSchema. One self-similar shape describes both the
// focused `primary` stop and the `next` peek.
export interface EventStop {
  kind: EventKind;
  title: string;
  startAt: Date;
  scheduledStartAt?: Date;
  secondaryText?: string;
  navigationAddress?: string;
  details: DetailRecord[];
  flight?: FlightInfo;
}

// Mirrors LiveActivityTravelSchema. Logistics for reaching `primary`.
export interface Travel {
  driveMinutes?: number;
  tsaMinutes?: number;
  // Client-stamped "leave-by" moment; the widget renders a self-counting
  // countdown to it.
  leaveByAt?: Date;
}

// Mirrors LiveActivityContentStateSchema.
export interface ContentState {
  primary: EventStop;
  next?: EventStop;
  // Trip-rail pager window: ordered future stops after `primary` (max 3);
  // upcoming[0] is normally the same stop as `next`. The native pager walks
  // [primary's flight phases] + upcoming.
  upcoming?: EventStop[];
  travel?: Travel;
  phaseStartAt?: Date;
  // Manually-focused pager position (absolute index into the synthesized card
  // sequence); absent = follow the live/auto card. Mutated in place by the
  // native prev/next intents; the server never emits it.
  pagerFocus?: number;
  actions: Action[];
  // The AT-AIRPORT rail card's action set (terminal amenities + terminal map),
  // carried alongside `actions` on flight_departure payloads; the widget swaps
  // it in when the at-airport card is focused and falls back to `actions`.
  airportActions?: Action[];
}
