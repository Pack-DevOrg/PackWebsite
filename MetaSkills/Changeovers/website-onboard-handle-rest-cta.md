# website-onboard-handle-rest-cta
state: EXIT. tree PackWebsite-session-website-onboard-handle-rest-cta/PackWebsite `session/website-onboard-handle-rest-cta`.
base `f71005909ac9f611d39025068b686b44895b386e`. No Slack. No ACCEPT.
invariant: CompleteStep CTA with no onContinue assigns buildAppStoreUrl(APPLE_APP_ID); markup has no ProgressDots.
files: src/components/onboard/CompleteStep.tsx (+test)
test: npx jest src/components/onboard/CompleteStep.test.tsx — 1 suite, 4 passed, 0 failed
RED at base: assign 0 calls (noop); queryAllByTestId onboard-progress-dot length 5
mutate: SKIP named: PackWebsite has no mutate-changed.mjs / no Stryker config
photos: before=photos/complete-step-before.png after=photos/complete-step-after.png alongside goldens/IMG_2791.png; after dots=0
suites: CompleteStep.test.tsx
tsc: npx tsc --noEmit exit 0
result: EXIT
