/**
 * OPT-IN backend contract lane (`npm run test:e2e:contract`). Excluded from
 * plain `test:e2e` (playwright.config.ts testIgnore) because it talks to a
 * REAL backend stage. It defaults to DEV and exercises the real subscribe
 * happy path with the sanctioned test mailbox test@trypackai.com — a waitlist
 * row/email for that address in dev is an acceptable, attributable side
 * effect. Pointing it at prod requires an explicit E2E_API_BASE_URL override.
 */
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";

import { expect, request as playwrightRequest, test } from "playwright/test";

const apiBaseUrl = process.env.E2E_API_BASE_URL ?? "https://api.trypackai.com/dev";
const websiteOrigin = process.env.E2E_WEBSITE_ORIGIN ?? "https://www.trypackai.com";

// Sanctioned E2E test mailbox (see repo AGENTS.md / CLAUDE.md).
const TEST_MAILBOX = "test@trypackai.com";
// Waitlist storage contract: partition key = sha256 of trimmed/lowercased address.
const TEST_MAILBOX_HASH = createHash("sha256")
  .update(TEST_MAILBOX.trim().toLowerCase())
  .digest("hex");
const DEV_WAITLIST_TABLE = process.env.E2E_WAITLIST_TABLE ?? "dev-EncryptedWaitlist";

test.describe("Backend API contracts for website flows", () => {
  test("subscribe endpoint supports CORS preflight from website origin", async ({ request }) => {
    const response = await request.fetch(`${apiBaseUrl}/subscribe`, {
      method: "OPTIONS",
      headers: {
        Origin: websiteOrigin,
        "Access-Control-Request-Method": "POST",
        "Access-Control-Request-Headers": "content-type",
      },
    });

    expect(response.status()).toBeLessThan(500);
    const allowOrigin = response.headers()["access-control-allow-origin"] ?? "";
    expect(allowOrigin === "*" || allowOrigin === websiteOrigin).toBeTruthy();
  });

  test("subscribe happy path accepts the sanctioned test mailbox (real backend)", async ({
    request,
  }) => {
    const response = await request.post(`${apiBaseUrl}/subscribe`, {
      headers: {
        Origin: websiteOrigin,
        "Content-Type": "application/json",
      },
      data: {
        email: TEST_MAILBOX,
        source: "playwright-e2e-contract",
        ageConfirmed: true,
      },
    });

    expect(response.status(), await response.text()).toBe(200);
    const payload = (await response.json()) as { success?: boolean; message?: string };
    // First run creates the row; repeat runs take the resend/already-subscribed
    // path — both are contract-valid success shapes for the same single row.
    expect(payload.success).toBe(true);
  });

  test("subscribe endpoint rejects malformed requests with structured JSON (real backend)", async ({
    request,
  }) => {
    const response = await request.post(`${apiBaseUrl}/subscribe`, {
      headers: {
        Origin: websiteOrigin,
        "Content-Type": "application/json",
      },
      data: {
        email: "invalid-email",
        source: "playwright-e2e-contract",
      },
    });

    expect(response.status(), await response.text()).toBe(400);
    const payload = (await response.json().catch(() => null)) as
      | { success?: boolean; message?: string }
      | null;
    expect(payload?.success).toBe(false);
    expect((payload?.message ?? "").length).toBeGreaterThan(0);
  });

  test("unsubscribe endpoint returns explicit error when token is missing", async ({ request }) => {
    const response = await request.post(`${apiBaseUrl}/unsubscribe`, {
      headers: {
        Origin: websiteOrigin,
        "Content-Type": "application/json",
      },
      data: {},
    });

    expect(response.status(), await response.text()).toBe(400);
    const payload = (await response.json().catch(() => null)) as
      | { success?: boolean; message?: string }
      | null;
    expect(payload?.success).toBe(false);
    expect(payload?.message?.toLowerCase()).toContain("missing unsubscribe token");
  });

  // Cleanup: unsubscribe test@ so repeated runs stay idempotent. The
  // unsubscribe API is token-only; the token lives on the dev waitlist row
  // (plaintext attribute; only emailAddress is encrypted), so this reads it
  // with the AWS CLI. Without AWS credentials the cleanup is skipped — safe,
  // because re-subscribing the same address reuses the single hash-keyed row.
  // afterAll cannot use the test-scoped `request` fixture; build its own context.
  test.afterAll(async () => {
    let unsubscribeToken: string | undefined;
    try {
      const raw = execFileSync(
        "aws",
        [
          "dynamodb",
          "get-item",
          "--table-name",
          DEV_WAITLIST_TABLE,
          "--key",
          JSON.stringify({ email: { S: TEST_MAILBOX_HASH } }),
          "--projection-expression",
          "unsubscribeToken",
          "--output",
          "json",
        ],
        { encoding: "utf8" },
      );
      unsubscribeToken = JSON.parse(raw)?.Item?.unsubscribeToken?.S;
    } catch (error) {
      console.warn(
        `[api-contract] cleanup skipped (no AWS access to ${DEV_WAITLIST_TABLE}): ${String(error).slice(0, 200)}`,
      );
      return;
    }
    if (!unsubscribeToken) {
      return;
    }
    const context = await playwrightRequest.newContext();
    try {
      const response = await context.post(`${apiBaseUrl}/unsubscribe`, {
        headers: { Origin: websiteOrigin, "Content-Type": "application/json" },
        data: { unsubscribeToken },
      });
      console.log(`[api-contract] cleanup unsubscribe status=${response.status()}`);
    } finally {
      await context.dispose();
    }
  });
});
