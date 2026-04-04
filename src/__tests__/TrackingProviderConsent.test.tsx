import React from 'react';
import {act, render} from '@testing-library/react';
import '@testing-library/jest-dom';
import TrackingProvider, {useTracking} from '../components/TrackingProvider';
import {ThemeProvider} from '../styles/ThemeProvider';
import {useMountEffect} from '../hooks/useMountEffect';

jest.mock('../utils/env', () => ({
  env: {
    VITE_GTM_ID: 'GTM-TEST1234',
    VITE_GA4_MEASUREMENT_ID: 'G-TEST123456',
    VITE_META_PIXEL_ID: '3101676426887721',
    VITE_TIKTOK_PIXEL_ID: 'TT-123456',
  },
}));

jest.mock('../services/consentLogger', () => ({
  logConsentEvent: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('../tracking/runtime', () => ({
  loadGtmRuntime: jest.fn(async () => undefined),
  loadGA4Runtime: jest.fn(async () => undefined),
  loadMetaPixelRuntime: jest.fn(async () => undefined),
  loadTikTokPixelRuntime: jest.fn(async () => undefined),
}));

const runtimeMock = jest.requireMock('../tracking/runtime') as {
  loadGtmRuntime: jest.Mock;
  loadGA4Runtime: jest.Mock;
  loadMetaPixelRuntime: jest.Mock;
  loadTikTokPixelRuntime: jest.Mock;
};

const TestWrapper: React.FC<{children: React.ReactNode}> = ({children}) => (
  <ThemeProvider>
    <TrackingProvider>{children}</TrackingProvider>
  </ThemeProvider>
);

const RevokeConsentHarness: React.FC = () => {
  const {revokeConsent} = useTracking();

  useMountEffect(() => {
    revokeConsent('revoked');
  });

  return <div>revoked</div>;
};

const TrackEventHarness: React.FC = () => {
  const {hasAnalyticsConsent, trackEvent} = useTracking();

  React.useEffect(() => {
    if (!hasAnalyticsConsent) {
      return;
    }

    trackEvent('generate_lead', {
      event_id: 'evt_test_123',
      email_hash: 'hashed-email-should-not-leak',
      form_name: 'waitlist_signup',
    });
  }, [hasAnalyticsConsent, trackEvent]);

  return <div>tracked</div>;
};

const TrackMarketingEventHarness: React.FC<{eventName: string}> = ({eventName}) => {
  const {hasMarketingConsent, trackEvent} = useTracking();

  React.useEffect(() => {
    if (!hasMarketingConsent) {
      return;
    }

    trackEvent(eventName, {
      event_id: 'evt_test_456',
      form_name: 'waitlist_signup',
    });
  }, [eventName, hasMarketingConsent, trackEvent]);

  return <div>marketing-tracked</div>;
};

const TrackPageViewHarness: React.FC<{page: string}> = ({page}) => {
  const {trackPageView} = useTracking();

  React.useEffect(() => {
    trackPageView(page);
  }, [page, trackPageView]);

  return <div>page-view-tracked</div>;
};

describe('TrackingProvider consent gating', () => {
  const localStorageMock = {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn(),
  };

  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();

    Object.defineProperty(window, 'localStorage', {
      value: localStorageMock,
      configurable: true,
    });

    document.cookie = 'tracking-consent=; max-age=0; path=/';
    document.cookie = 'tracking-consent-timestamp=; max-age=0; path=/';
    window.dataLayer = [];
    window.gtag = jest.fn();
    window.fbq = jest.fn() as unknown as Window['fbq'];
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  const flushIdle = async () => {
    await act(async () => {
      jest.runOnlyPendingTimers();
      await Promise.resolve();
    });
  };

  it('loads GA4 only when analytics consent is granted', async () => {
    localStorageMock.getItem.mockImplementation((key: string) => {
      if (key === 'tracking-consent') return 'partial';
      if (key === 'tracking-consent-timestamp') return Date.now().toString();
      if (key === 'tracking-preferences') {
        return JSON.stringify({analytics: true, marketing: false, functional: true});
      }
      return null;
    });

    render(
      <TestWrapper>
        <div>child</div>
      </TestWrapper>,
    );

    await flushIdle();

    expect(runtimeMock.loadGA4Runtime).toHaveBeenCalledTimes(1);
    expect(runtimeMock.loadGtmRuntime).toHaveBeenCalledTimes(1);
    expect(runtimeMock.loadMetaPixelRuntime).not.toHaveBeenCalled();
    expect(runtimeMock.loadTikTokPixelRuntime).not.toHaveBeenCalled();
  });

  it('loads ads pixels only when marketing consent is granted', async () => {
    localStorageMock.getItem.mockImplementation((key: string) => {
      if (key === 'tracking-consent') return 'partial';
      if (key === 'tracking-consent-timestamp') return Date.now().toString();
      if (key === 'tracking-preferences') {
        return JSON.stringify({analytics: false, marketing: true, functional: true});
      }
      return null;
    });

    render(
      <TestWrapper>
        <div>child</div>
      </TestWrapper>,
    );

    await flushIdle();

    expect(runtimeMock.loadGtmRuntime).toHaveBeenCalledTimes(1);
    expect(runtimeMock.loadGA4Runtime).not.toHaveBeenCalled();
    expect(runtimeMock.loadMetaPixelRuntime).toHaveBeenCalledTimes(1);
    expect(runtimeMock.loadTikTokPixelRuntime).toHaveBeenCalledTimes(1);
  });

  it('does not load anything when partial consent has invalid preferences', async () => {
    localStorageMock.getItem.mockImplementation((key: string) => {
      if (key === 'tracking-consent') return 'partial';
      if (key === 'tracking-consent-timestamp') return Date.now().toString();
      if (key === 'tracking-preferences') return 'invalid-json';
      return null;
    });

    render(
      <TestWrapper>
        <div>child</div>
      </TestWrapper>,
    );

    await flushIdle();

    expect(runtimeMock.loadGtmRuntime).not.toHaveBeenCalled();
    expect(runtimeMock.loadGA4Runtime).not.toHaveBeenCalled();
    expect(runtimeMock.loadMetaPixelRuntime).not.toHaveBeenCalled();
    expect(runtimeMock.loadTikTokPixelRuntime).not.toHaveBeenCalled();
  });

  it('clears known analytics and marketing cookies when consent is revoked', async () => {
    localStorageMock.getItem.mockReturnValue(null);

    document.cookie = '_ga=analytics-cookie; path=/';
    document.cookie = '_ga_ABC123=analytics-session-cookie; path=/';
    document.cookie = '_fbp=marketing-cookie; path=/';
    document.cookie = '_fbc=marketing-click-cookie; path=/';
    document.cookie = '_ttp=tiktok-cookie; path=/';

    render(
      <TestWrapper>
        <RevokeConsentHarness />
      </TestWrapper>,
    );

    await flushIdle();

    expect(document.cookie).not.toContain('_ga=');
    expect(document.cookie).not.toContain('_ga_ABC123=');
    expect(document.cookie).not.toContain('_fbp=');
    expect(document.cookie).not.toContain('_fbc=');
    expect(document.cookie).not.toContain('_ttp=');
  });

  it('pushes sanitized events into dataLayer without hashed identifiers', async () => {
    localStorageMock.getItem.mockImplementation((key: string) => {
      if (key === 'tracking-consent') return 'partial';
      if (key === 'tracking-consent-timestamp') return Date.now().toString();
      if (key === 'tracking-preferences') {
        return JSON.stringify({analytics: true, marketing: false, functional: true});
      }
      return null;
    });

    render(
      <TestWrapper>
        <TrackEventHarness />
      </TestWrapper>,
    );

    await flushIdle();

    const matchingEvent = window.dataLayer?.find((entry) => {
      if (!entry || typeof entry !== 'object') {
        return false;
      }
      return (entry as {event?: string}).event === 'generate_lead';
    }) as {event?: string; form_name?: string; email_hash?: string; event_id?: string} | undefined;

    expect(matchingEvent).toEqual(
      expect.objectContaining({
        event: 'generate_lead',
        form_name: 'waitlist_signup',
        event_id: 'evt_test_123',
      }),
    );
    expect(matchingEvent?.email_hash).toBeUndefined();
  });

  it('does not emit GA4 page views without analytics consent', async () => {
    localStorageMock.getItem.mockImplementation((key: string) => {
      if (key === 'tracking-consent') return 'partial';
      if (key === 'tracking-consent-timestamp') return Date.now().toString();
      if (key === 'tracking-preferences') {
        return JSON.stringify({analytics: false, marketing: true, functional: true});
      }
      return null;
    });

    render(
      <TestWrapper>
        <TrackPageViewHarness page="/pricing" />
      </TestWrapper>,
    );

    await flushIdle();

    expect(window.gtag).not.toHaveBeenCalledWith(
      'event',
      'page_view',
      expect.objectContaining({page_path: '/pricing'}),
    );
  });

  it('emits a GA4 page view once analytics consented runtime is ready', async () => {
    runtimeMock.loadGA4Runtime.mockImplementation(async ({onLoaded}: {onLoaded: () => void}) => {
      onLoaded();
    });

    localStorageMock.getItem.mockImplementation((key: string) => {
      if (key === 'tracking-consent') return 'partial';
      if (key === 'tracking-consent-timestamp') return Date.now().toString();
      if (key === 'tracking-preferences') {
        return JSON.stringify({analytics: true, marketing: false, functional: true});
      }
      return null;
    });

    render(
      <TestWrapper>
        <TrackPageViewHarness page="/pricing?utm_source=ad" />
      </TestWrapper>,
    );

    await flushIdle();

    expect(window.gtag).toHaveBeenCalledWith(
      'event',
      'page_view',
      expect.objectContaining({
        page_path: '/pricing?utm_source=ad',
      }),
    );
  });

  it('maps waitlist leads to the standard Meta Lead event', async () => {
    runtimeMock.loadMetaPixelRuntime.mockImplementation(async ({onLoaded}: {onLoaded: () => void}) => {
      onLoaded();
    });

    localStorageMock.getItem.mockImplementation((key: string) => {
      if (key === 'tracking-consent') return 'partial';
      if (key === 'tracking-consent-timestamp') return Date.now().toString();
      if (key === 'tracking-preferences') {
        return JSON.stringify({analytics: false, marketing: true, functional: true});
      }
      return null;
    });

    render(
      <TestWrapper>
        <TrackMarketingEventHarness eventName="generate_lead" />
      </TestWrapper>,
    );

    await flushIdle();

    expect(window.fbq).toHaveBeenCalledWith(
      'track',
      'Lead',
      expect.objectContaining({
        form_name: 'waitlist_signup',
      }),
      expect.objectContaining({
        eventID: 'evt_test_456',
      }),
    );
  });

  it('does not send unmapped Meta custom events', async () => {
    runtimeMock.loadMetaPixelRuntime.mockImplementation(async ({onLoaded}: {onLoaded: () => void}) => {
      onLoaded();
    });

    localStorageMock.getItem.mockImplementation((key: string) => {
      if (key === 'tracking-consent') return 'partial';
      if (key === 'tracking-consent-timestamp') return Date.now().toString();
      if (key === 'tracking-preferences') {
        return JSON.stringify({analytics: false, marketing: true, functional: true});
      }
      return null;
    });

    render(
      <TestWrapper>
        <TrackMarketingEventHarness eventName="form_start" />
      </TestWrapper>,
    );

    await flushIdle();

    const fbqMock = window.fbq as unknown as jest.Mock;
    expect(fbqMock).not.toHaveBeenCalledWith(
      'trackCustom',
      'form_start',
      expect.anything(),
      expect.anything(),
    );
    expect(fbqMock).not.toHaveBeenCalledWith(
      'trackCustom',
      'form_start',
      expect.anything(),
    );
  });
});
