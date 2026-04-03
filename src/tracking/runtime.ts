/**
 * Analytics runtime helpers that are dynamically imported only after the user
 * grants consent. Keeping this logic isolated prevents GA/Meta bootstrapping
 * logic from ever landing in the critical path bundle.
 */

import {env} from '../utils/env';

type FbqFunction = ((...args: unknown[]) => void) & {
  loaded?: boolean;
  version?: string;
  queue?: unknown[][];
  push?: FbqFunction;
  callMethod?: (...args: unknown[]) => void;
};

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    dataLayer?: unknown[];
    fbq?: FbqFunction;
    _fbq?: unknown;
    ttq?: Array<unknown> & {loaded?: boolean; page?: (...args: unknown[]) => void; track?: (...args: unknown[]) => void; load?: (pixelId: string) => void};
  }
}

interface ConfigureGoogleAdsOptions {
  readonly gtmId: string;
  readonly analyticsConsent: boolean;
  readonly marketingConsent: boolean;
  readonly onLoaded: () => void;
}

interface LoadGA4Options {
  readonly measurementId: string;
  readonly analyticsConsent: boolean;
  readonly marketingConsent: boolean;
  readonly onLoaded: () => void;
}

export async function loadGA4Runtime({
  measurementId,
  analyticsConsent,
  marketingConsent,
  onLoaded,
}: LoadGA4Options): Promise<void> {
  if (typeof window === 'undefined') {
    return;
  }

  const consentDefaults = buildGoogleConsentDefaults({
    analyticsConsent,
    marketingConsent,
    functionalConsent: true,
  });

  ensureGoogleTagInitialized();
  window.gtag?.('consent', 'default', consentDefaults);

  await loadGoogleTagRuntime({
    tagId: measurementId,
  });

  window.gtag?.('js', new Date());
  window.gtag?.('config', measurementId, {
    anonymize_ip: true,
    allow_google_signals: marketingConsent,
    allow_ad_personalization_signals: marketingConsent,
    send_page_view: false,
    enhanced_measurements: {
      scrolls: true,
      outbound_clicks: true,
      site_search: true,
      file_downloads: true,
      page_changes: true,
    },
  });

  onLoaded();
}

interface LoadMetaPixelOptions {
  readonly pixelId: string;
  readonly marketingConsent: boolean;
  readonly onLoaded: () => void;
}

const META_PIXEL_SCRIPT_SRC = 'https://connect.facebook.net/en_US/fbevents.js';
const initializedMetaPixelIds = new Set<string>();
let metaPixelScriptPromise: Promise<void> | undefined;

export async function loadMetaPixelRuntime({
  pixelId,
  marketingConsent,
  onLoaded,
}: LoadMetaPixelOptions): Promise<void> {
  if (typeof window === 'undefined') {
    return;
  }

  const hasInitializedPixel = initializedMetaPixelIds.has(pixelId);
  if (window.fbq?.loaded && hasInitializedPixel) {
    onLoaded();
    return;
  }

  const fbq: FbqFunction = ((...args: unknown[]) => {
    if (typeof fbq.callMethod === 'function') {
      fbq.callMethod(...args);
      return;
    }
    (fbq.queue = fbq.queue || []).push(args);
  }) as FbqFunction;

  if (typeof window.fbq !== 'function') {
    window.fbq = fbq;
    window._fbq = fbq;
    window.fbq.push = window.fbq;
    window.fbq.loaded = true;
    window.fbq.version = '2.0';
    window.fbq.queue = [];
  }

  if (!hasInitializedPixel) {
    window.fbq?.('init', pixelId, {
      external_id: undefined,
      em: undefined,
      advanced_matching: marketingConsent ? 'enabled' : 'disabled',
    });
    initializedMetaPixelIds.add(pixelId);
  }

  const existingScript = document.querySelector<HTMLScriptElement>(
    `script[src="${META_PIXEL_SCRIPT_SRC}"]`,
  );

  if (existingScript) {
    onLoaded();
    return;
  }

  if (!metaPixelScriptPromise) {
    metaPixelScriptPromise = new Promise<void>((resolve, reject) => {
      const script = document.createElement('script');
      script.async = true;
      script.src = META_PIXEL_SCRIPT_SRC;
      script.onload = () => {
        resolve();
      };
      script.onerror = () => {
        metaPixelScriptPromise = undefined;
        reject(new Error('Failed to load Meta Pixel'));
      };

      document.head.appendChild(script);
    });
  }

  await metaPixelScriptPromise.catch((error) => {
    if (env.DEV) {
      console.error(error);
    }
  });

  onLoaded();

}

interface LoadGtmOptions {
  readonly gtmId: string;
  readonly analyticsConsent: boolean;
  readonly marketingConsent: boolean;
  readonly onLoaded: () => void;
}

export async function loadGtmRuntime({
  gtmId,
  analyticsConsent,
  marketingConsent,
  onLoaded,
}: LoadGtmOptions): Promise<void> {
  if (typeof window === 'undefined') {
    return;
  }

  const consentDefaults = buildGoogleConsentDefaults({
    analyticsConsent,
    marketingConsent,
    functionalConsent: true,
  });

  ensureGoogleTagInitialized();
  window.gtag?.('consent', 'default', consentDefaults);

  const existingScript = document.querySelector<HTMLScriptElement>(
    `script[src="https://www.googletagmanager.com/gtm.js?id=${gtmId}"]`,
  );

  if (existingScript) {
    onLoaded();
    return;
  }

  const anyGtmScript = document.querySelector<HTMLScriptElement>(
    'script[src^="https://www.googletagmanager.com/gtm.js?id="]',
  );
  if (anyGtmScript) {
    onLoaded();
    return;
  }

  window.dataLayer?.push({
    'gtm.start': Date.now(),
    event: 'gtm.js',
  });

  await new Promise<void>((resolve, reject) => {
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtm.js?id=${gtmId}`;
    script.onload = () => {
      onLoaded();
      resolve();
    };
    script.onerror = () => reject(new Error('Failed to load Google tag'));

    document.head.appendChild(script);
  }).catch((error) => {
    if (env.DEV) {
      console.error(error);
    }
  });
}

interface LoadGoogleTagOptions {
  readonly tagId: string;
}

export async function loadGoogleTagRuntime({tagId}: LoadGoogleTagOptions): Promise<void> {
  if (typeof window === 'undefined') {
    return;
  }

  const existingScript = document.querySelector<HTMLScriptElement>(
    `script[src="https://www.googletagmanager.com/gtag/js?id=${tagId}"]`,
  );

  if (existingScript) {
    return;
  }

  const anyGoogleTag = document.querySelector<HTMLScriptElement>(
    'script[src^="https://www.googletagmanager.com/gtag/js?id="]',
  );
  if (anyGoogleTag) {
    return;
  }

  await new Promise<void>((resolve, reject) => {
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${tagId}`;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Google tag'));

    document.head.appendChild(script);
  }).catch((error) => {
    if (env.DEV) {
      console.error(error);
    }
  });
}

interface LoadTikTokPixelOptions {
  readonly pixelId: string;
  readonly marketingConsent: boolean;
  readonly onLoaded: () => void;
}

export async function loadTikTokPixelRuntime({
  pixelId,
  marketingConsent,
  onLoaded,
}: LoadTikTokPixelOptions): Promise<void> {
  if (typeof window === 'undefined') {
    return;
  }

  if (!marketingConsent) {
    return;
  }

  if (window.ttq?.loaded) {
    onLoaded();
    return;
  }

  const ttq = ensureTikTokPixelQueue();
  void loadTikTokPixelScript({
    pixelId,
    queue: ttq,
    onLoaded,
  });

  ttq.load(pixelId);
  ttq.page();
}

function ensureGoogleTagInitialized(): void {
  window.dataLayer = window.dataLayer || [];

  if (typeof window.gtag !== 'function') {
    window.gtag = function gtag(...args: unknown[]) {
      window.dataLayer?.push(args);
    };
  }
}

function buildGoogleConsentDefaults({
  analyticsConsent,
  marketingConsent,
  functionalConsent,
}: {
  readonly analyticsConsent: boolean;
  readonly marketingConsent: boolean;
  readonly functionalConsent: boolean;
}): Record<string, unknown> {
  return {
    ad_storage: marketingConsent ? 'granted' : 'denied',
    analytics_storage: analyticsConsent ? 'granted' : 'denied',
    personalization_storage: marketingConsent ? 'granted' : 'denied',
    functionality_storage: functionalConsent ? 'granted' : 'denied',
    security_storage: 'granted',
    ad_user_data: marketingConsent ? 'granted' : 'denied',
    ad_personalization: marketingConsent ? 'granted' : 'denied',
    wait_for_update: 500,
  };
}

type TikTokQueue = Array<unknown> & {
  loaded?: boolean;
  methods?: readonly string[];
  load: (pixelId: string, config?: Record<string, unknown>) => void;
  page: (...args: unknown[]) => void;
  track: (...args: unknown[]) => void;
};

function ensureTikTokPixelQueue(): TikTokQueue {
  const existing = window.ttq as unknown;
  if (Array.isArray(existing)) {
    const withMethods = existing as TikTokQueue;
    if (typeof withMethods.page === 'function' && typeof withMethods.track === 'function') {
      window.ttq = withMethods;
      return withMethods;
    }
  }

  const queue = [] as unknown[];
  const ttqQueue = queue as TikTokQueue;

  const methods = [
    'page',
    'track',
    'identify',
    'instances',
    'debug',
    'on',
    'off',
    'once',
    'ready',
    'alias',
    'group',
    'enableCookie',
    'disableCookie',
    'holdConsent',
    'revokeConsent',
    'grantConsent',
  ] as const;

  ttqQueue.methods = methods;

  const setAndDefer = (methodName: string) => {
    (ttqQueue as unknown as Record<string, unknown>)[methodName] = (...args: unknown[]) => {
      ttqQueue.push([methodName, ...args]);
    };
  };

  for (const methodName of methods) {
    setAndDefer(methodName);
  }

  ttqQueue.load = (pixelId: string) => {
    ttqQueue.push(['load', pixelId]);
  };

  window.ttq = ttqQueue;
  return ttqQueue;
}

async function loadTikTokPixelScript({
  pixelId,
  queue,
  onLoaded,
}: {
  readonly pixelId: string;
  readonly queue: TikTokQueue;
  readonly onLoaded: () => void;
}): Promise<void> {
  const existingScript = document.querySelector<HTMLScriptElement>(
    `script[src^="https://analytics.tiktok.com/i18n/pixel/events.js?sdkid=${pixelId}"]`,
  );
  if (existingScript) {
    queue.loaded = true;
    onLoaded();
    return;
  }

  await new Promise<void>((resolve, reject) => {
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://analytics.tiktok.com/i18n/pixel/events.js?sdkid=${pixelId}&lib=ttq`;
    script.onload = () => {
      queue.loaded = true;
      onLoaded();
      resolve();
    };
    script.onerror = () => reject(new Error('Failed to load TikTok Pixel'));

    document.head.appendChild(script);
  }).catch((error) => {
    if (env.DEV) {
      console.error(error);
    }
  });
}
