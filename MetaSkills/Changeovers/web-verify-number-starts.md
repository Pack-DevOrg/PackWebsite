# web-verify-number-starts
- invariant: Verify your number POSTs `/user/information/phone-verification/start` `{platform:"web"}` with the web session Authorization. 200 + pending check shows the minted code (Text Pack / QR). API 4xx renders the typed envelope (`code: details.reason` for B93 `DEVICE_ATTESTATION_CLIENT_UNKNOWN`), never "Unable to start verification."
- files: `src/api/client.ts` (+test), `src/components/VerifyPhoneStep.tsx` (+test), `src/components/VerifyPhoneCta.tsx` (+test), `e2e/onboard-steps.spec.ts`
- tests: `npx jest src/api/client.test.ts src/components/VerifyPhoneStep.test.tsx src/components/VerifyPhoneCta.test.tsx`
- mutate: SKIP named: golden-table (PackWebsite has no mutate-changed.mjs)
- photos: n/a (`--not-visual`)
- suites: client.test.ts, VerifyPhoneStep.test.tsx, VerifyPhoneCta.test.tsx, e2e/onboard-steps.spec.ts
