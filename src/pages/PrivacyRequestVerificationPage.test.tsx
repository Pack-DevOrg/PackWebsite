import React from 'react';
import {render, screen, waitFor} from '@testing-library/react';
import {MemoryRouter} from 'react-router-dom';
import {QueryClient, QueryClientProvider} from '@tanstack/react-query';
import {HelmetProvider} from 'react-helmet-async';
import {ThemeProvider} from '../styles/ThemeProvider';
import TrackingProvider from '../components/TrackingProvider';
import {I18nProvider} from '../i18n/I18nProvider';

import PrivacyRequestVerificationPage from './PrivacyRequestVerificationPage';

jest.mock('../services/consentLogger', () => ({
  logConsentEvent: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('../tracking/runtime', () => ({
  loadGtmRuntime: jest.fn(async () => undefined),
  loadGA4Runtime: jest.fn(async () => undefined),
  loadMetaPixelRuntime: jest.fn(async () => undefined),
  loadTikTokPixelRuntime: jest.fn(async () => undefined),
}));

const renderWithProviders = (initialEntry: string) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return render(
      <MemoryRouter initialEntries={[initialEntry]}>
        <QueryClientProvider client={queryClient}>
          <ThemeProvider>
            <HelmetProvider>
              <I18nProvider>
                <TrackingProvider>
                  <PrivacyRequestVerificationPage />
                </TrackingProvider>
              </I18nProvider>
            </HelmetProvider>
          </ThemeProvider>
        </QueryClientProvider>
      </MemoryRouter>,
  );
};

describe('PrivacyRequestVerificationPage', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test('shows an error when the verification token is missing', async () => {
    renderWithProviders('/privacy-request/verify');

    expect(
      await screen.findByText(/Missing privacy verification details/i),
    ).toBeInTheDocument();
  });

  test('confirms the opt-out request when verification succeeds', async () => {
    window.localStorage.setItem('tracking-consent', 'granted');
    window.localStorage.setItem('tracking-consent-timestamp', Date.now().toString());
    window.localStorage.setItem(
      'tracking-preferences',
      JSON.stringify({analytics: true, marketing: true, functional: true}),
    );
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve({
            success: true,
            data: {
              requestId: '550e8400-e29b-41d4-a716-446655440000',
              requestType: 'opt_out',
              status: 'completed',
              verifiedAt: '2026-04-02T12:00:00.000Z',
              completedAt: '2026-04-02T12:00:00.000Z',
              message: 'Your privacy opt-out request has been confirmed and applied.',
            },
          }),
      }),
    ) as jest.Mock;

    renderWithProviders(
      '/privacy-request/verify?requestId=550e8400-e29b-41d4-a716-446655440000&token=verify-token-1234567890',
    );

    expect(
      await screen.findByText(/confirmed and applied/i),
    ).toBeInTheDocument();
    expect(window.localStorage.getItem('tracking-consent')).toBe('revoked');
    expect(window.localStorage.getItem('tracking-preferences')).toContain('"marketing":false');
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringMatching(/\/privacy\/requests\/verify$/),
      expect.objectContaining({
        method: 'POST',
      }),
    );
  });

  test('shows a server error returned by the verification endpoint', async () => {
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: false,
        json: () =>
          Promise.resolve({
            error: {
              message: 'This privacy verification link has expired. Please submit a new request.',
            },
          }),
      }),
    ) as jest.Mock;

    renderWithProviders(
      '/privacy-request/verify?requestId=550e8400-e29b-41d4-a716-446655440000&token=expired-token-1234567890',
    );

    await waitFor(() => {
      expect(
        screen.getByText(/verification link has expired/i),
      ).toBeInTheDocument();
    });
  });
});
