import assert from "node:assert/strict";
import test from "node:test";

import {
  SSG_BUILD_SUITE,
  changedFilesForLand,
  suitesForChangedFiles,
} from "./website-land-suites.mjs";

test("src/pages and src/onboarding changes include npm run build", () => {
  assert.deepEqual(suitesForChangedFiles(["src/pages/OnboardPage.tsx"]), [
    SSG_BUILD_SUITE,
  ]);
  assert.deepEqual(suitesForChangedFiles(["src/onboarding/flow.tsx"]), [
    SSG_BUILD_SUITE,
  ]);
  assert.equal(SSG_BUILD_SUITE, "npm run build");
});

test("other paths do not add the SSG build", () => {
  assert.deepEqual(suitesForChangedFiles(["scripts/land-smoke.mjs"]), []);
  assert.deepEqual(suitesForChangedFiles([]), []);
});

test("PACK_MERGED_FILES wins over git", () => {
  const files = changedFilesForLand({
    env: { PACK_MERGED_FILES: "src/pages/FAQ.tsx, scripts/x.mjs" },
    execFileSync: () => {
      throw new Error("git should not run");
    },
  });
  assert.deepEqual(files, ["src/pages/FAQ.tsx", "scripts/x.mjs"]);
  assert.deepEqual(suitesForChangedFiles(files), [SSG_BUILD_SUITE]);
});
