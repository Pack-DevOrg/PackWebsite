/**
 * Google Calendar "render?action=TEMPLATE" link builders.
 *
 * Google's template URL supports exactly ONE event per link, so shared trips
 * expose a per-event chooser. Two shapes:
 * - all-day events: dates=YYYYMMDD/YYYYMMDD with an EXCLUSIVE end date;
 * - timed events: floating local wall time (YYYYMMDDTHHMMSS) pinned to the
 *   event's real timezone via ctz — never UTC-converted on the client.
 */

const GOOGLE_CALENDAR_RENDER_URL = "https://calendar.google.com/calendar/render";

const DATE_ONLY_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;
const TIME_PATTERN = /^(\d{1,2}):(\d{2})/;

/** "2026-03-12" -> "20260312", with optional whole-day offset. */
export const formatGoogleDate = (
  dateString: string,
  daysToAdd = 0
): string | null => {
  const match = DATE_ONLY_PATTERN.exec(dateString);
  if (!match) {
    return null;
  }
  if (daysToAdd === 0) {
    return `${match[1]}${match[2]}${match[3]}`;
  }
  const date = new Date(
    Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]) + daysToAdd)
  );
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  const year = date.getUTCFullYear();
  const month = `${date.getUTCMonth() + 1}`.padStart(2, "0");
  const day = `${date.getUTCDate()}`.padStart(2, "0");
  return `${year}${month}${day}`;
};

export interface GoogleCalendarEventInput {
  readonly title: string;
  /** Date-only start, YYYY-MM-DD. */
  readonly startDate: string;
  /** Date-only INCLUSIVE end (e.g. hotel check-out day). Defaults to startDate. */
  readonly endDate?: string;
  /** Optional local wall-clock start time, "HH:MM" (destination-local). */
  readonly startTime?: string;
  /** IANA timezone the times are local to (e.g. "Asia/Tokyo"). */
  readonly timeZone?: string;
  readonly location?: string;
  readonly details?: string;
};

const TIMED_EVENT_DEFAULT_DURATION_MINUTES = 120;

/**
 * Build a single-event Google Calendar link, or null when the dates are
 * unusable. Timed form only engages when BOTH a start time and a real
 * timezone are known; otherwise the event stays all-day (correct on every
 * device, never shifted through the viewer's clock).
 */
export const buildGoogleCalendarUrl = (
  event: GoogleCalendarEventInput
): string | null => {
  const { title, startDate, endDate, startTime, timeZone, location, details } =
    event;

  const params = new URLSearchParams({ action: "TEMPLATE", text: title });

  const timeMatch = startTime ? TIME_PATTERN.exec(startTime.trim()) : null;
  if (timeMatch && timeZone) {
    const day = formatGoogleDate(startDate);
    if (!day) {
      return null;
    }
    const startMinutes =
      Number(timeMatch[1]) * 60 + Number(timeMatch[2]);
    const endMinutes = startMinutes + TIMED_EVENT_DEFAULT_DURATION_MINUTES;
    const clock = (totalMinutes: number): string => {
      const clamped = Math.min(totalMinutes, 23 * 60 + 59);
      const hours = `${Math.floor(clamped / 60)}`.padStart(2, "0");
      const minutes = `${clamped % 60}`.padStart(2, "0");
      return `T${hours}${minutes}00`;
    };
    params.set("dates", `${day}${clock(startMinutes)}/${day}${clock(endMinutes)}`);
    params.set("ctz", timeZone);
  } else {
    const start = formatGoogleDate(startDate);
    // Google all-day ends are EXCLUSIVE: +1 day past the inclusive end.
    const end = formatGoogleDate(endDate ?? startDate, 1);
    if (!start || !end) {
      return null;
    }
    params.set("dates", `${start}/${end}`);
  }

  if (location) {
    params.set("location", location);
  }
  if (details) {
    params.set("details", details);
  }

  return `${GOOGLE_CALENDAR_RENDER_URL}?${params.toString()}`;
};
