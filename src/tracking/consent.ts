export const CONSENT_STATUSES = [
  'granted',
  'partial',
  'rejected',
  'revoked',
  'gpc',
] as const;

export type ConsentStatus = (typeof CONSENT_STATUSES)[number];

export interface ConsentPreferences {
  readonly analytics: boolean;
  readonly marketing: boolean;
  readonly functional: boolean;
}

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

  return isConsentPreferences(parsed) ? parsed : null;
}

export function isConsentStatus(value: unknown): value is ConsentStatus {
  return (
    typeof value === 'string' &&
    (CONSENT_STATUSES as readonly string[]).includes(value)
  );
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

function isConsentPreferences(value: unknown): value is ConsentPreferences {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return false;
  }

  const candidate = value as Record<string, unknown>;
  const keys = Object.keys(candidate);
  if (
    keys.length !== 3 ||
    !keys.includes('analytics') ||
    !keys.includes('marketing') ||
    !keys.includes('functional')
  ) {
    return false;
  }

  return (
    typeof candidate.analytics === 'boolean' &&
    typeof candidate.marketing === 'boolean' &&
    typeof candidate.functional === 'boolean'
  );
}
