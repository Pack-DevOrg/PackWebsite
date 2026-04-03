// Set up Jest DOM matchers
import '@testing-library/jest-dom';
import { TextEncoder, TextDecoder } from 'util';
import { toHaveNoViolations } from 'jest-axe';

expect.extend(toHaveNoViolations);

// Minimal document metadata for accessibility tests (jsdom doesn't load index.html)
if (typeof document !== 'undefined') {
  document.documentElement.lang = document.documentElement.lang || 'en';
  document.title = document.title || 'Pack';
}

// Mock the window.grecaptcha object for reCAPTCHA v3 (jsdom only)
if (typeof window !== 'undefined') {
  Object.defineProperty(window, 'grecaptcha', {
    value: {
      ready: (callback: () => void) => {
        callback();
      },
      execute: jest.fn(() => Promise.resolve('test-token-123')),
    },
    writable: true,
  });
}

// Provide a minimal IntersectionObserver polyfill for jsdom
class IntersectionObserverMock implements IntersectionObserver {
  readonly root: Element | Document | null = null;
  readonly rootMargin = '0px';
  readonly thresholds: ReadonlyArray<number> = [0];

  constructor(private readonly callback: IntersectionObserverCallback) {}

  observe: IntersectionObserver['observe'] = jest.fn((element: Element) => {
    const mockEntry = {
      time: Date.now(),
      target: element,
      rootBounds: null,
      boundingClientRect: element.getBoundingClientRect?.() ?? ({} as DOMRectReadOnly),
      intersectionRect: element.getBoundingClientRect?.() ?? ({} as DOMRectReadOnly),
      intersectionRatio: 1,
      isIntersecting: true,
    } as unknown as IntersectionObserverEntry;

    this.callback([mockEntry], this);
  });

  unobserve: IntersectionObserver['unobserve'] = jest.fn();
  disconnect: IntersectionObserver['disconnect'] = jest.fn();
  takeRecords: IntersectionObserver['takeRecords'] = jest.fn(() => []);
}

if (!(globalThis as { IntersectionObserver?: typeof IntersectionObserver }).IntersectionObserver) {
  (globalThis as { IntersectionObserver?: typeof IntersectionObserver }).IntersectionObserver = IntersectionObserverMock;
}

// Polyfill TextEncoder/TextDecoder for Node test environment
if (!(globalThis as { TextEncoder?: typeof globalThis.TextEncoder }).TextEncoder) {
  (globalThis as { TextEncoder?: typeof globalThis.TextEncoder }).TextEncoder =
    TextEncoder as unknown as typeof globalThis.TextEncoder;
}

if (!(globalThis as { TextDecoder?: typeof globalThis.TextDecoder }).TextDecoder) {
  (globalThis as { TextDecoder?: typeof globalThis.TextDecoder }).TextDecoder =
    TextDecoder as unknown as typeof globalThis.TextDecoder;
}

// Mock environment variables for Vite
(globalThis as { __DEV__?: boolean }).__DEV__ = true;

(globalThis as { __TEST_ENV__?: Record<string, unknown> }).__TEST_ENV__ = {
  VITE_API_ENDPOINT: 'https://test-api-endpoint.com/api',
  VITE_RECAPTCHA_SITE_KEY: 'test-recaptcha-site-key',
  VITE_GTM_ID: 'GTM-TEST1234',
  VITE_GA4_MEASUREMENT_ID: 'G-TEST123456',
  VITE_META_PIXEL_ID: '3101676426887721',
  DEV: true
};

// Create a helper to pause execution (for async tests)
export const waitFor = (ms: number) => new Promise(r => setTimeout(r, ms));
