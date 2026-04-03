import {z} from 'zod';
import legalUiCopyJson from './legalUiCopy.json';

const consentBannerCopySchema = z.object({
  id: z.literal('consent-banner'),
  locale: z.string().min(2),
  title: z.string().min(1),
  gpcNotice: z.string().min(1),
  bannerPart1: z.string().min(1),
  bannerPart2: z.string().min(1),
  settingsTitle: z.string().min(1),
  settingsGpcNotice: z.string().min(1),
  functionalName: z.string().min(1),
  functionalDescription: z.string().min(1),
  analyticsName: z.string().min(1),
  analyticsDescription: z.string().min(1),
  marketingName: z.string().min(1),
  marketingDescription: z.string().min(1),
  cancel: z.string().min(1),
  savePreferences: z.string().min(1),
});

const acceptanceNoticeCopySchema = z.object({
  id: z.literal('acceptance-notice'),
  locale: z.string().min(2),
  prefix: z.string().min(1),
  termsLabel: z.string().min(1),
  middle: z.string().min(1),
  privacyLabel: z.string().min(1),
  suffix: z.string().min(1),
  privacyChoicesLabel: z.string().min(1),
});

const legalUiCopyEntrySchema = z.union([
  consentBannerCopySchema,
  acceptanceNoticeCopySchema,
]);

const legalUiCopyManifestSchema = z.object({
  defaultLocale: z.string().min(2),
  entries: z.array(legalUiCopyEntrySchema).min(1),
});

const legalUiCopyManifest = legalUiCopyManifestSchema.parse(legalUiCopyJson);

function getLegalUiEntryOrThrow<
  TEntry extends z.infer<typeof legalUiCopyEntrySchema>,
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

export type ConsentBannerLegalCopy = z.infer<typeof consentBannerCopySchema>;
export type AcceptanceNoticeLegalCopy = z.infer<
  typeof acceptanceNoticeCopySchema
>;

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
