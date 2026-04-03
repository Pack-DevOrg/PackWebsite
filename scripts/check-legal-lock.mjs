import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import {execFileSync} from 'node:child_process';
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
  reviewedSha256: z.string().min(1),
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

function normalizeRepoPath(value) {
  return value.replace(/\\/g, '/');
}

async function loadLegalDocumentsManifest() {
  const json = JSON.parse(await fs.readFile(legalDocumentsManifestPath, 'utf8'));
  return legalDocumentsManifestSchema.parse(json);
}

async function sha256ForFile(relativePath) {
  const absolutePath = path.join(repoRoot, relativePath);
  const content = await fs.readFile(absolutePath, 'utf8');
  return crypto.createHash('sha256').update(content).digest('hex');
}

function getStagedPaths() {
  const output = execFileSync(
    'git',
    ['diff', '--cached', '--name-only', '--diff-filter=ACMR'],
    {
      cwd: repoRoot,
      encoding: 'utf8',
    },
  );

  return output
    .split('\n')
    .map((entry) => entry.trim())
    .filter(Boolean)
    .map(normalizeRepoPath);
}

function shouldCheckDocument({onlyStaged, manifestPath, sourceFile, stagedPaths}) {
  if (!onlyStaged) {
    return true;
  }

  return stagedPaths.includes(manifestPath) || stagedPaths.includes(sourceFile);
}

function shouldCheckAuxiliaryFile({onlyStaged, manifestPath, sourceFile, stagedPaths}) {
  if (!onlyStaged) {
    return true;
  }

  return stagedPaths.includes(manifestPath) || stagedPaths.includes(sourceFile);
}

async function main() {
  const onlyStaged = process.argv.includes('--staged');
  const manifest = await loadLegalDocumentsManifest();
  const manifestPath = normalizeRepoPath(path.relative(repoRoot, legalDocumentsManifestPath));
  const stagedPaths = onlyStaged ? getStagedPaths() : [];
  const overrideEnvVar = manifest.overrideEnvVar;

  if (process.env[overrideEnvVar] === '1') {
    console.log(
      `[legal-lock] Override enabled via ${overrideEnvVar}=1. Skipping legal lock validation.`,
    );
    return;
  }

  const mismatches = [];

  for (const document of manifest.documents) {
    if (
      !shouldCheckDocument({
        onlyStaged,
        manifestPath,
        sourceFile: normalizeRepoPath(document.sourceFile),
        stagedPaths,
      })
    ) {
      continue;
    }

    const actualSha256 = await sha256ForFile(document.sourceFile);
    if (actualSha256 !== document.lock.reviewedSha256) {
      mismatches.push({
        id: document.id,
        locale: document.locale,
        sourceFile: document.sourceFile,
        actualSha256,
      });
    }
  }

  for (const asset of manifest.auxiliaryFiles) {
    const normalizedSourceFile = normalizeRepoPath(asset.sourceFile);
    if (
      !shouldCheckAuxiliaryFile({
        onlyStaged,
        manifestPath,
        sourceFile: normalizedSourceFile,
        stagedPaths,
      })
    ) {
      continue;
    }

    const actualSha256 = await sha256ForFile(asset.sourceFile);
    if (actualSha256 !== asset.lock.reviewedSha256) {
      mismatches.push({
        id: asset.id,
        locale: 'locked-asset',
        sourceFile: asset.sourceFile,
        actualSha256,
      });
    }
  }

  if (mismatches.length === 0) {
    console.log('[legal-lock] All reviewed legal documents match their approved hashes.');
    return;
  }

  console.error('[legal-lock] Reviewed legal content changed without an explicit override.');
  for (const mismatch of mismatches) {
    console.error(
      `  - ${mismatch.id} (${mismatch.locale}) -> ${mismatch.sourceFile} hash ${mismatch.actualSha256}`,
    );
  }
  console.error(
    `[legal-lock] To intentionally update reviewed legal content, run ${overrideEnvVar}=1 npm run legal:refresh-lock and commit the updated manifest.`,
  );
  process.exitCode = 1;
}

await main();
