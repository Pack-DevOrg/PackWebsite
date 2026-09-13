# night-acceptance-2026-09-13-a

test: `E2E_BASE_URL=https://www.trypackai.com npx playwright test e2e/onboard-every-button.spec.ts --workers=2` — 14 passed, 0 failed (7 steps × desktop+mobile). Global-setup hosted-UI timed out; JWT inject still lands authenticated steps. E2E user `tests@trypackai.com` only.
mutate: SKIP named: e2e spec, no unit logic
photos: `test-results/onboard-every-button/` (per-step desktop+mobile pngs)
note: live Connections `onBack` / `onConnectGoogle` / `onConnectMicrosoft` unset; spec asserts those controls exist and classifies no-op Back as chrome-back, no-op providers as named-provider.
