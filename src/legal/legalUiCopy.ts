import legalUiCopyJson from './legalUiCopy.json';

export interface ConsentBannerLegalCopy {
  readonly id: 'consent-banner';
  readonly locale: string;
  readonly title: string;
  readonly gpcNotice: string;
  readonly bannerPart1: string;
  readonly bannerPart2: string;
  readonly settingsTitle: string;
  readonly settingsGpcNotice: string;
  readonly functionalName: string;
  readonly functionalDescription: string;
  readonly analyticsName: string;
  readonly analyticsDescription: string;
  readonly marketingName: string;
  readonly marketingDescription: string;
  readonly cancel: string;
  readonly savePreferences: string;
}

export interface AcceptanceNoticeLegalCopy {
  readonly id: 'acceptance-notice';
  readonly locale: string;
  readonly prefix: string;
  readonly termsLabel: string;
  readonly middle: string;
  readonly privacyLabel: string;
  readonly suffix: string;
  readonly privacyChoicesLabel: string;
}

type LegalUiCopyEntry = ConsentBannerLegalCopy | AcceptanceNoticeLegalCopy;

interface LegalUiCopyManifest {
  readonly defaultLocale: string;
  readonly entries: readonly LegalUiCopyEntry[];
}

const legalUiCopyManifest = validateLegalUiCopyManifest(legalUiCopyJson);

function getLegalUiEntryOrThrow<
  TEntry extends LegalUiCopyEntry,
>(id: TEntry['id'], locale: string): TEntry {
  const exactMatch = legalUiCopyManifest.entries.find(
    (entry) => entry.id === id && entry.locale === locale,
  );
  const fallbackMatch = legalUiCopyManifest.entries.find(
    (entry) =>
      entry.id === id &&
      entry.locale === legalUiCopyManifest.defaultLocale,
  );
  const match = (exactMatch ?? fallbackMatch) as TEntry | undefined;

  if (!match) {
    throw new Error(`Missing legal UI copy for id "${id}" and locale "${locale}"`);
  }

  return match;
}

export function getConsentBannerLegalCopy(
  locale: string = legalUiCopyManifest.defaultLocale,
): ConsentBannerLegalCopy {
  return getLegalUiEntryOrThrow<ConsentBannerLegalCopy>('consent-banner', locale);
}

export function getAcceptanceNoticeLegalCopy(
  locale: string = legalUiCopyManifest.defaultLocale,
): AcceptanceNoticeLegalCopy {
  return getLegalUiEntryOrThrow<AcceptanceNoticeLegalCopy>(
    'acceptance-notice',
    locale,
  );
}

function validateLegalUiCopyManifest(value: unknown): LegalUiCopyManifest {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error('Invalid legal UI copy manifest');
  }

  const candidate = value as Record<string, unknown>;
  if (
    typeof candidate.defaultLocale !== 'string' ||
    candidate.defaultLocale.length < 2 ||
    !Array.isArray(candidate.entries) ||
    candidate.entries.length === 0
  ) {
    throw new Error('Invalid legal UI copy manifest');
  }

  const entries = candidate.entries.map(validateLegalUiCopyEntry);
  return {
    defaultLocale: candidate.defaultLocale,
    entries,
  };
}

function validateLegalUiCopyEntry(value: unknown): LegalUiCopyEntry {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error('Invalid legal UI copy entry');
  }

  const candidate = value as Record<string, unknown>;
  if (candidate.id === 'consent-banner') {
    assertNonEmptyStrings(candidate, [
      'locale',
      'title',
      'gpcNotice',
      'bannerPart1',
      'bannerPart2',
      'settingsTitle',
      'settingsGpcNotice',
      'functionalName',
      'functionalDescription',
      'analyticsName',
      'analyticsDescription',
      'marketingName',
      'marketingDescription',
      'cancel',
      'savePreferences',
    ]);
    return candidate as unknown as ConsentBannerLegalCopy;
  }

  if (candidate.id === 'acceptance-notice') {
    assertNonEmptyStrings(candidate, [
      'locale',
      'prefix',
      'termsLabel',
      'middle',
      'privacyLabel',
      'suffix',
      'privacyChoicesLabel',
    ]);
    return candidate as unknown as AcceptanceNoticeLegalCopy;
  }

  throw new Error('Invalid legal UI copy entry');
}

function assertNonEmptyStrings(
  candidate: Record<string, unknown>,
  keys: readonly string[],
): void {
  for (const key of keys) {
    if (typeof candidate[key] !== 'string' || candidate[key]?.length === 0) {
      throw new Error(`Invalid legal UI copy field "${key}"`);
    }
  }
}
