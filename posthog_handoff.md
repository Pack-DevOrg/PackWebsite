# PostHog Handoff

Last updated: `2026-04-07`

Purpose:

- this file is the current handoff for PostHog work in the live `PackAll` repo
- it separates verified reality from assumptions and from post-deploy checks
- it should be updated in place when analytics wiring, dashboards, or validation status changes

## Repo Scope

This handoff covers the current repo layout:

- Mobile app: `/Users/noahmitsuhashi/Code/PackAll/PackApp`
- Server: `/Users/noahmitsuhashi/Code/PackAll/PackServer`
- Website: `/Users/noahmitsuhashi/Code/PackAll/PackWebsite`

Primary PostHog project context:

- project name: `DoneAI`
- project id: `152808`
- region host: `https://us.i.posthog.com`

## Current Status

### Verified in code

- mobile and backend now share the same analytics identity hash semantics
- `user_active` exists again in both mobile and backend analytics schemas
- the PostHog query layer now uses `user_active` instead of `user_authenticated` for active-user metrics
- mobile `user_active` emission is gated to meaningful product events and deduped once per local day per identified user
- backend booking completion events remain the highest-confidence conversion events

### Verified live in dev

- backend analytics delivery is active in CloudWatch for development
- dev backend events are being enqueued and delivered to PostHog
- dev traffic exists in PostHog for at least some mobile events

### Not yet fully live-validated after the latest fixes

- a fresh deployed mobile build emitting the restored `user_active` event
- stitched mobile-to-backend identity behavior after the hash alignment change
- updated dashboard population based on the restored `user_active` path

## Verified Findings

### Mobile analytics

Relevant files:

- `/Users/noahmitsuhashi/Code/PackAll/PackApp/src/services/analytics/unified-analytics.ts`
- `/Users/noahmitsuhashi/Code/PackAll/PackApp/src/services/analytics/sharedSchemas.ts`
- `/Users/noahmitsuhashi/Code/PackAll/PackApp/src/tests/unit/PosthogAnalyticsPrivacy.test.ts`

What is true now:

- mobile hashing uses HMAC-SHA256 with 32-character truncation
- mobile `user_active` is emitted from a meaningful-event allowlist, not from auth restore
- mobile stores daily dedupe state in AsyncStorage
- mobile carries `activity_date_local` and `trigger_event`
- mobile keeps the identified user in memory so post-identify events can emit `user_active` correctly

Validation run:

- `cd PackApp && npx jest src/tests/unit/PosthogAnalyticsPrivacy.test.ts --runInBand`
- result: pass

### Backend analytics and query layer

Relevant files:

- `/Users/noahmitsuhashi/Code/PackAll/PackServer/packages/analytics/src/utils.ts`
- `/Users/noahmitsuhashi/Code/PackAll/PackServer/packages/analytics/src/event-schemas.ts`
- `/Users/noahmitsuhashi/Code/PackAll/PackServer/packages/posthog-queries/src/utils/query-builders.ts`
- `/Users/noahmitsuhashi/Code/PackAll/PackServer/packages/posthog-queries/src/insights/trends/growth-metrics.ts`
- `/Users/noahmitsuhashi/Code/PackAll/PackServer/packages/posthog-queries/src/insights/trends/engagement-metrics.ts`
- `/Users/noahmitsuhashi/Code/PackAll/PackServer/packages/posthog-queries/src/insights/trends/revenue-metrics.ts`
- `/Users/noahmitsuhashi/Code/PackAll/PackServer/lambdas/travel-book/src/index.ts`

What is true now:

- backend hashing already used HMAC-SHA256 and now matches mobile behavior
- `user_active` exists in backend analytics schemas
- DAU / WAU / MAU query builders were migrated to `user_active`
- backend booking completion events remain the source-of-truth conversion events

Validation run:

- `cd PackServer/packages/posthog-queries && npx tsc --noEmit`
- result: pass

Additional repo check:

- `rg -n "USER_AUTHENTICATED|user_authenticated" PackServer/packages/posthog-queries/src`
- result: no matches

## Dev Verification Snapshot

Verification date:

- `2026-04-07`

CloudWatch verification already performed in this handoff:

- `/aws/lambda/dev-google-api` logged analytics enqueue activity to the dev SQS path
- `/aws/lambda/dev-analytics-delivery` logged successful PostHog delivery for `environment:"development"`

PostHog verification already performed in this handoff:

- `screen_viewed` with `environment=development`: `22` events in the last 24 hours at audit time
- `user_authenticated` with `environment=development`: `2` events in the last 24 hours at audit time
- `booking_completed` with `environment=development`: `0` events in the last 7 days at audit time
- `user_active` exists in PostHog event definitions
- `activity_date_local`, `trigger_event`, `build_number`, and `user_id_hash` exist in PostHog property definitions

Interpretation:

- dev ingestion is working end to end on the backend delivery path
- PostHog is receiving development traffic
- lack of recent `booking_completed` in dev is a traffic reality, not evidence that delivery is broken
- the restored `user_active` behavior still needs post-deploy live confirmation

## Website Reality

The website is not currently using PostHog in this repo.

Relevant files:

- `/Users/noahmitsuhashi/Code/PackAll/PackWebsite/src/components/TrackingProvider.tsx`
- `/Users/noahmitsuhashi/Code/PackAll/PackWebsite/src/tracking/runtime.ts`

Current website tracking stack:

- GA4
- GTM
- Meta Pixel
- TikTok

Implication:

- do not treat website analytics as part of the current PostHog rollout unless separate website PostHog instrumentation is added later

## KPI Guidance

### Safe canonical sources

- activity: `user_active` from mobile, after post-deploy live validation
- booking conversion: `booking_started`, `booking_completed`, `booking_failed`, `flight_booking_completed` from backend
- messaging engagement: `message_sent` from mobile
- search and planning engagement: `search_started`, `ai_planning_started`, `travel_request_started` from mobile

### Not trustworthy as primary KPIs yet

- `revenue_recorded`
- `payment_intent_started`

## Dashboard Notes

The older dashboard inventory in the previous handoff was stale.

What was re-verified in this handoff:

- the currently pinned source-of-truth dashboard in PostHog is `THE ONE DASHBOARD [PRODUCTION - SOURCE OF TRUTH]`
- dashboard id at audit time: `1374607`

Operational guidance:

- do not trust old dashboard IDs listed in earlier handoff versions without re-checking them in PostHog
- if a dashboard uses active-user ratios, confirm the underlying insight now points at `user_active`
- after deploy, confirm the restored `user_active` event is visible before using those charts for decision-making

## Post-Deploy Checklist

Run these checks after the current deploy lands:

1. Confirm fresh `user_active` events appear in PostHog for `environment=development`.
2. Open a fresh dev mobile session and verify `trigger_event`, `activity_date_local`, `build_number`, and `user_id_hash` on the event.
3. Verify the same user can generate both a mobile `user_active` event and a backend identified event under the same PostHog person.
4. Re-open the active-user dashboards and confirm tiles populate from `user_active`, not `user_authenticated`.
5. If testing booking flow in dev, verify `booking_started` and `booking_completed` land in PostHog with expected pricing properties.

## Known Limits

- full `PackApp` typecheck still has unrelated pre-existing failures outside the analytics files touched in this work
- this handoff does not claim website PostHog instrumentation exists
- this handoff does not claim production validation was completed in this session

## Bottom Line

The repo is now aligned on the main analytics regressions that previously made the handoff inaccurate:

- `user_active` is restored in schema and query code
- mobile and backend identity hashing semantics now match
- dev backend delivery to PostHog is verified working

What still matters operationally is the deploy:

- the latest mobile and backend code must be live before PostHog reflects these fixes
- dashboards that depend on `user_active` should be treated as ready for validation, not automatically trusted until fresh events land
