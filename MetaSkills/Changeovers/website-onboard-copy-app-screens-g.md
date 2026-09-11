# website-onboard-copy-app-screens-g
- invariant: OnboardPage is Signup → Connections → Photos → Notifications → Complete via the five step components + page ProgressDots. No stepper header, STEP_LABELS, data-step, or VerifyPhoneScreen in this sequence. Auth status authenticated on Signup advances to Connections. `/onboard?phone=` prefills SignupLoginStep.
- files: src/pages/OnboardPage.tsx (+test)
- test: npx jest src/pages/OnboardPage.test.tsx — 3 passed, 0 failed
- mutate: SKIP no-runner-in-repo
- photos: n/a (frames at seat P)
- suites: OnboardPage.test.tsx
