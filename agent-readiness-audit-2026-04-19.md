# Pack Agent-Readiness Audit

Date: 2026-04-19  
Target: `https://www.trypackai.com`  
Reference scan: `https://isitagentready.com` user-provided results captured on 2026-04-19

## Executive Summary

The scan rated `www.trypackai.com` at **25/100** with these category results:

- Discoverability: `2/3`
- Content: `0/1`
- Bot Access Control: `1/2`
- API, Auth, MCP, and Skill Discovery: `0/6`
- Commerce: informational only, not scored

The site already had strong baseline crawlability via `robots.txt`, `sitemap.xml`, and `llms.txt`. The main gaps were in machine-readable protocol discovery rather than human-facing marketing content.

## Issues Found

### Already present before this change

- `robots.txt` existed and was valid.
- `sitemap.xml` existed and was valid.
- AI crawler rules were already present in `robots.txt`.
- `llms.txt` already provided a useful public markdown summary.

### Gaps confirmed by the scan

1. Homepage responses exposed no discovery `Link` headers.
2. The site did not publish markdown negotiation for `Accept: text/markdown`.
3. `robots.txt` did not declare Content Signals preferences.
4. No API catalog was published at `/.well-known/api-catalog`.
5. No OAuth discovery metadata was published on the website origin.
6. No OAuth Protected Resource metadata was published on the website origin.
7. No Agent Skills index was published.
8. No MCP server card was published.
9. No WebMCP tools were registered on page load.
10. Web Bot Auth metadata was not published.

## Fixed In Repo Now

These fixes were implemented in the website source:

- Added homepage and route-level discovery `Link` headers in [public/_headers](/Users/noahmitsuhashi/Code/DoneAll/PackWebsite/public/_headers:1) and [netlify.toml](/Users/noahmitsuhashi/Code/DoneAll/PackWebsite/netlify.toml:1).
- Added `Content-Signal: ai-train=no, search=yes, ai-input=yes` to [public/robots.txt](/Users/noahmitsuhashi/Code/DoneAll/PackWebsite/public/robots.txt:1).
- Expanded [public/llms.txt](/Users/noahmitsuhashi/Code/DoneAll/PackWebsite/public/llms.txt:1) to emphasize capability pages as preferred AI-input sources for feature-specific answers.
- Published markdown mirrors for the homepage, core marketing routes, and capability pages under [public](/Users/noahmitsuhashi/Code/DoneAll/PackWebsite/public:1) so edge negotiation can serve `text/markdown` instead of HTML.
- Published an API catalog at [public/.well-known/api-catalog](/Users/noahmitsuhashi/Code/DoneAll/PackWebsite/public/.well-known/api-catalog:1).
- Published a high-level OpenAPI description at [public/.well-known/api/openapi.json](/Users/noahmitsuhashi/Code/DoneAll/PackWebsite/public/.well-known/api/openapi.json:1).
- Published OAuth authorization-server metadata at [public/.well-known/oauth-authorization-server](/Users/noahmitsuhashi/Code/DoneAll/PackWebsite/public/.well-known/oauth-authorization-server:1).
- Published OpenID configuration metadata at [public/.well-known/openid-configuration](/Users/noahmitsuhashi/Code/DoneAll/PackWebsite/public/.well-known/openid-configuration:1).
- Published OAuth Protected Resource metadata at [public/.well-known/oauth-protected-resource](/Users/noahmitsuhashi/Code/DoneAll/PackWebsite/public/.well-known/oauth-protected-resource:1).
- Published an Agent Skills index at [public/.well-known/agent-skills/index.json](/Users/noahmitsuhashi/Code/DoneAll/PackWebsite/public/.well-known/agent-skills/index.json:1).
- Published supporting skill documents:
  [product-overview.md](/Users/noahmitsuhashi/Code/DoneAll/PackWebsite/public/.well-known/agent-skills/product-overview.md:1),
  [support-and-contact.md](/Users/noahmitsuhashi/Code/DoneAll/PackWebsite/public/.well-known/agent-skills/support-and-contact.md:1),
  [policies-and-trust.md](/Users/noahmitsuhashi/Code/DoneAll/PackWebsite/public/.well-known/agent-skills/policies-and-trust.md:1),
  [capability-pages.md](/Users/noahmitsuhashi/Code/DoneAll/PackWebsite/public/.well-known/agent-skills/capability-pages.md:1).
- Added CloudFront function sources in [scripts/cloudfront](/Users/noahmitsuhashi/Code/DoneAll/PackWebsite/scripts/cloudfront:1) and a publish helper in [scripts/sync-app-cloudfront-functions.mjs](/Users/noahmitsuhashi/Code/DoneAll/PackWebsite/scripts/sync-app-cloudfront-functions.mjs:1) so the live S3 and CloudFront stack can actually negotiate markdown and emit discovery headers.

## Remaining Gaps

### Needs a product, legal, or policy decision

1. **WebMCP**
   Exposing browser tools is possible, but the right tool set is product-facing.
   Example decisions: read-only marketing discovery only, account/login actions, waitlist signup, support escalation, or no browser tools for now.

2. **MCP server card**
   This should only be added once there is a real MCP endpoint to advertise.
   Publishing a server card without a working transport would be misleading.

3. **Web Bot Auth**
   This requires key management and outbound request-signing intent.
   It is not a static marketing-site change.

### Needs deployment or edge-runtime support

4. **Markdown negotiation**
   The scan specifically expects the homepage to return `text/markdown` when agents request `Accept: text/markdown`.
   Static files alone do not provide true content negotiation. This needs edge logic in front of the S3 origin, which is why CloudFront function changes were added.

### Worth tightening after deployment

5. **Soft-404 behavior for missing well-known routes**
   The current live site serves HTML for missing `/.well-known/*` paths. Once deployed, the new files should remove the specific scan failures, but the fallback behavior is still noisy for future agent discovery.

6. **Origin/CDN parity**
   The repo now contains the right `_headers` and Netlify rules, but the live host is S3 plus CloudFront. Equivalent response-header behavior must be applied in the active CDN configuration, not just in static files.

## Recommendations

### Immediate

1. Deploy the new static discovery files and headers.
2. Re-run `isitagentready.com` after deploy to confirm the new baseline.
### Next

3. Publish the CloudFront markdown-negotiation and discovery-header changes to the live distribution.
4. Decide whether Pack wants a real WebMCP surface for read-only discovery or authenticated actions.
5. Only add an MCP server card after a real MCP transport exists.

### Later

6. Consider a fuller OpenAPI spec exported from backend source of truth instead of the current high-level public description.
7. Add explicit API status or health documentation if Pack wants deeper machine-readable operational discovery.

## Notes

- The new OAuth and protected-resource metadata were derived from the active website config and backend scope definitions in this repo, including the Cognito-backed Pack resource server identifiers and the current production API base.
- The current custom auth domain does not appear to expose its own discovery document, so the website now publishes origin-scoped discovery metadata that points to the active authorization endpoints and JWKS.
