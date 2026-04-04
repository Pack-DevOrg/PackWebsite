/**
 * TrackingProvider - Comprehensive tracking implementation for the Pack website
 * 
 * Features:
 * - Facebook Pixel (Meta Pixel) integration with consent management
 * - Google Analytics 4 (GA4) integration with enhanced events
 * - Privacy-compliant consent management
 * - Dynamic loading for performance optimization
 * - TypeScript support with proper type definitions
 * 
 * Based on 2025 best practices for conversion optimization and privacy compliance.
 */

import React, {createContext, useCallback, useContext, useEffect, useRef, useState} from 'react';
import { clearTrackingCookies, getCookie, setCookie } from '../utils/cookies';
import { env } from '../utils/env';
import { CONSENT_COOKIE_KEY, CONSENT_TIMESTAMP_COOKIE_KEY, CONSENT_MAX_AGE_SECONDS } from '../constants/consent';
import { logConsentEvent } from '../services/consentLogger';
import {
  ConsentStatusSchema,
  DEFAULT_CONSENT_PREFERENCES,
  deriveConsentState,
  parseConsentPreferences,
  type ConsentPreferences,
  type ConsentStatus,
} from '../tracking/consent';
import { useMountEffect } from '@/hooks/useMountEffect';

type IdleRequestDeadline = {
  readonly didTimeout: boolean;
  timeRemaining: () => number;
};

type IdleRequestCallback = (deadline: IdleRequestDeadline) => void;

interface IdleRequestOptions {
  readonly timeout?: number;
}

// Type definitions for tracking services
interface TrackingContextType {
  isGtmLoaded: boolean;
  isGA4Loaded: boolean;
  isMetaPixelLoaded: boolean;
  isTikTokPixelLoaded: boolean;
  hasConsent: boolean;
  hasAnalyticsConsent: boolean;
  hasMarketingConsent: boolean;
  gpcApplies: boolean;
  trackEvent: (eventName: string, parameters?: Record<string, unknown>) => void;
  trackPageView: (page: string) => void;
  grantConsent: (status?: 'granted' | 'partial') => void;
  revokeConsent: (status?: 'rejected' | 'revoked' | 'gpc') => void;
  applyConsentDecision: (input: {status: ConsentStatus; preferences: ConsentPreferences}) => void;
  openPrivacyPreferences: () => void;
}

interface TrackingProviderProps {
  children: React.ReactNode;
  gtmId?: string;
  enableGA4?: boolean;
  enableMetaPixel?: boolean;
  enableTikTokPixel?: boolean;
  ga4MeasurementId?: string;
  metaPixelId?: string;
  tikTokPixelId?: string;
}

// Extend window object for tracking scripts
declare global {
  type FbqFunction = ((...args: unknown[]) => void) & {
    loaded?: boolean;
    version?: string;
    queue?: unknown[][];
    push?: FbqFunction;
    callMethod?: (...args: unknown[]) => void;
  };

  interface Window {
    gtag?: (...args: unknown[]) => void;
    dataLayer?: unknown[];
    fbq?: FbqFunction;
    _fbq?: unknown;
    ttq?: Array<unknown> & {loaded?: boolean; page?: (...args: unknown[]) => void; track?: (...args: unknown[]) => void};
    requestIdleCallback?: (callback: IdleRequestCallback, options?: IdleRequestOptions) => number;
    cancelIdleCallback?: (handle: number) => void;
  }
}

const TrackingContext = createContext<TrackingContextType | undefined>(undefined);
export const OPEN_PRIVACY_PREFERENCES_EVENT = 'doneai:open-privacy-preferences';

const CONSENT_ID_COOKIE_KEY = 'tracking-consent-id';
const CONSENT_VERSION = 'website-consent-2025-10-09';
const TRACKING_QUERY_PARAMETERS = [
  'gclid',
  'gclsrc',
  'wbraid',
  'gbraid',
  'fbclid',
  'ttclid',
  'msclkid',
  'twclid',
] as const;

const generateConsentId = (): string => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `consent_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
};

// Lazily load the analytics runtime so the main bundle stays lean.
let trackingRuntimePromise:
  | Promise<typeof import('../tracking/runtime')>
  | undefined;

const getTrackingRuntime = () => {
  if (!trackingRuntimePromise) {
    trackingRuntimePromise = import('../tracking/runtime');
  }
  return trackingRuntimePromise;
};

const runWhenIdle = (task: () => void) => {
  if (typeof window === 'undefined') {
    task();
    return () => undefined;
  }

  if (typeof window.requestIdleCallback === 'function') {
    const handle = window.requestIdleCallback(() => {
      task();
    });

    return () => {
      if (typeof window.cancelIdleCallback === 'function') {
        window.cancelIdleCallback(handle);
      }
    };
  }

  const timeout = window.setTimeout(task, 0);
  return () => window.clearTimeout(timeout);
};

const summarizeTrackingPayloadForLogs = (payload: Record<string, unknown>): {
  keyCount: number;
  keys: string[];
} => {
  const keys = Object.keys(payload);
  return { keyCount: keys.length, keys: keys.slice(0, 25) };
};

const summarizePathForLogs = (path: string): { path: string; hasQuery: boolean } => {
  const [pathOnly, query] = path.split('?', 2);
  return { path: pathOnly, hasQuery: Boolean(query) };
};

const pushDataLayerEvent = (
  eventName: string,
  parameters: Record<string, unknown>,
): void => {
  if (typeof window === 'undefined') {
    return;
  }

  window.dataLayer = window.dataLayer || [];

  const sanitizedEntries = Object.entries(parameters).filter(([, value]) => value !== undefined);
  window.dataLayer.push({
    event: eventName,
    ...Object.fromEntries(sanitizedEntries),
  });
};

const stripTrackingQueryParametersFromUrl = (): void => {
  if (typeof window === 'undefined') {
    return;
  }

  const url = new URL(window.location.href);
  let changed = false;

  for (const parameter of TRACKING_QUERY_PARAMETERS) {
    if (url.searchParams.has(parameter)) {
      url.searchParams.delete(parameter);
      changed = true;
    }
  }

  if (!changed) {
    return;
  }

  const nextSearch = url.searchParams.toString();
  const nextUrl = `${url.pathname}${nextSearch ? `?${nextSearch}` : ''}${url.hash}`;
  window.history.replaceState({}, document.title, nextUrl);
};

/**
 * TrackingProvider Component
 * 
 * Manages all tracking implementations with privacy compliance and performance optimization
 */
export const TrackingProvider: React.FC<TrackingProviderProps> = ({
  children,
  gtmId = env.VITE_GTM_ID as string | undefined,
  enableGA4 = true,
  enableMetaPixel = true,
  enableTikTokPixel = true,
  ga4MeasurementId = env.VITE_GA4_MEASUREMENT_ID as string | undefined,
  metaPixelId = env.VITE_META_PIXEL_ID as string | undefined,
  tikTokPixelId = env.VITE_TIKTOK_PIXEL_ID as string | undefined,
}) => {
  const [isGtmLoaded, setIsGtmLoaded] = useState(false);
  const [isGA4Loaded, setIsGA4Loaded] = useState(false);
  const [isMetaPixelLoaded, setIsMetaPixelLoaded] = useState(false);
  const [isTikTokPixelLoaded, setIsTikTokPixelLoaded] = useState(false);
  const [hasConsent, setHasConsent] = useState(false);
  const [hasAnalyticsConsent, setHasAnalyticsConsent] = useState(false);
  const [hasMarketingConsent, setHasMarketingConsent] = useState(false);
  const [gpcApplies, setGpcApplies] = useState(false);
  const [consentId, setConsentId] = useState<string | undefined>(undefined);
  const [currentPagePath, setCurrentPagePath] = useState<string | null>(null);
  const lastDataLayerPagePathRef = useRef<string | null>(null);
  const lastGa4PagePathRef = useRef<string | null>(null);
  const lastMetaPageViewPathRef = useRef<string | null>(null);
  const lastTikTokPagePathRef = useRef<string | null>(null);

  const isTestEnv =
    (typeof globalThis !== 'undefined' && Boolean((globalThis as {__TEST_ENV__?: unknown}).__TEST_ENV__)) ||
    (typeof process !== 'undefined' && process.env?.NODE_ENV === 'test');

  const persistConsentId = useCallback((id: string) => {
    setCookie(CONSENT_ID_COOKIE_KEY, id, CONSENT_MAX_AGE_SECONDS);
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(CONSENT_ID_COOKIE_KEY, id);
      }
    } catch (error) {
      if (env.DEV && !isTestEnv) {
        console.warn('Unable to persist consent identifier', error);
      }
    }
  }, []);

  const readStoredConsentId = useCallback(() => {
    let storedId: string | null = null;
    try {
      storedId =
        getCookie(CONSENT_ID_COOKIE_KEY) ??
        (typeof window !== 'undefined' && window.localStorage
          ? window.localStorage.getItem(CONSENT_ID_COOKIE_KEY)
          : null);
    } catch (error) {
      if (env.DEV && !isTestEnv) {
        console.warn('Unable to read stored consent identifier', error);
      }
    }
    return storedId ?? undefined;
  }, []);

  const readStoredConsent = useCallback(() => {
    let storedStatus: string | null = null;
    let storedTimestamp: string | null = null;
    let storedPreferencesJson: string | null = null;

    try {
      storedStatus =
        getCookie(CONSENT_COOKIE_KEY) ??
        (typeof window !== 'undefined' && window.localStorage
          ? window.localStorage.getItem('tracking-consent')
          : null);

      storedTimestamp =
        getCookie(CONSENT_TIMESTAMP_COOKIE_KEY) ??
        (typeof window !== 'undefined' && window.localStorage
          ? window.localStorage.getItem('tracking-consent-timestamp')
          : null);

      storedPreferencesJson =
        typeof window !== 'undefined' && window.localStorage
          ? window.localStorage.getItem('tracking-preferences')
          : null;
    } catch (error) {
      if (env.DEV && !isTestEnv) {
        console.warn('Unable to read stored consent preferences', error);
      }
    }

    const parsedStatus = storedStatus
      ? ConsentStatusSchema.safeParse(storedStatus).success
        ? (storedStatus as ConsentStatus)
        : null
      : null;
    const parsedPreferences = parseConsentPreferences(storedPreferencesJson);

    return { storedStatus: parsedStatus, storedTimestamp, storedPreferences: parsedPreferences };
  }, []);

  const loadGtm = useCallback(async (
    consentOverrides?: {
      readonly analyticsConsent?: boolean;
      readonly marketingConsent?: boolean;
    },
  ) => {
    if (!gtmId || isGtmLoaded) {
      return;
    }

    const analyticsConsent =
      consentOverrides?.analyticsConsent ?? hasAnalyticsConsent;
    const marketingConsent =
      consentOverrides?.marketingConsent ?? hasMarketingConsent;

    if (!analyticsConsent && !marketingConsent) {
      return;
    }

    try {
      const runtime = await getTrackingRuntime();
      await runtime.loadGtmRuntime({
        gtmId,
        analyticsConsent,
        marketingConsent,
        onLoaded: () => {
          setIsGtmLoaded(true);
          if (env.DEV) {
            console.log('GTM loaded successfully');
          }
        },
      });
    } catch (error) {
      if (env.DEV) {
        console.error('Error initializing GTM:', error);
      }
    }
  }, [gtmId, hasAnalyticsConsent, hasMarketingConsent, isGtmLoaded]);

  const recordConsentEvent = useCallback(
    async (
      status: ConsentStatus,
      overrides: {
        marketingConsent: boolean;
        analyticsConsent: boolean;
        personalizationConsent?: boolean;
        gpcApplied: boolean;
      },
    ) => {
      let id = consentId;
      if (!id) {
        id = generateConsentId();
        setConsentId(id);
        persistConsentId(id);
      }

      void logConsentEvent({
        consentId: id,
        status,
        marketing: overrides.marketingConsent,
        analytics: overrides.analyticsConsent,
        personalization: overrides.personalizationConsent,
        gpc: overrides.gpcApplied,
        consentVersion: CONSENT_VERSION,
        source: 'website',
      });
    },
    [consentId, persistConsentId],
  );

  /**
   * Load Google Analytics 4 (GA4)
   */
  const loadGA4 = useCallback(async () => {
    if (!enableGA4 || !ga4MeasurementId || isGA4Loaded) return;
    if (!hasAnalyticsConsent) return;

    try {
      const runtime = await getTrackingRuntime();
      await runtime.loadGA4Runtime({
        measurementId: ga4MeasurementId,
        analyticsConsent: hasAnalyticsConsent,
        marketingConsent: hasMarketingConsent,
        onLoaded: () => {
          setIsGA4Loaded(true);
          if (env.DEV) {
            console.log('GA4 loaded successfully');
          }
        },
      });
    } catch (error) {
      if (env.DEV) {
        console.error('Error initializing GA4:', error);
      }
    }
  }, [enableGA4, ga4MeasurementId, hasAnalyticsConsent, hasMarketingConsent, isGA4Loaded]);

  /**
   * Load Facebook Pixel (Meta Pixel)
   */
  const loadMetaPixel = useCallback(async () => {
    if (!enableMetaPixel || !metaPixelId || isMetaPixelLoaded) return;
    if (!hasMarketingConsent) return;

    try {
      const runtime = await getTrackingRuntime();
      await runtime.loadMetaPixelRuntime({
        pixelId: metaPixelId,
        marketingConsent: hasMarketingConsent,
        onLoaded: () => {
          setIsMetaPixelLoaded(true);
          if (env.DEV) {
            console.log('Meta Pixel loaded successfully');
          }
        },
      });
    } catch (error) {
      if (env.DEV) {
        console.error('Error initializing Meta Pixel:', error);
      }
    }
  }, [enableMetaPixel, hasMarketingConsent, isMetaPixelLoaded, metaPixelId]);

  const loadTikTokPixel = useCallback(async () => {
    if (!enableTikTokPixel || !tikTokPixelId || isTikTokPixelLoaded) {
      return;
    }

    if (!hasMarketingConsent) {
      return;
    }

    try {
      const runtime = await getTrackingRuntime();
      await runtime.loadTikTokPixelRuntime({
        pixelId: tikTokPixelId,
        marketingConsent: hasMarketingConsent,
        onLoaded: () => {
          setIsTikTokPixelLoaded(true);
          if (env.DEV) {
            console.log('TikTok Pixel loaded successfully');
          }
        },
      });
    } catch (error) {
      if (env.DEV) {
        console.error('Error initializing TikTok Pixel:', error);
      }
    }
  }, [enableTikTokPixel, hasMarketingConsent, isTikTokPixelLoaded, tikTokPixelId]);

  /**
   * Load tracking scripts when consent is granted
   */
  const persistConsentDecision = useCallback((status: ConsentStatus, preferences: ConsentPreferences) => {
    const timestamp = Date.now().toString();

    setCookie(CONSENT_COOKIE_KEY, status, CONSENT_MAX_AGE_SECONDS);
    setCookie(CONSENT_TIMESTAMP_COOKIE_KEY, timestamp, CONSENT_MAX_AGE_SECONDS);

    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem('tracking-consent', status);
        window.localStorage.setItem('tracking-consent-timestamp', timestamp);
        window.localStorage.setItem('tracking-preferences', JSON.stringify(preferences));
      }
    } catch (error) {
      if (env.DEV) {
        console.warn('Unable to persist tracking consent to localStorage', error);
      }
    }
  }, []);

  const applyConsentDecision = useCallback(
    ({status, preferences}: {status: ConsentStatus; preferences: ConsentPreferences}) => {
      const derived = deriveConsentState({
        status,
        preferences,
        gpcEnabled: gpcApplies,
      });

      setHasConsent(derived.hasAnyTrackingConsent);
      setHasAnalyticsConsent(derived.hasAnalyticsConsent);
      setHasMarketingConsent(derived.hasMarketingConsent);
      if (derived.hasAnyTrackingConsent) {
        void loadGtm({
          analyticsConsent: derived.hasAnalyticsConsent,
          marketingConsent: derived.hasMarketingConsent,
        });
      }

      persistConsentDecision(status, preferences);

      if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
        window.gtag('consent', 'update', {
          ad_storage: derived.hasMarketingConsent ? 'granted' : 'denied',
          analytics_storage: derived.hasAnalyticsConsent ? 'granted' : 'denied',
          personalization_storage: derived.hasMarketingConsent ? 'granted' : 'denied',
          functionality_storage: derived.hasFunctionalConsent ? 'granted' : 'denied',
          security_storage: 'granted',
          ad_user_data: derived.hasMarketingConsent ? 'granted' : 'denied',
          ad_personalization: derived.hasMarketingConsent ? 'granted' : 'denied',
        });
      }

      if (typeof window !== 'undefined' && typeof window.fbq === 'function') {
        if (derived.hasMarketingConsent) {
          window.fbq('consent', 'grant');
        } else {
          window.fbq('consent', 'revoke');
        }
      }

      clearTrackingCookies({
        analytics: !derived.hasAnalyticsConsent,
        marketing: !derived.hasMarketingConsent,
      });
      if (!derived.hasMarketingConsent) {
        stripTrackingQueryParametersFromUrl();
      }

      void recordConsentEvent(status, {
        marketingConsent: derived.hasMarketingConsent,
        analyticsConsent: derived.hasAnalyticsConsent,
        gpcApplied: gpcApplies || status === 'gpc',
      });
    },
    [gpcApplies, loadGtm, persistConsentDecision, recordConsentEvent],
  );

  /**
   * Grant tracking consent
   */
  const grantConsent = useCallback(
    (status: 'granted' | 'partial' = 'granted') => {
      if (gpcApplies) {
        if (env.DEV) {
          console.info('Global Privacy Control is enabled; maintaining opt-out status.');
        }
        applyConsentDecision({status: 'gpc', preferences: DEFAULT_CONSENT_PREFERENCES});
        return;
      }

      const grantedPreferences: ConsentPreferences = {
        analytics: true,
        marketing: true,
        functional: true,
      };
      applyConsentDecision({status, preferences: grantedPreferences});
    },
    [applyConsentDecision, gpcApplies],
  );

  /**
   * Revoke tracking consent
   */
  const revokeConsent = useCallback(
    (status: 'rejected' | 'revoked' | 'gpc' = 'rejected') => {
      const rejectedPreferences: ConsentPreferences = {
        analytics: false,
        marketing: false,
        functional: true,
      };
      applyConsentDecision({status, preferences: rejectedPreferences});
      setIsGA4Loaded(false);
      setIsMetaPixelLoaded(false);
      setIsTikTokPixelLoaded(false);
      setIsGtmLoaded(false);
      lastMetaPageViewPathRef.current = null;
    },
    [applyConsentDecision],
  );

  const openPrivacyPreferences = useCallback(() => {
    if (typeof window === 'undefined') {
      return;
    }

    window.dispatchEvent(new CustomEvent(OPEN_PRIVACY_PREFERENCES_EVENT));
  }, []);

  /**
   * Track custom events across all platforms
   */
  const trackEvent = useCallback(
    (eventName: string, parameters: Record<string, unknown> = {}) => {
      const rawEventId = parameters['event_id'];
      const eventId = typeof rawEventId === 'string' ? rawEventId : undefined;
      const canSendAnalyticsEvent = hasAnalyticsConsent;
      const canSendMarketingEvent = hasMarketingConsent;

      const restParameters = Object.fromEntries(
        Object.entries(parameters).filter(([key]) => !['event_id', 'email_hash'].includes(key)),
      ) as Record<string, unknown>;

      const gaParameters: Record<string, unknown> = {
        ...restParameters,
        engagement_time_msec:
          typeof restParameters['engagement_time_msec'] === 'number'
            ? restParameters['engagement_time_msec']
            : 1,
        session_id: restParameters['session_id'],
      };

      if (eventId) {
        gaParameters['event_id'] = eventId;
      }

      if (canSendAnalyticsEvent || canSendMarketingEvent) {
        pushDataLayerEvent(eventName, gaParameters);
      }

      if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
        if (canSendAnalyticsEvent) {
          window.gtag('event', eventName, gaParameters);
        }
      }

      // Track in Meta Pixel
      if (canSendMarketingEvent && isMetaPixelLoaded && typeof window !== 'undefined' && typeof window.fbq === 'function') {
      const metaEventMap: Record<string, string> = {
        page_view: 'PageView',
        generate_lead: 'Lead',
        waitlist_join: 'Lead',
        newsletter_subscribe: 'Subscribe',
        contact_submit: 'Contact',
        sign_up: 'CompleteRegistration',
        purchase: 'Purchase',
        add_to_cart: 'AddToCart',
        begin_checkout: 'InitiateCheckout',
        search: 'Search',
        contact: 'Contact',
        subscribe: 'Subscribe',
      };

      const metaEventName = metaEventMap[eventName];
      const pixelOptions: Record<string, unknown> = {};
      if (eventId) {
        pixelOptions['eventID'] = eventId;
      }

      if (metaEventName) {
        if (Object.keys(pixelOptions).length > 0) {
          window.fbq('track', metaEventName, restParameters, pixelOptions);
        } else {
          window.fbq('track', metaEventName, restParameters);
        }
      }
    }

    if (
      canSendMarketingEvent &&
      isTikTokPixelLoaded &&
      typeof window !== 'undefined' &&
      typeof window.ttq?.track === 'function'
    ) {
      const tikTokEventMap: Record<string, string> = {
        page_view: 'PageView',
        generate_lead: 'SubmitForm',
        waitlist_join: 'SubmitForm',
        newsletter_subscribe: 'Subscribe',
        contact_submit: 'Contact',
        form_submit: 'SubmitForm',
        sign_up: 'CompleteRegistration',
        purchase: 'CompletePayment',
        add_to_cart: 'AddToCart',
        begin_checkout: 'InitiateCheckout',
        search: 'Search',
        contact: 'Contact',
        subscribe: 'Subscribe',
      };

      const tikTokEventName = tikTokEventMap[eventName];
      if (tikTokEventName) {
        window.ttq.track(tikTokEventName, restParameters);
      }
    }

    if (env.DEV) {
      console.log(`Tracking event: ${eventName}`, {
        payload: summarizeTrackingPayloadForLogs(restParameters),
        hasEventId: Boolean(eventId),
      });
    }
  },
    [hasAnalyticsConsent, hasMarketingConsent, isMetaPixelLoaded, isTikTokPixelLoaded],
  );

  const dispatchPageView = useCallback((page: string) => {
    if (!page) {
      return;
    }

    const pageTitle = typeof document !== 'undefined' ? document.title : undefined;
    const pageLocation = typeof window !== 'undefined' ? window.location.href : undefined;
    const pageReferrer = typeof document !== 'undefined' ? document.referrer || undefined : undefined;

    if (
      (hasAnalyticsConsent || hasMarketingConsent) &&
      lastDataLayerPagePathRef.current !== page
    ) {
      pushDataLayerEvent('page_view', {
        page_path: page,
        page_title: pageTitle,
        page_location: pageLocation,
        page_referrer: pageReferrer,
      });
      lastDataLayerPagePathRef.current = page;
    }

    if (
      hasAnalyticsConsent &&
      isGA4Loaded &&
      typeof window !== 'undefined' &&
      typeof window.gtag === 'function' &&
      ga4MeasurementId &&
      lastGa4PagePathRef.current !== page
    ) {
      window.gtag('event', 'page_view', {
        page_path: page,
        page_title: pageTitle,
        page_location: pageLocation,
        page_referrer: pageReferrer,
      });
      lastGa4PagePathRef.current = page;
    }

    if (
      hasMarketingConsent &&
      isMetaPixelLoaded &&
      typeof window !== 'undefined' &&
      typeof window.fbq === 'function' &&
      lastMetaPageViewPathRef.current !== page
    ) {
        window.fbq('track', 'PageView');
        lastMetaPageViewPathRef.current = page;
    }

    if (
      hasMarketingConsent &&
      isTikTokPixelLoaded &&
      typeof window !== 'undefined' &&
      typeof window.ttq?.page === 'function' &&
      lastTikTokPagePathRef.current !== page
    ) {
      window.ttq.page();
      lastTikTokPagePathRef.current = page;
    }

    if (env.DEV) {
      const summary = summarizePathForLogs(page);
      console.log(`Tracking page view: ${summary.path}`, {hasQuery: summary.hasQuery});
    }
  }, [ga4MeasurementId, hasAnalyticsConsent, hasMarketingConsent, isGA4Loaded, isMetaPixelLoaded, isTikTokPixelLoaded]);

  /**
   * Track page views across all platforms.
   * Persist the latest route so late-loading consented runtimes still receive it.
   */
  const trackPageView = useCallback((page: string) => {
    setCurrentPagePath(page);
    dispatchPageView(page);
  }, [dispatchPageView]);

  useEffect(() => {
    if (!currentPagePath) {
      return;
    }

    dispatchPageView(currentPagePath);
  }, [currentPagePath, dispatchPageView]);

  const contextValue: TrackingContextType = {
    isGtmLoaded,
    isGA4Loaded,
    isMetaPixelLoaded,
    isTikTokPixelLoaded,
    hasConsent,
    hasAnalyticsConsent,
    hasMarketingConsent,
    gpcApplies,
    trackEvent,
    trackPageView,
    grantConsent,
    revokeConsent,
    applyConsentDecision,
    openPrivacyPreferences,
  };

  return (
    <TrackingContext.Provider value={contextValue}>
      <TrackingConsentBootstrap
        key={`consent:${gpcApplies ? 'gpc' : 'normal'}`}
        gpcApplies={gpcApplies}
        readStoredConsent={readStoredConsent}
        setHasAnalyticsConsent={setHasAnalyticsConsent}
        setHasConsent={setHasConsent}
        setHasMarketingConsent={setHasMarketingConsent}
      />
      <TrackingConsentIdBootstrap
        readStoredConsentId={readStoredConsentId}
        setConsentId={setConsentId}
        persistConsentId={persistConsentId}
      />
      <TrackingGpcBootstrap
        applyConsentDecision={applyConsentDecision}
        setGpcApplies={setGpcApplies}
      />
      {hasAnalyticsConsent || hasMarketingConsent ? (
        <TrackingScriptLoader
          key={`scripts:${hasAnalyticsConsent}:${hasMarketingConsent}:${gtmId ?? 'none'}`}
          loadGtm={loadGtm}
          loadGA4={loadGA4}
          loadMetaPixel={loadMetaPixel}
          loadTikTokPixel={loadTikTokPixel}
        />
      ) : null}
      {children}
    </TrackingContext.Provider>
  );
};

/**
 * Hook to use tracking context
 */
export const useTracking = (): TrackingContextType => {
  const context = useContext(TrackingContext);
  if (!context) {
    throw new Error('useTracking must be used within a TrackingProvider');
  }
  return context;
};

const TrackingConsentBootstrap: React.FC<{
  readonly gpcApplies: boolean;
  readonly readStoredConsent: () => {
    storedStatus: ConsentStatus | null;
    storedTimestamp: string | null;
    storedPreferences: ConsentPreferences;
  };
  readonly setHasAnalyticsConsent: React.Dispatch<React.SetStateAction<boolean>>;
  readonly setHasConsent: React.Dispatch<React.SetStateAction<boolean>>;
  readonly setHasMarketingConsent: React.Dispatch<React.SetStateAction<boolean>>;
}> = ({
  gpcApplies,
  readStoredConsent,
  setHasAnalyticsConsent,
  setHasConsent,
  setHasMarketingConsent,
}) => {
  useMountEffect(() => {
    const { storedStatus, storedTimestamp, storedPreferences } = readStoredConsent();

    if (!storedStatus) {
      return;
    }

    const timestampValue = storedTimestamp ? Number.parseInt(storedTimestamp, 10) : Number.NaN;
    const isExpired =
      Number.isFinite(timestampValue) &&
      Date.now() - timestampValue > CONSENT_MAX_AGE_SECONDS * 1000;

    if (isExpired) {
      setHasConsent(false);
      setHasAnalyticsConsent(false);
      setHasMarketingConsent(false);
      return;
    }

    const derived = deriveConsentState({
      status: storedStatus,
      preferences: storedPreferences,
      gpcEnabled: gpcApplies,
    });
    setHasAnalyticsConsent(derived.hasAnalyticsConsent);
    setHasMarketingConsent(derived.hasMarketingConsent);
    setHasConsent(derived.hasAnyTrackingConsent);
  });

  return null;
};

const TrackingConsentIdBootstrap: React.FC<{
  readonly persistConsentId: (id: string) => void;
  readonly readStoredConsentId: () => string | undefined;
  readonly setConsentId: React.Dispatch<React.SetStateAction<string | undefined>>;
}> = ({ persistConsentId, readStoredConsentId, setConsentId }) => {
  useMountEffect(() => {
    const storedId = readStoredConsentId();
    if (!storedId) {
      const newId = generateConsentId();
      setConsentId(newId);
      persistConsentId(newId);
    } else {
      setConsentId(storedId);
    }
  });

  return null;
};

const TrackingGpcBootstrap: React.FC<{
  readonly applyConsentDecision: (input: {status: ConsentStatus; preferences: ConsentPreferences}) => void;
  readonly setGpcApplies: React.Dispatch<React.SetStateAction<boolean>>;
}> = ({ applyConsentDecision, setGpcApplies }) => {
  useMountEffect(() => {
    if (typeof navigator === 'undefined') {
      return;
    }

    const gpcEnabled =
      (navigator as Navigator & { globalPrivacyControl?: boolean }).globalPrivacyControl === true;
    setGpcApplies(gpcEnabled);

    if (gpcEnabled) {
      applyConsentDecision({status: 'gpc', preferences: DEFAULT_CONSENT_PREFERENCES});
    }
  });

  return null;
};

const TrackingScriptLoader: React.FC<{
  readonly loadGtm: () => Promise<void>;
  readonly loadGA4: () => Promise<void>;
  readonly loadMetaPixel: () => Promise<void>;
  readonly loadTikTokPixel: () => Promise<void>;
}> = ({ loadGtm, loadGA4, loadMetaPixel, loadTikTokPixel }) => {
  useMountEffect(() => {
    return runWhenIdle(() => {
      void loadGtm();
      void loadGA4();
      void loadMetaPixel();
      void loadTikTokPixel();
    });
  });

  return null;
};

/**
 * Higher-order component for tracking page views
 */
export const withPageTracking = <P extends object>(
  Component: React.ComponentType<P>,
  pageName: string
) => {
  return (props: P) => {
    const { trackPageView, hasConsent } = useTracking();

    return (
      <>
        {hasConsent ? (
          <TrackedPageViewCoordinator
            key={`page-view:${pageName}`}
            pageName={pageName}
            trackPageView={trackPageView}
          />
        ) : null}
        <Component {...props} />
      </>
    );
  };
};

const TrackedPageViewCoordinator: React.FC<{
  readonly pageName: string;
  readonly trackPageView: (page: string) => void;
}> = ({ pageName, trackPageView }) => {
  useMountEffect(() => {
    trackPageView(pageName);
  });

  return null;
};

export default TrackingProvider;
