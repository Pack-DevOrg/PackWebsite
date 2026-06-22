// Faithful TypeScript ports of the native helper functions in
// `TripNextEventLiveActivityDetailLookups.swift`,
// `TripNextEventLiveActivityFormatters.swift`, and
// `TripNextEventLiveActivityMetricBoxes.swift`. Pure functions only; logic,
// thresholds, token selection, and fallbacks match the Swift exactly.

import type { DetailRecord } from './contentState';
import type { EmphasisColor } from './viewModels';

// Mirrors the lab's IconKey union (LiveActivityLab.tsx). Declared here so the
// model layer stays self-contained; the lab imports the same identifiers.
export type IconKey =
  | 'plane-takeoff'
  | 'plane'
  | 'plane-landing'
  | 'bed'
  | 'calendar'
  | 'clock'
  | 'sparkles'
  | 'car'
  | 'building'
  | 'gate'
  | 'seat'
  | 'shield'
  | 'baggage'
  | 'map'
  | 'wifi'
  | 'next';

// ---------------------------------------------------------------------------
// String utilities mirroring Swift's trimming/whitespace semantics.
// ---------------------------------------------------------------------------

/** Swift `.trimmingCharacters(in: .whitespacesAndNewlines)`. */
function trim(value: string): string {
  return value.replace(/^[\s]+|[\s]+$/g, '');
}

function isNumberChar(ch: string): boolean {
  return ch >= '0' && ch <= '9';
}

// ---------------------------------------------------------------------------
// Detail-record lookups (TripNextEventLiveActivityDetailLookups.swift)
// ---------------------------------------------------------------------------

/**
 * Records-only lookup keyed by sourceKey (case-insensitive). Returns the matched
 * record's trimmed `value`, or null when no record matches / value is empty.
 * Port of `detailItemValue(sourceKeys:in:)`.
 */
export function detailItemValue(
  sourceKeys: string[],
  records: DetailRecord[],
): string | null {
  for (const key of sourceKeys) {
    const record = records.find(
      (r) => r.sourceKey.toLowerCase() === key.toLowerCase(),
    );
    if (record) {
      const value = trim(record.value);
      if (value.length > 0) {
        return value;
      }
    }
  }
  return null;
}

/**
 * Records-only lookup returning the "Label value" display string (e.g.
 * "Terminal 4"). Port of `detailLabeledValue(sourceKeys:in:)`.
 */
export function detailLabeledValue(
  sourceKeys: string[],
  records: DetailRecord[],
): string | null {
  for (const key of sourceKeys) {
    const record = records.find(
      (r) => r.sourceKey.toLowerCase() === key.toLowerCase(),
    );
    if (record) {
      const label = trim(record.label);
      const value = trim(record.value);
      if (value.length === 0) {
        return label.length === 0 ? null : label;
      }
      return label.length === 0 ? value : `${label} ${value}`;
    }
  }
  return null;
}

/** Port of `parseMinutes(sourceKeys:records:)`. */
export function parseMinutes(
  sourceKeys: string[],
  records: DetailRecord[],
): number | null {
  for (const key of sourceKeys) {
    const record = records.find(
      (r) => r.sourceKey.toLowerCase() === key.toLowerCase(),
    );
    if (record) {
      const digits = [...record.value].filter(isNumberChar).join('');
      if (digits.length > 0) {
        const value = parseInt(digits, 10);
        if (!Number.isNaN(value) && value >= 0) {
          return value;
        }
      }
    }
  }
  return null;
}

// ---------------------------------------------------------------------------
// Weather / location / title tokens (DetailLookups + Formatters)
// ---------------------------------------------------------------------------

/** Port of `compactDestinationWeather(records:)`. */
export function compactDestinationWeather(records: DetailRecord[]): string | null {
  const raw = detailItemValue(['weather', 'temp', 'temperature'], records);
  const cleaned = raw == null ? null : trim(raw);
  if (cleaned == null || cleaned.length === 0) {
    return null;
  }
  if (cleaned.includes('°')) {
    return cleaned;
  }
  const digits = [...cleaned].filter(isNumberChar).join('');
  if (digits.length === 0) {
    return cleaned;
  }
  return `${digits}°`;
}

/** Port of `compactLeadingLocation(_:)`. */
export function compactLeadingLocation(raw: string | null | undefined): string | null {
  if (raw == null) {
    return null;
  }
  const trimmed = trim(raw);
  if (trimmed.length === 0) {
    return null;
  }
  const firstSegment = trimmed.split(',')[0]?.trim();
  return firstSegment != null && firstSegment.length > 0 ? firstSegment : trimmed;
}

/** Port of `compactTitleToken(_:)`. */
export function compactTitleToken(raw: string | null | undefined): string | null {
  if (raw == null) {
    return null;
  }
  const trimmed = trim(raw);
  if (trimmed.length === 0) {
    return null;
  }
  // Swift splits on the separator set [",-•"].
  const primary =
    trimmed.split(/[,\-•]/)[0]?.trim() ?? trimmed;
  const words = primary.split(/\s+/).filter((w) => w.length > 0);
  if (words.length === 0) {
    return primary;
  }
  if (words.length === 1) {
    return words[0];
  }
  const last = words[words.length - 1];
  if (last.length <= 8) {
    return last;
  }
  return words.slice(0, 2).join(' ');
}

/** Port of `activityCompactToken(_:)`. */
export function activityCompactToken(raw: string | null | undefined): string | null {
  if (raw == null) {
    return null;
  }
  const trimmed = trim(raw);
  if (trimmed.length === 0) {
    return null;
  }
  const stopWords = new Set(['at', 'in', 'on', 'for', 'with', 'the', '&']);
  const words = trimmed.split(/\s+/).filter((w) => w.length > 0);
  const firstMeaningful = words.find((w) => !stopWords.has(w.toLowerCase()));
  if (firstMeaningful == null) {
    return compactTitleToken(raw);
  }
  return firstMeaningful;
}

/** Port of `hotelCompactToken(_:)`. */
export function hotelCompactToken(raw: string | null | undefined): string | null {
  if (raw == null) {
    return null;
  }
  const trimmed = trim(raw);
  if (trimmed.length === 0) {
    return null;
  }
  const words = trimmed
    .split(/\s+/)
    .map((w) => w.replace(/^[,-]+|[,-]+$/g, ''))
    .filter((w) => w.length > 0);
  const stopWords = new Set([
    'hotel', 'hotels', 'inn', 'resort', 'resorts', 'suite', 'suites', 'lodge',
    'hostel', 'by', 'at', 'the', '&',
  ]);
  const firstMeaningful = words.find((w) => !stopWords.has(w.toLowerCase()));
  if (firstMeaningful != null) {
    return firstMeaningful;
  }
  return compactTitleToken(raw);
}

/** Port of `splitPrimaryAndSecondaryInfo(_:)`. */
export function splitPrimaryAndSecondaryInfo(
  raw: string | null | undefined,
): { primary: string | null; secondary: string | null } {
  if (raw == null) {
    return { primary: null, secondary: null };
  }
  const trimmed = trim(raw);
  if (trimmed.length === 0) {
    return { primary: null, secondary: null };
  }
  // Swift split(separator: ",", maxSplits: 1) => at most two parts.
  const commaIndex = trimmed.indexOf(',');
  let primary: string | null;
  let secondary: string | null;
  if (commaIndex === -1) {
    primary = trim(trimmed);
    secondary = null;
  } else {
    primary = trim(trimmed.slice(0, commaIndex));
    secondary = trim(trimmed.slice(commaIndex + 1));
  }
  return {
    primary: primary != null && primary.length > 0 ? primary : null,
    secondary: secondary != null && secondary.length > 0 ? secondary : null,
  };
}

// ---------------------------------------------------------------------------
// Numeric / countdown formatters (Formatters.swift + MetricBoxes.swift)
// ---------------------------------------------------------------------------

/** Port of `formatMinutes(_:)`. */
export function formatMinutes(minutes: number): string {
  if (minutes <= 0) {
    return '0m';
  }
  if (minutes < 60) {
    return `${minutes}m`;
  }
  const hours = Math.floor(minutes / 60);
  const remaining = minutes % 60;
  return `${hours}h ${remaining}m`;
}

/** Port of `compactCountdownToken(minutes:)`. */
export function compactCountdownToken(minutes: number): string {
  const safeMinutes = Math.max(0, minutes);
  if (safeMinutes <= 0) {
    return 'Now';
  }
  const hours = Math.floor(safeMinutes / 60);
  const remaining = safeMinutes % 60;
  if (hours > 0) {
    return remaining === 0 ? `${hours}h` : `${hours}h${remaining}m`;
  }
  return `${safeMinutes}m`;
}

/**
 * Concise time-remaining token equivalent to the native `conciseCountdownText`
 * (which renders a live "2h 33m" / "45m" string via SwiftUI's `.units` format
 * with [.hours, .minutes], narrow width, fractional part hidden rounding down).
 * Computed statically here from (target - now).
 *
 * The native format truncates toward zero and shows both units only when the
 * hour component is non-zero; under an hour it shows just minutes. At/under zero
 * the duration offset is empty, which renders as "0m".
 */
export function conciseTimeRemaining(target: Date, now: Date): string {
  const totalMinutes = Math.floor(
    Math.max(0, target.getTime() - now.getTime()) / 60000,
  );
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  // Tight form to match the native narrow-units timer ("1h30m" / "45m"), no space.
  if (hours > 0) {
    return `${hours}h${minutes}m`;
  }
  return `${minutes}m`;
}

// ---------------------------------------------------------------------------
// Clock-label formatters (Formatters.swift)
// ---------------------------------------------------------------------------

/**
 * Port of `trackClockLabel(_:)`: 24-hour "HH:mm" (two-digit hour, am/pm omitted).
 * Uses local time to mirror the device-local SwiftUI Date.FormatStyle.
 */
export function trackClockLabel(date: Date | null | undefined): string | null {
  if (date == null) {
    return null;
  }
  const hh = String(date.getHours()).padStart(2, '0');
  const mm = String(date.getMinutes()).padStart(2, '0');
  return `${hh}:${mm}`;
}

/**
 * Port of `twelveHourClockLabel(_:)`: 12-hour "h:mm AM/PM" (default-digit hour,
 * abbreviated am/pm, two-digit minute).
 */
export function twelveHourClockLabel(date: Date | null | undefined): string | null {
  if (date == null) {
    return null;
  }
  const hours24 = date.getHours();
  const period = hours24 < 12 ? 'AM' : 'PM';
  let hour12 = hours24 % 12;
  if (hour12 === 0) {
    hour12 = 12;
  }
  const mm = String(date.getMinutes()).padStart(2, '0');
  return `${hour12}:${mm} ${period}`;
}

/**
 * Port of `startAt.formatted(date: .omitted, time: .shortened)` — short 12-hour
 * time. Matches `twelveHourClockLabel` for the lab's purposes.
 */
export function shortTimeLabel(date: Date): string {
  return twelveHourClockLabel(date) ?? '';
}

// ---------------------------------------------------------------------------
// Status-part joins (Formatters.swift)
// ---------------------------------------------------------------------------

/** Port of `joinStatusParts(_:separator:)`. */
export function joinStatusParts(
  parts: (string | null | undefined)[],
  separator = ' • ',
): string | null {
  const values = parts
    .map((value) => (value == null ? null : trim(value)))
    .filter((v): v is string => v != null && v.length > 0);
  if (values.length === 0) {
    return null;
  }
  return values.join(separator);
}

// ---------------------------------------------------------------------------
// Summaries (MetricBoxes.swift)
// ---------------------------------------------------------------------------

/** Port of `delaySummary(actual:scheduled:)`. */
export function delaySummary(
  actual: Date,
  scheduled: Date | null | undefined,
): { text: string; emphasis: EmphasisColor } {
  if (scheduled == null) {
    return { text: 'Delay TBD', emphasis: 'white' };
  }
  const minutes = Math.round((actual.getTime() - scheduled.getTime()) / 60000);
  if (minutes === 0) {
    return { text: 'Delay +0m', emphasis: 'white' };
  }
  if (minutes > 0) {
    return { text: `Delay +${minutes}m`, emphasis: 'danger' };
  }
  return { text: `Delay -${Math.abs(minutes)}m`, emphasis: 'success' };
}

/**
 * Port of `leaveTimingSummary(startAt:driveMinutes:tsaMinutes:boardingBufferMinutes:now:)`.
 * Returns the leave-in value string, the leave-by date, the drive/TSA/board
 * detail line, and the emphasis color.
 */
export function leaveTimingSummary(
  startAt: Date,
  driveMinutes: number | null | undefined,
  tsaMinutes: number | null | undefined,
  boardingBufferMinutes: number,
  now: Date,
): { value: string; valueDate: Date; detail: string; emphasis: EmphasisColor } {
  const safeDriveMinutes = Math.max(0, driveMinutes ?? 0);
  const safeTsaMinutes = Math.max(0, tsaMinutes ?? 10);
  const requiredMinutes = safeDriveMinutes + safeTsaMinutes + boardingBufferMinutes;
  const leaveByAt = new Date(startAt.getTime() - requiredMinutes * 60000);
  // Swift: Int((leaveByAt - now) / 60) truncates toward zero.
  const minutesUntilLeave = Math.trunc(
    (leaveByAt.getTime() - now.getTime()) / 60000,
  );
  const detail = `Drive ${formatMinutes(safeDriveMinutes)} • TSA ${formatMinutes(
    safeTsaMinutes,
  )} • Board ${formatMinutes(boardingBufferMinutes)}`;
  if (minutesUntilLeave >= 0) {
    const emphasis: EmphasisColor = minutesUntilLeave <= 20 ? 'warning' : 'white';
    return {
      value: `in ${formatMinutes(minutesUntilLeave)}`,
      valueDate: leaveByAt,
      detail,
      emphasis,
    };
  }
  return { value: 'Now', valueDate: leaveByAt, detail, emphasis: 'danger' };
}

/** Port of `driveTimingDetailText(driveMinutes:tsaMinutes:)`. */
export function driveTimingDetailText(
  driveMinutes: number | null | undefined,
  tsaMinutes: number | null | undefined = null,
): string | null {
  if (driveMinutes == null) {
    return null;
  }
  const driveText = `${formatMinutes(Math.max(0, driveMinutes))} Drive`;
  if (tsaMinutes == null) {
    return driveText;
  }
  return `${driveText} • ${formatMinutes(Math.max(0, tsaMinutes))} TSA`;
}

// ---------------------------------------------------------------------------
// SF Symbol -> IconKey mapping (SurfaceBuilders.compactLeadingSymbolName)
// ---------------------------------------------------------------------------

/**
 * Port of `compactLeadingSymbolName(forKind:)`, returning the lab's IconKey
 * union instead of an SF Symbol name.
 *   airplane.departure -> plane-takeoff
 *   airplane.arrival   -> plane-landing
 *   bed.double.fill    -> bed
 *   mappin.and.ellipse -> map
 *   calendar           -> calendar
 */
export function compactLeadingSymbolName(kind: string): IconKey {
  switch (kind) {
    case 'flight_departure':
      return 'plane-takeoff';
    case 'flight_arrival':
    case 'flight_arrived':
      return 'plane-landing';
    case 'hotel_checkin':
      return 'bed';
    case 'activity':
      return 'map';
    default:
      return 'calendar';
  }
}

/** Maps an SF Symbol name to the lab's IconKey (for the minimal-symbol slot). */
export function sfSymbolToIconKey(symbol: string): IconKey {
  switch (symbol) {
    case 'airplane.departure':
      return 'plane-takeoff';
    case 'airplane.arrival':
      return 'plane-landing';
    case 'bed.double.fill':
      return 'bed';
    case 'mappin.and.ellipse':
      return 'map';
    default:
      return 'calendar';
  }
}
