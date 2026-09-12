# web-app-cognito-client-split-d
files: src/config/appConfig.ts src/config/appConfig.test.ts MetaSkills/Changeovers/web-app-cognito-client-split-d.md
INVARIANT: hosted-UI/PKCE client id from VITE_COGNITO_WEB_CLIENT_ID (CognitoWebUserPoolClientId); never iOS 6qjkv282db2701o9m0uroh6c9k; callback https://www.trypackai.com/auth/callback
test: src/config/appConfig.test.ts — iOS absent + web env key + prod callback. RED at BASE: 2 failed (iOS still pinned; VITE_COGNITO_WEB_CLIENT_ID missing), 3 passed. GREEN: 5 passed, 0 failed.
cmd: npx jest --watchman=false --runInBand --no-coverage src/config/appConfig.test.ts
baseSha: 3d15b540a3760402dd3065e88d7f8c46bb9a4d20
tipSha: ebeed7dd86177008b2f6fc12ea30496521b982a8
mutate: SKIP — config value swap, covered by pin
photos: n/a — no pixel change
parked: awaiting deploy of CognitoWebUserPoolClientId
nested briefs: `.env.production` still pins iOS `VITE_COGNITO_CLIENT_ID`; `e2e/global-setup.ts` still defaults to iOS id
REVIEW PACKET: writer does not ACCEPT
result: EXIT CANDIDATE. Writer does not ACCEPT.
