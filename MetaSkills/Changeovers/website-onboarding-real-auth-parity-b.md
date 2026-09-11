# website-onboarding-real-auth-parity-b
- invariant: real Cognito hosted-UI login as tests@ (SSM `/pack/e2e/test-user-password`); both projects walk signup → what-Pack-does → verify → connections → welcome; desktop QR; Pixel 7 `sms:`; no alg:none JWT
- files: e2e/onboard-steps.spec.ts, e2e/global-setup.ts, playwright.config.ts, package.json, package-lock.json
- test: `npm run test:e2e:live -- e2e/onboard-steps.spec.ts` — 2 passed (logged-out signup desktop+mobile), 2 failed (authenticated G order, expected-red until G deploys). Playwright CLI 1.58.2.
- mutate: SKIP named: golden table
- photos: test-results/onboard/chromium-desktop-signup.png test-results/onboard/chromium-mobile-signup.png test-results/onboard/chromium-desktop-authenticated-land.png test-results/onboard/chromium-mobile-authenticated-land.png
- notes: pin PackWebsite `playwright` 1.58.2 so live CLI is not the hoisted 1.48 bin; Cognito hosted UI is email-OTP-first then Password; tests@ password rejected on live hosted UI so session did not stick — spec still asserts new order.
