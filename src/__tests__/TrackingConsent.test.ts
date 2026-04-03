import {
  DEFAULT_CONSENT_PREFERENCES,
  deriveConsentState,
  parseConsentPreferences,
} from '../tracking/consent';

describe('tracking consent helpers', () => {
  describe('parseConsentPreferences', () => {
    it('returns null for invalid JSON', () => {
      expect(parseConsentPreferences('not-json')).toBeNull();
    });

    it('returns null for non-matching shapes', () => {
      expect(parseConsentPreferences(JSON.stringify({analytics: true}))).toBeNull();
    });

    it('parses valid preference payloads', () => {
      expect(
        parseConsentPreferences(
          JSON.stringify({analytics: true, marketing: false, functional: true}),
        ),
      ).toEqual({analytics: true, marketing: false, functional: true});
    });
  });

  describe('deriveConsentState', () => {
    it('defaults to no tracking consent when no status exists', () => {
      expect(
        deriveConsentState({status: null, preferences: null, gpcEnabled: false}),
      ).toEqual({
        hasAnalyticsConsent: false,
        hasMarketingConsent: false,
        hasFunctionalConsent: true,
        hasAnyTrackingConsent: false,
      });
    });

    it('treats granted as full consent', () => {
      expect(
        deriveConsentState({
          status: 'granted',
          preferences: DEFAULT_CONSENT_PREFERENCES,
          gpcEnabled: false,
        }),
      ).toEqual({
        hasAnalyticsConsent: true,
        hasMarketingConsent: true,
        hasFunctionalConsent: true,
        hasAnyTrackingConsent: true,
      });
    });

    it('uses granular preferences when status is partial', () => {
      expect(
        deriveConsentState({
          status: 'partial',
          preferences: {analytics: true, marketing: false, functional: true},
          gpcEnabled: false,
        }),
      ).toEqual({
        hasAnalyticsConsent: true,
        hasMarketingConsent: false,
        hasFunctionalConsent: true,
        hasAnyTrackingConsent: true,
      });
    });

    it('enforces GPC by disabling marketing and analytics', () => {
      expect(
        deriveConsentState({
          status: 'granted',
          preferences: {analytics: true, marketing: true, functional: true},
          gpcEnabled: true,
        }),
      ).toEqual({
        hasAnalyticsConsent: false,
        hasMarketingConsent: false,
        hasFunctionalConsent: true,
        hasAnyTrackingConsent: false,
      });
    });
  });
});

