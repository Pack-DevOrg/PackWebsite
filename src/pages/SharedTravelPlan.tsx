/**
 * Shared Travel Plan Page
 *
 * Displays a shared travel plan from a universal link with rich social media
 * previews. Uses schema-first validation to keep shared data safe to render
 * on web.
 *
 * Visual language mirrors the app's trip view (MetaSkills/PackApp/
 * design-language-guide.md): hero city art, one clean header, outline cards
 * with icon-disc eyebrows, boxed hairline info bands, dot-line duration
 * rails, and accent weekday date badges — on the website's tokens (Fraunces
 * display serif, warm dark palette from index.css).
 */

import React, { useCallback, useMemo, useRef, useState } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { z } from 'zod';
// Type-only import: the runtime schemas in @pack/schemas pull the server-side
// locality catalog into the bundle, so the page keeps a lenient local reader
// and reuses the contract at the type level only (see drift guard below).
import type { SharedTravelData as SharedTravelDataContract } from '@pack/schemas/shared-travel';
import { executeRecaptchaAction, loadRecaptchaScript } from '../utils/recaptcha';
import { appConfig } from '../config/appConfig';
import {
  attemptOpenInApp,
  buildAppStoreUrl,
  buildShareUniversalLink,
  DEFAULT_APPLE_APP_ID,
} from '../utils/appDeepLink';
import { buildGoogleCalendarUrl } from '../utils/calendarLinks';
import { useMountEffect } from '../hooks/useMountEffect';
import { useI18n } from '../i18n/I18nProvider';
import type { SupportedLocale } from '../i18n/config';
import {
  AppleGlyph,
  ArrowRightGlyph,
  BedGlyph,
  CarGlyph,
  ClockGlyph,
  GoogleGlyph,
  MapPinGlyph,
  MoonGlyph,
  PlaneGlyph,
  TicketGlyph,
  type PackIconProps,
} from '../components/share/packIcons';

// Environment variables with fallbacks
const WEBSITE_URL = import.meta.env.VITE_WEBSITE_URL || 'https://www.trypackai.com';
const RECAPTCHA_SITE_KEY = import.meta.env.VITE_RECAPTCHA_SITE_KEY || '';
// appConfig.apiBaseUrl is the single API origin source (VITE_API_URL was
// defined nowhere and always fell through).
const SHARED_PLAN_API_BASE = appConfig.apiBaseUrl;

// A blocked/stalled reCAPTCHA script must not keep the trip invisible: after
// this window the page fetches without a token and lets the API decide.
const RECAPTCHA_SETTLE_TIMEOUT_MS = 8000;

const APPLE_APP_ID = import.meta.env.VITE_APPLE_APP_ID || DEFAULT_APPLE_APP_ID;
const APP_STORE_URL = buildAppStoreUrl(APPLE_APP_ID);

const DateOnlyStringSchema = z.string().regex(/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/);

const SharedTravelFlightChunkSchema = z.object({
  id: z.string(),
  type: z.literal('flight'),
  origin: z.string(),
  destination: z.string(),
  date: DateOnlyStringSchema,
  departureTime: z.string().optional(),
  arrivalTime: z.string().optional(),
  airline: z.string().optional(),
  flightNumber: z.string().optional(),
});

const SharedTravelHotelChunkSchema = z.object({
  id: z.string(),
  type: z.literal('hotel'),
  location: z.string(),
  checkIn: DateOnlyStringSchema,
  checkOut: DateOnlyStringSchema.optional(),
  name: z.string().optional(),
  nights: z.number().int().positive().optional(),
});

const SharedTravelActivityChunkSchema = z.object({
  id: z.string(),
  type: z.literal('activity'),
  title: z.string(),
  location: z.string().optional(),
  date: DateOnlyStringSchema,
  time: z.string().optional(),
  endDate: DateOnlyStringSchema.optional(),
  category: z.string().optional(),
});

const SharedTravelFlightOutlineChunkSchema = z.object({
  id: z.string(),
  type: z.literal('flightOutline'),
  origin: z.string(),
  destination: z.string(),
  date: DateOnlyStringSchema,
  alreadyBooked: z.boolean().default(false),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

const SharedTravelHotelOutlineChunkSchema = z.object({
  id: z.string(),
  type: z.literal('hotelOutline'),
  location: z.string(),
  checkIn: DateOnlyStringSchema,
  checkOut: DateOnlyStringSchema.optional(),
  nights: z.number().int().positive(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

const SharedTravelCarRentalPickupOutlineChunkSchema = z.object({
  id: z.string(),
  type: z.literal('carRentalPickupOutline'),
  carRentalId: z.string().optional(),
  pickupCity: z.string(),
  pickupDate: DateOnlyStringSchema,
  days: z.number().int().positive().optional(),
  pickupLocation: z.string().optional(),
  company: z.string().optional(),
  alreadyBooked: z.boolean().default(false),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

const SharedTravelCarRentalDropoffOutlineChunkSchema = z.object({
  id: z.string(),
  type: z.literal('carRentalDropoffOutline'),
  carRentalId: z.string().optional(),
  returnCity: z.string().optional(),
  returnDate: DateOnlyStringSchema,
  returnLocation: z.string().optional(),
  company: z.string().optional(),
  alreadyBooked: z.boolean().default(false),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

const SharedTravelActivityOutlineChunkSchema = z.object({
  id: z.string(),
  type: z.literal('activityOutline'),
  title: z.string(),
  location: z.string().optional(),
  date: DateOnlyStringSchema,
  time: z.string().optional(),
  endDate: DateOnlyStringSchema.optional(),
  category: z.string().optional(),
  alreadyBooked: z.boolean().default(false),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

const SharedTravelOutlineChunkSchema = z.union([
  SharedTravelFlightOutlineChunkSchema,
  SharedTravelHotelOutlineChunkSchema,
  SharedTravelCarRentalPickupOutlineChunkSchema,
  SharedTravelCarRentalDropoffOutlineChunkSchema,
  SharedTravelActivityOutlineChunkSchema,
]);

const SharedTravelChunkSchema = z.union([
  SharedTravelFlightChunkSchema,
  SharedTravelHotelChunkSchema,
  SharedTravelActivityChunkSchema,
  SharedTravelFlightOutlineChunkSchema,
  SharedTravelHotelOutlineChunkSchema,
  SharedTravelCarRentalPickupOutlineChunkSchema,
  SharedTravelCarRentalDropoffOutlineChunkSchema,
  SharedTravelActivityOutlineChunkSchema,
]);

// Reader schema, deliberately lenient: this page renders whatever it can and
// must never blank the whole trip over a field it does not display strictly.
// Shape drift against the backend contract is caught at compile time by the
// assignability guard below (see @pack/schemas shared-travel).
const SharedTravelDataSchema = z.object({
  version: z.string(),
  title: z.string(),
  description: z.string().optional(),
  chunks: z.array(SharedTravelChunkSchema).default([]),
  outlineChunks: z.array(SharedTravelOutlineChunkSchema).default([]),
  createdAt: z.string(),
  sharedBy: z.string().optional(),
  thumbnailUrl: z.string().optional(),
  heroImageUrl: z.string().optional(),
  heroImageNightUrl: z.string().optional(),
  destinationTimeZone: z.string().optional(),
});

type SharedTravelPlan = z.infer<typeof SharedTravelDataSchema>;
type SharedTravelChunk = z.infer<typeof SharedTravelChunkSchema>;

// Compile-time drift guard against the backend contract (the trip primitives
// in @pack/schemas): every payload the server can emit must be readable by
// this page's lenient reader. A backend field rename/retype or a new chunk
// type breaks this assignability check instead of blanking the live page.
type _ServerShareContractIsReadable =
  SharedTravelDataContract extends SharedTravelPlan ? true : never;
const _serverShareContractIsReadable: _ServerShareContractIsReadable = true;
void _serverShareContractIsReadable;
type SharedTravelOutlineChunk = z.infer<typeof SharedTravelOutlineChunkSchema>;

interface TimelineItem {
  startDate: string;
  chunk: SharedTravelChunk | SharedTravelOutlineChunk;
}

const dateFormatLocale = (locale: SupportedLocale): string =>
  locale === 'es' ? 'es-ES' : 'en-US';

/** Parse a YYYY-MM-DD date at UTC noon so the calendar day never shifts. */
const parseDateOnly = (dateString: string): Date | null => {
  const date = new Date(`${dateString}T12:00:00Z`);
  return Number.isNaN(date.getTime()) ? null : date;
};

/** "Thu, Mar 12" — the app's accent-date-badge input format. */
const formatDate = (dateString: string, locale: SupportedLocale): string => {
  const date = parseDateOnly(dateString) ?? new Date(dateString);
  return Number.isNaN(date.getTime())
    ? ''
    : date.toLocaleDateString(dateFormatLocale(locale), {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        timeZone: 'UTC',
      });
};

/** Compact trip range per the app grammar: "Mar 12 – Mar 18, 2026". */
const formatTripRange = (
  startDate: string,
  endDate: string,
  locale: SupportedLocale
): string => {
  const start = parseDateOnly(startDate);
  const end = parseDateOnly(endDate);
  if (!start) {
    return '';
  }
  const fmt = (date: Date, withYear: boolean): string =>
    date.toLocaleDateString(dateFormatLocale(locale), {
      month: 'short',
      day: 'numeric',
      timeZone: 'UTC',
      ...(withYear ? { year: 'numeric' } : {}),
    });
  if (!end || startDate === endDate) {
    return fmt(start, true);
  }
  const sameYear = start.getUTCFullYear() === end.getUTCFullYear();
  return sameYear
    ? `${fmt(start, false)} – ${fmt(end, true)}`
    : `${fmt(start, true)} – ${fmt(end, true)}`;
};

/** The date each chunk sorts/renders by, across all chunk types. */
const chunkStartDate = (
  chunk: SharedTravelChunk | SharedTravelOutlineChunk
): string | undefined => {
  switch (chunk.type) {
    case 'hotel':
    case 'hotelOutline':
      return chunk.checkIn;
    case 'carRentalPickupOutline':
      return chunk.pickupDate;
    case 'carRentalDropoffOutline':
      return chunk.returnDate;
    default:
      // flight, flightOutline, activityOutline
      return chunk.date;
  }
};

/** The INCLUSIVE end date of a chunk (check-out day, event end day). */
const chunkEndDate = (
  chunk: SharedTravelChunk | SharedTravelOutlineChunk
): string | undefined => {
  switch (chunk.type) {
    case 'hotel':
    case 'hotelOutline':
      return chunk.checkOut ?? chunk.checkIn;
    case 'activity':
    case 'activityOutline':
      return chunk.endDate ?? chunk.date;
    default:
      return chunkStartDate(chunk);
  }
};

type ChunkKind = 'flight' | 'hotel' | 'car' | 'event';

/** Human-readable title, meta line, kind and optional detail for a chunk. */
const describeChunk = (
  chunk: SharedTravelChunk | SharedTravelOutlineChunk,
  content: SharedTravelContent
): { kind: ChunkKind; title: string; meta: string; detail?: string } => {
  switch (chunk.type) {
    case 'flight':
      return {
        kind: 'flight',
        title: `${chunk.origin} -> ${chunk.destination}`,
        meta: chunk.airline
          ? `${content.flightLabel} · ${chunk.airline}${
              chunk.flightNumber ? ` ${chunk.flightNumber}` : ''
            }`
          : content.flightLabel,
      };
    case 'flightOutline':
      return {
        kind: 'flight',
        title: `${chunk.origin} -> ${chunk.destination}`,
        meta: content.flightLabel,
      };
    case 'hotel':
      return {
        kind: 'hotel',
        title: chunk.name || chunk.location,
        meta: content.stay,
        detail: chunk.name ? chunk.location : undefined,
      };
    case 'hotelOutline':
      return {
        kind: 'hotel',
        title: chunk.location,
        meta: content.stay,
      };
    case 'carRentalPickupOutline':
      return {
        kind: 'car',
        title: chunk.company || content.carPickupLabel,
        meta: content.carPickupLabel,
        detail: chunk.pickupLocation || chunk.pickupCity,
      };
    case 'carRentalDropoffOutline':
      return {
        kind: 'car',
        title: chunk.company || content.carReturnLabel,
        meta: content.carReturnLabel,
        detail: chunk.returnLocation || chunk.returnCity,
      };
    case 'activity':
    case 'activityOutline':
      return {
        kind: 'event',
        title: chunk.title,
        meta: content.eventLabel,
        detail: chunk.location,
      };
  }
};

const CHUNK_GLYPHS: Record<ChunkKind, React.FC<PackIconProps>> = {
  flight: PlaneGlyph,
  hotel: BedGlyph,
  car: CarGlyph,
  event: TicketGlyph,
};

type SharedTravelContent = {
  fallbackSharedBy: string;
  invalidDescription: string;
  sharedTravelPlanTitle: string;
  ogLocale: string;
  openInAppFeedback: string;
  noDatesFeedback: string;
  calendarDownloadedFeedback: string;
  loadingTitle: string;
  loadingBody: string;
  unableTitle: string;
  invalidLink: string;
  returnHome: string;
  sharedByPrefix: string;
  openInPack: string;
  appleCalendar: string;
  googleCalendar: string;
  chooseGoogleEvent: string;
  itineraryTitle: string;
  noTimeline: string;
  plannedWithPack: string;
  learnMore: string;
  downloadPack: string;
  flightLabel: string;
  stay: string;
  bookedLabel: string;
  checkIn: string;
  checkOut: string;
  nightSingular: string;
  nightPlural: string;
  daySingular: string;
  dayPlural: string;
  carPickupLabel: string;
  carReturnLabel: string;
  eventLabel: string;
  invalidShareLink: string;
  securityUnavailable: string;
  sharedLinkNotFound: string;
  unexpectedServerResponse: string;
  failedToLoadPlan: string;
  unexpectedData: string;
};

const SHARED_TRAVEL_CONTENT: Record<SupportedLocale, SharedTravelContent> = {
  en: {
    fallbackSharedBy: 'shared a travel plan with you',
    invalidDescription: 'This shared travel plan link may have expired or is invalid.',
    sharedTravelPlanTitle: 'Shared Travel Plan',
    ogLocale: 'en_US',
    openInAppFeedback: 'If you have Pack installed, the app will open with this trip.',
    noDatesFeedback: 'No dated flights or stays yet — calendar export unlocks once dates are set.',
    calendarDownloadedFeedback: 'Calendar file downloaded. Open it to add the trip to your calendar.',
    loadingTitle: 'Loading trip',
    loadingBody: 'Pulling the trip details…',
    unableTitle: 'Unable to load this trip',
    invalidLink: 'This link may have expired or is invalid.',
    returnHome: 'Go to Pack',
    sharedByPrefix: 'Shared by',
    openInPack: 'Open in Pack',
    appleCalendar: 'Apple Calendar',
    googleCalendar: 'Google Calendar',
    chooseGoogleEvent: 'Pick what to add to Google Calendar',
    itineraryTitle: 'Itinerary',
    noTimeline: 'No flights or stays yet. Once the trip is ready, it will show here.',
    plannedWithPack: 'Planned with Pack',
    learnMore: 'Learn more',
    downloadPack: 'Get the app',
    flightLabel: 'Flight',
    stay: 'Stay',
    bookedLabel: 'Booked',
    checkIn: 'Check-in',
    checkOut: 'Check-out',
    nightSingular: 'night',
    nightPlural: 'nights',
    daySingular: 'day',
    dayPlural: 'days',
    carPickupLabel: 'Car pickup',
    carReturnLabel: 'Car return',
    eventLabel: 'Event',
    invalidShareLink: 'Invalid share link',
    securityUnavailable: 'Security verification unavailable; still trying to load the shared plan.',
    sharedLinkNotFound: 'Shared link not found or expired',
    unexpectedServerResponse: 'Unexpected response from server',
    failedToLoadPlan: 'Failed to load shared travel plan',
    unexpectedData: 'Received unexpected data from server.',
  },
  es: {
    fallbackSharedBy: 'compartió un plan de viaje contigo',
    invalidDescription: 'Este enlace de viaje compartido puede haber expirado o no ser válido.',
    sharedTravelPlanTitle: 'Plan de viaje compartido',
    ogLocale: 'es_ES',
    openInAppFeedback: 'Si tienes Pack instalado, la app se abrirá con este viaje.',
    noDatesFeedback: 'Todavía no hay vuelos o estancias con fecha; la exportación al calendario se activará cuando haya fechas.',
    calendarDownloadedFeedback: 'Archivo de calendario descargado. Ábrelo para agregar el viaje a tu calendario.',
    loadingTitle: 'Cargando viaje',
    loadingBody: 'Trayendo los detalles del viaje…',
    unableTitle: 'No se pudo cargar este viaje',
    invalidLink: 'Este enlace puede haber expirado o no ser válido.',
    returnHome: 'Ir a Pack',
    sharedByPrefix: 'Compartido por',
    openInPack: 'Abrir en Pack',
    appleCalendar: 'Apple Calendar',
    googleCalendar: 'Google Calendar',
    chooseGoogleEvent: 'Elige qué agregar a Google Calendar',
    itineraryTitle: 'Itinerario',
    noTimeline: 'Todavía no hay vuelos ni estancias. Cuando el viaje esté listo, aparecerá aquí.',
    plannedWithPack: 'Planeado con Pack',
    learnMore: 'Conoce más',
    downloadPack: 'Descargar la app',
    flightLabel: 'Vuelo',
    stay: 'Estancia',
    bookedLabel: 'Reservado',
    checkIn: 'Entrada',
    checkOut: 'Salida',
    nightSingular: 'noche',
    nightPlural: 'noches',
    daySingular: 'día',
    dayPlural: 'días',
    carPickupLabel: 'Recogida de auto',
    carReturnLabel: 'Devolución de auto',
    eventLabel: 'Evento',
    invalidShareLink: 'Enlace compartido no válido',
    securityUnavailable: 'La verificación de seguridad no está disponible; igualmente intentaremos cargar el plan.',
    sharedLinkNotFound: 'Enlace compartido no encontrado o expirado',
    unexpectedServerResponse: 'Respuesta inesperada del servidor',
    failedToLoadPlan: 'No se pudo cargar el plan de viaje compartido',
    unexpectedData: 'Se recibieron datos inesperados del servidor.',
  },
};

const formatDateForIcs = (dateString: string, daysToAdd = 0): string | null => {
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  if (daysToAdd !== 0) {
    date.setUTCDate(date.getUTCDate() + daysToAdd);
  }

  const year = date.getUTCFullYear();
  const month = `${date.getUTCMonth() + 1}`.padStart(2, '0');
  const day = `${date.getUTCDate()}`.padStart(2, '0');
  return `${year}${month}${day}`;
};

const buildIcs = (
  plan: SharedTravelPlan,
  shareId: string,
  localizedContent: SharedTravelContent
): { ics: string; eventCount: number } => {
  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Pack//Shared Travel Plan//EN',
  ];

  let eventCount = 0;

  const chunks: Array<SharedTravelChunk | SharedTravelOutlineChunk> = [
    ...(plan.chunks || []),
    ...(plan.outlineChunks || []),
  ];

  chunks.forEach((chunk, index) => {
    const described = describeChunk(chunk, localizedContent);
    const summary = `${described.meta}: ${described.title}`;

    const startDate = chunkStartDate(chunk);
    const formattedStart = startDate ? formatDateForIcs(startDate) : null;
    if (!formattedStart) {
      return;
    }

    const endDate =
      chunk.type === 'hotel' || chunk.type === 'hotelOutline'
        ? formatDateForIcs(chunk.checkOut || chunk.checkIn, 1)
        : formatDateForIcs(startDate, 1);

    const description = described.detail ?? '';

    lines.push('BEGIN:VEVENT');
    lines.push(`UID:${shareId || 'shared-trip'}-${index}@trypackai.com`);
    lines.push(`DTSTAMP:${formatDateForIcs(new Date().toISOString())}`);
    lines.push(`SUMMARY:${summary}`);
    lines.push(`DTSTART;VALUE=DATE:${formattedStart}`);
    if (endDate) {
      lines.push(`DTEND;VALUE=DATE:${endDate}`);
    }
    if (description) {
      lines.push(`DESCRIPTION:${description}`);
    }
    lines.push('END:VEVENT');
    eventCount += 1;
  });

  lines.push('END:VCALENDAR');

  return { ics: lines.join('\r\n'), eventCount };
};

/**
 * App IconDisc port: 28px tinted circle around a 14–16px glyph. The tint
 * pair (1F fill / 33 border on the accent) is the one sanctioned colored
 * alpha form in the design language.
 */
const IconDisc: React.FC<{ readonly children: React.ReactNode }> = ({ children }) => (
  <span className="stp-icondisc">{children}</span>
);

/** App AccentDateBadge port: accent weekday + white tabular rest. */
const AccentDateBadge: React.FC<{ readonly formattedDate: string }> = ({
  formattedDate,
}) => {
  const displayDate = formattedDate.replace(/,\s*\d{4}$/, '');
  const [weekdayPart, ...restParts] = displayDate.split(' ');
  const weekday = weekdayPart?.replace(/,$/, '') ?? '';
  const rest = restParts.join(' ').trim();

  if (!weekday || !rest) {
    return <span className="stp-datebadge">{displayDate}</span>;
  }
  return (
    <span className="stp-datebadge">
      <span className="stp-datebadge-weekday">{weekday}</span>
      <span className="stp-datebadge-rest">{rest}</span>
    </span>
  );
};

/** Timeline card kicker: icon disc + uppercase micro-label left, date right. */
const CardKicker: React.FC<{
  readonly kind: ChunkKind;
  readonly label: string;
  readonly dateLabel: string;
  readonly booked?: boolean;
  readonly bookedLabel: string;
}> = ({ kind, label, dateLabel, booked, bookedLabel }) => {
  const Glyph = CHUNK_GLYPHS[kind];
  return (
    <div className="stp-kicker">
      <span className="stp-kicker-lead">
        <IconDisc>
          <Glyph size={14} />
        </IconDisc>
        <span className="stp-kicker-label">{label}</span>
        {booked && <span className="stp-booked">{bookedLabel}</span>}
      </span>
      {dateLabel && <AccentDateBadge formattedDate={dateLabel} />}
    </div>
  );
};

/** Flight band: endpoints flanking the app's hairline–pill–hairline rail. */
const FlightRouteBand: React.FC<{
  readonly origin: string;
  readonly destination: string;
}> = ({ origin, destination }) => (
  <div className="stp-band stp-band-route">
    <span className="stp-route-endpoint">{origin}</span>
    <span className="stp-route-rail" aria-hidden>
      <span className="stp-route-line" />
      <span className="stp-route-pill">
        <PlaneGlyph size={12} />
      </span>
      <span className="stp-route-line" />
    </span>
    <span className="stp-route-endpoint stp-route-endpoint-right">{destination}</span>
  </div>
);

/** Stay band: check-in / nights-pill / check-out (app hotel-card box). */
const StayBand: React.FC<{
  readonly checkInLabel: string;
  readonly checkOutLabel: string;
  readonly checkInDate: string;
  readonly checkOutDate?: string;
  readonly nightsLabel: string;
}> = ({ checkInLabel, checkOutLabel, checkInDate, checkOutDate, nightsLabel }) => (
  <div className="stp-band stp-band-stay">
    <span className="stp-stay-col">
      <span className="stp-microlabel">{checkInLabel}</span>
      <AccentDateBadge formattedDate={checkInDate} />
    </span>
    <span className="stp-nights-pill">
      <MoonGlyph size={12} />
      <span>{nightsLabel}</span>
    </span>
    <span className="stp-stay-col stp-stay-col-right">
      <span className="stp-microlabel">{checkOutLabel}</span>
      {checkOutDate ? <AccentDateBadge formattedDate={checkOutDate} /> : <span className="stp-datebadge">—</span>}
    </span>
  </div>
);

export const SharedTravelPlan: React.FC = () => {
  const { locale } = useI18n();
  const location = useLocation();
  const { shareId: shareIdFromParams } = useParams<{ shareId: string }>();
  const shareIdFromQuery = new URLSearchParams(location.search).get('shareId');
  const shareId = shareIdFromParams ?? shareIdFromQuery ?? '';
  const [travelPlan, setTravelPlan] = useState<SharedTravelPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);
  const [googleChooserOpen, setGoogleChooserOpen] = useState(false);
  const cancelAppOpenRef = useRef<() => void>(() => undefined);
  // The plan fetch waits for reCAPTCHA to SETTLE (ready or unavailable) so the
  // first request already carries a token — a token-less first fetch is
  // rejected by the API and flashed an error before the tokened retry.
  const [recaptchaState, setRecaptchaState] = useState<
    'loading' | 'ready' | 'unavailable'
  >(RECAPTCHA_SITE_KEY ? 'loading' : 'unavailable');
  const localizedContent = SHARED_TRAVEL_CONTENT[locale];

  useMountEffect(() => {
    // Unmount cancels any armed open-in-app App Store fallback timer.
    const cancelPendingAppOpen = (): void => cancelAppOpenRef.current();
    if (!RECAPTCHA_SITE_KEY) {
      return cancelPendingAppOpen;
    }
    const settleTimeout = window.setTimeout(
      () => setRecaptchaState((state) => (state === 'loading' ? 'unavailable' : state)),
      RECAPTCHA_SETTLE_TIMEOUT_MS,
    );
    void loadRecaptchaScript(RECAPTCHA_SITE_KEY)
      .then(() => setRecaptchaState('ready'))
      .catch(() => {
        // We still allow loading without recaptcha, but prefer to block bots where possible
        setRecaptchaState('unavailable');
      })
      .finally(() => window.clearTimeout(settleTimeout));
    return cancelPendingAppOpen;
  });

  const hasShareId = Boolean(shareId);

  const fallbackDescription = travelPlan?.sharedBy
    ? `${travelPlan.sharedBy} ${localizedContent.fallbackSharedBy}`
    : `View this travel plan on Pack`;

  const rawDescription =
    travelPlan?.description ||
    (hasShareId
      ? fallbackDescription
      : localizedContent.invalidDescription);

  const rawTitle = travelPlan?.title || localizedContent.sharedTravelPlanTitle;
  const ogTitle = rawTitle.length > 90 ? `${rawTitle.substring(0, 87)}...` : rawTitle;
  const ogDescription = rawDescription.length > 160 ? `${rawDescription.substring(0, 157)}...` : rawDescription;

  // Destination hero art: the night variant between 19:00–06:00 in the
  // destination's local time (matching the app's day/night tile window),
  // otherwise the day variant.
  const heroImage = useMemo(() => {
    if (!travelPlan?.heroImageUrl) {
      return undefined;
    }
    if (travelPlan.heroImageNightUrl && travelPlan.destinationTimeZone) {
      try {
        const hour = Number.parseInt(
          new Intl.DateTimeFormat('en-US', {
            timeZone: travelPlan.destinationTimeZone,
            hour: 'numeric',
            hourCycle: 'h23',
          }).format(new Date()),
          10,
        );
        if (Number.isInteger(hour) && (hour >= 19 || hour < 6)) {
          return travelPlan.heroImageNightUrl;
        }
      } catch {
        // Unknown timezone — fall through to the day image.
      }
    }
    return travelPlan.heroImageUrl;
  }, [travelPlan]);

  const ogImage =
    heroImage ||
    travelPlan?.thumbnailUrl ||
    `${WEBSITE_URL}/images/share-card.png?v=20260410a`;
  const ogImageAlt = travelPlan?.title ? `${travelPlan.title} - Pack` : 'Shared travel plan on Pack';
  const encodedShareId = hasShareId ? encodeURIComponent(shareId) : '';
  // Canonical share URL is the query-param form: /share/<id> 404s on the
  // static host and crawlers suppress previews on non-200 canonicals.
  const ogUrl = `${WEBSITE_URL}${encodedShareId ? `/share?shareId=${encodedShareId}` : '/share'}`;

  // The button href stays the page's own https universal link on the CURRENT
  // host (this page will also serve from trips.trypackai.com), so link taps
  // from other apps open Pack directly when installed.
  const universalLink = hasShareId
    ? buildShareUniversalLink(
        typeof window !== 'undefined' ? window.location.origin : WEBSITE_URL,
        shareId,
      )
    : ogUrl;

  const handleOpenInApp = useCallback(
    (event: React.MouseEvent<HTMLAnchorElement>) => {
      if (!hasShareId) {
        return;
      }
      // In-browser tap: a universal link to our own host never leaves the
      // browser, so attempt the custom scheme with a timed App Store fallback.
      event.preventDefault();
      cancelAppOpenRef.current();
      cancelAppOpenRef.current = attemptOpenInApp({
        shareId,
        userAgent: navigator.userAgent,
        appleAppId: APPLE_APP_ID,
        env: {
          navigate: (url) => {
            window.location.href = url;
          },
          isPageHidden: () => document.visibilityState === 'hidden',
          setTimer: (handler, ms) => window.setTimeout(handler, ms),
          clearTimer: (timerId) => window.clearTimeout(timerId),
          onPageHide: (handler) => {
            const onVisibility = (): void => {
              if (document.visibilityState === 'hidden') {
                handler();
              }
            };
            document.addEventListener('visibilitychange', onVisibility);
            window.addEventListener('pagehide', handler);
            return () => {
              document.removeEventListener('visibilitychange', onVisibility);
              window.removeEventListener('pagehide', handler);
            };
          },
        },
      });
      setActionFeedback(localizedContent.openInAppFeedback);
    },
    [hasShareId, localizedContent.openInAppFeedback, shareId],
  );

  const handleAppleCalendar = useCallback(() => {
    if (!travelPlan) {
      return;
    }

    const { ics, eventCount } = buildIcs(travelPlan, shareId, localizedContent);

    if (eventCount === 0) {
      setActionFeedback(localizedContent.noDatesFeedback);
      return;
    }

    const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `pack-shared-trip${shareId ? `-${shareId.slice(0, 6)}` : ''}.ics`;
    link.click();
    URL.revokeObjectURL(url);

    setActionFeedback(localizedContent.calendarDownloadedFeedback);
  }, [localizedContent, shareId, travelPlan]);

  const timelineItems: TimelineItem[] = useMemo(() => {
    if (!travelPlan) {
      return [];
    }
    const items: TimelineItem[] = [
      ...(travelPlan.chunks || []),
      ...(travelPlan.outlineChunks || []),
    ]
      .map((chunk) => ({ chunk, startDate: chunkStartDate(chunk) }))
      .filter((item): item is TimelineItem => Boolean(item.startDate));

    return items.sort(
      (a, b) =>
        new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
    );
  }, [travelPlan]);

  // One Google Calendar template link per dated item (Google's template URL
  // carries exactly one event). Single event -> the button opens it directly;
  // several -> a per-event chooser panel.
  const googleCalendarEvents = useMemo(
    () =>
      timelineItems.flatMap((item) => {
        const described = describeChunk(item.chunk, localizedContent);
        const time =
          item.chunk.type === 'activity' || item.chunk.type === 'activityOutline'
            ? item.chunk.time
            : undefined;
        const url = buildGoogleCalendarUrl({
          title: `${described.meta}: ${described.title}`,
          startDate: item.startDate,
          endDate: chunkEndDate(item.chunk),
          startTime: time,
          timeZone: travelPlan?.destinationTimeZone,
          location: described.detail,
        });
        if (!url) {
          return [];
        }
        return [
          {
            key: `${item.chunk.type}-${item.chunk.id}`,
            kind: described.kind,
            title: described.title,
            dateLabel: formatDate(item.startDate, locale),
            url,
          },
        ];
      }),
    [timelineItems, localizedContent, locale, travelPlan?.destinationTimeZone],
  );

  const handleGoogleCalendar = useCallback(() => {
    if (googleCalendarEvents.length === 0) {
      setActionFeedback(localizedContent.noDatesFeedback);
      return;
    }
    if (googleCalendarEvents.length === 1) {
      window.open(googleCalendarEvents[0].url, '_blank', 'noopener');
      return;
    }
    setGoogleChooserOpen((open) => !open);
  }, [googleCalendarEvents, localizedContent.noDatesFeedback]);

  const tripRange = useMemo(() => {
    if (timelineItems.length === 0) {
      return null;
    }
    const start = timelineItems[0].startDate;
    const end = timelineItems.reduce((latest, item) => {
      const itemEnd = chunkEndDate(item.chunk) ?? item.startDate;
      return itemEnd > latest ? itemEnd : latest;
    }, start);
    const startDate = parseDateOnly(start);
    const endDate = parseDateOnly(end);
    const dayCount =
      startDate && endDate
        ? Math.round((endDate.getTime() - startDate.getTime()) / 86_400_000) + 1
        : null;
    return {
      label: formatTripRange(start, end, locale),
      dayCount,
    };
  }, [timelineItems, locale]);

  const chunkIsBooked = (
    chunk: SharedTravelChunk | SharedTravelOutlineChunk
  ): boolean => 'alreadyBooked' in chunk && chunk.alreadyBooked === true;

  return (
    <>
      <SharedTravelPlanLoader
        key={`${shareId}:${recaptchaState}`}
        localizedContent={localizedContent}
        recaptchaState={recaptchaState}
        setActionFeedback={setActionFeedback}
        setError={setError}
        setLoading={setLoading}
        setTravelPlan={setTravelPlan}
        shareId={shareId}
      />
      <Helmet>
        <title>{ogTitle} - Pack</title>
        <meta name="description" content={ogDescription} />
        <meta name="robots" content="noindex, nofollow" />

        <meta property="og:type" content="website" />
        <meta property="og:url" content={ogUrl} />
        <meta property="og:title" content={ogTitle} />
        <meta property="og:description" content={ogDescription} />
        <meta property="og:image" content={ogImage} />
        <meta property="og:image:secure_url" content={ogImage} />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:image:alt" content={ogImageAlt} />
        <meta property="og:site_name" content="Pack" />
        <meta property="og:locale" content={localizedContent.ogLocale} />

        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:domain" content="www.trypackai.com" />
        <meta name="twitter:url" content={ogUrl} />
        <meta name="twitter:title" content={ogTitle} />
        <meta name="twitter:description" content={ogDescription} />
        <meta name="twitter:image" content={ogImage} />
        <meta name="twitter:image:alt" content={ogImageAlt} />

        <meta name="apple-itunes-app" content={`app-id=${APPLE_APP_ID}, app-argument=${ogUrl}`} />

        <link rel="canonical" href={ogUrl} />
      </Helmet>

      <style>{SHARE_PAGE_CSS}</style>

      <div className="stp-page">
        {loading ? (
          <div className="stp-shell stp-center">
            <div className="stp-status-card" role="status">
              <span className="stp-loading-disc" aria-hidden />
              <h2 className="stp-status-title">{localizedContent.loadingTitle}</h2>
              <p className="stp-status-body">{localizedContent.loadingBody}</p>
            </div>
          </div>
        ) : error || !travelPlan ? (
          <div className="stp-shell stp-center">
            <div className="stp-status-card">
              <h2 className="stp-status-title">{localizedContent.unableTitle}</h2>
              <p className="stp-status-body">{error || localizedContent.invalidLink}</p>
              <a href={WEBSITE_URL} className="stp-btn stp-btn-ghost stp-status-home">
                {localizedContent.returnHome}
                <ArrowRightGlyph size={14} />
              </a>
            </div>
          </div>
        ) : (
          <div className="stp-shell">
            {/* ONE clean header: hero city art, title, dates, sharer — once. */}
            <header className="stp-head">
              {heroImage && (
                <div className="stp-hero">
                  <img
                    src={heroImage}
                    alt=""
                    className="stp-hero-img"
                    loading="eager"
                    decoding="async"
                  />
                  <div className="stp-hero-fade" aria-hidden />
                </div>
              )}
              <h1 className="stp-title">{travelPlan.title}</h1>
              <div className="stp-head-meta">
                {tripRange?.label && (
                  <span className="stp-head-dates">
                    {tripRange.label}
                    {tripRange.dayCount && tripRange.dayCount > 1 && (
                      <span className="stp-head-daycount">
                        {' · '}
                        {tripRange.dayCount}{' '}
                        {tripRange.dayCount === 1
                          ? localizedContent.daySingular
                          : localizedContent.dayPlural}
                      </span>
                    )}
                  </span>
                )}
                {travelPlan.sharedBy && (
                  <span className="stp-head-sharedby">
                    {localizedContent.sharedByPrefix} {travelPlan.sharedBy}
                  </span>
                )}
              </div>
            </header>

            <div className="stp-actions">
              <a
                href={universalLink}
                onClick={handleOpenInApp}
                className="stp-btn stp-btn-primary"
              >
                {localizedContent.openInPack}
                <ArrowRightGlyph size={15} />
              </a>
              <div className="stp-actions-row">
                <button
                  type="button"
                  onClick={handleAppleCalendar}
                  className="stp-btn stp-btn-ghost"
                >
                  <AppleGlyph size={15} />
                  {localizedContent.appleCalendar}
                </button>
                <button
                  type="button"
                  onClick={handleGoogleCalendar}
                  className="stp-btn stp-btn-ghost"
                  aria-expanded={googleChooserOpen}
                >
                  <GoogleGlyph size={14} />
                  {localizedContent.googleCalendar}
                </button>
              </div>
              {googleChooserOpen && googleCalendarEvents.length > 1 && (
                <div className="stp-gcal-panel">
                  <span className="stp-microlabel stp-gcal-label">
                    {localizedContent.chooseGoogleEvent}
                  </span>
                  {googleCalendarEvents.map((event) => {
                    const Glyph = CHUNK_GLYPHS[event.kind];
                    return (
                      <a
                        key={event.key}
                        href={event.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="stp-gcal-row"
                      >
                        <span className="stp-gcal-row-lead">
                          <Glyph size={14} />
                          <span className="stp-gcal-row-title">{event.title}</span>
                        </span>
                        <span className="stp-gcal-row-date">
                          {event.dateLabel}
                          <ArrowRightGlyph size={12} />
                        </span>
                      </a>
                    );
                  })}
                </div>
              )}
              <div aria-live="polite" className="stp-feedback">
                {actionFeedback}
              </div>
            </div>

            <section className="stp-timeline">
              <header className="stp-section-head">
                <IconDisc>
                  <MapPinGlyph size={14} />
                </IconDisc>
                <h2 className="stp-section-title">{localizedContent.itineraryTitle}</h2>
              </header>

              {timelineItems.length === 0 ? (
                <div className="stp-empty">{localizedContent.noTimeline}</div>
              ) : (
                <div className="stp-cards">
                  {timelineItems.map((item) => {
                    const described = describeChunk(item.chunk, localizedContent);
                    const dateLabel = formatDate(item.startDate, locale);
                    const key = `${item.chunk.type}-${item.chunk.id}`;
                    const chunk = item.chunk;

                    if (chunk.type === 'flight' || chunk.type === 'flightOutline') {
                      return (
                        <article key={key} className="stp-card">
                          <CardKicker
                            kind="flight"
                            label={described.meta}
                            dateLabel={dateLabel}
                            booked={chunkIsBooked(chunk)}
                            bookedLabel={localizedContent.bookedLabel}
                          />
                          <FlightRouteBand
                            origin={chunk.origin}
                            destination={chunk.destination}
                          />
                        </article>
                      );
                    }

                    if (chunk.type === 'hotel' || chunk.type === 'hotelOutline') {
                      const nights =
                        chunk.type === 'hotelOutline'
                          ? chunk.nights
                          : chunk.nights ??
                            (chunk.checkOut && parseDateOnly(chunk.checkOut) && parseDateOnly(chunk.checkIn)
                              ? Math.max(
                                  1,
                                  Math.round(
                                    ((parseDateOnly(chunk.checkOut) as Date).getTime() -
                                      (parseDateOnly(chunk.checkIn) as Date).getTime()) /
                                      86_400_000,
                                  ),
                                )
                              : 1);
                      return (
                        <article key={key} className="stp-card">
                          <CardKicker
                            kind="hotel"
                            label={described.meta}
                            dateLabel=""
                            booked={chunkIsBooked(chunk)}
                            bookedLabel={localizedContent.bookedLabel}
                          />
                          <h3 className="stp-card-title">{described.title}</h3>
                          {described.detail && (
                            <p className="stp-card-detail">
                              <MapPinGlyph size={12} />
                              {described.detail}
                            </p>
                          )}
                          <StayBand
                            checkInLabel={localizedContent.checkIn}
                            checkOutLabel={localizedContent.checkOut}
                            checkInDate={formatDate(chunk.checkIn, locale)}
                            checkOutDate={
                              chunk.checkOut ? formatDate(chunk.checkOut, locale) : undefined
                            }
                            nightsLabel={`${nights} ${
                              nights === 1
                                ? localizedContent.nightSingular
                                : localizedContent.nightPlural
                            }`}
                          />
                        </article>
                      );
                    }

                    const time =
                      chunk.type === 'activity' || chunk.type === 'activityOutline'
                        ? chunk.time
                        : undefined;
                    return (
                      <article key={key} className="stp-card">
                        <CardKicker
                          kind={described.kind}
                          label={described.meta}
                          dateLabel={dateLabel}
                          booked={chunkIsBooked(chunk)}
                          bookedLabel={localizedContent.bookedLabel}
                        />
                        <h3 className="stp-card-title">{described.title}</h3>
                        {(described.detail || time) && (
                          <p className="stp-card-detail">
                            {time && (
                              <span className="stp-card-time">
                                <ClockGlyph size={12} />
                                {time}
                              </span>
                            )}
                            {described.detail && (
                              <span className="stp-card-place">
                                <MapPinGlyph size={12} />
                                {described.detail}
                              </span>
                            )}
                          </p>
                        )}
                      </article>
                    );
                  })}
                </div>
              )}
            </section>

            <footer className="stp-foot">
              <span className="stp-foot-brand">{localizedContent.plannedWithPack}</span>
              <span className="stp-foot-links">
                <a href={WEBSITE_URL} className="stp-foot-link">
                  {localizedContent.learnMore}
                </a>
                <a
                  href={APP_STORE_URL}
                  className="stp-foot-link"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {localizedContent.downloadPack}
                </a>
              </span>
            </footer>
          </div>
        )}
      </div>
    </>
  );
};

const SharedTravelPlanLoader: React.FC<{
  readonly localizedContent: SharedTravelContent;
  readonly recaptchaState: 'loading' | 'ready' | 'unavailable';
  readonly setActionFeedback: React.Dispatch<React.SetStateAction<string | null>>;
  readonly setError: React.Dispatch<React.SetStateAction<string | null>>;
  readonly setLoading: React.Dispatch<React.SetStateAction<boolean>>;
  readonly setTravelPlan: React.Dispatch<React.SetStateAction<SharedTravelPlan | null>>;
  readonly shareId: string;
}> = ({
  localizedContent,
  recaptchaState,
  setActionFeedback,
  setError,
  setLoading,
  setTravelPlan,
  shareId,
}) => {
  useMountEffect(() => {
    if (!shareId) {
      setError(localizedContent.invalidShareLink);
      setLoading(false);
      return;
    }

    // Wait for reCAPTCHA to settle; the remount (keyed on recaptchaState)
    // fires the fetch exactly once, with a token whenever one is possible.
    if (recaptchaState === 'loading') {
      return;
    }

    const loadPlan = async (): Promise<void> => {
      try {
        setLoading(true);
        setError(null);

        const recaptchaToken = await (async (): Promise<string | null> => {
          if (!RECAPTCHA_SITE_KEY || recaptchaState !== 'ready') {
            return null;
          }
          try {
            return await executeRecaptchaAction('shared_travel_plan_view', RECAPTCHA_SITE_KEY);
          } catch {
            setActionFeedback(localizedContent.securityUnavailable);
            return null;
          }
        })();

        const sharePath = `api/share/${encodeURIComponent(shareId)}`;
        const url = new URL(sharePath, `${SHARED_PLAN_API_BASE.replace(/\/+$/, "")}/`);
        if (recaptchaToken) {
          url.searchParams.set('recaptchaToken', recaptchaToken);
        }

        // The token travels ONLY as a query param. A custom X-Recaptcha-Token
        // header turns this GET into a preflighted request, and the API
        // Gateway OPTIONS mock answers with a single static allow-origin —
        // the browser on trips.trypackai.com then blocks the fetch before it
        // ever reaches the lambda (the 2026-08-05 "Unable to load this trip"
        // incident). Keep this a simple request: no custom headers.
        const response = await fetch(url.toString());

        const contentType = response.headers.get('content-type') ?? '';
        const rawText = await response.text();

        let parsedJson: unknown = null;
        if (contentType.includes('application/json')) {
          try {
            parsedJson = JSON.parse(rawText);
          } catch {
            // fall through to error handling below
          }
        }

        if (!response.ok) {
          const errorPayload =
            parsedJson && typeof parsedJson === 'object'
              ? (parsedJson as { readonly error?: unknown; readonly message?: unknown })
              : null;
          const message =
            (typeof errorPayload?.error === 'string' && errorPayload.error) ||
            (typeof errorPayload?.message === 'string' && errorPayload.message) ||
            rawText.slice(0, 200) ||
            localizedContent.sharedLinkNotFound;
          throw new Error(message);
        }

        if (!parsedJson) {
          throw new Error(rawText ? rawText.slice(0, 200) : localizedContent.unexpectedServerResponse);
        }

        // Per-chunk salvage: one unrenderable chunk must not blank the whole
        // trip, so invalid entries are dropped before the strict data parse
        // (mirrors the server's create-time sanitizeChunks).
        const envelope = parsedJson as {
          success?: unknown;
          data?: Record<string, unknown> | null;
          error?: unknown;
        };
        if (envelope.success !== true || !envelope.data) {
          throw new Error(
            (typeof envelope.error === 'string' && envelope.error) ||
              localizedContent.failedToLoadPlan,
          );
        }
        const keepValidChunks = <S extends z.ZodTypeAny>(
          schema: S,
          items: unknown,
        ): Array<z.infer<S>> =>
          Array.isArray(items)
            ? items.flatMap((item) => {
                const result = schema.safeParse(item);
                return result.success ? [result.data] : [];
              })
            : [];
        const plan = SharedTravelDataSchema.parse({
          ...envelope.data,
          chunks: keepValidChunks(SharedTravelChunkSchema, envelope.data.chunks),
          outlineChunks: keepValidChunks(
            SharedTravelOutlineChunkSchema,
            envelope.data.outlineChunks,
          ),
        });

        setTravelPlan(plan);
      } catch (err) {
        if (err instanceof z.ZodError) {
          setError(localizedContent.unexpectedData);
        } else {
          setError(err instanceof Error ? err.message : String(err));
        }
      } finally {
        setLoading(false);
      }
    };

    void loadPlan();
  });

  return null;
};

/**
 * Page-scoped styles on the website's tokens (index.css custom properties)
 * with the app's hierarchy: hairline borders, boxed info bands, tinted icon
 * discs, accent weekday dates. Mobile-first — most opens are 390px iMessage
 * taps — with a single 680px column on desktop.
 */
const SHARE_PAGE_CSS = `
.stp-page {
  --stp-text: var(--color-text-primary, #f7f0e3);
  --stp-text-secondary: var(--color-text-secondary, rgba(247, 240, 227, 0.72));
  --stp-text-tertiary: rgba(247, 240, 227, 0.5);
  --stp-accent: var(--color-accent, #f3d27a);
  --stp-bg: var(--color-bg-primary, #0f0d0b);
  --stp-card: rgba(247, 240, 227, 0.04);
  --stp-band: rgba(9, 8, 6, 0.5);
  --stp-hairline: rgba(247, 240, 227, 0.1);
  --stp-hairline-strong: rgba(247, 240, 227, 0.18);
  --stp-pill: rgba(247, 240, 227, 0.07);
  min-height: 100vh;
  background: var(--stp-bg);
  color: var(--stp-text);
}
.stp-shell {
  max-width: 680px;
  margin: 0 auto;
  padding: clamp(1rem, 4vw, 2rem) clamp(1rem, 4vw, 1.5rem) 3rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}
.stp-center {
  min-height: 70vh;
  justify-content: center;
}

/* Header */
.stp-hero {
  position: relative;
  border-radius: 20px;
  overflow: hidden;
  aspect-ratio: 16 / 9;
  max-height: 300px;
  border: 1px solid var(--stp-hairline);
  margin-bottom: 1.1rem;
}
.stp-hero-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}
.stp-hero-fade {
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, transparent 55%, rgba(15, 13, 11, 0.65) 100%);
  pointer-events: none;
}
.stp-title {
  margin: 0;
  font-family: var(--font-display-serif, Georgia, serif);
  font-weight: 580;
  font-size: clamp(1.7rem, 6vw, 2.35rem);
  line-height: 1.12;
  letter-spacing: -0.01em;
}
.stp-head-meta {
  margin-top: 0.55rem;
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  column-gap: 0.85rem;
  row-gap: 0.2rem;
}
.stp-head-dates {
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--stp-accent);
  font-variant-numeric: tabular-nums;
}
.stp-head-daycount {
  color: var(--stp-text-secondary);
  font-weight: 500;
}
.stp-head-sharedby {
  font-size: 0.82rem;
  color: var(--stp-text-tertiary);
}

/* Actions */
.stp-actions {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}
.stp-actions-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.6rem;
}
.stp-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.45rem;
  border-radius: 14px;
  padding: 0.85rem 0.75rem;
  font-size: 0.95rem;
  font-weight: 650;
  font-family: inherit;
  text-decoration: none;
  cursor: pointer;
  white-space: nowrap;
  transition: filter 120ms ease, background 120ms ease;
  -webkit-tap-highlight-color: transparent;
}
@media (max-width: 400px) {
  .stp-actions-row .stp-btn { font-size: 0.86rem; gap: 0.35rem; }
}
.stp-btn-primary {
  background: var(--stp-accent);
  color: #171205;
  border: 1px solid var(--stp-accent);
}
.stp-btn-primary:hover { filter: brightness(1.06); }
.stp-btn-ghost {
  background: var(--stp-card);
  color: var(--stp-text);
  border: 1px solid var(--stp-hairline);
}
.stp-btn-ghost:hover { background: rgba(247, 240, 227, 0.08); }
.stp-feedback {
  min-height: 1rem;
  font-size: 0.82rem;
  color: var(--stp-text-tertiary);
}

/* Google Calendar per-event chooser */
.stp-gcal-panel {
  border: 1px solid var(--stp-hairline);
  border-radius: 14px;
  background: var(--stp-card);
  padding: 0.7rem;
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
}
.stp-gcal-label { padding: 0 0.3rem 0.4rem; }
.stp-gcal-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 0.55rem 0.45rem;
  border-radius: 10px;
  color: var(--stp-text);
  text-decoration: none;
  font-size: 0.88rem;
}
.stp-gcal-row:hover { background: rgba(247, 240, 227, 0.06); }
.stp-gcal-row + .stp-gcal-row { border-top: 1px solid var(--stp-hairline); border-radius: 0 0 10px 10px; }
.stp-gcal-row-lead {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  min-width: 0;
  color: var(--stp-text);
}
.stp-gcal-row-lead svg { color: var(--stp-accent); flex-shrink: 0; }
.stp-gcal-row-title {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-weight: 600;
}
.stp-gcal-row-date {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  color: var(--stp-text-secondary);
  font-variant-numeric: tabular-nums;
  flex-shrink: 0;
  font-size: 0.8rem;
}

/* Timeline section */
.stp-section-head {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  margin-bottom: 0.8rem;
}
.stp-section-title {
  margin: 0;
  font-size: 0.95rem;
  font-weight: 650;
  letter-spacing: 0.01em;
}
.stp-cards {
  display: flex;
  flex-direction: column;
  gap: 0.65rem;
}
.stp-card {
  border: 1px solid var(--stp-hairline);
  border-radius: 16px;
  background: var(--stp-card);
  padding: 0.85rem 0.95rem;
}
.stp-card-title {
  margin: 0.55rem 0 0;
  font-size: 0.98rem;
  font-weight: 700;
  line-height: 1.3;
}
.stp-card-detail {
  margin: 0.3rem 0 0;
  display: flex;
  flex-wrap: wrap;
  gap: 0.3rem 0.9rem;
  font-size: 0.83rem;
  color: var(--stp-text-secondary);
}
.stp-card-detail svg { color: var(--stp-text-tertiary); }
.stp-card-time, .stp-card-place {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
}
.stp-card > .stp-band { margin-top: 0.65rem; }

/* Kicker: icon disc + uppercase micro-label + accent date */
.stp-kicker {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
}
.stp-kicker-lead {
  display: inline-flex;
  align-items: center;
  gap: 0.55rem;
  min-width: 0;
}
.stp-kicker-label {
  font-size: 0.68rem;
  font-weight: 700;
  letter-spacing: 0.09em;
  text-transform: uppercase;
  color: var(--stp-text-secondary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.stp-icondisc {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: rgba(243, 210, 122, 0.12);
  border: 1px solid rgba(243, 210, 122, 0.2);
  color: var(--stp-accent);
}
.stp-booked {
  font-size: 0.66rem;
  font-weight: 700;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: var(--color-success, #10b981);
  background: rgba(16, 185, 129, 0.12);
  border-radius: 999px;
  padding: 0.15rem 0.5rem;
  flex-shrink: 0;
}

/* Accent weekday date badge */
.stp-datebadge {
  display: inline-flex;
  align-items: baseline;
  gap: 0.3rem;
  font-size: 0.85rem;
  flex-shrink: 0;
}
.stp-datebadge-weekday {
  color: var(--stp-accent);
  font-weight: 700;
}
.stp-datebadge-rest {
  color: var(--stp-text);
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}

/* Boxed hairline info bands (app plan-card signature) */
.stp-band {
  border: 1px solid var(--stp-hairline);
  border-radius: 12px;
  background: var(--stp-band);
  padding: 0.7rem 0.8rem;
}
.stp-band-route {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
}
.stp-route-endpoint {
  font-size: 0.95rem;
  font-weight: 700;
  letter-spacing: 0.01em;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.stp-route-endpoint-right { text-align: right; }
.stp-route-rail {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0 0.4rem;
  min-width: 70px;
}
.stp-route-line {
  flex: 1;
  height: 1px;
  background: var(--stp-hairline-strong);
}
.stp-route-pill {
  display: inline-flex;
  align-items: center;
  padding: 0.28rem 0.55rem;
  border-radius: 999px;
  background: var(--stp-pill);
  color: var(--stp-accent);
}
.stp-band-stay {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.75rem;
}
.stp-stay-col {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  min-width: 0;
}
.stp-stay-col-right { align-items: flex-end; text-align: right; }
.stp-microlabel {
  font-size: 0.62rem;
  font-weight: 700;
  letter-spacing: 0.09em;
  text-transform: uppercase;
  color: var(--stp-text-secondary);
}
.stp-nights-pill {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  align-self: center;
  padding: 0.3rem 0.6rem;
  border-radius: 999px;
  background: var(--stp-pill);
  color: var(--stp-text);
  font-size: 0.78rem;
  font-weight: 600;
  flex-shrink: 0;
}
.stp-nights-pill svg { color: var(--stp-accent); }

/* Empty / status / footer */
.stp-empty {
  border: 1px dashed var(--stp-hairline-strong);
  border-radius: 14px;
  padding: 1.1rem;
  text-align: center;
  color: var(--stp-text-secondary);
  font-size: 0.9rem;
}
.stp-status-card {
  border: 1px solid var(--stp-hairline);
  border-radius: 18px;
  background: var(--stp-card);
  padding: 2rem 1.5rem;
  text-align: center;
  max-width: 460px;
  margin: 0 auto;
  width: 100%;
}
.stp-status-title {
  margin: 0 0 0.35rem;
  font-family: var(--font-display-serif, Georgia, serif);
  font-weight: 560;
  font-size: 1.35rem;
}
.stp-status-body {
  margin: 0;
  color: var(--stp-text-secondary);
  font-size: 0.92rem;
}
.stp-status-home {
  margin-top: 1.1rem;
}
.stp-loading-disc {
  display: block;
  width: 34px;
  height: 34px;
  margin: 0 auto 0.9rem;
  border-radius: 50%;
  border: 2px solid rgba(243, 210, 122, 0.25);
  border-top-color: var(--stp-accent);
  animation: stp-spin 0.9s linear infinite;
}
@keyframes stp-spin { to { transform: rotate(360deg); } }
@media (prefers-reduced-motion: reduce) {
  .stp-loading-disc { animation: none; }
}
.stp-foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  border-top: 1px solid var(--stp-hairline);
  padding-top: 1rem;
  font-size: 0.82rem;
  color: var(--stp-text-tertiary);
}
.stp-foot-links { display: inline-flex; gap: 1rem; }
.stp-foot-link {
  color: var(--stp-text-secondary);
  text-decoration: none;
  font-weight: 600;
}
.stp-foot-link:hover { color: var(--stp-text); }
`;
