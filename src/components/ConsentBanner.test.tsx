import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { HelmetProvider } from 'react-helmet-async';
import { MemoryRouter } from 'react-router-dom';
import { ThemeProvider } from '../styles/ThemeProvider';
import TrackingProvider from './TrackingProvider';
import { I18nProvider } from '../i18n/I18nProvider';
import ConsentBanner from './ConsentBanner';

jest.mock('../services/consentLogger', () => ({
  logConsentEvent: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('../tracking/runtime', () => ({
  loadGtmRuntime: jest.fn(async () => undefined),
  loadGA4Runtime: jest.fn(async () => undefined),
  loadMetaPixelRuntime: jest.fn(async () => undefined),
  loadTikTokPixelRuntime: jest.fn(async () => undefined),
}));

const mockEnv = {
  VITE_GTM_ID: 'GTM-TEST1234',
  VITE_GA4_MEASUREMENT_ID: 'G-TEST123456',
  VITE_META_PIXEL_ID: '3101676426887721',
  VITE_TIKTOK_PIXEL_ID: 'TT-123456',
};

(globalThis as { __TEST_ENV__?: typeof mockEnv }).__TEST_ENV__ = mockEnv;

const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

type WindowTrackingMocks = {
  gtag?: (...args: unknown[]) => void;
  fbq?: (...args: unknown[]) => void;
  dataLayer?: unknown[];
  matchMedia?: (query: string) => MediaQueryList;
};

function renderConsentBanner(initialEntry: string) {
  return render(
    <ThemeProvider>
      <HelmetProvider>
        <MemoryRouter initialEntries={[initialEntry]}>
          <I18nProvider>
            <TrackingProvider>
              <ConsentBanner />
            </TrackingProvider>
          </I18nProvider>
        </MemoryRouter>
      </HelmetProvider>
    </ThemeProvider>,
  );
}

describe('ConsentBanner', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.getItem.mockReset();
    localStorageMock.setItem.mockReset();
    localStorageMock.removeItem.mockReset();
    localStorageMock.clear.mockReset();
    localStorageMock.getItem.mockReturnValue(null);

    document.cookie = 'tracking-consent=; max-age=0; path=/';
    document.cookie = 'tracking-consent-timestamp=; max-age=0; path=/';

    (window as unknown as WindowTrackingMocks).gtag = jest.fn();
    (window as unknown as WindowTrackingMocks).fbq = jest.fn();
    (window as unknown as WindowTrackingMocks).dataLayer = [];
    (window as unknown as WindowTrackingMocks).matchMedia = jest
      .fn()
      .mockImplementation((query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      }) as MediaQueryList);
  });

  afterEach(() => {
    delete (window as unknown as WindowTrackingMocks).gtag;
    delete (window as unknown as WindowTrackingMocks).fbq;
    delete (window as unknown as WindowTrackingMocks).dataLayer;
    delete (window as unknown as WindowTrackingMocks).matchMedia;
  });

  test('does not render the overlapping banner on /onboard', () => {
    renderConsentBanner('/onboard');

    expect(screen.queryByTestId('consent-banner')).not.toBeInTheDocument();
  });

  test('does not render the overlapping banner on nested onboard routes', () => {
    renderConsentBanner('/onboard/verify');

    expect(screen.queryByTestId('consent-banner')).not.toBeInTheDocument();
  });

  test('shows the consent banner on the homepage when no consent is stored', () => {
    renderConsentBanner('/');

    expect(screen.getByTestId('consent-banner')).toBeInTheDocument();
  });

  test('shows the consent banner on /privacy when no consent is stored', () => {
    renderConsentBanner('/privacy');

    expect(screen.getByTestId('consent-banner')).toBeInTheDocument();
  });
});
