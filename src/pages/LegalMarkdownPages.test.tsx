import React from 'react';
import {render, screen, waitFor} from '@testing-library/react';
import {QueryClient, QueryClientProvider} from '@tanstack/react-query';
import {HelmetProvider} from 'react-helmet-async';
import {MemoryRouter} from 'react-router-dom';
import {ThemeProvider} from '../styles/ThemeProvider';
import TrackingProvider from '../components/TrackingProvider';
import {I18nProvider} from '../i18n/I18nProvider';
import {getLegalOverrideEnvVarName} from '../legal/legalDocuments';

import PrivacyPolicy from './PrivacyPolicy';
import TermsOfService from './TermsOfService';

jest.mock('../services/consentLogger', () => ({
  logConsentEvent: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('../tracking/runtime', () => ({
  loadGtmRuntime: jest.fn(async () => undefined),
  loadGA4Runtime: jest.fn(async () => undefined),
  loadMetaPixelRuntime: jest.fn(async () => undefined),
  loadTikTokPixelRuntime: jest.fn(async () => undefined),
}));

const renderWithProviders = (ui: React.ReactElement) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return render(
    <MemoryRouter initialEntries={['/']}>
      <HelmetProvider>
        <I18nProvider>
          <QueryClientProvider client={queryClient}>
            <ThemeProvider>
              <TrackingProvider>{ui}</TrackingProvider>
            </ThemeProvider>
          </QueryClientProvider>
        </I18nProvider>
      </HelmetProvider>
    </MemoryRouter>,
  );
};

describe('Legal markdown pages', () => {
  test('legal registry exposes the hard-override env var', () => {
    expect(getLegalOverrideEnvVarName()).toBe('DONEAI_LEGAL_OVERRIDE');
  });

  afterEach(() => {
    jest.clearAllMocks();
    window.localStorage.clear();
  });

  test('PrivacyPolicy fetches markdown from site root', async () => {
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        status: 200,
        statusText: 'OK',
        text: () =>
          Promise.resolve('# DoneAI Privacy Policy\n\n## Introduction\n\nHello'),
      }),
    ) as jest.Mock;

    renderWithProviders(<PrivacyPolicy />);

    expect(await screen.findByText(/Hello/i)).toBeInTheDocument();
    expect(await screen.findByText(/Hello/i)).toBeInTheDocument();
    expect(global.fetch).toHaveBeenCalledWith(
      '/PrivacyPolicy.md',
      expect.any(Object),
    );
  });

  test('PrivacyPolicy still renders fallback markdown when fetch fails', async () => {
    global.fetch = jest.fn(() => Promise.reject(new Error('Network error'))) as jest.Mock;

    renderWithProviders(<PrivacyPolicy />);

    expect(
      screen.getByRole('heading', {name: /^Privacy Policy$/i, level: 1}),
    ).toBeInTheDocument();
    await waitFor(() => {
      expect(
        screen.queryByText(/Unable to load privacy policy right now/i),
      ).not.toBeInTheDocument();
    });
  });

  test('TermsOfService fetches markdown from site root', async () => {
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        status: 200,
        statusText: 'OK',
        text: () =>
          Promise.resolve('# Terms of Service\n\n## Acceptance of Terms\n\nHello'),
      }),
    ) as jest.Mock;

    renderWithProviders(<TermsOfService />);

    expect(screen.getByLabelText(/^Terms of Service$/i)).toBeInTheDocument();
    expect(await screen.findByText(/Hello/i)).toBeInTheDocument();
    expect(global.fetch).toHaveBeenCalledWith(
      '/TermsOfService.md',
      expect.any(Object),
    );
  });

  test('TermsOfService renders the loaded text verbatim', async () => {
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        status: 200,
        statusText: 'OK',
        text: () =>
          Promise.resolve(
            'Terms of Service\nEffective Date: March 23, 2026\n\nAcceptance of Terms\nHello',
          ),
      }),
    ) as jest.Mock;

    renderWithProviders(<TermsOfService />);

    const document = await screen.findByLabelText(/^Terms of Service$/i);
    await waitFor(() => {
      expect(
        screen.getByRole('heading', {name: /^Terms of Service$/i, level: 1}),
      ).toBeInTheDocument();
      expect(screen.getByText('Effective Date: March 23, 2026')).toBeInTheDocument();
      expect(
        screen.getByRole('heading', {name: /^Acceptance of Terms$/i, level: 2}),
      ).toBeInTheDocument();
      expect(screen.getByText('Hello')).toBeInTheDocument();
    });
    expect(document).not.toHaveTextContent(/Showing a cached copy due to a network issue/i);
  });
});
