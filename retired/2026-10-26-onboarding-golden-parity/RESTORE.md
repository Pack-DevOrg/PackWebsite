# Retired 2026-10-26 — onboarding-golden-parity workflow and screenshot parity spec

Tag: `retired/onboarding-golden-parity-2026-10-26` (`1c2d1fd1592172f2950057cf73c3203d0f2704e4`, trunk parent of the retiring change).

Restore command:
```bash
git checkout retired/onboarding-golden-parity-2026-10-26 -- \
  .github/workflows/onboarding-golden-parity.yml \
  e2e/onboard-golden-parity.spec.ts \
  e2e/onboard-golden-parity.manifest.json \
  e2e/onboard-golden-parity.spec.ts-snapshots \
  scripts/__tests__/onboard-golden-parity.test.mjs \
  src/__tests__/onboardGoldenManifestBounds.test.ts
```

Why retired:
- `onboarding-golden-parity.yml` failed 60/60 GitHub Actions runs since introduction (`bdb3d175`, 2026-10-05) because it copied macOS CoreText PNG snapshots (`*-darwin.png`) to `*-linux.png` and compared them against Ubuntu Linux Chromium (`maxDiffPixelRatio: 0.02`), and compared web safe-area bounding boxes (`top: 0`) against iOS Simulator status-bar/header coordinates (`y: 155` vs `y: 32`).
- Per owner rule (`WRITER-RULES.md` §1, 2026-10-25), parity gates are retired.
- Replacement: `e2e/onboard-every-button.spec.ts` and `e2e/onboard-viewport-fit.spec.ts` (referenced by `PackServer/scripts/e2e/full-system-acceptance.ts:413-426`).
