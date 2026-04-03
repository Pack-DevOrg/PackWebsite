import {z} from 'zod';
import {
  DO_NOT_SELL_FALLBACK,
  PRIVACY_POLICY_FALLBACK,
  TERMS_OF_SERVICE_FALLBACK,
} from '../content/legalFallbacks';
import legalDocumentsManifestJson from './legalDocuments.json';

const legalDocumentLockSchema = z.object({
  mode: z.enum(['hard']),
  reviewed: z.literal(true),
  reviewedAt: z.string().min(1),
  reviewedSha256: z.string().min(1),
});

const legalDocumentSchema = z.object({
  id: z.string().min(1),
  locale: z.string().min(2),
  title: z.string().min(1),
  translationNamespace: z.string().min(1),
  publicPath: z.string().startsWith('/'),
  sourceFile: z.string().min(1),
  fallbackExportName: z.enum([
    'DO_NOT_SELL_FALLBACK',
    'PRIVACY_POLICY_FALLBACK',
    'TERMS_OF_SERVICE_FALLBACK',
  ]),
  lock: legalDocumentLockSchema,
});

const legalLockedAssetSchema = z.object({
  id: z.string().min(1),
  sourceFile: z.string().min(1),
  lock: legalDocumentLockSchema,
});

const legalDocumentsManifestSchema = z.object({
  defaultLocale: z.string().min(2),
  overrideEnvVar: z.string().min(1),
  documents: z.array(legalDocumentSchema).min(1),
  auxiliaryFiles: z.array(legalLockedAssetSchema).default([]),
});

const legalDocumentsManifest = legalDocumentsManifestSchema.parse(
  legalDocumentsManifestJson,
);

const fallbackContentByExportName = {
  DO_NOT_SELL_FALLBACK,
  PRIVACY_POLICY_FALLBACK,
  TERMS_OF_SERVICE_FALLBACK,
} as const;

export type LegalDocument = z.infer<typeof legalDocumentSchema> & {
  fallbackContent: string;
};

export function getDefaultLegalLocale(): string {
  return legalDocumentsManifest.defaultLocale;
}

export function getLegalOverrideEnvVarName(): string {
  return legalDocumentsManifest.overrideEnvVar;
}

export function getLegalDocumentOrThrow(
  id: string,
  locale: string = legalDocumentsManifest.defaultLocale,
): LegalDocument {
  const exactMatch = legalDocumentsManifest.documents.find(
    (entry) => entry.id === id && entry.locale === locale,
  );
  const document =
    exactMatch ??
    legalDocumentsManifest.documents.find(
      (entry) =>
        entry.id === id && entry.locale === legalDocumentsManifest.defaultLocale,
    );

  if (!document) {
    throw new Error(`Missing legal document for id "${id}" and locale "${locale}"`);
  }

  return {
    ...document,
    fallbackContent: fallbackContentByExportName[document.fallbackExportName],
  };
}

export function getAllLegalDocuments(): LegalDocument[] {
  return legalDocumentsManifest.documents.map((document) => ({
    ...document,
    fallbackContent: fallbackContentByExportName[document.fallbackExportName],
  }));
}
