# website-onboarding-real-auth-parity-a2
- invariant: VerifyPhoneStep mints start, `sms:<pack>?body=<code>` Text Pack on narrow, QR (`data-sms-href` same link) on desktop width ≥740, polls `/user/information/phone-verification/check` every `VERIFY_STATUS_POLL_INTERVAL_MS` until confirmed|unmount|skip. Skip fires. No "Text me the code". Prop contract unchanged (`issueVerifyCode`/`confirmVerifyCode`/`onVerified`/`onSkip`). AppSettingsPage untouched.
- files: `src/components/VerifyPhoneStep.tsx` (+test)
- tests: `npx jest src/components/VerifyPhoneStep.test.tsx`
- mutate: SKIP named: PackWebsite has no mutate-changed.mjs
- photos: n/a (frames in B/C2)
- forbidden: AppSettingsPage.tsx, PackApp, PackServer, Sendblue
