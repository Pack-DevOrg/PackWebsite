/**
 * Google Calendar template links: all-day exclusive-end handling and
 * timezone-pinned timed events (local wall time + ctz, never UTC math).
 */

import { buildGoogleCalendarUrl, formatGoogleDate } from './calendarLinks';

const paramsOf = (url: string): URLSearchParams =>
  new URL(url).searchParams;

describe('formatGoogleDate', () => {
  it('compacts a date-only string', () => {
    expect(formatGoogleDate('2026-03-12')).toBe('20260312');
  });

  it('adds whole days across month boundaries', () => {
    expect(formatGoogleDate('2026-03-31', 1)).toBe('20260401');
  });

  it('rejects non date-only input', () => {
    expect(formatGoogleDate('2026-03-12T10:00:00Z')).toBeNull();
    expect(formatGoogleDate('tomorrow')).toBeNull();
  });
});

describe('buildGoogleCalendarUrl', () => {
  it('builds a single all-day event with an exclusive end date', () => {
    const url = buildGoogleCalendarUrl({
      title: 'Flight: SFO -> NRT',
      startDate: '2026-03-12',
    });
    expect(url).toContain('https://calendar.google.com/calendar/render?');
    const params = paramsOf(url as string);
    expect(params.get('action')).toBe('TEMPLATE');
    expect(params.get('text')).toBe('Flight: SFO -> NRT');
    expect(params.get('dates')).toBe('20260312/20260313');
    expect(params.get('ctz')).toBeNull();
  });

  it('spans a stay through the inclusive check-out day', () => {
    const params = paramsOf(
      buildGoogleCalendarUrl({
        title: 'Stay: Tokyo',
        startDate: '2026-03-12',
        endDate: '2026-03-15',
        location: 'Tokyo',
      }) as string
    );
    expect(params.get('dates')).toBe('20260312/20260316');
    expect(params.get('location')).toBe('Tokyo');
  });

  it("pins timed events to the event's real timezone via ctz", () => {
    const params = paramsOf(
      buildGoogleCalendarUrl({
        title: 'Event: Sumo tournament',
        startDate: '2026-03-14',
        startTime: '18:30',
        timeZone: 'Asia/Tokyo',
        location: 'Ryogoku Kokugikan',
      }) as string
    );
    expect(params.get('dates')).toBe('20260314T183000/20260314T203000');
    expect(params.get('ctz')).toBe('Asia/Tokyo');
  });

  it('stays all-day when a time exists but no timezone is known', () => {
    const params = paramsOf(
      buildGoogleCalendarUrl({
        title: 'Event: Show',
        startDate: '2026-03-14',
        startTime: '20:00',
      }) as string
    );
    expect(params.get('dates')).toBe('20260314/20260315');
    expect(params.get('ctz')).toBeNull();
  });

  it('clamps late-night default durations inside the same day', () => {
    const params = paramsOf(
      buildGoogleCalendarUrl({
        title: 'Event: Midnight run',
        startDate: '2026-03-14',
        startTime: '23:30',
        timeZone: 'Asia/Tokyo',
      }) as string
    );
    expect(params.get('dates')).toBe('20260314T233000/20260314T235900');
  });

  it('returns null on malformed dates', () => {
    expect(
      buildGoogleCalendarUrl({ title: 'X', startDate: 'not-a-date' })
    ).toBeNull();
  });
});
