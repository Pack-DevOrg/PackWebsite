import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, it } from 'node:test';

const here = path.dirname(fileURLToPath(import.meta.url));

describe('website deploy', () => {
  it('the --delete sync never sweeps og/ (per-card link-preview images the link-preview lambda writes)', () => {
    const src = fs.readFileSync(path.join(here, '../deploy-app-origin.mjs'), 'utf8');
    const main = src.slice(src.indexOf('`${distDir}/`,\n    appBucket,\n    "--delete"'));
    const firstSync = main.slice(0, main.indexOf(']);'));
    assert.ok(firstSync.includes('"og/*"'), 'the main sync excludes og/*');
  });
});
