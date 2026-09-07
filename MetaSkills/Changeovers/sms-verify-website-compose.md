# sms-verify-website-compose
- invariant: Text Pack CTA POSTs `/user/information/phone-verification/start` `{platform:"web"}` with no `phoneNumber`. Authed mint sends Authorization via createApiClient. Public mint uses requestPublicApi `credentials:"include"` for `pack_sms_onboard`. sms: UA navigates to returned `smsHref` (`sms:+13054392989?body=<code>`). Desktop shows `+13054392989` and minted code, no navigation. No phone or OTP inputs.
- files: `src/components/VerifyPhoneCta.tsx` (+test), `src/api/client.ts` (+test mint helper only), `src/pages/AppSettingsPage.tsx` (+test) logged-in and signed-out cards.
- tests: `npx jest src/components/VerifyPhoneCta.test.tsx src/pages/AppSettingsPage.test.tsx src/api/client.test.ts` GREEN 9/9. Sandwich red on origin (no VerifyPhoneCta). `npx tsc --noEmit` PASS (root solution). Slice `tsc -p tsconfig.app.json` has no new errors except pre-existing PackServer alias misses.
- mutate: SKIP PackWebsite has no mutate-changed.mjs
- photos: n/a (`--not-visual --skip-maestro`)
- forbidden held: no PackServer/PackApp/Twilio/WaitlistForm/`phoneNumber` body/OTP field
