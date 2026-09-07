# web-account-control-plane
test: src/pages/AppSettingsPage.test.tsx — 6 passed (unauth ⇒ social/connect mock 0 + Connect mail absent; accept pending ⇒ POST `/friends/:sub/accept` `{status:"active"}` then refetch; Connect mail does not pin "Connected for booking confirmations." without `mailConnected`). Origin sandwich: 3 failed (pending label, connected copy flip).
mutate: SKIP no PackWebsite mutate-changed/Stryker runner. UI-string residuals: `Connected for booking confirmations.` `Not connected.` `Connected for trip alerts.` `Pending friend request.` `Active friend.` `No friends yet.` `Accept` `Decline`
photos: n/a (`--not-visual`)
suites: src/pages/AppSettingsPage.test.tsx 6 passed; e2e/app-settings-grants.spec.ts 4 passed (desktop+mobile `/app/settings` + `/en/app/settings` → Cognito authorize; waitUntil commit so OAuth abort does not hang)
tsc: `npx tsc --noEmit` exit 0
base: ac15079853d5caf211c52436687229e37466a80e
files: src/pages/AppSettingsPage.tsx src/pages/AppSettingsPage.test.tsx e2e/app-settings-grants.spec.ts src/routes/NonHomeRoutes.tsx MetaSkills/Changeovers/web-account-control-plane.md
flags: --not-visual --skip-maestro
invariant: friend-grant and connect-account actions fire only with a live Cognito session through `src/api/social.ts` + authenticated `client.ts`; unauthenticated zero network and no grant controls; connected copy is server-prop only
RELAY: src/api/accounts.ts needs PackServer GET `/user/accounts` + browser OAuth start; this seat does not mint `src/api/*.ts`
