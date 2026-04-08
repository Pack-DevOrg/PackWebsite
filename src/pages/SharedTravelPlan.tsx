/**
 * Shared Travel Plan Page
 *
 * Displays a shared travel plan from a universal link with rich social media previews.
 * Uses schema-first validation to keep shared data safe to render on web.
 */

import React, { useCallback, useMemo, useState } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { z } from 'zod';
import { CalendarRange, Download, Plane, ShieldCheck, Sparkles, ExternalLink } from 'lucide-react';
import { executeRecaptchaAction, loadRecaptchaScript } from '../utils/recaptcha';
import { appConfig } from '../config/appConfig';
import { useMountEffect } from '../hooks/useMountEffect';
import { useI18n } from '../i18n/I18nProvider';
import type { SupportedLocale } from '../i18n/config';

// Environment variables with fallbacks
const WEBSITE_URL = import.meta.env.VITE_WEBSITE_URL || 'https://trypackai.com';
const RECAPTCHA_SITE_KEY = import.meta.env.VITE_RECAPTCHA_SITE_KEY || '';
const SHARED_PLAN_API_BASE = import.meta.env.VITE_API_URL || appConfig.apiBaseUrl;

// App Store links - iOS and Android
// These deep link back to the shared plan when user opens app from store
const APPLE_APP_ID = import.meta.env.VITE_APPLE_APP_ID || ''; // e.g., '6502345678'
const APP_STORE_URL = APPLE_APP_ID
  ? `https://apps.apple.com/app/pack/id${APPLE_APP_ID}`
  : 'https://apps.apple.com/search/app/pack'; // Fallback to search
const APP_SCHEME_PREFIX = 'com.packai.app://';

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

const SharedTravelOutlineChunkSchema = z.union([
  SharedTravelFlightOutlineChunkSchema,
  SharedTravelHotelOutlineChunkSchema,
]);

const SharedTravelChunkSchema = z.union([
  SharedTravelFlightChunkSchema,
  SharedTravelHotelChunkSchema,
  SharedTravelFlightOutlineChunkSchema,
  SharedTravelHotelOutlineChunkSchema,
]);

const SharedTravelDataSchema = z.object({
  version: z.literal('1.0'),
  title: z.string(),
  description: z.string().optional(),
  chunks: z.array(SharedTravelChunkSchema),
  outlineChunks: z.array(SharedTravelOutlineChunkSchema).default([]),
  createdAt: z.string().datetime(),
  sharedBy: z.string().optional(),
  thumbnailUrl: z.string().url().optional(),
});

const SharedTravelResponseSchema = z.object({
  success: z.boolean(),
  data: SharedTravelDataSchema.optional(),
  error: z.string().optional(),
});

type SharedTravelPlan = z.infer<typeof SharedTravelDataSchema>;
type SharedTravelChunk = z.infer<typeof SharedTravelChunkSchema>;
type SharedTravelOutlineChunk = z.infer<typeof SharedTravelOutlineChunkSchema>;
type SharedTravelHotelChunk = z.infer<typeof SharedTravelHotelChunkSchema>;
type SharedTravelHotelOutlineChunk = z.infer<typeof SharedTravelHotelOutlineChunkSchema>;
type SharedTravelFlightChunk = z.infer<typeof SharedTravelFlightChunkSchema>;
type SharedTravelFlightOutlineChunk = z.infer<typeof SharedTravelFlightOutlineChunkSchema>;

interface TimelineItem {
  startDate: string;
  chunk: SharedTravelChunk | SharedTravelOutlineChunk;
}

const formatDate = (dateString: string, locale: SupportedLocale): string => {
  const date = new Date(dateString);
  return Number.isNaN(date.getTime())
    ? ''
    : date.toLocaleDateString(locale === 'es' ? 'es-ES' : 'en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      });
};

type SharedTravelContent = {
  fallbackSharedBy: string;
  invalidDescription: string;
  sharedTravelPlanTitle: string;
  ogLocale: string;
  openInAppFeedback: string;
  noDatesFeedback: string;
  calendarDownloadedFeedback: string;
  downloadAppFeedback: string;
  loadingTitle: string;
  loadingBody: string;
  unableTitle: string;
  invalidLink: string;
  returnHome: string;
  sharedTripBadge: string;
  secureLink: string;
  sharedSubtitle: string;
  addToCalendar: string;
  openInDoneAi: string;
  downloadDoneAi: string;
  tripTimeline: string;
  tripTimelineBody: string;
  noTimeline: string;
  noTimelineBody: string;
  learnMore: string;
  flightLabel: string;
  plannedFlightLabel: string;
  stayLabel: string;
  flightOption: string;
  stay: string;
  outlineHolds: string;
  alreadyBooked: string;
  checkOut: string;
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
    noDatesFeedback: 'No dated flights or stays yet. We will add calendar exports once dates are available.',
    calendarDownloadedFeedback: 'Calendar file downloaded. Import it into your calendar to hold the dates.',
    downloadAppFeedback: 'Download Pack will be available soon - stay tuned!',
    loadingTitle: 'Loading shared travel plan...',
    loadingBody: "We're pulling the trip details.",
    unableTitle: 'Unable to Load Travel Plan',
    invalidLink: 'This link may have expired or is invalid.',
    returnHome: 'Return to Pack',
    sharedTripBadge: 'Shared Trip',
    secureLink: 'Secure link',
    sharedSubtitle: 'Shared from Pack',
    addToCalendar: 'Add to calendar (.ics)',
    openInDoneAi: 'Open in Pack',
    downloadDoneAi: 'Download Pack',
    tripTimeline: 'Trip timeline',
    tripTimelineBody: "Quick peek from the app's timeline view.",
    noTimeline: 'No flights or stays yet. Once your trip is ready, you\'ll see it here.',
    noTimelineBody: '',
    learnMore: 'Learn more about Pack',
    flightLabel: 'Flight',
    plannedFlightLabel: 'Planned Flight',
    stayLabel: 'Stay',
    flightOption: 'Flight option',
    stay: 'Stay',
    outlineHolds: 'Outline holds',
    alreadyBooked: 'Already booked',
    checkOut: 'Check-out',
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
    noDatesFeedback: 'Todavía no hay vuelos o estancias con fecha. Agregaremos exportaciones al calendario cuando haya fechas disponibles.',
    calendarDownloadedFeedback: 'Archivo de calendario descargado. Impórtalo en tu calendario para guardar las fechas.',
    downloadAppFeedback: 'La descarga de Pack estará disponible pronto.',
    loadingTitle: 'Cargando plan de viaje compartido...',
    loadingBody: 'Estamos trayendo los detalles del viaje.',
    unableTitle: 'No se pudo cargar el plan de viaje',
    invalidLink: 'Este enlace puede haber expirado o no ser válido.',
    returnHome: 'Volver a Pack',
    sharedTripBadge: 'Viaje compartido',
    secureLink: 'Enlace seguro',
    sharedSubtitle: 'Compartido desde Pack',
    addToCalendar: 'Agregar al calendario (.ics)',
    openInDoneAi: 'Abrir en Pack',
    downloadDoneAi: 'Descargar Pack',
    tripTimeline: 'Cronología del viaje',
    tripTimelineBody: 'Vista rápida desde la línea de tiempo de la app.',
    noTimeline: 'Todavía no hay vuelos ni estancias. Cuando el viaje esté listo, aparecerá aquí.',
    noTimelineBody: '',
    learnMore: 'Conoce más sobre Pack',
    flightLabel: 'Vuelo',
    plannedFlightLabel: 'Vuelo planeado',
    stayLabel: 'Estancia',
    flightOption: 'Opción de vuelo',
    stay: 'Estancia',
    outlineHolds: 'Elementos del esquema',
    alreadyBooked: 'Ya reservado',
    checkOut: 'Salida',
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
    const summary =
      chunk.type === 'flight'
        ? `${localizedContent.flightLabel}: ${chunk.origin} -> ${chunk.destination}`
        : chunk.type === 'flightOutline'
        ? `${localizedContent.plannedFlightLabel}: ${chunk.origin} -> ${chunk.destination}`
        : `${localizedContent.stayLabel}: ${(chunk as SharedTravelHotelChunk | SharedTravelHotelOutlineChunk).name || chunk.location}`;

    const startDate =
      chunk.type === 'hotel' || chunk.type === 'hotelOutline'
        ? chunk.checkIn
        : chunk.date;

    const formattedStart = startDate ? formatDateForIcs(startDate) : null;
    if (!formattedStart) {
      return;
    }

    const endDate =
      chunk.type === 'hotel' || chunk.type === 'hotelOutline'
        ? formatDateForIcs(chunk.checkOut || chunk.checkIn, 1)
        : formatDateForIcs(startDate, 1);

    const description =
      chunk.type === 'flight' || chunk.type === 'flightOutline'
        ? [
            (chunk as SharedTravelFlightChunk | SharedTravelFlightOutlineChunk).airline,
            (chunk as SharedTravelFlightChunk).flightNumber
              ? `Flight ${(chunk as SharedTravelFlightChunk).flightNumber}`
              : null,
          ]
            .filter(Boolean)
            .join(' - ')
        : chunk.location;

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
  const [recaptchaReady, setRecaptchaReady] = useState(false);
  const localizedContent = SHARED_TRAVEL_CONTENT[locale];

  useMountEffect(() => {
    if (RECAPTCHA_SITE_KEY) {
      void loadRecaptchaScript(RECAPTCHA_SITE_KEY).then(() => setRecaptchaReady(true)).catch(() => {
        // We still allow loading without recaptcha, but prefer to block bots where possible
        setRecaptchaReady(false);
      });
    }
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

  const ogImage =
    travelPlan?.thumbnailUrl ||
    `${WEBSITE_URL}/images/share-card.png?v=20260402b`;
  const ogImageAlt = travelPlan?.title ? `${travelPlan.title} - Pack` : 'Shared travel plan on Pack';
  const encodedShareId = hasShareId ? encodeURIComponent(shareId) : '';
  const ogUrl = `${WEBSITE_URL}${encodedShareId ? `/share/${encodedShareId}` : '/share'}`;

  const handleOpenInApp = useCallback(() => {
    if (!hasShareId) {
      return;
    }

    const encodedShareId = encodeURIComponent(shareId);
    const appScheme = `${APP_SCHEME_PREFIX}share/${encodedShareId}`;
    const universalLink = `${WEBSITE_URL}/share/${encodedShareId}`;

    window.location.href = appScheme;

    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    iframe.src = appScheme;
    document.body.appendChild(iframe);
    setTimeout(() => {
      document.body.removeChild(iframe);
    }, 900);

    setTimeout(() => {
      window.location.href = universalLink;
    }, 1400);

    if (APPLE_APP_ID) {
      setTimeout(() => {
        const userAgent = navigator.userAgent.toLowerCase();
        if (userAgent.includes('iphone') || userAgent.includes('ipad')) {
          window.location.href = APP_STORE_URL;
        }
      }, 2400);
    }
    setActionFeedback(localizedContent.openInAppFeedback);
  }, [hasShareId, localizedContent.openInAppFeedback, shareId]);

  const handleAddToCalendar = useCallback(() => {
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
    link.download = `doneai-shared-trip${shareId ? `-${shareId.slice(0, 6)}` : ''}.ics`;
    link.click();
    URL.revokeObjectURL(url);

    setActionFeedback(localizedContent.calendarDownloadedFeedback);
  }, [localizedContent.calendarDownloadedFeedback, localizedContent.noDatesFeedback, shareId, travelPlan]);

  const handleDownloadApp = useCallback(() => {
    setActionFeedback(localizedContent.downloadAppFeedback);
  }, [localizedContent.downloadAppFeedback]);

  const timelineItems: TimelineItem[] = useMemo(() => {
    if (!travelPlan) {
      return [];
    }
    const items: TimelineItem[] = [
      ...(travelPlan.chunks || []),
      ...(travelPlan.outlineChunks || []),
    ]
      .map((chunk) => {
        const startDate =
          chunk.type === 'hotel' || chunk.type === 'hotelOutline'
            ? chunk.checkIn
            : chunk.date;
        return { chunk, startDate };
      })
      .filter((item): item is TimelineItem => Boolean(item.startDate));

    return items.sort(
      (a, b) =>
        new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
    );
  }, [travelPlan]);

  const sharedSubtitle = travelPlan?.sharedBy
    ? `${travelPlan.sharedBy} ${localizedContent.fallbackSharedBy}`
    : localizedContent.sharedSubtitle;

  return (
    <>
      <SharedTravelPlanLoader
        key={`${shareId}:${recaptchaReady ? 'recaptcha' : 'no-recaptcha'}`}
        localizedContent={localizedContent}
        recaptchaReady={recaptchaReady}
        setActionFeedback={setActionFeedback}
        setError={setError}
        setLoading={setLoading}
        setTravelPlan={setTravelPlan}
        shareId={shareId}
      />
      <Helmet>
        <title>{ogTitle} - Pack</title>
        <meta name="description" content={ogDescription} />

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
        <meta name="twitter:url" content={ogUrl} />
        <meta name="twitter:title" content={ogTitle} />
        <meta name="twitter:description" content={ogDescription} />
        <meta name="twitter:image" content={ogImage} />
        <meta name="twitter:image:alt" content={ogImageAlt} />

        {APPLE_APP_ID && (
          <meta name="apple-itunes-app" content={`app-id=${APPLE_APP_ID}, app-argument=${ogUrl}`} />
        )}

        <link rel="canonical" href={ogUrl} />
      </Helmet>

      <div style={styles.page}>
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(180deg, rgba(255, 255, 255, 0.03), transparent 40%)',
            pointerEvents: 'none',
          }}
        />
        <div style={styles.content}>
          {loading ? (
            <div style={{ ...styles.card, textAlign: 'center', margin: '2rem auto', maxWidth: 520 }}>
              <h2>{localizedContent.loadingTitle}</h2>
              <p>{localizedContent.loadingBody}</p>
            </div>
          ) : error || !travelPlan ? (
            <div style={{ ...styles.card, textAlign: 'center', margin: '2rem auto', maxWidth: 520 }}>
              <h2>{localizedContent.unableTitle}</h2>
              <p>{error || localizedContent.invalidLink}</p>
              <a
                href={WEBSITE_URL}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.35rem',
                  marginTop: '0.75rem',
                  padding: '0.65rem 1rem',
                  borderRadius: 10,
                  background: 'rgba(255, 255, 255, 0.05)',
                  color: palette.accentSecondary,
                  textDecoration: 'none',
                }}
              >
                {localizedContent.returnHome}
              </a>
            </div>
          ) : (
            <>
              <div style={styles.card}>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '0.75rem',
                    flexWrap: 'wrap',
                  }}
                >
                  <span style={styles.badge}>{localizedContent.sharedTripBadge}</span>
                  <span style={styles.pill}>
                    <ShieldCheck size={16} />
                    <span>{localizedContent.secureLink}</span>
                  </span>
                </div>
                <h1
                  style={{
                    margin: '0.35rem 0 0.3rem 0',
                    fontSize: 'clamp(1.5rem, 4vw, 2.2rem)',
                    letterSpacing: '-0.02em',
                    color: palette.text,
                  }}
                >
                  {travelPlan.title}
                </h1>
                <p style={{ margin: 0, fontSize: '1.05rem', color: palette.textMuted }}>{sharedSubtitle}</p>
                <p style={{ margin: '0.75rem 0 1.5rem 0', color: palette.text, lineHeight: 1.7, maxWidth: 720 }}>
                  {rawDescription}
                </p>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                    gap: '0.75rem',
                    marginBottom: '0.75rem',
                  }}
                >
                  <button
                    onClick={handleAddToCalendar}
                    style={{
                      ...styles.buttonBase,
                      background: `linear-gradient(90deg, ${palette.accent}, #ffdd67)`,
                      color: '#0e0d0c',
                      boxShadow: '0 10px 30px rgba(240, 198, 45, 0.25)',
                    }}
                  >
                    <CalendarRange size={18} />
                    {localizedContent.addToCalendar}
                  </button>
                  <button
                    onClick={handleOpenInApp}
                    style={{
                      ...styles.buttonBase,
                      background: 'rgba(255, 255, 255, 0.05)',
                      color: palette.text,
                      border: `1px solid ${palette.border}`,
                    }}
                  >
                    <Sparkles size={18} />
                    {localizedContent.openInDoneAi}
                  </button>
                  <button
                    onClick={handleDownloadApp}
                    style={{
                      ...styles.buttonBase,
                      background: 'rgba(255, 255, 255, 0.03)',
                      color: palette.textMuted,
                      border: `1px dashed ${palette.border}`,
                    }}
                  >
                    <Download size={18} />
                    {localizedContent.downloadDoneAi}
                  </button>
                </div>
                {actionFeedback && (
                  <div style={{ marginTop: '0.5rem', color: palette.textMuted, fontSize: '0.9rem' }}>
                    {actionFeedback}
                  </div>
                )}
              </div>

              <section style={styles.timelineSection}>
                <header style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', marginBottom: '1rem' }}>
                  <h3 style={{ margin: 0, fontSize: '1.35rem', color: palette.text }}>{localizedContent.tripTimeline}</h3>
                  <span style={{ color: palette.textMuted, fontSize: '0.9rem' }}>
                    {localizedContent.tripTimelineBody}
                  </span>
                </header>

                {timelineItems.length === 0 ? (
                  <div
                    style={{
                      background: 'rgba(255, 255, 255, 0.03)',
                      border: `1px dashed ${palette.border}`,
                      borderRadius: 12,
                      padding: '1rem',
                      color: palette.textMuted,
                      textAlign: 'center' as const,
                    }}
                  >
                    <p>{localizedContent.noTimeline}</p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {timelineItems.map((item) => {
                      const key = `${item.chunk.type}-${item.chunk.id}`;
                      const isFlight =
                        item.chunk.type === 'flight' || item.chunk.type === 'flightOutline';
                      const title = isFlight
                        ? `${item.chunk.origin} -> ${item.chunk.destination}`
                        : (item.chunk as SharedTravelHotelChunk | SharedTravelHotelOutlineChunk).name ||
                          item.chunk.location;
                      const dateLabel = formatDate(item.startDate, locale);
                      const meta =
                        item.chunk.type === 'flight' || item.chunk.type === 'flightOutline'
                          ? (item.chunk as SharedTravelFlightChunk).airline || localizedContent.flightLabel
                          : localizedContent.stay;

                      return (
                        <div key={key} style={styles.timelineItemRow}>
                          <div
                            style={{
                              width: 12,
                              height: 12,
                              marginTop: '0.55rem',
                              borderRadius: '50%',
                              background: palette.accent,
                              boxShadow: '0 0 0 6px rgba(240, 198, 45, 0.15)',
                              position: 'relative',
                            }}
                          >
                            <div
                              style={{
                                position: 'absolute',
                                left: '50%',
                                top: 14,
                                bottom: -14,
                                transform: 'translateX(-50%)',
                                width: 1,
                                background: palette.border,
                              }}
                            />
                          </div>
                          <div
                            style={{
                              background: 'rgba(255, 255, 255, 0.04)',
                              border: `1px solid ${palette.border}`,
                              borderRadius: 14,
                              padding: '0.85rem 1rem',
                              boxShadow: '0 10px 22px rgba(0, 0, 0, 0.25)',
                            }}
                          >
                            <div
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                color: palette.textMuted,
                                fontSize: '0.9rem',
                              }}
                            >
                              {isFlight ? <Plane size={18} /> : <CalendarRange size={18} />}
                              <span>{meta}</span>
                              {dateLabel && <strong style={{ color: palette.text }}>{dateLabel}</strong>}
                            </div>
                            <div
                              style={{
                                margin: '0.35rem 0',
                                fontSize: '1.05rem',
                                fontWeight: 700,
                                color: palette.text,
                              }}
                            >
                              {title}
                            </div>
                            {isFlight && (item.chunk as SharedTravelFlightChunk).flightNumber && (
                              <div style={{ color: palette.textMuted, fontSize: '0.9rem' }}>
                                {localizedContent.flightLabel} {(item.chunk as SharedTravelFlightChunk).flightNumber}
                              </div>
                            )}
                            {!isFlight && (item.chunk as SharedTravelHotelChunk | SharedTravelHotelOutlineChunk).checkOut && (
                              <div style={{ color: palette.textMuted, fontSize: '0.9rem' }}>
                                {localizedContent.checkOut}:{' '}
                                {formatDate(
                                  (item.chunk as SharedTravelHotelChunk | SharedTravelHotelOutlineChunk).checkOut!,
                                  locale
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                <a
                  href={WEBSITE_URL}
                  style={{
                    marginTop: '1.25rem',
                    display: 'inline-flex',
                    gap: '0.4rem',
                    alignItems: 'center',
                    color: palette.accentSecondary,
                    textDecoration: 'none',
                    fontWeight: 700,
                  }}
                >
                  {localizedContent.learnMore}
                  <ExternalLink size={16} />
                </a>
              </section>
            </>
          )}
        </div>
      </div>
    </>
  );
};

const SharedTravelPlanLoader: React.FC<{
  readonly localizedContent: SharedTravelContent;
  readonly recaptchaReady: boolean;
  readonly setActionFeedback: React.Dispatch<React.SetStateAction<string | null>>;
  readonly setError: React.Dispatch<React.SetStateAction<string | null>>;
  readonly setLoading: React.Dispatch<React.SetStateAction<boolean>>;
  readonly setTravelPlan: React.Dispatch<React.SetStateAction<SharedTravelPlan | null>>;
  readonly shareId: string;
}> = ({
  localizedContent,
  recaptchaReady,
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

    const loadPlan = async (): Promise<void> => {
      try {
        setLoading(true);
        setError(null);

        const recaptchaToken = await (async (): Promise<string | null> => {
          if (!RECAPTCHA_SITE_KEY || !recaptchaReady) {
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

        const response = await fetch(url.toString(), {
          headers: recaptchaToken ? { 'X-Recaptcha-Token': recaptchaToken } : undefined,
        });

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
          const message =
            (parsedJson as any)?.error ||
            (parsedJson as any)?.message ||
            rawText.slice(0, 200) ||
            localizedContent.sharedLinkNotFound;
          throw new Error(message);
        }

        if (!parsedJson) {
          throw new Error(rawText ? rawText.slice(0, 200) : localizedContent.unexpectedServerResponse);
        }

        const parsed = SharedTravelResponseSchema.parse(parsedJson);
        if (!parsed.success || !parsed.data) {
          throw new Error(parsed.error || localizedContent.failedToLoadPlan);
        }

        setTravelPlan(parsed.data);
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

const palette = {
  bg: '#0e0d0c',
  panel: 'rgba(255,255,255,0.03)',
  border: 'rgba(255,255,255,0.12)',
  text: '#f5f5f5',
  textMuted: '#c2c2c2',
  accent: '#f0c62d',
  accentSecondary: '#e72340',
};

const styles = {
  page: {
    minHeight: '100vh',
    background: `
      radial-gradient(120% 140% at 20% 20%, rgba(240, 198, 45, 0.06), transparent),
      radial-gradient(120% 140% at 80% 0%, rgba(231, 35, 64, 0.08), transparent),
      ${palette.bg}
    `,
    color: palette.text,
    position: 'relative' as const,
    padding: 'clamp(1.25rem, 4vw, 2rem)',
  },
  content: {
    position: 'relative' as const,
    zIndex: 1,
    maxWidth: 960,
    margin: '0 auto',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 'clamp(1rem, 3vw, 1.5rem)',
  },
  card: {
    background: palette.panel,
    border: `1px solid ${palette.border}`,
    borderRadius: 18,
    padding: 'clamp(1.25rem, 4vw, 1.75rem)',
    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.35)',
  },
  badge: {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '0.45rem 0.75rem',
    borderRadius: 999,
    background: `linear-gradient(90deg, ${palette.accent}, ${palette.accentSecondary})`,
    color: '#0e0d0c',
    fontWeight: 700,
    fontSize: '0.85rem',
    letterSpacing: '0.02em',
  },
  pill: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.4rem',
    padding: '0.4rem 0.65rem',
    borderRadius: 12,
    background: 'rgba(16, 185, 129, 0.08)',
    color: palette.textMuted,
    border: '1px solid rgba(16, 185, 129, 0.25)',
    fontSize: '0.85rem',
  },
  buttonBase: {
    border: 'none',
    outline: 'none',
    cursor: 'pointer',
    borderRadius: 12,
    padding: '0.85rem 1rem',
    fontWeight: 700,
    fontSize: '1rem',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5rem',
    transition: 'transform 120ms ease, box-shadow 120ms ease, background 120ms ease',
  },
  timelineSection: {
    background: 'rgba(255, 255, 255, 0.02)',
    border: `1px solid ${palette.border}`,
    borderRadius: 18,
    padding: 'clamp(1rem, 3vw, 1.25rem)',
    boxShadow: '0 15px 45px rgba(0, 0, 0, 0.28)',
  },
  timelineItemRow: {
    display: 'grid',
    gridTemplateColumns: '28px 1fr',
    gap: '0.5rem',
    alignItems: 'flex-start',
  },
};
