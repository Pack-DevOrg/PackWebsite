# onboarding-verify-number-step-b
- invariant: ONBOARDING_SEQUENCE VerifyPhoneScreen immediately before ConnectedAccountsScreen. Auth Continue → VerifyPhoneStep in Card. Skip advances to connections without POST /verify-phone/confirm. Connections re-ask returns to VerifyPhoneScreen without confirm. Stubs POST /verify-phone/issue and /verify-phone/confirm via useApiClient.
- files: src/pages/OnboardPage.tsx (+test)
- test: npx jest src/pages/OnboardPage.test.tsx — 7 passed, 0 failed
- mutate: SKIP named: PackWebsite has no mutate-changed.mjs
- photos: n/a (page slice; shots land in G)
- suites: OnboardPage.test.tsx
