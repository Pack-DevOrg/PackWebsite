import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import {fileURLToPath} from 'node:url';
import {z} from 'zod';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');
const legalDocumentsManifestPath = path.join(
  repoRoot,
  'src/legal/legalDocuments.json',
);

const legalDocumentLockSchema = z.object({
  mode: z.enum(['hard']),
  reviewed: z.literal(true),
  reviewedAt: z.string().min(1),
  reviewedSha256: z.string(),
});

const legalDocumentSchema = z.object({
  id: z.string().min(1),
  locale: z.string().min(2),
  title: z.string().min(1),
  translationNamespace: z.string().min(1),
  publicPath: z.string().startsWith('/'),
  sourceFile: z.string().min(1),
  fallbackExportName: z.string().min(1),
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

async function sha256ForFile(relativePath) {
  const absolutePath = path.join(repoRoot, relativePath);
  const content = await fs.readFile(absolutePath, 'utf8');
  return crypto.createHash('sha256').update(content).digest('hex');
}

async function main() {
  const manifest = legalDocumentsManifestSchema.parse(
    JSON.parse(await fs.readFile(legalDocumentsManifestPath, 'utf8')),
  );
  const overrideEnvVar = manifest.overrideEnvVar;

  if (process.env[overrideEnvVar] !== '1') {
    console.error(
      `[legal-lock] Refusing to refresh reviewed hashes without ${overrideEnvVar}=1.`,
    );
    process.exit(1);
  }

  const reviewedAt = new Date().toISOString().slice(0, 10);
  const nextManifest = {
    ...manifest,
    auxiliaryFiles: await Promise.all(
      manifest.auxiliaryFiles.map(async (asset) => ({
        ...asset,
        lock: {
          ...asset.lock,
          reviewedAt,
          reviewedSha256: await sha256ForFile(asset.sourceFile),
        },
      })),
    ),
    documents: await Promise.all(
      manifest.documents.map(async (document) => ({
        ...document,
        lock: {
          ...document.lock,
          reviewedAt,
          reviewedSha256: await sha256ForFile(document.sourceFile),
        },
      })),
    ),
  };

  await fs.writeFile(
    legalDocumentsManifestPath,
    `${JSON.stringify(nextManifest, null, 2)}\n`,
    'utf8',
  );

  console.log(
    `[legal-lock] Refreshed reviewed hashes for ${nextManifest.documents.length} legal documents.`,
  );
}

await main();
