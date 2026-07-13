/**
 * Guard: server-only IP must never be imported into the public website.
 *
 * The site aliases `@pack/schemas` to the CANONICAL PackServer source (not a
 * trimmed vendored copy), so nothing stops a stray import from pulling a
 * server-only module into the shipped client bundle. This check fails the build
 * if the website source imports:
 *
 *   - @pack/shared-lib (OAuth token KMS encryption, PII, extraction IP)
 *   - any @pack/schemas *.server module (e.g. travel-providers.server — the
 *     per-provider email extraction regex tables, locality-catalog-data.server)
 *   - the heavy generated server catalogs (major-city / locality-source /
 *     airport-lookup-source) and the city-image cache
 *
 * The website legitimately uses the small client catalogs (locality-catalog's
 * ~9 KB region catalog, getAllAirportCatalogEntries); those stay allowed.
 *
 * Wired into `lint`.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const SITE_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC_DIR = path.join(SITE_DIR, 'src');
const SOURCE_EXT = new Set(['.ts', '.tsx', '.js', '.jsx', '.mjs']);

// Import specifiers that must never appear in website source.
const FORBIDDEN_SPECIFIERS = [
  /['"]@pack\/shared-lib(\/[^'"]*)?['"]/,
  /['"]@pack\/schemas\/[^'"]*\.server['"]/,
  /['"]@pack\/schemas\/generated-major-city-code-catalog['"]/,
  /['"]@pack\/schemas\/generated-locality-catalog-source['"]/,
  /['"]@pack\/schemas\/generated-airport-lookup-catalog-source['"]/,
  /['"]@pack\/schemas\/locality-catalog-data\.server['"]/,
  /['"]@pack\/schemas\/city-image-cache['"]/,
];
const IMPORT_STATEMENT_RE = /\b(?:import|export)\b[^\n]*\bfrom\b|\brequire\s*\(|\bimport\s*\(/;

const errors = [];

function collect(dir, out) {
  for (const child of fs.readdirSync(dir)) {
    if (child === 'node_modules') continue;
    const abs = path.join(dir, child);
    const stat = fs.statSync(abs);
    if (stat.isDirectory()) collect(abs, out);
    else if (SOURCE_EXT.has(path.extname(abs))) out.push(abs);
  }
}

const files = [];
if (fs.existsSync(SRC_DIR)) collect(SRC_DIR, files);

for (const file of files) {
  const lines = fs.readFileSync(file, 'utf8').split('\n');
  lines.forEach((line, index) => {
    const trimmed = line.trim();
    if (trimmed.startsWith('*') || trimmed.startsWith('//') || trimmed.startsWith('/*')) return;
    if (!IMPORT_STATEMENT_RE.test(line)) return;
    for (const re of FORBIDDEN_SPECIFIERS) {
      if (re.test(line)) {
        errors.push(`${path.relative(SITE_DIR, file)}:${index + 1} imports server-only IP:\n  ${trimmed}`);
        break;
      }
    }
  });
}

if (errors.length > 0) {
  console.error('❌ Server-only IP would ship in the public website bundle:\n');
  for (const err of errors) console.error(`  • ${err}\n`);
  process.exit(1);
}

console.log('✅ No server-only IP is imported into the website.');
