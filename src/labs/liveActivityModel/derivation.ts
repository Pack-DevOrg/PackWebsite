// Faithful TypeScript ports of the native derivation builders:
//   TripNextEventLiveActivityStateBuilders.swift
//   TripNextEventLiveActivitySurfaceBuilders.swift
//   TripNextEventLiveActivityMetricBoxes.swift
//   TripNextEventLiveActivityFlightStateModule.swift
//   TripNextEventLiveActivityGroundStateModule.swift
//
// Every threshold, token-selection rule, and fallback matches the Swift. The
// lab consumes these to COMPUTE display tokens from a ContentState — proving
// the schema -> display logic.

import type { Action, ContentState, DetailRecord } from './contentState';
import {
  compactCountdownToken,
  compactDestinationWeather,
  compactLeadingLocation,
  compactLeadingSymbolName,
  compactTitleToken,
  delaySummary,
  detailItemValue,
  detailLabeledValue,
  driveTimingDetailText,
  formatMinutes,
  hotelCompactToken,
  activityCompactToken,
  joinStatusParts,
  parseMinutes,
  shortTimeLabel,
  splitPrimaryAndSecondaryInfo,
  trackClockLabel,
  twelveHourClockLabel,
} from './helpers';
import type {
  DynamicIslandModel,
  EmphasisColor,
  LockScreenSurfaceModel,
  MetricBox,
  MetricKind,
  StatusBarModel,
} from './viewModels';

// Native `statusBarTravelWindowMinutes` (TripNextEventLiveActivityStatusBar.swift).
const STATUS_BAR_TRAVEL_WINDOW_MINUTES = 180;

// ---------------------------------------------------------------------------
// Small numeric helpers mirroring Swift semantics.
// ---------------------------------------------------------------------------

/** Port of `clamp(_:min:max:)`. */
function clamp(value: number, min: number, max: number): number {
  const lowerBound = Math.min(min, max);
  const upperBound = Math.max(min, max);
  if (!Number.isFinite(value)) {
    return Number.isFinite(lowerBound) ? lowerBound : 0;
  }
  if (value < lowerBound) {
    return lowerBound;
  }
  if (value > upperBound) {
    return upperBound;
  }
  return value;
}

/** Seconds between two dates, mirroring Swift `Date.timeIntervalSince`. */
function secondsBetween(later: Date, earlier: Date): number {
  return (later.getTime() - earlier.getTime()) / 1000;
}

/** Whole minutes-until via `Int(ceil((target - now) / 60))`. */
function ceilMinutesUntil(target: Date, now: Date): number {
  return Math.ceil(secondsBetween(target, now) / 60);
}

function addMinutes(date: Date, minutes: number): Date {
  return new Date(date.getTime() + minutes * 60000);
}

function addSeconds(date: Date, seconds: number): Date {
  return new Date(date.getTime() + seconds * 1000);
}

// ---------------------------------------------------------------------------
// MetricBox construction mirroring the Swift initializer + MetricKind.fromTitle.
// ---------------------------------------------------------------------------

/** Port of `MetricKind.fromTitle(_:)`. */
function metricKindFromTitle(title: string): MetricKind {
  switch (title.toLowerCase()) {
    case 'leave in':
      return 'leaveIn';
    case 'lands in':
      return 'landsIn';
    case 'flight':
      return 'flight';
    case 'gate':
      return 'gate';
    case 'terminal':
      return 'terminal';
    case 'seat':
      return 'seat';
    case 'tsa':
      return 'tsa';
    case 'boarding':
      return 'boarding';
    case 'check-in':
      return 'checkIn';
    case 'hotel':
      return 'hotel';
    case 'address':
      return 'address';
    case 'venue':
      return 'venue';
    case 'arrival':
      return 'arrival';
    case 'confirmation':
      return 'confirmation';
    case 'travel':
    case 'drive':
      return 'travel';
    case 'status':
      return 'status';
    case 'baggage':
      return 'baggage';
    case 'next':
      return 'next';
    default:
      return 'unknown';
  }
}

interface MetricBoxInput {
  title: string;
  value: string;
  valueDate?: Date;
  detail?: string | null;
  emphasis: EmphasisColor;
  kind?: MetricKind;
  showsTitle?: boolean;
  valueLineLimit?: number;
  detailLineLimit?: number;
}

/** Mirrors the Swift `MetricBox.init` (kind defaults to fromTitle). */
function makeMetricBox(input: MetricBoxInput): MetricBox {
  return {
    kind: input.kind ?? metricKindFromTitle(input.title),
    title: input.title,
    value: input.value,
    valueDate: input.valueDate,
    detail: input.detail ?? undefined,
    emphasis: input.emphasis,
    showsTitle: input.showsTitle ?? true,
    valueLineLimit: input.valueLineLimit ?? 1,
    detailLineLimit: input.detailLineLimit ?? 1,
  };
}

/** Port of `metricPriority(_:)`. */
function metricPriority(kind: MetricKind): number {
  switch (kind) {
    case 'leaveIn':
      return 0;
    case 'next':
      return 1;
    case 'landsIn':
      return 2;
    case 'flight':
      return 3;
    case 'gate':
      return 4;
    case 'terminal':
      return 5;
    case 'seat':
      return 6;
    case 'tsa':
      return 7;
    case 'boarding':
      return 8;
    case 'hotel':
      return 9;
    case 'checkIn':
      return 10;
    case 'venue':
      return 11;
    case 'address':
      return 12;
    case 'arrival':
      return 13;
    case 'travel':
      return 14;
    case 'confirmation':
      return 15;
    case 'baggage':
      return 16;
    case 'status':
      return 17;
    case 'unknown':
      return 18;
    default:
      return 18;
  }
}

/**
 * Port of `prioritizeMetricBoxes(_:)`. Stable sort by priority then title.
 * JS `Array.prototype.sort` is stable (ES2019+), matching Swift's behavior here
 * since the comparator fully orders equal-priority boxes by title.
 */
function prioritizeMetricBoxes(boxes: MetricBox[]): MetricBox[] {
  return [...boxes].sort((lhs, rhs) => {
    const lhsPriority = metricPriority(lhs.kind);
    const rhsPriority = metricPriority(rhs.kind);
    if (lhsPriority !== rhsPriority) {
      return lhsPriority - rhsPriority;
    }
    if (lhs.title < rhs.title) {
      return -1;
    }
    if (lhs.title > rhs.title) {
      return 1;
    }
    return 0;
  });
}

// ---------------------------------------------------------------------------
// Route / nav-target resolution (DetailLookups + Actions)
// ---------------------------------------------------------------------------

/** Port of `airportPairFromText(_:)`. */
function airportPairFromText(
  text: string | null | undefined,
): { origin: string; destination: string } | null {
  if (text == null || text.length === 0) {
    return null;
  }
  const normalized = text.replace(/→/g, '-');
  const match = normalized.match(/([A-Z]{3})\s*[-]\s*([A-Z]{3})/);
  if (match == null) {
    return null;
  }
  return { origin: match[1], destination: match[2] };
}

/** Port of `routeAirports(...)`. */
function routeAirports(
  originAirportCode: string | null | undefined,
  destinationAirportCode: string | null | undefined,
  secondaryText: string | null | undefined,
  records: DetailRecord[],
): { origin: string; destination: string } {
  if (
    originAirportCode != null &&
    destinationAirportCode != null &&
    originAirportCode.length === 3 &&
    destinationAirportCode.length === 3
  ) {
    return {
      origin: originAirportCode.toUpperCase(),
      destination: destinationAirportCode.toUpperCase(),
    };
  }
  const from = records.find((r) => r.sourceKey.toLowerCase() === 'from')?.value;
  const to = records.find((r) => r.sourceKey.toLowerCase() === 'to')?.value;
  if (from != null && to != null && from.length === 3 && to.length === 3) {
    return { origin: from.toUpperCase(), destination: to.toUpperCase() };
  }
  const pair = airportPairFromText(secondaryText);
  if (pair != null) {
    return pair;
  }
  return { origin: 'DEP', destination: 'ARR' };
}

/** Port of `normalizedDestinationLabel(_:)` (collapse whitespace, trim). */
function normalizedDestinationLabel(value: string | null | undefined): string | null {
  if (value == null) {
    return null;
  }
  const candidate = value.replace(/\s+/g, ' ');
  return candidate.replace(/^[\s]+|[\s]+$/g, '');
}

/** Port of `destinationFromActionTitle(_:)`. */
function destinationFromActionTitle(title: string): string | null {
  const prefixes = ['uber to ', 'maps to ', 'uber ', 'maps ', 'to '];
  const lower = title.toLowerCase();
  for (const prefix of prefixes) {
    if (lower.startsWith(prefix)) {
      return normalizedDestinationLabel(title.slice(prefix.length));
    }
  }
  return null;
}

/** Port of `destinationFromActionURL(_:)`. */
function destinationFromActionURL(rawURL: string): string | null {
  let params: URLSearchParams;
  try {
    params = new URL(rawURL).searchParams;
  } catch {
    return null;
  }
  const keys = ['daddr', 'destination', 'dropoff[formatted_address]', 'dropoff[address]'];
  for (const key of keys) {
    const value = params.get(key);
    if (value != null) {
      const normalized = normalizedDestinationLabel(value);
      if (normalized != null && normalized.length > 0) {
        return normalized;
      }
    }
  }
  return null;
}

/** Port of `isCurrentNavigationAction(_:)`. */
function isCurrentNavigationAction(action: Action): boolean {
  const id = action.id.toLowerCase();
  const title = action.title.toLowerCase();
  if (id.includes('next') || id.includes('home') || id.includes('inflight')) {
    return false;
  }
  if (
    title.includes('next event') ||
    title.includes('home') ||
    title.includes('wi-fi') ||
    title.includes('airline')
  ) {
    return false;
  }
  if (id === 'primary' || id === 'maps' || id === 'uber') {
    return true;
  }
  return title.includes('map') || title.includes('uber');
}

/** Port of `hasCurrentNavigationTarget(actions:)`. */
export function hasCurrentNavigationTarget(actions: Action[]): boolean {
  for (const action of actions) {
    if (!isCurrentNavigationAction(action)) {
      continue;
    }
    if (
      destinationFromActionURL(action.url) != null ||
      destinationFromActionTitle(action.title) != null
    ) {
      return true;
    }
  }
  return false;
}

// ---------------------------------------------------------------------------
// Title resolution (LockScreenViews.liveActivityTitle)
// ---------------------------------------------------------------------------

/** Port of `liveActivityTitle(kind:fallbackTitle:records:)`. */
export function liveActivityTitle(
  kind: string,
  fallbackTitle: string,
  records: DetailRecord[],
): string {
  if (kind !== 'flight_arrival') {
    return fallbackTitle;
  }
  return detailItemValue(['flightLabel', 'flight'], records) ?? fallbackTitle;
}

// ---------------------------------------------------------------------------
// State-key routing (StateBuilders.liveActivityStateKey)
// ---------------------------------------------------------------------------

type StateKey =
  | 'flightDeparture'
  | 'flightArrival'
  | 'flightArrived'
  | 'hotelCheckIn'
  | 'activity'
  | 'generic';

function liveActivityStateKey(kind: string): StateKey {
  switch (kind) {
    case 'flight_departure':
      return 'flightDeparture';
    case 'flight_arrival':
      return 'flightArrival';
    case 'flight_arrived':
      return 'flightArrived';
    case 'hotel_checkin':
      return 'hotelCheckIn';
    case 'activity':
      return 'activity';
    default:
      return 'generic';
  }
}

// ===========================================================================
// MetricBox builders (FlightStateModule + GroundStateModule)
// ===========================================================================

function buildFlightDepartureMetricBoxes(args: {
  startAt: Date;
  detailRecords: DetailRecord[];
  originAirportCode?: string;
  destinationAirportCode?: string;
  hasCurrentNavigationTarget: boolean;
  driveMinutes?: number | null;
  tsaMinutes?: number | null;
  secondaryText?: string;
  now: Date;
}): MetricBox[] {
  const airports = routeAirports(
    args.originAirportCode,
    args.destinationAirportCode,
    args.secondaryText,
    args.detailRecords,
  );
  const terminalLabel = detailItemValue(['terminal'], args.detailRecords);
  const gateLabel = detailItemValue(['gate'], args.detailRecords);
  const seatLabel = detailItemValue(['seat'], args.detailRecords);
  const boardingLabel = detailItemValue(['boarding'], args.detailRecords);
  const destinationWeather = compactDestinationWeather(args.detailRecords);
  const boxes: MetricBox[] = [];

  // Mirror of the native change: the status slider carries the live leave-by
  // countdown + drive/TSA legend, so the first tile complements it with the
  // absolute boarding/departure times instead of a second leave countdown.
  const departsLabel = twelveHourClockLabel(args.startAt) ?? shortTimeLabel(args.startAt);
  boxes.push(
    makeMetricBox({
      title: boardingLabel != null ? 'Boards' : 'Departs',
      value: boardingLabel ?? departsLabel,
      valueDate: undefined,
      detail: boardingLabel != null ? `Departs ${departsLabel}` : null,
      emphasis: 'white',
      kind: 'boarding',
    }),
  );

  // Mirror of the native absent-data contract: no placeholders — a missing
  // field yields its tile, a half-known pair collapses to the known half.
  if (gateLabel != null || terminalLabel != null) {
    boxes.push(
      makeMetricBox({
        title:
          gateLabel != null && terminalLabel != null
            ? `Terminal ${terminalLabel}`
            : '',
        value: gateLabel != null ? `Gate ${gateLabel}` : `Terminal ${terminalLabel}`,
        detail: null,
        emphasis: 'white',
        kind: 'terminal',
        showsTitle: gateLabel != null && terminalLabel != null,
      }),
    );
  }

  const destinationLine = [airports.destination, destinationWeather]
    .filter((v): v is string => v != null && v.length > 0)
    .join(' • ');
  if (seatLabel != null) {
    boxes.push(
      makeMetricBox({
        title: '',
        value: `Seat ${seatLabel}`,
        detail: destinationLine.length === 0 ? airports.destination : destinationLine,
        emphasis: 'white',
        kind: 'seat',
        showsTitle: false,
      }),
    );
  } else if (destinationLine.length > 0) {
    boxes.push(
      makeMetricBox({
        title: '',
        value: destinationLine,
        detail: null,
        emphasis: 'white',
        kind: 'arrival',
        showsTitle: false,
      }),
    );
  }
  return boxes;
}

function buildFlightArrivalMetricBoxes(args: {
  startAt: Date;
  scheduledStartAt?: Date;
  detailRecords: DetailRecord[];
  secondaryText?: string;
}): MetricBox[] {
  const seatValue = detailItemValue(['seat'], args.detailRecords);
  const destinationWeather = compactDestinationWeather(args.detailRecords);
  const terminalLabel = detailItemValue(['terminal'], args.detailRecords);
  const gateLabel = detailItemValue(['gate'], args.detailRecords);
  const baggageClaim = detailItemValue(['baggage', 'bags'], args.detailRecords);

  // Mirror of the native absent-data contract: no "--"/"TBD" placeholders.
  const boxes: MetricBox[] = [];
  if (destinationWeather != null && destinationWeather.length > 0) {
    boxes.push(
      makeMetricBox({
        title: 'Weather',
        value: destinationWeather,
        detail: null,
        emphasis: 'white',
        kind: 'status',
      }),
    );
  }
  if (gateLabel != null || terminalLabel != null) {
    boxes.push(
      makeMetricBox({
        title:
          gateLabel != null && terminalLabel != null
            ? `Terminal ${terminalLabel}`
            : '',
        value: gateLabel != null ? `Gate ${gateLabel}` : `Terminal ${terminalLabel}`,
        detail: null,
        emphasis: 'white',
        kind: 'terminal',
        showsTitle: gateLabel != null && terminalLabel != null,
      }),
    );
  }
  const delayText =
    args.scheduledStartAt != null
      ? delaySummary(args.startAt, args.scheduledStartAt).text
      : null;
  const bottomLine = baggageClaim ?? delayText;
  if (bottomLine != null) {
    boxes.push(
      makeMetricBox({
        title: seatValue != null ? `Seat ${seatValue}` : 'Baggage',
        value: bottomLine,
        detail: null,
        emphasis: 'white',
        kind: seatValue != null ? 'seat' : 'baggage',
      }),
    );
  } else if (seatValue != null) {
    boxes.push(
      makeMetricBox({
        title: 'Seat',
        value: seatValue,
        detail: null,
        emphasis: 'white',
        kind: 'seat',
      }),
    );
  }
  return prioritizeMetricBoxes(boxes);
}

function buildFlightArrivedMetricBoxes(args: {
  detailRecords: DetailRecord[];
  driveMinutes?: number | null;
  nextUpTitle?: string;
  nextUpStartAt?: Date;
  nextUpSecondaryText?: string;
  now: Date;
}): MetricBox[] {
  const baggageValue = detailItemValue(['baggage', 'bags'], args.detailRecords);
  const weatherValue = compactDestinationWeather(args.detailRecords);
  const destinationInfo = splitPrimaryAndSecondaryInfo(args.nextUpSecondaryText);
  const cleanedNextUpTitle =
    args.nextUpTitle != null ? args.nextUpTitle.replace(/^[\s]+|[\s]+$/g, '') : null;
  const normalizedNextUpTitle = cleanedNextUpTitle?.toLowerCase();
  const shortenedSecondaryAddress =
    splitPrimaryAndSecondaryInfo(destinationInfo.secondary).primary ??
    destinationInfo.secondary;
  const isGenericDestinationTitle =
    normalizedNextUpTitle === 'hotel check-in' ||
    normalizedNextUpTitle === 'hotel' ||
    normalizedNextUpTitle === 'check-in';
  const destinationName = !isGenericDestinationTitle
    ? cleanedNextUpTitle ?? destinationInfo.primary ?? 'Hotel'
    : destinationInfo.primary ?? 'Hotel';
  const destinationDetail = !isGenericDestinationTitle
    ? destinationInfo.primary ?? shortenedSecondaryAddress ?? args.nextUpSecondaryText ?? null
    : shortenedSecondaryAddress ?? args.nextUpSecondaryText ?? null;

  // Mirror of the native absent-data contract: no "Baggage TBD" placeholder.
  const boxes: MetricBox[] = [];
  if (baggageValue != null) {
    boxes.push(
      makeMetricBox({
        title: 'Baggage',
        value: baggageValue,
        detail: null,
        emphasis: 'white',
        kind: 'baggage',
        showsTitle: true,
      }),
    );
  }

  if (args.nextUpStartAt != null) {
    boxes.push(
      makeMetricBox({
        title: 'Next in',
        value: compactCountdownToken(Math.max(0, ceilMinutesUntil(args.nextUpStartAt, args.now))),
        valueDate: args.nextUpStartAt,
        detail: destinationName,
        emphasis: 'white',
        kind: 'next',
        showsTitle: true,
        detailLineLimit: 2,
      }),
    );
  } else {
    boxes.push(
      makeMetricBox({
        title: '',
        value: destinationName,
        detail: destinationDetail,
        emphasis: 'white',
        kind: 'hotel',
        showsTitle: false,
        valueLineLimit: 2,
        detailLineLimit: 2,
      }),
    );
  }

  if (args.driveMinutes != null) {
    boxes.push(
      makeMetricBox({
        title: 'Drive',
        value: formatMinutes(Math.max(0, args.driveMinutes)),
        // The "Next in" tile already names the destination — repeating it under
        // the drive time reads as duplicate info on a three-tile row.
        detail: args.nextUpStartAt == null ? destinationName : null,
        emphasis: 'white',
        kind: 'travel',
        showsTitle: true,
      }),
    );
  }

  if (weatherValue != null && weatherValue.length > 0) {
    boxes.push(
      makeMetricBox({
        title: 'Weather',
        value: weatherValue,
        detail: null,
        emphasis: 'white',
        kind: 'status',
        showsTitle: true,
      }),
    );
  }
  return prioritizeMetricBoxes(boxes);
}

function buildHotelCheckInMetricBoxes(args: {
  currentTitle: string;
  startAt: Date;
  secondaryText?: string;
  detailRecords: DetailRecord[];
  nextUpTitle?: string;
  nextUpStartAt?: Date;
  phaseStartAt?: Date;
  now: Date;
}): MetricBox[] {
  const hotelInfo = splitPrimaryAndSecondaryInfo(args.secondaryText);
  const addressValue = detailItemValue(['address'], args.detailRecords);
  const confirmationValue = detailItemValue(['confirmation', 'conf'], args.detailRecords);
  // Mirror of the native change: the hotel NAME is already the card title, so
  // the tiles carry the live check-in countdown, the address, and the conf.
  const addressLine =
    (addressValue != null && addressValue.length > 0 ? addressValue : null) ??
    (hotelInfo.secondary != null && hotelInfo.secondary.length > 0
      ? hotelInfo.secondary
      : null);

  const isCurrentlyAtEvent =
    args.phaseStartAt != null && args.phaseStartAt <= args.now && args.startAt > args.now;
  const boxes: MetricBox[] = [];

  if (isCurrentlyAtEvent) {
    boxes.push(
      makeMetricBox({
        title: 'Remaining',
        value: compactCountdownToken(Math.max(0, ceilMinutesUntil(args.startAt, args.now))),
        valueDate: args.startAt,
        detail: null,
        emphasis: 'white',
        kind: 'leaveIn',
      }),
    );
    if (args.nextUpTitle != null && args.nextUpTitle.replace(/^[\s]+|[\s]+$/g, '').length > 0) {
      const nextUpMinutes =
        args.nextUpStartAt != null
          ? Math.max(0, ceilMinutesUntil(args.nextUpStartAt, args.now))
          : null;
      boxes.push(
        makeMetricBox({
          title: nextUpMinutes == null ? 'Next' : 'Next in',
          value:
            nextUpMinutes != null
              ? compactCountdownToken(nextUpMinutes)
              : args.nextUpTitle.replace(/^[\s]+|[\s]+$/g, ''),
          valueDate: args.nextUpStartAt,
          detail: nextUpMinutes == null ? null : args.nextUpTitle.replace(/^[\s]+|[\s]+$/g, ''),
          emphasis: 'white',
          kind: 'next',
          detailLineLimit: 2,
        }),
      );
    }
  } else {
    boxes.push(
      makeMetricBox({
        title: 'Check-in',
        value: compactCountdownToken(Math.max(0, ceilMinutesUntil(args.startAt, args.now))),
        valueDate: args.startAt,
        detail: null,
        emphasis: 'white',
        kind: 'checkIn',
      }),
    );
  }

  if (addressLine != null) {
    boxes.push(
      makeMetricBox({
        title: 'Address',
        value: addressLine,
        detail: null,
        emphasis: 'white',
        kind: 'address',
        showsTitle: true,
        valueLineLimit: 2,
      }),
    );
  }

  if (confirmationValue != null && confirmationValue.length > 0) {
    boxes.push(
      makeMetricBox({
        title: 'Conf',
        value: confirmationValue,
        detail: null,
        emphasis: 'white',
        kind: 'confirmation',
      }),
    );
  }
  return prioritizeMetricBoxes(boxes);
}

function buildActivityMetricBoxes(args: {
  startAt: Date;
  hasCurrentNavigationTarget: boolean;
  driveMinutes?: number | null;
  secondaryText?: string;
  detailRecords: DetailRecord[];
  nextUpTitle?: string;
  nextUpStartAt?: Date;
  phaseStartAt?: Date;
  now: Date;
}): MetricBox[] {
  const addressValue = detailItemValue(['address'], args.detailRecords);
  const cityValue = detailItemValue(['city'], args.detailRecords);
  const locationValue = addressValue ?? cityValue ?? args.secondaryText ?? 'Event';
  const isCurrentlyAtEvent =
    args.phaseStartAt != null && args.phaseStartAt <= args.now && args.startAt > args.now;
  const calculatedDriveMinutes = args.hasCurrentNavigationTarget ? args.driveMinutes ?? null : null;
  const activeRemainingValue = compactCountdownToken(
    Math.max(0, ceilMinutesUntil(args.startAt, args.now)),
  );
  const cleanedNextUpTitle =
    args.nextUpTitle != null ? args.nextUpTitle.replace(/^[\s]+|[\s]+$/g, '') : null;

  // Mirror of the native change: the slider trailing carries the live leave-by
  // countdown when a drive estimate exists, so the first tile is a live
  // countdown to the event itself (clock detail only when the slider trailing
  // is busy with the leave countdown).
  const boxes: MetricBox[] = [
    makeMetricBox({
      title: isCurrentlyAtEvent ? 'Remaining' : 'Starts in',
      value: activeRemainingValue,
      valueDate: args.startAt,
      detail:
        !isCurrentlyAtEvent && calculatedDriveMinutes != null
          ? twelveHourClockLabel(args.startAt)
          : null,
      emphasis: 'white',
      kind: 'leaveIn',
    }),
    makeMetricBox({
      title: '',
      value: locationValue,
      detail: null,
      emphasis: 'white',
      kind: 'address',
      showsTitle: false,
      valueLineLimit: 2,
    }),
  ];

  if (!isCurrentlyAtEvent && calculatedDriveMinutes != null) {
    // No "Drive --" placeholder tile when there's nowhere to navigate.
    boxes.push(
      makeMetricBox({
        title: 'Drive',
        value: formatMinutes(Math.max(0, calculatedDriveMinutes)),
        detail: null,
        emphasis: 'white',
        kind: 'travel',
      }),
    );
  }

  if (cleanedNextUpTitle != null && cleanedNextUpTitle.length > 0) {
    const nextUpMinutes =
      args.nextUpStartAt != null
        ? Math.max(0, ceilMinutesUntil(args.nextUpStartAt, args.now))
        : null;
    boxes.push(
      makeMetricBox({
        title: isCurrentlyAtEvent && args.nextUpStartAt != null ? 'Next in' : 'After',
        value: isCurrentlyAtEvent
          ? nextUpMinutes != null
            ? compactCountdownToken(nextUpMinutes)
            : cleanedNextUpTitle
          : cleanedNextUpTitle,
        valueDate: isCurrentlyAtEvent ? args.nextUpStartAt : undefined,
        detail: isCurrentlyAtEvent && args.nextUpStartAt != null ? cleanedNextUpTitle : null,
        emphasis: 'white',
        kind: 'next',
        detailLineLimit: 2,
      }),
    );
  }
  return prioritizeMetricBoxes(boxes);
}

function buildDefaultMetricBoxes(args: {
  startAt: Date;
  nextUpTitle?: string;
  nextUpStartAt?: Date;
  now: Date;
}): MetricBox[] {
  const isPast = args.startAt <= args.now;
  const statusTitle = isPast ? 'Happened' : 'Starts in';
  const nextValue = args.nextUpTitle != null ? args.nextUpTitle.replace(/^[\s]+|[\s]+$/g, '') : null;
  const boxes: MetricBox[] = [
    makeMetricBox({
      title: statusTitle,
      value: isPast
        ? shortTimeLabel(args.startAt)
        : compactCountdownToken(Math.max(0, ceilMinutesUntil(args.startAt, args.now))),
      valueDate: isPast ? undefined : args.startAt,
      detail: null,
      emphasis: 'white',
      kind: 'status',
      showsTitle: true,
    }),
  ];
  // No "At h:mm" tile: the status slider's trailing now shows the absolute
  // start time for a generic event (mirrors the native dedup).
  if (nextValue != null && nextValue.length > 0) {
    const nextUpMinutes =
      args.nextUpStartAt != null
        ? Math.max(0, ceilMinutesUntil(args.nextUpStartAt, args.now))
        : null;
    boxes.push(
      makeMetricBox({
        title: nextUpMinutes == null ? 'Next' : 'Next in',
        value: nextUpMinutes != null ? compactCountdownToken(nextUpMinutes) : nextValue,
        detail: nextUpMinutes == null ? null : nextValue,
        emphasis: 'white',
        kind: 'next',
        showsTitle: true,
        detailLineLimit: 2,
      }),
    );
  }
  return prioritizeMetricBoxes(boxes);
}

/**
 * Port of `buildStateMetricBoxes(...)` + `stateMetricBoxes(...)`. Computes
 * drive/TSA minutes from travel-or-records exactly like the native `content`
 * closure, derives the title, and routes per-kind.
 */
export function buildMetricBoxes(state: ContentState, now: Date): MetricBox[] {
  const primary = state.primary;
  const detailRecords = primary.details;
  const kind = primary.kind;
  const displayedTitle = liveActivityTitle(kind, primary.title, detailRecords);
  const driveMinutes =
    state.travel?.driveMinutes ?? parseMinutes(['drive', 'travel'], detailRecords) ?? null;
  const tsaMinutes =
    state.travel?.tsaMinutes ?? parseMinutes(['tsa', 'security'], detailRecords) ?? null;
  const navTarget = hasCurrentNavigationTarget(state.actions);

  switch (liveActivityStateKey(kind)) {
    case 'flightDeparture':
      return buildFlightDepartureMetricBoxes({
        startAt: primary.startAt,
        detailRecords,
        originAirportCode: primary.flight?.originAirportCode,
        destinationAirportCode: primary.flight?.destinationAirportCode,
        hasCurrentNavigationTarget: navTarget,
        driveMinutes,
        tsaMinutes,
        secondaryText: primary.secondaryText,
        now,
      });
    case 'flightArrival':
      return buildFlightArrivalMetricBoxes({
        startAt: primary.startAt,
        scheduledStartAt: primary.scheduledStartAt,
        detailRecords,
        secondaryText: primary.secondaryText,
      });
    case 'flightArrived':
      return buildFlightArrivedMetricBoxes({
        detailRecords,
        driveMinutes,
        nextUpTitle: state.next?.title,
        nextUpStartAt: state.next?.startAt,
        nextUpSecondaryText: state.next?.secondaryText,
        now,
      });
    case 'hotelCheckIn':
      return buildHotelCheckInMetricBoxes({
        currentTitle: displayedTitle,
        startAt: primary.startAt,
        secondaryText: primary.secondaryText,
        detailRecords,
        nextUpTitle: state.next?.title,
        nextUpStartAt: state.next?.startAt,
        phaseStartAt: state.phaseStartAt,
        now,
      });
    case 'activity':
      return buildActivityMetricBoxes({
        startAt: primary.startAt,
        hasCurrentNavigationTarget: navTarget,
        driveMinutes,
        secondaryText: primary.secondaryText,
        detailRecords,
        nextUpTitle: state.next?.title,
        nextUpStartAt: state.next?.startAt,
        phaseStartAt: state.phaseStartAt,
        now,
      });
    case 'generic':
    default:
      return buildDefaultMetricBoxes({
        startAt: primary.startAt,
        nextUpTitle: state.next?.title,
        nextUpStartAt: state.next?.startAt,
        now,
      });
  }
}

// ===========================================================================
// StatusBar builders (FlightStateModule + GroundStateModule)
// ===========================================================================

function buildFlightDepartureStatusBarModel(args: {
  startAt: Date;
  hasCurrentNavigationTarget: boolean;
  driveMinutes?: number | null;
  tsaMinutes?: number | null;
  now: Date;
}): StatusBarModel {
  const departureTimeLabel = twelveHourClockLabel(args.startAt) ?? shortTimeLabel(args.startAt);
  const minutesUntilDeparture = Math.max(0, ceilMinutesUntil(args.startAt, args.now));

  if (!args.hasCurrentNavigationTarget || args.driveMinutes == null) {
    return {
      mode: 'duration',
      leadingText: undefined,
      countdownToken: compactCountdownToken(minutesUntilDeparture),
      countdownCaption: '',
      progressFraction: 0,
      reservedFraction: 0,
      markerFraction: 0,
      startLabel: undefined,
      endLabel: departureTimeLabel,
      detailText: driveTimingDetailText(args.driveMinutes, args.tsaMinutes) ?? undefined,
      countdownEmphasis: 'white',
      progressColor: undefined,
      usesEndpointLabelStyleForEndText: true,
      countdownTargetAt: undefined,
      trackStartAt: undefined,
      warningStartAt: undefined,
      trackEndAt: undefined,
    };
  }

  const safeDriveMinutes = Math.max(0, args.driveMinutes);
  const safeTsaMinutes = Math.max(0, args.tsaMinutes ?? 10);
  const fixedTravelWindowMinutes = STATUS_BAR_TRAVEL_WINDOW_MINUTES;
  // drive + TSA + 30m boarding buffer — mirrors the native FLIGHT leave-by
  // model (arrive by boarding, not by scheduled departure). Flights only:
  // the ground/event branch has no buffer.
  const requiredMinutes = Math.max(1, safeDriveMinutes + safeTsaMinutes + 30);
  const leaveByAt = addMinutes(args.startAt, -requiredMinutes);
  const minutesUntilLeave = ceilMinutesUntil(leaveByAt, args.now);
  const reservedWindowMinutes = Math.min(requiredMinutes, fixedTravelWindowMinutes);
  const activeWindowMinutes = Math.max(1, fixedTravelWindowMinutes - reservedWindowMinutes);
  const trackStartAt = addMinutes(leaveByAt, -activeWindowMinutes);
  const trackEndAt = args.startAt;
  const reservedFraction = clamp(reservedWindowMinutes / fixedTravelWindowMinutes, 0, 1);
  const progressCutoff = args.now < leaveByAt ? args.now : leaveByAt;
  const elapsedFraction = clamp(
    secondsBetween(progressCutoff, trackStartAt) / (fixedTravelWindowMinutes * 60),
    0,
    1 - reservedFraction,
  );
  const lateFraction =
    minutesUntilLeave < 0
      ? clamp(Math.abs(minutesUntilLeave) / Math.max(1, reservedWindowMinutes), 0, 1)
      : 0;
  const markerFraction =
    minutesUntilLeave >= 0
      ? elapsedFraction
      : clamp(1 - reservedFraction + lateFraction * reservedFraction, 0, 1);

  // Trailing = the LIVE leave-by countdown ("1h5m Leave"); the absolute times
  // live in the "Boards/Departs" tile (mirrors the native change).
  return {
    mode: 'travel',
    leadingText: undefined,
    countdownToken: compactCountdownToken(minutesUntilLeave),
    countdownCaption: 'Leave',
    progressFraction: elapsedFraction,
    reservedFraction,
    markerFraction,
    startLabel: undefined,
    endLabel: undefined,
    detailText: driveTimingDetailText(args.driveMinutes, args.tsaMinutes) ?? undefined,
    countdownEmphasis: minutesUntilLeave > 0 ? 'white' : 'danger',
    progressColor: undefined,
    usesEndpointLabelStyleForEndText: false,
    countdownTargetAt: leaveByAt,
    trackStartAt,
    warningStartAt: leaveByAt,
    trackEndAt,
  };
}

function buildFlightArrivalStatusBarModel(args: {
  startAt: Date;
  phaseStartAt?: Date;
  originAirportCode?: string;
  destinationAirportCode?: string;
  detailRecords: DetailRecord[];
  secondaryText?: string;
  now: Date;
}): StatusBarModel {
  const airports = routeAirports(
    args.originAirportCode,
    args.destinationAirportCode,
    args.secondaryText,
    args.detailRecords,
  );
  const fallbackStart = addSeconds(args.startAt, -4 * 60 * 60);
  const flightStart = args.phaseStartAt ?? fallbackStart;
  const total = Math.max(1, secondsBetween(args.startAt, flightStart));
  const elapsed = Math.max(0, secondsBetween(args.now, flightStart));
  const progress = clamp(elapsed / total, 0, 1);
  const departureTimeLabel = trackClockLabel(flightStart);
  const leadingText = joinStatusParts([airports.origin, departureTimeLabel], ' ');
  const trailingText = airports.destination;

  return {
    mode: 'duration',
    leadingText: leadingText ?? undefined,
    countdownToken: compactCountdownToken(Math.max(0, ceilMinutesUntil(args.startAt, args.now))),
    countdownCaption: 'Lands in',
    progressFraction: progress,
    reservedFraction: 0,
    markerFraction: progress,
    startLabel: undefined,
    endLabel: trailingText,
    detailText: undefined,
    countdownEmphasis: 'white',
    progressColor: undefined,
    usesEndpointLabelStyleForEndText: true,
    countdownTargetAt: args.startAt,
    trackStartAt: flightStart,
    warningStartAt: args.startAt,
    trackEndAt: args.startAt,
  };
}

function buildFlightArrivedStatusBarModel(args: {
  startAt: Date;
  originAirportCode?: string;
  destinationAirportCode?: string;
  detailRecords: DetailRecord[];
  driveMinutes?: number | null;
  secondaryText?: string;
}): StatusBarModel {
  const airports = routeAirports(
    args.originAirportCode,
    args.destinationAirportCode,
    args.secondaryText,
    args.detailRecords,
  );
  const baggageRaw = detailItemValue(['baggage', 'claim'], args.detailRecords);
  const bagPart =
    baggageRaw != null
      ? (() => {
          const stripped = baggageRaw
            .replace(/^claim\s*:?\s*/i, '')
            .replace(/^[\s]+|[\s]+$/g, '');
          return `Bag ${stripped.length === 0 ? baggageRaw : stripped}`;
        })()
      : null;
  const terminalPart = detailItemValue(['terminal'], args.detailRecords);

  return {
    mode: 'duration',
    leadingText:
      joinStatusParts([bagPart, terminalPart != null ? `T${terminalPart}` : null]) ?? undefined,
    countdownToken: 'Now',
    countdownCaption: 'Landed',
    progressFraction: 1,
    reservedFraction: 0,
    markerFraction: 1,
    startLabel: undefined,
    endLabel: airports.destination,
    detailText: driveTimingDetailText(args.driveMinutes) ?? undefined,
    countdownEmphasis: 'success',
    progressColor: 'success',
    usesEndpointLabelStyleForEndText: false,
    countdownTargetAt: undefined,
    trackStartAt: addSeconds(args.startAt, -1),
    warningStartAt: args.startAt,
    trackEndAt: args.startAt,
  };
}

function buildTravelEventStatusBarModel(args: {
  startAt: Date;
  hasCurrentNavigationTarget: boolean;
  phaseStartAt?: Date;
  driveMinutes?: number | null;
  fallbackCaption: string;
  now: Date;
}): StatusBarModel | null {
  const isHotelCheckIn = args.fallbackCaption === 'Check-in';
  const isStartCountdown = args.fallbackCaption === 'Start';
  const usesFixedEventTimeEndpoint = isHotelCheckIn || isStartCountdown;
  const isCurrentlyAtEvent =
    args.phaseStartAt != null && args.phaseStartAt <= args.now && args.startAt > args.now;
  const detailText = driveTimingDetailText(
    args.hasCurrentNavigationTarget ? args.driveMinutes : null,
    null,
  );

  if (isCurrentlyAtEvent && args.phaseStartAt != null) {
    const progressFraction = clamp(
      secondsBetween(args.now, args.phaseStartAt) /
        Math.max(1, secondsBetween(args.startAt, args.phaseStartAt)),
      0,
      1,
    );
    return {
      mode: 'duration',
      leadingText: undefined,
      countdownToken: compactCountdownToken(ceilMinutesUntil(args.startAt, args.now)),
      countdownCaption: 'Remaining',
      progressFraction,
      reservedFraction: 0,
      markerFraction: progressFraction,
      startLabel: undefined,
      // Mirrors the native change: during a LIVE event the trailing time is
      // the endpoint, and the copy says so ("Ends 9:31 PM").
      endLabel: twelveHourClockLabel(args.startAt) != null
        ? `Ends ${twelveHourClockLabel(args.startAt)}`
        : undefined,
      detailText: undefined,
      countdownEmphasis: 'white',
      progressColor: undefined,
      usesEndpointLabelStyleForEndText: true,
      countdownTargetAt: args.startAt,
      trackStartAt: args.phaseStartAt,
      warningStartAt: undefined,
      trackEndAt: args.startAt,
    };
  }

  if (!args.hasCurrentNavigationTarget || args.driveMinutes == null) {
    const minutesUntilStart = ceilMinutesUntil(args.startAt, args.now);
    const eventTimeLabel = twelveHourClockLabel(args.startAt);
    const countdownTrackStartAt = usesFixedEventTimeEndpoint
      ? addSeconds(args.startAt, -3 * 60 * 60)
      : null;
    const countdownProgressFraction =
      countdownTrackStartAt != null
        ? clamp(
            secondsBetween(args.now < args.startAt ? args.now : args.startAt, countdownTrackStartAt) /
              Math.max(1, secondsBetween(args.startAt, countdownTrackStartAt)),
            0,
            1,
          )
        : 0;
    return {
      mode: 'duration',
      leadingText: undefined,
      countdownToken: compactCountdownToken(minutesUntilStart),
      countdownCaption: args.fallbackCaption,
      progressFraction: countdownProgressFraction,
      reservedFraction: 0,
      markerFraction: countdownProgressFraction,
      startLabel: usesFixedEventTimeEndpoint ? undefined : eventTimeLabel ?? undefined,
      endLabel: usesFixedEventTimeEndpoint ? eventTimeLabel ?? undefined : undefined,
      detailText: detailText ?? undefined,
      countdownEmphasis: isHotelCheckIn ? 'accent' : 'white',
      progressColor: isHotelCheckIn ? 'accent' : undefined,
      usesEndpointLabelStyleForEndText: usesFixedEventTimeEndpoint,
      countdownTargetAt: args.startAt,
      trackStartAt: countdownTrackStartAt ?? undefined,
      warningStartAt: undefined,
      trackEndAt: usesFixedEventTimeEndpoint ? args.startAt : undefined,
    };
  }

  if (isHotelCheckIn) {
    const minutesUntilStart = ceilMinutesUntil(args.startAt, args.now);
    const trackStartAt = addMinutes(args.startAt, -Math.max(1, args.driveMinutes));
    const progressCutoff = args.now < args.startAt ? args.now : args.startAt;
    const progressFraction = clamp(
      secondsBetween(progressCutoff, trackStartAt) /
        Math.max(1, secondsBetween(args.startAt, trackStartAt)),
      0,
      1,
    );
    return {
      mode: 'duration',
      leadingText: undefined,
      countdownToken: compactCountdownToken(minutesUntilStart),
      countdownCaption: args.fallbackCaption,
      progressFraction,
      reservedFraction: 0,
      markerFraction: progressFraction,
      startLabel: undefined,
      endLabel: twelveHourClockLabel(args.startAt) ?? undefined,
      detailText: detailText ?? undefined,
      countdownEmphasis: 'white',
      progressColor: undefined,
      usesEndpointLabelStyleForEndText: true,
      countdownTargetAt: args.startAt,
      trackStartAt,
      warningStartAt: args.startAt,
      trackEndAt: args.startAt,
    };
  }

  const requiredMinutes = Math.max(1, Math.max(0, args.driveMinutes));
  const leaveByAt = addMinutes(args.startAt, -requiredMinutes);
  const fixedTravelWindowMinutes = STATUS_BAR_TRAVEL_WINDOW_MINUTES;
  const reservedWindowMinutes = Math.min(requiredMinutes, fixedTravelWindowMinutes);
  const activeWindowMinutes = Math.max(1, fixedTravelWindowMinutes - reservedWindowMinutes);
  const trackStartAt = addMinutes(leaveByAt, -activeWindowMinutes);
  const minutesUntilLeave = ceilMinutesUntil(leaveByAt, args.now);
  const reservedFraction = clamp(reservedWindowMinutes / fixedTravelWindowMinutes, 0, 1);
  const elapsedFraction = clamp(
    secondsBetween(args.now, trackStartAt) / (fixedTravelWindowMinutes * 60),
    0,
    1 - reservedFraction,
  );
  const lateFraction =
    minutesUntilLeave < 0
      ? clamp(Math.abs(minutesUntilLeave) / Math.max(1, reservedWindowMinutes), 0, 1)
      : 0;
  const markerFraction =
    minutesUntilLeave >= 0
      ? elapsedFraction
      : clamp(1 - reservedFraction + lateFraction * reservedFraction, 0, 1);

  // Trailing = the LIVE leave-by countdown ("1h2m Leave"); the absolute start
  // time lives in the "Starts in" tile's detail (mirrors the native change).
  return {
    mode: 'travel',
    leadingText: undefined,
    countdownToken: compactCountdownToken(minutesUntilLeave),
    countdownCaption: 'Leave',
    progressFraction: elapsedFraction,
    reservedFraction,
    markerFraction,
    startLabel: undefined,
    endLabel: undefined,
    detailText: detailText ?? undefined,
    countdownEmphasis: minutesUntilLeave > 0 ? 'white' : 'danger',
    progressColor: undefined,
    usesEndpointLabelStyleForEndText: false,
    countdownTargetAt: leaveByAt,
    trackStartAt,
    warningStartAt: leaveByAt,
    trackEndAt: args.startAt,
  };
}

function buildDefaultStatusBarModel(args: { startAt: Date; now: Date }): StatusBarModel {
  const minutesUntilStart = Math.max(0, ceilMinutesUntil(args.startAt, args.now));
  const countdownTrackStartAt = addSeconds(args.startAt, -3 * 60 * 60);
  const boundedNow = args.now < countdownTrackStartAt ? countdownTrackStartAt : args.now;
  const progressCutoff = boundedNow < args.startAt ? boundedNow : args.startAt;
  const progressFraction = clamp(
    secondsBetween(progressCutoff, countdownTrackStartAt) /
      Math.max(1, secondsBetween(args.startAt, countdownTrackStartAt)),
    0,
    1,
  );
  // Trailing = the absolute start time (endpoint style); the live countdown
  // lives in the "Starts in" tile (mirrors the native dedup).
  return {
    mode: 'duration',
    leadingText: undefined,
    countdownToken: compactCountdownToken(minutesUntilStart),
    countdownCaption: 'Start',
    progressFraction,
    reservedFraction: 0,
    markerFraction: progressFraction,
    startLabel: undefined,
    endLabel: twelveHourClockLabel(args.startAt) ?? undefined,
    detailText: undefined,
    countdownEmphasis: 'white',
    progressColor: undefined,
    usesEndpointLabelStyleForEndText: true,
    countdownTargetAt: args.startAt,
    trackStartAt: countdownTrackStartAt,
    warningStartAt: undefined,
    trackEndAt: args.startAt,
  };
}

/** Port of `buildLiveStatusBarModel(...)` (routes per-kind). */
function buildLiveStatusBarModel(state: ContentState, now: Date): StatusBarModel | null {
  const primary = state.primary;
  const detailRecords = primary.details;
  const kind = primary.kind;
  const driveMinutes =
    state.travel?.driveMinutes ?? parseMinutes(['drive', 'travel'], detailRecords) ?? null;
  const tsaMinutes =
    state.travel?.tsaMinutes ?? parseMinutes(['tsa', 'security'], detailRecords) ?? null;
  const navTarget = hasCurrentNavigationTarget(state.actions);

  switch (liveActivityStateKey(kind)) {
    case 'flightDeparture':
      return buildFlightDepartureStatusBarModel({
        startAt: primary.startAt,
        hasCurrentNavigationTarget: navTarget,
        driveMinutes,
        tsaMinutes,
        now,
      });
    case 'flightArrival':
      return buildFlightArrivalStatusBarModel({
        startAt: primary.startAt,
        phaseStartAt: state.phaseStartAt,
        originAirportCode: primary.flight?.originAirportCode,
        destinationAirportCode: primary.flight?.destinationAirportCode,
        detailRecords,
        secondaryText: primary.secondaryText,
        now,
      });
    case 'flightArrived':
      return buildFlightArrivedStatusBarModel({
        startAt: primary.startAt,
        originAirportCode: primary.flight?.originAirportCode,
        destinationAirportCode: primary.flight?.destinationAirportCode,
        detailRecords,
        driveMinutes,
        secondaryText: primary.secondaryText,
      });
    case 'hotelCheckIn':
      return buildTravelEventStatusBarModel({
        startAt: primary.startAt,
        hasCurrentNavigationTarget: navTarget,
        phaseStartAt: state.phaseStartAt,
        driveMinutes,
        fallbackCaption: 'Check-in',
        now,
      });
    case 'activity':
      return buildTravelEventStatusBarModel({
        startAt: primary.startAt,
        hasCurrentNavigationTarget: navTarget,
        phaseStartAt: state.phaseStartAt,
        driveMinutes,
        fallbackCaption: 'Start',
        now,
      });
    case 'generic':
    default:
      return buildDefaultStatusBarModel({ startAt: primary.startAt, now });
  }
}

// ===========================================================================
// Leave-by overrides (StateBuilders)
// ===========================================================================

function isLeaveByCountdownActive(leaveByAt: Date | undefined, now: Date): boolean {
  if (leaveByAt == null) {
    return false;
  }
  return leaveByAt > now;
}

/** Port of `statusBarModelApplyingLeaveBy(_:leaveByAt:now:)`. */
export function applyLeaveByToStatusBar(
  model: StatusBarModel | null,
  leaveByAt: Date | undefined,
  now: Date,
): StatusBarModel | null {
  if (model == null || !isLeaveByCountdownActive(leaveByAt, now) || leaveByAt == null) {
    return model;
  }
  return {
    mode: model.mode,
    leadingText: model.leadingText,
    countdownToken: model.countdownToken,
    countdownCaption: 'Leave',
    progressFraction: model.progressFraction,
    reservedFraction: model.reservedFraction,
    markerFraction: model.markerFraction,
    startLabel: model.startLabel,
    endLabel: undefined,
    detailText: model.detailText,
    countdownEmphasis: model.countdownEmphasis,
    progressColor: model.progressColor,
    usesEndpointLabelStyleForEndText: false,
    countdownTargetAt: leaveByAt,
    trackStartAt: model.trackStartAt,
    warningStartAt: model.warningStartAt,
    trackEndAt: model.trackEndAt,
  };
}

/** Port of `islandModelApplyingLeaveBy(_:leaveByAt:now:)`. */
export function applyLeaveByToIsland(
  model: DynamicIslandModel,
  leaveByAt: Date | undefined,
  now: Date,
): DynamicIslandModel {
  if (!isLeaveByCountdownActive(leaveByAt, now) || leaveByAt == null) {
    return model;
  }
  return {
    expandedLeadingText: model.expandedLeadingText,
    expandedText: model.expandedText,
    expandedTrailingText: undefined,
    compactLeadingSymbolName: model.compactLeadingSymbolName,
    compactTrailingText: model.compactTrailingText,
    minimalSymbolName: undefined,
    minimalText: undefined,
    showsCountdown: true,
    countdownTargetAt: leaveByAt,
  };
}

// ===========================================================================
// Dynamic Island surface builder (SurfaceBuilders.buildDynamicIslandSurfaceModel)
// ===========================================================================

function buildDynamicIslandSurfaceModel(args: {
  kind: string;
  currentTitle: string;
  startAt: Date;
  driveMinutes?: number | null;
  detailRecords: DetailRecord[];
  secondaryText?: string;
  nextUpStartAt?: Date;
  boardingAt?: Date;
}): DynamicIslandModel {
  const compactSymbol = compactLeadingSymbolName(args.kind);
  switch (args.kind) {
    case 'flight_departure': {
      // Prefer the structured content-state boarding instant; the constant is
      // only the legacy fallback for states that predate flight.boardingAt.
      const boardingTargetAt = args.boardingAt ?? addMinutes(args.startAt, -30);
      const gate = detailItemValue(['gate'], args.detailRecords);
      const terminal = detailItemValue(['terminal'], args.detailRecords);
      const seat = detailItemValue(['seat'], args.detailRecords);
      const gateOrTerminal = gate ?? (terminal != null ? `T${terminal}` : null);
      // Mirrors the native fallback chain: gate/terminal, then the seat, then
      // EMPTY — never a mangled title word in the pill.
      return {
        expandedLeadingText: gateOrTerminal ?? seat ?? undefined,
        expandedText: undefined,
        expandedTrailingText: undefined,
        compactLeadingSymbolName: compactSymbol,
        compactTrailingText: gateOrTerminal ?? seat ?? undefined,
        minimalSymbolName: undefined,
        minimalText: undefined,
        showsCountdown: true,
        countdownTargetAt: boardingTargetAt,
      };
    }
    case 'flight_arrival': {
      const seatText = detailItemValue(['seat'], args.detailRecords);
      const arrivalGate = detailItemValue(['gate'], args.detailRecords);
      const arrivalTerminal = detailItemValue(['terminal'], args.detailRecords);
      const arrivalGateOrTerminal =
        arrivalGate ?? (arrivalTerminal != null ? `T${arrivalTerminal}` : null);
      // Mirrors the native fallback chain: seat, then arrival gate/terminal,
      // then EMPTY — never a mangled title word in the pill.
      return {
        expandedLeadingText: undefined,
        expandedText: undefined,
        expandedTrailingText: seatText ?? undefined,
        compactLeadingSymbolName: compactSymbol,
        compactTrailingText: seatText ?? arrivalGateOrTerminal ?? undefined,
        minimalSymbolName: undefined,
        minimalText: undefined,
        showsCountdown: true,
        countdownTargetAt: args.startAt,
      };
    }
    case 'flight_arrived': {
      const minimalClaim = detailLabeledValue(['baggage', 'bags'], args.detailRecords);
      const carousel = detailItemValue(['baggage', 'bags'], args.detailRecords);
      const weather = compactDestinationWeather(args.detailRecords);
      const fallbackLocation = compactLeadingLocation(args.secondaryText);
      const expandedLeading = minimalClaim ?? weather;
      const fallbackArrivalToken = minimalClaim ?? weather ?? fallbackLocation ?? 'Landed';
      const arrivedTrailingText = carousel ?? weather ?? 'Landed';
      const countdownTargetAt = args.nextUpStartAt ?? null;
      return {
        expandedLeadingText: expandedLeading ?? undefined,
        expandedText: undefined,
        expandedTrailingText:
          countdownTargetAt == null ? (weather ?? fallbackLocation ?? undefined) : undefined,
        compactLeadingSymbolName: compactSymbol,
        compactTrailingText: arrivedTrailingText,
        minimalSymbolName: 'plane-landing',
        minimalText: countdownTargetAt == null ? fallbackArrivalToken : undefined,
        showsCountdown: countdownTargetAt != null,
        countdownTargetAt: countdownTargetAt ?? undefined,
      };
    }
    case 'hotel_checkin': {
      const leaveByTargetAt =
        args.driveMinutes != null
          ? addMinutes(args.startAt, -Math.max(1, args.driveMinutes))
          : null;
      const countdownTargetAt = args.nextUpStartAt ?? leaveByTargetAt ?? args.startAt;
      return {
        expandedLeadingText: hotelCompactToken(args.currentTitle) ?? undefined,
        expandedText: undefined,
        expandedTrailingText: undefined,
        compactLeadingSymbolName: compactSymbol,
        compactTrailingText: hotelCompactToken(args.currentTitle) ?? undefined,
        minimalSymbolName: undefined,
        minimalText: undefined,
        showsCountdown: true,
        countdownTargetAt,
      };
    }
    case 'activity': {
      const leaveByTargetAt =
        args.driveMinutes != null
          ? addMinutes(args.startAt, -Math.max(1, args.driveMinutes))
          : null;
      const countdownTargetAt = args.nextUpStartAt ?? leaveByTargetAt ?? args.startAt;
      return {
        expandedLeadingText: activityCompactToken(args.currentTitle) ?? undefined,
        expandedText: undefined,
        expandedTrailingText: undefined,
        compactLeadingSymbolName: compactSymbol,
        compactTrailingText: activityCompactToken(args.currentTitle) ?? undefined,
        minimalSymbolName: undefined,
        minimalText: undefined,
        showsCountdown: true,
        countdownTargetAt,
      };
    }
    default:
      return {
        expandedLeadingText: undefined,
        expandedText: undefined,
        expandedTrailingText: undefined,
        compactLeadingSymbolName: compactSymbol,
        compactTrailingText: undefined,
        minimalSymbolName: undefined,
        minimalText: undefined,
        showsCountdown: true,
        countdownTargetAt: args.startAt,
      };
  }
}

/**
 * Port of the native `islandModelApplyingLeaveBy(buildDynamicIslandSurfaceModel(...))`
 * composition. Computes drive minutes from travel-or-records like the renderer.
 */
export function buildDynamicIslandModel(state: ContentState, now: Date): DynamicIslandModel {
  const primary = state.primary;
  const detailRecords = primary.details;
  const displayedTitle = liveActivityTitle(primary.kind, primary.title, detailRecords);
  const driveMinutes =
    state.travel?.driveMinutes ?? parseMinutes(['drive', 'travel'], detailRecords) ?? null;
  const base = buildDynamicIslandSurfaceModel({
    kind: primary.kind,
    currentTitle: displayedTitle,
    startAt: primary.startAt,
    driveMinutes,
    detailRecords,
    secondaryText: primary.secondaryText,
    nextUpStartAt: state.next?.startAt,
    boardingAt: primary.flight?.boardingAt,
  });
  return applyLeaveByToIsland(base, state.travel?.leaveByAt, now);
}

/**
 * Port of the native `statusBarModelApplyingLeaveBy(liveStatusBarModel(...))`
 * composition.
 */
export function buildStatusBarModel(state: ContentState, now: Date): StatusBarModel | null {
  const base = buildLiveStatusBarModel(state, now);
  return applyLeaveByToStatusBar(base, state.travel?.leaveByAt, now);
}

// ===========================================================================
// Lock-screen surface builder (SurfaceBuilders.buildLockScreenSurfaceModel)
// ===========================================================================

/** Port of `buildLockScreenSurfaceModel(kind:isPast:hasNextUp:)`. */
export function buildLockScreenSurfaceModel(
  kind: string,
  isPast: boolean,
  hasNextUp: boolean,
): LockScreenSurfaceModel {
  if (kind === 'flight_departure') {
    return {
      fullMetricLimit: 3,
      midMetricLimit: 2,
      compactMetricLimit: 2,
      showNextInFull: false,
      showNextInMid: false,
      showStatusBarInCompact: !isPast,
      compactTitleLineLimit: 1,
    };
  }
  if (kind === 'activity' && hasNextUp) {
    return {
      fullMetricLimit: 3,
      midMetricLimit: 2,
      compactMetricLimit: 2,
      showNextInFull: false,
      showNextInMid: false,
      showStatusBarInCompact: !isPast,
      compactTitleLineLimit: 1,
    };
  }
  return {
    fullMetricLimit: 3,
    midMetricLimit: 2,
    compactMetricLimit: 1,
    showNextInFull: false,
    showNextInMid: false,
    showStatusBarInCompact: !isPast,
    compactTitleLineLimit: 1,
  };
}

/**
 * Convenience entry point mirroring the renderer's lock-screen wiring: computes
 * isPast/hasNextUp from the state and the supplied `now`.
 */
export function buildLockScreenSurfaceModelFor(
  state: ContentState,
  now: Date,
): LockScreenSurfaceModel {
  const isPast = state.primary.startAt <= now;
  const hasNextUp = (state.next?.title ?? '').length > 0;
  return buildLockScreenSurfaceModel(state.primary.kind, isPast, hasNextUp);
}
