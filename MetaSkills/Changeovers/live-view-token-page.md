# live-view-token-page
state: EXIT CANDIDATE. tree PackWebsite-session-live-view-token-page/PackWebsite `session/live-view-token-page`.
SHA: 480376dcb19c226520a662098ce0e2181e8971c0. base bb7ea144317a9025131af9dcc4fff76c5f6f4bda. No Slack.
invariant: iframe only after token GET to Pack API resolves https cross-host unexpired handoff; query liveViewUrl/merchantHost ignored; missing/expired/invalid heading exactly `Pack needs your help — this link expired`; Helmet noindex,nofollow on every state.
files: src/pages/LiveViewConnectPage.tsx; src/pages/LiveViewConnectPage.test.tsx; src/routes/NonHomeRoutes.live-view.test.tsx
test: LiveViewConnectPage.test.tsx 7/7; NonHomeRoutes.live-view.test.tsx 2/2
mutate: SKIP PackWebsite has no Stryker
photos: n/a
result: EXIT CANDIDATE
