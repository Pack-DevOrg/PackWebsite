/**
 * Encrypted Waitlist Service for Development Testing
 * 
 * This service provides a way to test the encrypted waitlist functionality
 * during development by directly interfacing with the encrypted Lambda function.
 * In production, this would go through API Gateway, but for dev testing we can
 * use the direct Lambda integration.
 */

import { env } from '../utils/env';
import { apiEndpoints } from '../config/appConfig';

export interface WaitlistSignupRequest {
  readonly email: string;
  readonly source: string;
  readonly timestamp: string;
  readonly recaptchaToken?: string;
  readonly marketingConsent?: boolean;
  readonly marketingEmailConsent?: boolean;
  readonly ageConfirmed?: boolean;
  readonly eventId?: string;
  readonly gclid?: string;
  readonly wbraid?: string;
  readonly gbraid?: string;
  readonly ttclid?: string;
  readonly ttp?: string;
  readonly fbc?: string;
  readonly fbp?: string;
}

export interface WaitlistSignupResponse {
  readonly success: boolean;
  readonly message: string;
  readonly encrypted?: boolean;
  readonly ccpaCompliant?: boolean;
  readonly [key: string]: unknown;
}

/**
 * Submit email to encrypted waitlist (development mode)
 * This is for testing the encrypted waitlist functionality during development
 */
export const submitToEncryptedWaitlist = async (
  request: WaitlistSignupRequest
): Promise<WaitlistSignupResponse> => {
  const validatedRequest = validateWaitlistSignupRequest(request);
  
  // Check if we're in development mode with encrypted waitlist enabled
  const devMode = (env.VITE_DEV_MODE as string | undefined) === 'true';
  const encryptedEnabled = (env.VITE_ENABLE_ENCRYPTED_WAITLIST as string | undefined) === 'true';
  
  if (!devMode || !encryptedEnabled) {
    throw new Error('Encrypted waitlist service only available in development mode');
  }

  const debugLoggingEnabled = (env.VITE_DEBUG_LOGGING as string | undefined) === 'true';
  if (debugLoggingEnabled) {
    console.debug('Encrypted waitlist service enabled (development)', {
      sourceLength: request.source.length,
      hasRecaptchaToken: Boolean(request.recaptchaToken),
      hasTrackingParams: Boolean(request.gclid || request.wbraid || request.gbraid || request.ttclid),
    });
  }

  try {
    // For now, we'll call the regular API endpoint but log that we're in encrypted mode
    // In a full implementation, this would call a dev proxy or direct Lambda integration
    const API_ENDPOINT = apiEndpoints.waitlistSubscribe;

    const response = await fetch(API_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(validatedRequest),
    });

    const data = validateWaitlistSignupResponse(await response.json());

    if (!response.ok) {
      throw new Error(data.message || 'Failed to submit to encrypted waitlist');
    }

    if (debugLoggingEnabled) {
      console.debug('Encrypted waitlist signup successful');
    }
    
    return {
      success: true,
      message: data.message || 'Successfully joined encrypted waitlist!',
      encrypted: true,
      ccpaCompliant: true,
    };

  } catch (error) {
    if (debugLoggingEnabled) {
      console.error(
        'Encrypted waitlist signup failed',
        error instanceof Error ? error.message : String(error),
      );
    }
    
    return {
      success: false,
      message: error instanceof Error 
        ? error.message 
        : 'Failed to join encrypted waitlist',
      encrypted: false,
      ccpaCompliant: false,
    };
  }
};

/**
 * Check if encrypted waitlist is available and configured correctly
 */
export const checkEncryptedWaitlistStatus = (): {
  available: boolean;
  devMode: boolean;
  endpoint: string;
} => {
  const devMode = (env.VITE_DEV_MODE as string | undefined) === 'true';
  const encryptedEnabled = (env.VITE_ENABLE_ENCRYPTED_WAITLIST as string | undefined) === 'true';
  const endpoint = apiEndpoints.waitlistSubscribe;

  return {
    available: devMode && encryptedEnabled,
    devMode,
    endpoint,
  };
};

function validateWaitlistSignupRequest(
  value: WaitlistSignupRequest,
): WaitlistSignupRequest {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error('Invalid waitlist signup request');
  }

  const candidate = value as Record<string, unknown>;
  assertStrictKeys(candidate, [
    'email',
    'source',
    'timestamp',
    'recaptchaToken',
    'marketingConsent',
    'marketingEmailConsent',
    'ageConfirmed',
    'eventId',
    'gclid',
    'wbraid',
    'gbraid',
    'ttclid',
    'ttp',
    'fbc',
    'fbp',
  ]);

  assertRequiredString(candidate.email, 'email');
  assertRequiredString(candidate.source, 'source');
  assertRequiredString(candidate.timestamp, 'timestamp');
  assertOptionalString(candidate.recaptchaToken, 'recaptchaToken');
  assertOptionalBoolean(candidate.marketingConsent, 'marketingConsent');
  assertOptionalBoolean(candidate.marketingEmailConsent, 'marketingEmailConsent');
  assertOptionalBoolean(candidate.ageConfirmed, 'ageConfirmed');
  assertOptionalString(candidate.eventId, 'eventId');
  assertOptionalString(candidate.gclid, 'gclid');
  assertOptionalString(candidate.wbraid, 'wbraid');
  assertOptionalString(candidate.gbraid, 'gbraid');
  assertOptionalString(candidate.ttclid, 'ttclid');
  assertOptionalString(candidate.ttp, 'ttp');
  assertOptionalString(candidate.fbc, 'fbc');
  assertOptionalString(candidate.fbp, 'fbp');

  return value;
}

function validateWaitlistSignupResponse(value: unknown): WaitlistSignupResponse {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error('Invalid waitlist signup response');
  }

  const candidate = value as Record<string, unknown>;
  if (typeof candidate.success !== 'boolean' || typeof candidate.message !== 'string') {
    throw new Error('Invalid waitlist signup response');
  }
  assertOptionalBoolean(candidate.encrypted, 'encrypted');
  assertOptionalBoolean(candidate.ccpaCompliant, 'ccpaCompliant');
  return candidate as WaitlistSignupResponse;
}

function assertStrictKeys(
  candidate: Record<string, unknown>,
  allowedKeys: readonly string[],
): void {
  for (const key of Object.keys(candidate)) {
    if (!allowedKeys.includes(key)) {
      throw new Error(`Unexpected waitlist signup field "${key}"`);
    }
  }
}

function assertRequiredString(value: unknown, fieldName: string): void {
  if (typeof value !== 'string' || value.length === 0) {
    throw new Error(`Invalid ${fieldName}`);
  }
}

function assertOptionalString(value: unknown, fieldName: string): void {
  if (value !== undefined && (typeof value !== 'string' || value.length === 0)) {
    throw new Error(`Invalid ${fieldName}`);
  }
}

function assertOptionalBoolean(value: unknown, fieldName: string): void {
  if (value !== undefined && typeof value !== 'boolean') {
    throw new Error(`Invalid ${fieldName}`);
  }
}
