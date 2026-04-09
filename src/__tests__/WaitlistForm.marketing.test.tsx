import React from 'react';
import {render, waitFor, screen, fireEvent} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import WaitlistForm from '../components/WaitlistForm';
import { ThemeProvider } from '../styles/ThemeProvider';
import { I18nProvider } from '../i18n/I18nProvider';

const AnyMemoryRouter = MemoryRouter as unknown as React.ComponentType<{
  readonly children: React.ReactNode;
}>;

const renderWaitlistForm = () =>
  render(
    <AnyMemoryRouter>
      <ThemeProvider>
        <HelmetProvider>
          <I18nProvider>
            <WaitlistForm />
          </I18nProvider>
        </HelmetProvider>
      </ThemeProvider>
    </AnyMemoryRouter>,
  );

jest.mock('../utils/env', () => ({
  env: {
    VITE_RECAPTCHA_SITE_KEY: 'test-recaptcha-site-key',
    VITE_API_ENDPOINT: 'https://api.example.com/prod/subscribe',
    VITE_DEV_MODE: 'false',
    VITE_ENABLE_ENCRYPTED_WAITLIST: 'false',
  },
}));

jest.mock('framer-motion', () => {
  const React = require('react') as typeof import('react');
  const createStub = (tag: string) =>
    React.forwardRef((props: any, ref: any) => {
      const {
        children,
        animate,
        initial,
        variants,
        whileHover,
        whileTap,
        whileInView,
        transition,
        exit,
        ...rest
      } = props;
      return React.createElement(tag, {...rest, ref}, children);
    });

  const motionProxy = new Proxy(
    {},
    {
      get: (_target, prop: string) => {
        const component = createStub(prop);
        component.displayName = `MockMotion_${String(prop)}`;
        return component;
      },
    },
  );

  return { motion: motionProxy };
});

const trackConversionMock = jest.fn();
const trackFormSubmitMock = jest.fn();
const trackFormStartMock = jest.fn();
const trackCTAClickMock = jest.fn();
const requestPublicApiMock = jest.fn();
const googleInitializeMock = jest.fn();
const googleRenderButtonMock = jest.fn();
let googleCredentialCallback:
  | ((response: { credential?: string }) => void)
  | undefined;

jest.mock('../hooks/useConversionTracking', () => ({
  useConversionTracking: () => ({
    trackConversion: trackConversionMock,
    trackFormStart: trackFormStartMock,
    trackFormSubmit: trackFormSubmitMock,
    trackCTAClick: trackCTAClickMock,
    trackScrollMilestone: jest.fn(),
    trackVideoEngagement: jest.fn(),
    trackABTest: jest.fn(),
    startEngagementTracking: jest.fn(),
    stopEngagementTracking: jest.fn(),
    trackFeatureUsage: jest.fn(),
    trackTimelineAction: jest.fn(),
    trackQuickAction: jest.fn(),
    trackPerformance: jest.fn(),
    trackNetworkError: jest.fn(),
    trackRevenue: jest.fn(),
    updateUserProperties: jest.fn(),
  }),
}));

jest.mock('@/api/client', () => ({
  requestPublicApi: (...args: unknown[]) => requestPublicApiMock(...args),
  ApiRequestError: class ApiRequestError extends Error {
    status: number;
    details?: unknown;
    constructor(status: number, message: string, details?: unknown) {
      super(message);
      this.status = status;
      this.details = details;
    }
  },
}));

jest.mock('../utils/recaptcha', () => ({
  executeRecaptchaAction: jest.fn().mockResolvedValue('test-token'),
  loadRecaptchaScript: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('../services/encryptedWaitlistService', () => ({
  submitToEncryptedWaitlist: jest.fn(),
  checkEncryptedWaitlistStatus: jest.fn(() => ({
    available: false,
    devMode: false,
    endpoint: '',
  })),
}));

describe('WaitlistForm marketing payload', () => {
  const originalCrypto = window.crypto;
  const fetchMock = jest.fn();

  beforeAll(() => {
    class MockIntersectionObserver {
      observe() {}
      disconnect() {}
    }
    (window as unknown as { IntersectionObserver: typeof MockIntersectionObserver }).IntersectionObserver = MockIntersectionObserver;
  });

  beforeEach(() => {
    jest.clearAllMocks();
    Object.defineProperty(window, 'crypto', {
      value: originalCrypto,
      configurable: true,
    });

    window.localStorage.setItem('tracking-consent', 'granted');
    window.localStorage.setItem('tracking-consent-timestamp', Date.now().toString());
    window.localStorage.setItem(
      'tracking-preferences',
      JSON.stringify({analytics: false, marketing: true, functional: true}),
    );

    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, message: 'ok' }),
    } as Response);
    requestPublicApiMock.mockResolvedValue({
      email: 'traveler@example.com',
      emailVerified: true,
      cognitoSub: 'sub_123',
      cognitoUsername: 'google_123',
      status: 'existing_google_user',
      shouldContinueWithHostedLogin: true,
    });
    googleCredentialCallback = undefined;
    googleInitializeMock.mockImplementation(
      ({ callback }: { callback?: (response: { credential?: string }) => void }) => {
        googleCredentialCallback = callback;
      }
    );
    googleRenderButtonMock.mockImplementation((parent: HTMLElement) => {
      parent.replaceChildren();
      const button = document.createElement('button');
      button.type = 'button';
      button.textContent = 'Sign up with Google';
      button.addEventListener('click', () => {
        googleCredentialCallback?.({ credential: 'google_jwt' });
      });
      parent.appendChild(button);
    });
    window.google = {
      accounts: {
        id: {
          initialize: googleInitializeMock,
          renderButton: googleRenderButtonMock,
        },
      },
    };

    (globalThis as unknown as { fetch: typeof fetch }).fetch = fetchMock;
    (window as unknown as { fetch: typeof fetch }).fetch = fetchMock;

    document.cookie = '_ttp=test-ttp; path=/';
    window.history.pushState({}, '', '/?gclid=test-gclid&wbraid=test-wbraid&gbraid=test-gbraid&ttclid=test-ttclid');
  });

  afterEach(() => {
    window.localStorage.removeItem('tracking-consent');
    window.localStorage.removeItem('tracking-consent-timestamp');
    window.localStorage.removeItem('tracking-preferences');

    Object.defineProperty(window, 'crypto', {
      value: originalCrypto,
      configurable: true,
    });
  });

  it('includes marketing consent fields and event metadata in the waitlist payload', async () => {
    renderWaitlistForm();

    const emailInput = screen.getByLabelText('Your email address');
    const marketingEmailCheckbox = screen.getByRole('checkbox', { name: /marketing email consent/i });
    const user = userEvent.setup();
    fireEvent.change(emailInput, { target: { value: 'user@example.com' } });
    expect(emailInput).toHaveValue('user@example.com');
    await user.click(marketingEmailCheckbox);

    const submitButton = screen.getByRole('button', { name: /pack it\./i });
    await user.click(submitButton);

    await waitFor(() => expect(fetchMock).toHaveBeenCalled());

    const [, requestInit] = fetchMock.mock.calls[0];
    const payload = JSON.parse((requestInit?.body as string) ?? '{}');

    expect(payload.marketingConsent).toBe(true);
    expect(payload.marketingEmailConsent).toBe(true);
    expect(payload.ageConfirmed).toBe(true);
    expect(typeof payload.eventId).toBe('string');
    expect(payload.eventId).toMatch(/^evt_/);
    expect(payload.gclid).toBe('test-gclid');
    expect(payload.wbraid).toBe('test-wbraid');
    expect(payload.gbraid).toBe('test-gbraid');
    expect(payload.ttclid).toBe('test-ttclid');
    expect(payload.ttp).toBe('test-ttp');
    expect(payload.recaptchaToken).toBe('test-token');
    expect(payload.fbc).toBeUndefined();
    expect(payload.fbp).toBeUndefined();

    expect(trackConversionMock).toHaveBeenCalledWith(
      'generate_lead',
      expect.objectContaining({
        event_id: expect.stringMatching(/^evt_/),
        form_name: 'waitlist_signup',
        gclid: 'test-gclid',
        wbraid: 'test-wbraid',
        gbraid: 'test-gbraid',
        ttclid: 'test-ttclid',
        ttp: 'test-ttp',
      }),
    );

    expect(trackFormSubmitMock).toHaveBeenCalledWith(
      'waitlist_form',
      expect.objectContaining({
        event_id: expect.stringMatching(/^evt_/),
        gbraid: 'test-gbraid',
        ttclid: 'test-ttclid',
        ttp: 'test-ttp',
      }),
    );
  });

  it('shows a low-friction notice at collection with privacy controls', () => {
    renderWaitlistForm();

    expect(screen.getByRole('link', {name: /terms of service/i})).toHaveAttribute('href', '/terms');
    const privacyPolicyLinks = screen.getAllByRole('link', {name: /privacy policy/i});
    expect(privacyPolicyLinks.some((link) => link.getAttribute('href') === '/privacy')).toBe(true);
    expect(screen.getByRole('link', {name: /your privacy choices/i})).toHaveAttribute('href', '/privacy-request');
  });

  it('starts Google sign-in from the waitlist CTA', async () => {
    renderWaitlistForm();

    const user = userEvent.setup();
    await user.click(await screen.findByRole('button', {name: /sign up with google/i}));

    expect(trackCTAClickMock).toHaveBeenCalledWith(
      'Waitlist Google GIS Button',
      'waitlist_google_gis_button',
    );
    expect(requestPublicApiMock).toHaveBeenCalledWith(
      expect.objectContaining({
        path: '/auth/google/bridge',
        method: 'POST',
        body: expect.objectContaining({
          credential: 'google_jwt',
          redirectPath: '/?gclid=test-gclid&wbraid=test-wbraid&gbraid=test-gbraid&ttclid=test-ttclid',
          source: 'waitlist',
        }),
      }),
    );
  });

  it('passes Google-side marketing email opt-in only when explicitly checked', async () => {
    renderWaitlistForm();

    const user = userEvent.setup();
    await user.click(screen.getByRole('checkbox', {name: /marketing email consent/i}));
    await user.click(await screen.findByRole('button', {name: /sign up with google/i}));

    expect(requestPublicApiMock).toHaveBeenCalledWith(
      expect.objectContaining({
        body: expect.objectContaining({
          credential: 'google_jwt',
          source: 'waitlist',
          marketingEmailConsent: true,
        }),
      }),
    );
  });

  it('omits attribution identifiers when marketing consent is not granted', async () => {
    window.localStorage.removeItem('tracking-consent');
    window.localStorage.removeItem('tracking-consent-timestamp');
    window.localStorage.removeItem('tracking-preferences');

    renderWaitlistForm();

    const emailInput = screen.getByLabelText('Your email address');
    const user = userEvent.setup();

    fireEvent.change(emailInput, { target: { value: 'user@example.com' } });

    const submitButton = screen.getByRole('button', { name: /pack it\./i });
    await user.click(submitButton);

    await waitFor(() => expect(fetchMock).toHaveBeenCalled());

    const [, requestInit] = fetchMock.mock.calls[0];
    const payload = JSON.parse((requestInit?.body as string) ?? '{}');

    expect(payload.marketingConsent).toBe(false);
    expect(payload.marketingEmailConsent).toBe(false);
    expect(payload.eventId).toBeUndefined();
    expect(payload.gclid).toBeUndefined();
    expect(payload.wbraid).toBeUndefined();
    expect(payload.gbraid).toBeUndefined();
    expect(payload.ttclid).toBeUndefined();
    expect(payload.ttp).toBeUndefined();
  });

  it('keeps email marketing opt-in independent from tracking consent', async () => {
    window.localStorage.removeItem('tracking-consent');
    window.localStorage.removeItem('tracking-consent-timestamp');
    window.localStorage.removeItem('tracking-preferences');

    renderWaitlistForm();

    const emailInput = screen.getByLabelText('Your email address');
    const marketingEmailCheckbox = screen.getByRole('checkbox', { name: /marketing email consent/i });
    const user = userEvent.setup();

    fireEvent.change(emailInput, { target: { value: 'user@example.com' } });
    await user.click(marketingEmailCheckbox);

    const submitButton = screen.getByRole('button', { name: /pack it\./i });
    await user.click(submitButton);

    await waitFor(() => expect(fetchMock).toHaveBeenCalled());

    const [, requestInit] = fetchMock.mock.calls[0];
    const payload = JSON.parse((requestInit?.body as string) ?? '{}');

    expect(payload.marketingConsent).toBe(false);
    expect(payload.marketingEmailConsent).toBe(true);
    expect(payload.eventId).toBeUndefined();
    expect(payload.gclid).toBeUndefined();
    expect(payload.wbraid).toBeUndefined();
    expect(payload.gbraid).toBeUndefined();
    expect(payload.ttclid).toBeUndefined();
    expect(payload.ttp).toBeUndefined();
    expect(payload.fbc).toBeUndefined();
    expect(payload.fbp).toBeUndefined();
  });
});
