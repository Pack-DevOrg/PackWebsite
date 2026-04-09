/**
 * @file WaitlistForm.test.tsx
 * @description Comprehensive test suite for the WaitlistForm component
 * 
 * This test file covers all major functionality of the WaitlistForm component including:
 * - Form rendering and basic interaction
 * - Email validation and error handling
 * - Legal notice rendering
 * - reCAPTCHA integration and error handling
 * - API submission success and error scenarios
 * - Loading states and user feedback
 * 
 * The tests use React Testing Library for DOM testing and Jest for mocking external dependencies.
 */

import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { HelmetProvider } from 'react-helmet-async';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from 'styled-components';
import theme from '../styles/theme';
import WaitlistForm from './WaitlistForm';
import { executeRecaptchaAction } from '../utils/recaptcha';
import { I18nProvider } from '../i18n/I18nProvider';

const requestPublicApiMock = jest.fn();
const googleInitializeMock = jest.fn();
const googleRenderButtonMock = jest.fn();
let googleCredentialCallback:
  | ((response: { credential?: string }) => void)
  | undefined;

jest.mock('../utils/env', () => ({
  env: {
    VITE_RECAPTCHA_SITE_KEY: 'test-recaptcha-site-key',
    VITE_API_ENDPOINT: 'https://api.example.com/prod/subscribe',
    VITE_DEV_MODE: 'false',
    VITE_ENABLE_ENCRYPTED_WAITLIST: 'false',
  },
}));

jest.mock('framer-motion', () => {
  const React = require('react');
  const createStub = (tag: string) =>
    React.forwardRef<any, any>((props, ref) => {
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

jest.mock('../utils/recaptcha', () => ({
  executeRecaptchaAction: jest.fn().mockResolvedValue('test-token'),
  loadRecaptchaScript: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('../hooks/useConversionTracking', () => {
  const mockFn = () => ({
    trackConversion: jest.fn(),
    trackFormStart: jest.fn(),
    trackFormSubmit: jest.fn(),
    trackCTAClick: jest.fn(),
    trackScrollMilestone: jest.fn(),
    trackVideoEngagement: jest.fn(),
    trackABTest: jest.fn(),
    startEngagementTracking: jest.fn(),
    stopEngagementTracking: jest.fn(),
  });

  return {
    useConversionTracking: mockFn,
  };
});

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

/**
 * Mock the global fetch function to simulate API responses
 * Default mock returns successful response
 */
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({ success: true }),
  })
) as jest.Mock;

/**
 * Test wrapper component that provides necessary context providers
 * WaitlistForm requires BrowserRouter for navigation functionality
 * 
 * @returns JSX element wrapped with required providers
 */
const WaitlistFormWrapper = () => (
  <ThemeProvider theme={theme}>
    <HelmetProvider>
      <BrowserRouter>
        <I18nProvider>
          <WaitlistForm />
        </I18nProvider>
      </BrowserRouter>
    </HelmetProvider>
  </ThemeProvider>
);

/**
 * Test suite for WaitlistForm component
 * Validates all aspects of form functionality including UI rendering,
 * validation, API integration, and error handling
 */
describe('WaitlistForm Component', () => {
  beforeAll(() => {
    class MockIntersectionObserver {
      observe() {}
      disconnect() {}
    }
    (window as unknown as { IntersectionObserver: typeof MockIntersectionObserver }).IntersectionObserver = MockIntersectionObserver;
  });

  /**
   * Reset all mocks before each test to ensure clean test isolation
   */
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    (executeRecaptchaAction as jest.Mock).mockResolvedValue('test-token');
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
  });

  /**
   * Test that the form renders all required elements correctly
   * Validates presence of form fields, labels, and interactive elements
   */
  test('renders correctly', async () => {
    render(<WaitlistFormWrapper />);
    
    // Check if important elements are present
    expect(screen.getByRole('heading', { name: /planning a trip\?/i })).toBeInTheDocument();
    expect(await screen.findByRole('button', { name: /sign up with google/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    expect(screen.getByText(/By continuing, you agree to our/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /pack it\./i })).toBeInTheDocument();
  });

  test('starts Google sign-in from the shared waitlist form', async () => {
    render(<WaitlistFormWrapper />);

    fireEvent.click(await screen.findByRole('button', { name: /sign up with google/i }));

    await waitFor(() =>
      expect(requestPublicApiMock).toHaveBeenCalledWith(
        expect.objectContaining({
          path: '/auth/google/bridge',
          method: 'POST',
          body: expect.objectContaining({
            credential: 'google_jwt',
            redirectPath: '/',
            source: 'waitlist',
          }),
        }),
      ),
    );
  });

  test('includes Google-side email marketing consent only when checked', async () => {
    render(<WaitlistFormWrapper />);

    fireEvent.click(screen.getByRole('checkbox', { name: /marketing email consent/i }));
    fireEvent.click(await screen.findByRole('button', { name: /sign up with google/i }));

    await waitFor(() =>
      expect(requestPublicApiMock).toHaveBeenCalledWith(
        expect.objectContaining({
          path: '/auth/google/bridge',
          method: 'POST',
          body: expect.objectContaining({
            credential: 'google_jwt',
            redirectPath: '/',
            source: 'waitlist',
            marketingEmailConsent: true,
          }),
        }),
      ),
    );
  });

  /**
   * Test email format validation
   * Ensures that invalid email formats are rejected and appropriate error messages are shown
   */
  test('requires email before submission', async () => {
    render(<WaitlistFormWrapper />);

    const submitButton = screen.getByRole('button', { name: /pack it\./i });
    const form = submitButton.closest('form') as HTMLFormElement;
    expect(form).not.toBeNull();
    form.noValidate = true;

    fireEvent.submit(form);
    await screen.findByText(/Email is required/i);
  });

  /**
   * Test legal notice rendering
   * Verifies that the form keeps the click-through legal copy visible
   */
  test('renders click-through legal notice', () => {
    render(<WaitlistFormWrapper />);

    expect(screen.getByRole('link', { name: /terms of service/i })).toHaveAttribute('href', '/terms');
    expect(screen.getByRole('link', { name: /privacy policy/i })).toHaveAttribute('href', '/privacy');
    expect(screen.getByRole('link', { name: /your privacy choices/i })).toHaveAttribute('href', '/privacy-request');
  });

  /**
   * Test successful form submission with reCAPTCHA integration
   * Validates the complete happy path including reCAPTCHA execution and API call
   */
  test('triggers reCAPTCHA and submits form successfully', async () => {
    render(<WaitlistFormWrapper />);
    
    // Get form elements
    const emailInput = screen.getByLabelText(/email address/i);
    const submitButton = screen.getByRole('button', { name: /pack it\./i });
    const form = submitButton.closest('form') as HTMLFormElement;
    expect(form).not.toBeNull();

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    expect(emailInput).toHaveValue('test@example.com');
    fireEvent.submit(form);
    
    // Wait for form submission to complete
    await waitFor(() => {
      expect(executeRecaptchaAction).toHaveBeenCalledWith('submit_waitlist', expect.any(String));
      
      // Verify fetch was called with correct data
      expect(global.fetch).toHaveBeenCalledTimes(1);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: expect.stringContaining('test@example.com'),
        })
      );
    });
    
    // Should show success message
    await screen.findByText(/you're on the list/i);
  });

  /**
   * Test API error handling
   * Ensures that API errors are properly caught and displayed to the user
   */
  test('handles API error gracefully', async () => {
    (global.fetch as jest.Mock).mockImplementationOnce(() =>
      Promise.resolve({
        ok: false,
        json: () => Promise.resolve({ message: 'API error message' }),
      })
    );

    render(<WaitlistFormWrapper />);

    const emailInput = screen.getByLabelText(/email address/i);
    const submitButton = screen.getByRole('button', { name: /pack it\./i });
    const form = submitButton.closest('form') as HTMLFormElement;
    expect(form).not.toBeNull();

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    expect(emailInput).toHaveValue('test@example.com');
    fireEvent.submit(form);

    await screen.findByText(/^API error message$/i);
    await screen.findByText(/please check your connection and try again/i);
  });

  /**
   * Test reCAPTCHA failure handling
   * Verifies that reCAPTCHA errors are properly handled and communicated to the user
   */
  test('handles reCAPTCHA failure gracefully', async () => {
    (executeRecaptchaAction as jest.Mock).mockRejectedValueOnce(new Error('reCAPTCHA failed'));

    render(<WaitlistFormWrapper />);

    const emailInput = screen.getByLabelText(/email address/i);
    const submitButton = screen.getByRole('button', { name: /pack it\./i });
    const form = submitButton.closest('form') as HTMLFormElement;
    expect(form).not.toBeNull();

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    expect(emailInput).toHaveValue('test@example.com');
    fireEvent.submit(form);

    await screen.findByText(/failed to verify you are human/i);
  });
});
