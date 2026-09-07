# web-social-api
test: src/api/social.test.ts — 23 passed (no session ⇒ zero fetch; POST /friends/:sub/accept `{status:"active"}` + Bearer; malformed envelope; FriendSchema default planningAccess; schema-skip empty mint)
mutate: PASS 103 killed / 0 survived / 0 timeout / 0 noCoverage / 0 errors / 124 ignored (227 instrumented = 103+124). SKIP schema+planning social.ts:7-187 (`Stryker disable all`; 115 ignored; one-file brief). SKIP 7 ignored at :249 empty-error.message next-line. SKIP 2 ignoreStatic (`FRIENDS_PATH` :5, Bearer scheme :235).
photos: n/a
suites: src/api/social.test.ts
tsc: `npx tsc --noEmit` exit 0
base: 0d5a3b5400aae083e47ad225740c08ee982a3f2e
files: src/api/social.ts src/api/social.test.ts
flags: --not-visual --skip-maestro
invariant: friends grants require live Cognito token; no session ⇒ zero fetch
