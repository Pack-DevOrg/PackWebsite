import { env } from '../utils/env';
import { apiEndpoints } from '@/config/appConfig';

type ConsentStatus = 'granted' | 'partial' | 'rejected' | 'revoked' | 'gpc';

export interface ConsentLogPayload {
  consentId: string;
  status: ConsentStatus;
  marketing: boolean;
  analytics: boolean;
  personalization?: boolean;
  gpc?: boolean;
  consentVersion?: string;
  source?: string;
  userAgent?: string;
}

const resolveConsentEndpoint = (): string | null => {
  return apiEndpoints.consentEvent;
};

export const logConsentEvent = async (payload: ConsentLogPayload): Promise<void> => {
  const endpoint = resolveConsentEndpoint();
  if (!endpoint) {
    return;
  }

  try {
    await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        consentId: payload.consentId,
        consentStatus: payload.status,
        marketingConsent: payload.marketing,
        analyticsConsent: payload.analytics,
        personalizationConsent: payload.personalization,
        consentVersion: payload.consentVersion,
        gpc: payload.gpc,
        source: payload.source ?? 'website',
        timestamp: new Date().toISOString(),
        userAgent: payload.userAgent ?? (typeof navigator !== 'undefined' ? navigator.userAgent : undefined),
      }),
      credentials: 'omit',
    });
  } catch (error) {
    if (env.DEV && process.env.NODE_ENV !== 'test') {
      console.warn('[ConsentLogger] Failed to record consent event', error);
    }
  }
};
