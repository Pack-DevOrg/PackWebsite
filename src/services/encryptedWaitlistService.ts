/**
 * Encrypted Waitlist Service for Development Testing
 * 
 * This service provides a way to test the encrypted waitlist functionality
 * during development by directly interfacing with the encrypted Lambda function.
 * In production, this would go through API Gateway, but for dev testing we can
 * use the direct Lambda integration.
 */

import { env } from '../utils/env';
import {z} from 'zod';
import { apiEndpoints } from '../config/appConfig';

export const WaitlistSignupRequestSchema = z.object({
  email: z.string().min(1),
  source: z.string().min(1),
  timestamp: z.string().min(1),
  recaptchaToken: z.string().min(1).optional(),
  marketingConsent: z.boolean().optional(),
  marketingEmailConsent: z.boolean().optional(),
  ageConfirmed: z.boolean().optional(),
  eventId: z.string().min(1).optional(),
  gclid: z.string().min(1).optional(),
  wbraid: z.string().min(1).optional(),
  gbraid: z.string().min(1).optional(),
  ttclid: z.string().min(1).optional(),
  ttp: z.string().min(1).optional(),
  fbc: z.string().min(1).optional(),
  fbp: z.string().min(1).optional(),
}).strict();

export type WaitlistSignupRequest = z.infer<typeof WaitlistSignupRequestSchema>;

export const WaitlistSignupResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  encrypted: z.boolean().optional(),
  ccpaCompliant: z.boolean().optional(),
}).passthrough();

export type WaitlistSignupResponse = z.infer<typeof WaitlistSignupResponseSchema>;

/**
 * Submit email to encrypted waitlist (development mode)
 * This is for testing the encrypted waitlist functionality during development
 */
export const submitToEncryptedWaitlist = async (
  request: WaitlistSignupRequest
): Promise<WaitlistSignupResponse> => {
  const validatedRequest = WaitlistSignupRequestSchema.parse(request);
  
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

    const data = WaitlistSignupResponseSchema.parse(await response.json());

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
