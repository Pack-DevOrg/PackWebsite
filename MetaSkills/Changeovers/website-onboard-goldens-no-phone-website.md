# website-onboard-goldens-no-phone-website
state: EXIT. tree PackWebsite-session-website-onboard-goldens-no-phone-website/PackWebsite `session/website-onboard-goldens-no-phone-website`.
base origin/master `72f456b21daf67cb99d44fc57890c872b41d4c6b`. No Slack. No ACCEPT.
invariant: `/onboard` auth step has no phone input, no OTP boxes, no Resend, no ProgressDots; Google and Apple continue buttons each render a brand SVG copied from PackApp AuthProviderButtons.
files: src/components/onboard/SignupLoginStep.tsx (+test); src/pages/OnboardPage.tsx (+test). OnboardPrimitives.tsx untouched.
test: npx jest src/components/onboard/SignupLoginStep.test.tsx src/pages/OnboardPage.test.tsx — 2 suites, 4 passed, 0 failed.
RED at base: SignupLoginStep queryByLabelText('Phone number') received tel input; OnboardPage queryByTestId('onboard-progress-dots') received 5 dots; phone query still bound Phone number.
mutate: SKIP — PackWebsite has no Stryker config / no mutate-changed.mjs; markup-absence pins are the kill.
photos: FAILED playwright-core 1.58.2 TimeoutError navigating to http://127.0.0.1:4191/onboard waiting until load (repeat: npx playwright missing chromium-1140). vite curl /onboard HTTP 200. Never a question card.
suites: SignupLoginStep.test.tsx; OnboardPage.test.tsx
tsc: npx tsc --noEmit exit 0
result: EXIT
