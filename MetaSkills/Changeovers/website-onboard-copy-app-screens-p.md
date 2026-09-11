# website-onboard-copy-app-screens-p
- invariant: 390×844 full-page frames for signup/connections/photos/notifications/complete; no internal screen identifiers; /onboard?phone= prefills signup
- files: e2e/onboard-steps.spec.ts
- test: npx playwright test e2e/onboard-steps.spec.ts — 6 passed, 0 failed
- mutate: SKIP named: golden table
- photos: before=test-results/onboard/before-signup.png after=test-results/onboard/signup.png
  before=test-results/onboard/before-connections.png after=test-results/onboard/connections.png
  before=test-results/onboard/before-photos.png after=test-results/onboard/photos.png
  before=test-results/onboard/before-notifications.png after=test-results/onboard/notifications.png
  before=test-results/onboard/before-complete.png after=test-results/onboard/complete.png
  before=test-results/onboard/before-signin-link.png after=test-results/onboard/signin-link.png
- suites: e2e/onboard-steps.spec.ts
- notes: ugly a5b09e7 is 4-step debug stepper (no Photos); before-photos is Connect accounts. App Maestro screen goldens missing.
