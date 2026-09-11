# onboarding-verify-number-step-a
- invariant: VerifyPhoneStep idle phone + "Text me the code" → issueVerifyCode → 6 OTP boxes (autocomplete=one-time-code, inputMode=numeric, auto-advance, paste splits) → confirmVerifyCode → onVerified. Resend locked 30s from send/resend click (no useEffect). Skip for now → onSkip without issue. Wrong code warm short copy, never "for security". Injected callbacks only.
- files: src/components/VerifyPhoneStep.tsx (+test)
- tests: npx jest src/components/VerifyPhoneStep.test.tsx — 6 passed, 0 failed
- mutate: SKIP named: PackWebsite has no mutate-changed.mjs
- photos: n/a (component slice; shots land in G)
- suites: VerifyPhoneStep.test.tsx
