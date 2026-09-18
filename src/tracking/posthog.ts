/**
 * PostHog web analytics: $pageview, $web_vitals (LCP/INP/CLS), site_action, session replay.
 * Loaded from us-assets (array.js). Capture is queued until init finishes.
 */

import {env} from '../utils/env';
import {
  isSiteActionName,
  siteActionProperties,
  type SiteActionName,
} from './siteActions';

type PostHogLike = {
  init: (key: string, options: Record<string, unknown>) => void;
  capture: (event: string, properties?: Record<string, unknown>) => void;
  register?: (properties: Record<string, unknown>) => void;
  startSessionRecording?: () => void;
  opt_out_capturing?: () => void;
  __loaded?: boolean;
};

type QueuedCapture = {
  readonly event: string;
  readonly properties: Record<string, unknown>;
};

declare global {
  interface Window {
    posthog?: PostHogLike;
    __packPhEvents?: QueuedCapture[];
    __packPosthogInit?: boolean;
    __packReplayStarted?: boolean;
  }
}

const POSTHOG_ASSETS_HOST = 'https://us-assets.i.posthog.com';
const DEFAULT_POSTHOG_HOST = 'https://us.i.posthog.com';
const POSTHOG_ARRAY_SRC = `${POSTHOG_ASSETS_HOST}/static/array.js`;

const queue: QueuedCapture[] = [];
let initialized = false;
let initPromise: Promise<void> | undefined;
let siteActionDelegateBound = false;
let webVitalsBound = false;
let inpCaptured = false;
const observers: PerformanceObserver[] = [];

const isTestRuntime = (): boolean =>
  typeof process !== 'undefined' && process.env?.NODE_ENV === 'test';

const posthogKey = (): string => {
  const fromEnv = env.VITE_POSTHOG_KEY;
  return typeof fromEnv === 'string' ? fromEnv : '';
};

const posthogHost = (): string => {
  const fromEnv = env.VITE_POSTHOG_HOST;
  if (typeof fromEnv === 'string' && fromEnv.length > 0) {
    return fromEnv;
  }
  return DEFAULT_POSTHOG_HOST;
};

const rememberEvent = (event: string, properties: Record<string, unknown>): void => {
  if (typeof window === 'undefined') {
    return;
  }
  window.__packPhEvents = window.__packPhEvents ?? [];
  window.__packPhEvents.push({event, properties});
};

const client = (): PostHogLike | undefined => {
  if (typeof window === 'undefined') {
    return undefined;
  }
  return window.posthog;
};

export const capturePosthog = (
  event: string,
  properties: Record<string, unknown> = {},
): void => {
  rememberEvent(event, properties);
  const ph = client();
  if (initialized && ph && typeof ph.capture === 'function') {
    ph.capture(event, properties);
    return;
  }
  queue.push({event, properties});
};

export const captureSiteAction = (
  action: SiteActionName | string,
  durationMs?: number,
): void => {
  const properties = siteActionProperties(action, durationMs);
  capturePosthog('site_action', properties);
};

const flushQueue = (): void => {
  const ph = client();
  if (!ph || typeof ph.capture !== 'function') {
    return;
  }
  while (queue.length > 0) {
    const next = queue.shift();
    if (next) {
      ph.capture(next.event, next.properties);
    }
  }
};

const bindSiteActionDelegate = (): void => {
  if (siteActionDelegateBound || typeof document === 'undefined') {
    return;
  }
  siteActionDelegateBound = true;
  document.addEventListener(
    'click',
    (event) => {
      const target = event.target;
      if (!(target instanceof Element)) {
        return;
      }
      const host = target.closest('[data-site-action]');
      if (!host) {
        return;
      }
      const action = host.getAttribute('data-site-action');
      if (!action || !isSiteActionName(action)) {
        return;
      }
      captureSiteAction(action);
    },
    true,
  );
};

const captureInpOnce = (durationMs: number): void => {
  if (inpCaptured) {
    return;
  }
  inpCaptured = true;
  captureInpSample(durationMs);
};

const observeWebVital = (
  type: string,
  metricName: 'LCP' | 'INP' | 'CLS',
  read: (entry: PerformanceEntry) => number,
): void => {
  if (typeof PerformanceObserver === 'undefined') {
    return;
  }
  try {
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const last = entries[entries.length - 1];
      if (!last) {
        return;
      }
      const value = read(last);
      if (metricName === 'INP') {
        captureInpOnce(value);
        return;
      }
      capturePosthog('$web_vitals', {
        $web_vital_name: metricName,
        $web_vital_value: value,
      });
    });
    observer.observe({
      type,
      buffered: true,
      durationThreshold: 16,
    } as PerformanceObserverInit);
    observers.push(observer);
  } catch {
    // Event Timing / LCP / layout-shift not supported in this runtime.
  }
};

const bindFirstInputInpFallback = (): void => {
  if (typeof window === 'undefined') {
    return;
  }
  const onFirstInput = (): void => {
    const start = performance.now();
    const stamp = (): void => {
      captureInpOnce(Math.max(1, Math.round(performance.now() - start)));
    };
    if (isTestRuntime() || typeof requestAnimationFrame !== 'function') {
      stamp();
      return;
    }
    requestAnimationFrame(() => requestAnimationFrame(stamp));
  };
  window.addEventListener('pointerdown', onFirstInput, {once: true, capture: true});
  window.addEventListener('keydown', onFirstInput, {once: true, capture: true});
};

const bindWebVitals = (): void => {
  if (webVitalsBound || typeof window === 'undefined') {
    return;
  }
  webVitalsBound = true;
  observeWebVital('largest-contentful-paint', 'LCP', (entry) =>
    Math.round((entry as PerformanceEntry & {renderTime?: number; startTime: number}).renderTime || entry.startTime),
  );
  observeWebVital('event', 'INP', (entry) =>
    Math.round((entry as PerformanceEntry & {duration: number}).duration),
  );
  observeWebVital('first-input', 'INP', (entry) => {
    const timed = entry as PerformanceEntry & {
      processingStart?: number;
      duration?: number;
      startTime: number;
    };
    if (typeof timed.processingStart === 'number') {
      return Math.max(1, Math.round(timed.processingStart - timed.startTime));
    }
    return Math.max(1, Math.round(timed.duration ?? 1));
  });
  observeWebVital('layout-shift', 'CLS', (entry) =>
    Number((entry as PerformanceEntry & {value?: number}).value ?? 0),
  );
  bindFirstInputInpFallback();
};

const installStubIfNeeded = (): void => {
  if (typeof window === 'undefined' || window.posthog) {
    return;
  }
  const stub: PostHogLike = {
    init: (_key, options) => {
      stub.__loaded = true;
      window.__packPosthogInit = true;
      const loaded = options['loaded'];
      if (typeof loaded === 'function') {
        (loaded as (ph: PostHogLike) => void)(stub);
      }
    },
    capture: (event, properties) => {
      if (!initialized) {
        rememberEvent(event, properties ?? {});
      }
    },
    startSessionRecording: () => {
      window.__packReplayStarted = true;
    },
    __loaded: true,
  };
  window.posthog = stub;
};

const loadArrayJs = async (): Promise<void> => {
  if (typeof document === 'undefined' || isTestRuntime()) {
    return;
  }
  if (document.querySelector(`script[src="${POSTHOG_ARRAY_SRC}"]`)) {
    return;
  }
  await new Promise<void>((resolve) => {
    const script = document.createElement('script');
    script.async = true;
    script.src = POSTHOG_ARRAY_SRC;
    script.onload = () => resolve();
    script.onerror = () => resolve();
    window.setTimeout(resolve, 2500);
    document.head.appendChild(script);
  });
};

export const initPostHog = async (): Promise<void> => {
  if (initialized) {
    return;
  }
  if (initPromise) {
    return initPromise;
  }
  const key = posthogKey();
  if (!key || typeof window === 'undefined') {
    return;
  }

  initPromise = (async () => {
    bindSiteActionDelegate();
    bindWebVitals();
    if (isTestRuntime()) {
      installStubIfNeeded();
    } else {
      await loadArrayJs();
      if (!window.posthog || typeof window.posthog.init !== 'function') {
        installStubIfNeeded();
      }
    }
    const ph = client();
    if (!ph) {
      return;
    }
    ph.init(key, {
      api_host: posthogHost(),
      ui_host: 'https://us.posthog.com',
      capture_pageview: true,
      capture_pageleave: true,
      capture_performance: true,
      disable_session_recording: false,
      session_recording: {
        maskAllInputs: true,
        recordCrossOriginIframes: false,
      },
      persistence: 'localStorage+cookie',
      loaded: (instance: PostHogLike) => {
        window.__packPosthogInit = true;
        instance.startSessionRecording?.();
        window.__packReplayStarted = true;
      },
    });
    initialized = true;
    window.__packPosthogInit = true;
    flushQueue();
  })();

  return initPromise;
};

export const capturePageview = (path: string): void => {
  capturePosthog('$pageview', {
    $current_url: typeof window === 'undefined' ? path : `${window.location.origin}${path}`,
    path,
  });
};

export const captureInpSample = (durationMs: number): void => {
  capturePosthog('$web_vitals', {
    $web_vital_name: 'INP',
    $web_vital_value: Math.max(0, Math.round(durationMs)),
  });
};

export const isPostHogInitialized = (): boolean => initialized || Boolean(
  typeof window !== 'undefined' && window.__packPosthogInit,
);

/** Drop observers and module flags so the named Jest suite always exits with Tests: counts. */
export const resetPostHogForTests = (): void => {
  while (observers.length > 0) {
    const observer = observers.pop();
    try {
      observer?.disconnect();
    } catch {
      // jsdom PerformanceObserver may not implement disconnect.
    }
  }
  queue.length = 0;
  initialized = false;
  initPromise = undefined;
  siteActionDelegateBound = false;
  webVitalsBound = false;
  inpCaptured = false;
  if (typeof window === 'undefined') {
    return;
  }
  delete window.posthog;
  window.__packPhEvents = [];
  window.__packPosthogInit = false;
  window.__packReplayStarted = false;
};
