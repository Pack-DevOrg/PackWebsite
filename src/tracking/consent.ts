import {z} from 'zod';

export const ConsentStatusSchema = z.enum([
  'granted',
  'partial',
  'rejected',
  'revoked',
  'gpc',
]);

export type ConsentStatus = z.infer<typeof ConsentStatusSchema>;

export const ConsentPreferencesSchema = z
  .object({
    analytics: z.boolean(),
    marketing: z.boolean(),
    functional: z.boolean(),
  })
  .strict();

export type ConsentPreferences = z.infer<typeof ConsentPreferencesSchema>;

export const DEFAULT_CONSENT_PREFERENCES: ConsentPreferences = {
  analytics: false,
  marketing: false,
  functional: true,
};

export interface StoredConsentState {
  readonly status: ConsentStatus | null;
  readonly timestampMs: number | null;
  readonly preferences: ConsentPreferences | null;
}

export interface DerivedConsentState {
  readonly hasAnalyticsConsent: boolean;
  readonly hasMarketingConsent: boolean;
  readonly hasFunctionalConsent: boolean;
  readonly hasAnyTrackingConsent: boolean;
}

export function parseConsentPreferences(
  rawJson: string | null,
): ConsentPreferences | null {
  if (!rawJson) {
    return null;
  }

  const parsed = safeJsonParse(rawJson);
  if (!parsed) {
    return null;
  }

  const validated = ConsentPreferencesSchema.safeParse(parsed);
  return validated.success ? validated.data : null;
}

export function deriveConsentState({
  status,
  preferences,
  gpcEnabled,
}: {
  readonly status: ConsentStatus | null;
  readonly preferences: ConsentPreferences | null;
  readonly gpcEnabled: boolean;
}): DerivedConsentState {
  if (gpcEnabled || status === 'gpc') {
    return {
      hasAnalyticsConsent: false,
      hasMarketingConsent: false,
      hasFunctionalConsent: true,
      hasAnyTrackingConsent: false,
    };
  }

  if (!status) {
    return {
      hasAnalyticsConsent: false,
      hasMarketingConsent: false,
      hasFunctionalConsent: true,
      hasAnyTrackingConsent: false,
    };
  }

  if (status === 'granted') {
    return {
      hasAnalyticsConsent: true,
      hasMarketingConsent: true,
      hasFunctionalConsent: true,
      hasAnyTrackingConsent: true,
    };
  }

  if (status === 'partial') {
    const effectivePreferences = preferences ?? DEFAULT_CONSENT_PREFERENCES;
    const hasAnyTrackingConsent =
      effectivePreferences.analytics || effectivePreferences.marketing;
    return {
      hasAnalyticsConsent: effectivePreferences.analytics,
      hasMarketingConsent: effectivePreferences.marketing,
      hasFunctionalConsent: effectivePreferences.functional,
      hasAnyTrackingConsent,
    };
  }

  return {
    hasAnalyticsConsent: false,
    hasMarketingConsent: false,
    hasFunctionalConsent: preferences?.functional ?? true,
    hasAnyTrackingConsent: false,
  };
}

function safeJsonParse(value: string): unknown | null {
  try {
    return JSON.parse(value) as unknown;
  } catch {
    return null;
  }
}

