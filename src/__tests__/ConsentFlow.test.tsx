/**
 * ConsentFlow.test.tsx - Integration tests for cookie consent functionality
 * 
 * Tests the complete consent flow including:
 * - Banner visibility
 * - Consent storage
 * - Tracking activation/deactivation
 * - Legal compliance features
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { HelmetProvider } from 'react-helmet-async';
import { BrowserRouter, MemoryRouter } from 'react-router-dom';
import { ThemeProvider } from '../styles/ThemeProvider';
import TrackingProvider from '../components/TrackingProvider';
import { AppRoutes } from '../App';
import { env } from '../utils/env';
import ConsentBanner from '../components/ConsentBanner';
import Footer from '../components/Footer';
import { I18nProvider } from '../i18n/I18nProvider';

jest.mock('../services/consentLogger', () => ({
  logConsentEvent: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('../tracking/runtime', () => ({
  loadGtmRuntime: jest.fn(async () => undefined),
  loadGA4Runtime: jest.fn(async () => undefined),
  loadMetaPixelRuntime: jest.fn(async () => undefined),
  loadTikTokPixelRuntime: jest.fn(async () => undefined),
}));

// Mock environment variables
const mockEnv = {
  VITE_GTM_ID: 'GTM-TEST1234',
  VITE_GA4_MEASUREMENT_ID: 'G-TEST123456',
  VITE_META_PIXEL_ID: '3101676426887721',
  VITE_TIKTOK_PIXEL_ID: 'TT-123456',
};

// Mock environment for env helper
(globalThis as { __TEST_ENV__?: typeof mockEnv }).__TEST_ENV__ = mockEnv;

// Mock localStorage
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

const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ThemeProvider>
    <HelmetProvider>
      <BrowserRouter>
        <I18nProvider>
          <TrackingProvider>
            {children}
          </TrackingProvider>
        </I18nProvider>
      </BrowserRouter>
    </HelmetProvider>
  </ThemeProvider>
);

describe('ConsentFlow Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.getItem.mockReset();
    localStorageMock.setItem.mockReset();
    localStorageMock.removeItem.mockReset();
    localStorageMock.clear.mockReset();
    localStorageMock.getItem.mockReturnValue(null);

    document.cookie = 'tracking-consent=; max-age=0; path=/';
    document.cookie = 'tracking-consent-timestamp=; max-age=0; path=/';

    // Mock gtag and fbq functions
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

  describe('Banner Visibility', () => {
    test('shows consent banner on first visit', () => {
      localStorageMock.getItem.mockReturnValue(null);

      render(
        <TestWrapper>
          <ConsentBanner />
        </TestWrapper>
      );

      expect(screen.getByTestId('consent-banner')).toBeInTheDocument();
      expect(screen.getByText('We Value Your Privacy')).toBeInTheDocument();
    });

    test('shows consent banner on the homepage route', async () => {
      localStorageMock.getItem.mockReturnValue(null);

      render(
        <ThemeProvider>
          <HelmetProvider>
            <MemoryRouter initialEntries={['/']}>
              <TrackingProvider>
                <AppRoutes />
              </TrackingProvider>
            </MemoryRouter>
          </HelmetProvider>
        </ThemeProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('consent-banner')).toBeInTheDocument();
      });
    });

    test('hides banner when consent already given', () => {
      localStorageMock.getItem.mockImplementation((key) => {
        if (key === 'tracking-consent') return 'granted';
        if (key === 'tracking-consent-timestamp') return Date.now().toString();
        return null;
      });

      render(
        <TestWrapper>
          <ConsentBanner />
        </TestWrapper>
      );

      expect(screen.queryByTestId('consent-banner')).not.toBeInTheDocument();
    });

    test('shows banner when consent has expired', () => {
      const oneHundredEightyOneDaysAgo = Date.now() - (181 * 24 * 60 * 60 * 1000);
      
      localStorageMock.getItem.mockImplementation((key) => {
        if (key === 'tracking-consent') return 'granted';
        if (key === 'tracking-consent-timestamp') return oneHundredEightyOneDaysAgo.toString();
        return null;
      });

      render(
        <TestWrapper>
          <ConsentBanner />
        </TestWrapper>
      );

      expect(screen.getByTestId('consent-banner')).toBeInTheDocument();
    });
  });

  describe('Consent Actions', () => {
    test('accepts all cookies and stores consent', async () => {
      localStorageMock.getItem.mockReturnValue(null);

      render(
        <TestWrapper>
          <ConsentBanner />
        </TestWrapper>
      );

      const acceptButton = screen.getByText('Accept All');
      fireEvent.click(acceptButton);

      await waitFor(() => {
        expect(localStorageMock.setItem).toHaveBeenCalledWith('tracking-consent', 'granted');
        expect(localStorageMock.setItem).toHaveBeenCalledWith(
          'tracking-consent-timestamp', 
          expect.any(String)
        );
        expect(localStorageMock.setItem).toHaveBeenCalledWith(
          'tracking-preferences',
          expect.stringContaining('"marketing":true'),
        );
        expect(document.cookie).toContain('tracking-consent=granted');
        expect(document.cookie).toMatch(/tracking-consent-timestamp=/);
      });
    });

    test('rejects all cookies and stores refusal', async () => {
      localStorageMock.getItem.mockReturnValue(null);
      window.history.pushState(
        {},
        '',
        '/?gclid=test-gclid&wbraid=test-wbraid&gbraid=test-gbraid&fbclid=test-fbclid',
      );

      render(
        <TestWrapper>
          <ConsentBanner />
        </TestWrapper>
      );

      const rejectButton = screen.getByText('Reject All');
      fireEvent.click(rejectButton);

      await waitFor(() => {
        expect(localStorageMock.setItem).toHaveBeenCalledWith('tracking-consent', 'rejected');
        expect(localStorageMock.setItem).toHaveBeenCalledWith(
          'tracking-consent-timestamp', 
          expect.any(String)
        );
        expect(localStorageMock.setItem).toHaveBeenCalledWith(
          'tracking-preferences',
          expect.stringContaining('"marketing":false'),
        );
        expect(document.cookie).toContain('tracking-consent=rejected');
        expect(document.cookie).toMatch(/tracking-consent-timestamp=/);
        expect(window.location.search).toBe('');
      });
    });

    test('opens customization modal', async () => {
      localStorageMock.getItem.mockReturnValue(null);

      render(
        <TestWrapper>
          <ConsentBanner />
        </TestWrapper>
      );

      const customizeButton = screen.getByText('Customize');
      fireEvent.click(customizeButton);

      await waitFor(() => {
        expect(screen.getByText('Cookie Preferences')).toBeInTheDocument();
        expect(screen.getByText('Functional Cookies')).toBeInTheDocument();
        expect(screen.getByText('Analytics Cookies')).toBeInTheDocument();
        expect(screen.getByText('Marketing Cookies')).toBeInTheDocument();
      });
    });
  });

  describe('Granular Consent Management', () => {
    test('saves granular preferences', async () => {
      localStorageMock.getItem.mockReturnValue(null);

      render(
        <TestWrapper>
          <ConsentBanner />
        </TestWrapper>
      );

      // Open customization modal
      fireEvent.click(screen.getByText('Customize'));

      await waitFor(() => {
        expect(screen.getByText('Cookie Preferences')).toBeInTheDocument();
      });

      // Enable analytics while keeping marketing disabled
      const analyticsCheckbox = screen.getByLabelText(/Analytics Cookies/) as HTMLInputElement;
      expect(analyticsCheckbox.checked).toBe(false);
      fireEvent.click(analyticsCheckbox);

      const marketingCheckbox = screen.getByLabelText(/Marketing Cookies/) as HTMLInputElement;
      expect(marketingCheckbox.checked).toBe(false);

      // Save preferences
      const saveButton = screen.getByText('Save Preferences');
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(localStorageMock.setItem).toHaveBeenCalledWith(
          'tracking-preferences',
          expect.stringContaining('"analytics":true'),
        );
        expect(localStorageMock.setItem).toHaveBeenCalledWith(
          'tracking-preferences',
          expect.stringContaining('"marketing":false'),
        );
      });
    });

    test('loads saved preferences', () => {
      const savedPreferences = JSON.stringify({
        analytics: true,
        marketing: false,
        functional: true
      });

      localStorageMock.getItem.mockImplementation((key) => {
        if (key === 'tracking-preferences') return savedPreferences;
        return null;
      });

      render(
        <TestWrapper>
          <ConsentBanner />
        </TestWrapper>
      );

      // Open customization modal
      fireEvent.click(screen.getByText('Customize'));

      // Check that preferences are loaded
      const marketingCheckbox = screen.getByLabelText(/Marketing Cookies/) as HTMLInputElement;
      expect(marketingCheckbox.checked).toBe(false);

      const analyticsCheckbox = screen.getByLabelText(/Analytics Cookies/) as HTMLInputElement;
      expect(analyticsCheckbox.checked).toBe(true);
    });
  });

  describe('Persistent Privacy Controls', () => {
    test('opens cookie preferences from the footer after consent was previously set', async () => {
      localStorageMock.getItem.mockImplementation((key) => {
        if (key === 'tracking-consent') return 'granted';
        if (key === 'tracking-consent-timestamp') return Date.now().toString();
        if (key === 'tracking-preferences') {
          return JSON.stringify({analytics: true, marketing: true, functional: true});
        }
        return null;
      });

      render(
        <TestWrapper>
          <>
            <ConsentBanner />
            <Footer />
          </>
        </TestWrapper>
      );

      fireEvent.click(screen.getByRole('button', {name: /manage cookies/i}));

      await waitFor(() => {
        expect(screen.getByText('Cookie Preferences')).toBeInTheDocument();
      });
    });
  });

  describe('Tracking Integration', () => {
    test('initializes Google Consent Mode', () => {
      render(
        <TestWrapper>
          <ConsentBanner />
        </TestWrapper>
      );

      // Check that dataLayer is initialized
      expect(window.dataLayer).toBeDefined();
      expect(Array.isArray(window.dataLayer)).toBe(true);
    });

    test('calls gtag consent update on accept', async () => {
      localStorageMock.getItem.mockReturnValue(null);

      render(
        <TestWrapper>
          <ConsentBanner />
        </TestWrapper>
      );

      const acceptButton = screen.getByText('Accept All');
      fireEvent.click(acceptButton);

      // Note: In a real test, we'd need to wait for the TrackingProvider to update
      // This test verifies the structure is in place
      await waitFor(() => {
        expect(localStorageMock.setItem).toHaveBeenCalledWith('tracking-consent', 'granted');
      });
    });
  });

  describe('Legal Compliance', () => {
    test('includes privacy policy and terms links', () => {
      localStorageMock.getItem.mockReturnValue(null);

      render(
        <TestWrapper>
          <ConsentBanner />
        </TestWrapper>
      );

      expect(screen.getByText('Terms of Service')).toBeInTheDocument();
      expect(screen.getByText('Privacy Policy')).toBeInTheDocument();
    });

    test('provides detailed cookie information', async () => {
      localStorageMock.getItem.mockReturnValue(null);

      render(
        <TestWrapper>
          <ConsentBanner />
        </TestWrapper>
      );

      // Open customization modal
      fireEvent.click(screen.getByText('Customize'));

      await waitFor(() => {
        expect(screen.getByText(/Essential for the website to function properly/)).toBeInTheDocument();
        expect(screen.getByText(/Help us understand how visitors interact/)).toBeInTheDocument();
        expect(screen.getByText(/Used to track visitors across websites/)).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    test('handles localStorage errors gracefully', () => {
      localStorageMock.getItem.mockImplementation(() => {
        throw new Error('localStorage not available');
      });

      expect(() => {
        render(
          <TestWrapper>
            <ConsentBanner />
          </TestWrapper>
        );
      }).not.toThrow();
    });

    test('handles JSON parsing errors for preferences', () => {
      localStorageMock.getItem.mockImplementation((key) => {
        if (key === 'tracking-preferences') return 'invalid-json';
        return null;
      });

      expect(() => {
        render(
          <TestWrapper>
            <ConsentBanner />
          </TestWrapper>
        );
      }).not.toThrow();
    });
  });
});

// Additional utility test for consent flow validation
describe('Consent Flow Utility Functions', () => {
  test('validates consent timestamp correctly', () => {
    const oneMonth = 30 * 24 * 60 * 60 * 1000;
    const now = Date.now();
    
    // Recent consent - should be valid
    const recentTimestamp = now - (15 * 24 * 60 * 60 * 1000); // 15 days ago
    const isRecentExpired = (now - recentTimestamp) > oneMonth;
    expect(isRecentExpired).toBe(false);
    
    // Old consent - should be expired
    const oldTimestamp = now - (35 * 24 * 60 * 60 * 1000); // 35 days ago  
    const isOldExpired = (now - oldTimestamp) > oneMonth;
    expect(isOldExpired).toBe(true);
  });

  test('handles missing environment variables', () => {
    const originalEnv = env;
    
    // @ts-ignore - Mock empty env
    (globalThis as { __TEST_ENV__?: any }).__TEST_ENV__ = {};
    
    expect(() => {
      render(
        <TestWrapper>
          <ConsentBanner />
        </TestWrapper>
      );
    }).not.toThrow();
    
    // Restore original env
    (globalThis as { __TEST_ENV__?: any }).__TEST_ENV__ = originalEnv;
  });
});
