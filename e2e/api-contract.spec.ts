import { expect, test } from "playwright/test";

const apiBaseUrl = process.env.E2E_API_BASE_URL ?? "https://api.trypackai.com/prod";
const websiteOrigin = process.env.E2E_WEBSITE_ORIGIN ?? "https://trypackai.com";

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
});
