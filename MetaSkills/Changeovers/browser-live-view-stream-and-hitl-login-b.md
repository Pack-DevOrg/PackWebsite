# browser-live-view-stream-and-hitl-login-b
tree: pw-liveview `liveview-frames`. No Slack.
invariant: token GET then watch newest screencast frame; one poll for frames+progress; take-over HITL strips OTP; Resume → watch; stale badge if ts >5s; expired heading + `?token=` only.
files: src/pages/LiveViewConnectPage.tsx; src/pages/LiveViewConnectPage.test.tsx
tests: npx jest src/pages/LiveViewConnectPage.test.tsx — 11 passed, 0 failed (4 new went red on iframe sandwich first)
mutate: SKIP named: golden table
photos: before=MetaSkills/Changeovers/browser-live-view-stream-and-hitl-login-b/before.png after=MetaSkills/Changeovers/browser-live-view-stream-and-hitl-login-b/after.png
result: EXIT CANDIDATE
