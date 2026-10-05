import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const wf = readFileSync(join(ROOT, ".github/workflows/onboarding-golden-parity.yml"), "utf8");

test("runs on pull requests touching onboarding, spec, and goldens", () => {
  assert.match(wf, /pull_request:/);
  for (const p of ["src/components/onboard/**", "src/pages/OnboardPage*", "e2e/onboard-golden-parity.spec.ts", "e2e/onboard-golden-parity.spec.ts-snapshots/**"]) {
    assert.ok(wf.includes(p), p);
  }
});

test("installs chromium and runs the parity spec", () => {
  assert.match(wf, /npx playwright install --with-deps chromium/);
  assert.match(wf, /npm run test:e2e -- e2e\/onboard-golden-parity\.spec\.ts/);
});

test("uploads diff artifacts on failure", () => {
  assert.match(wf, /if: failure\(\)/);
  assert.match(wf, /upload-artifact@v4/);
});
