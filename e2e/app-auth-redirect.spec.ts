import { expect, test } from "playwright/test";

test.describe("App auth wiring", () => {
  test("unauthenticated /app route redirects to Cognito authorize with real config", async ({
    page,
  }) => {
    const authorizeRequestPromise = page.waitForRequest((request) => {
      return request.url().includes("auth.itsdoneai.com/oauth2/authorize");
    });

    await page.goto("/app", { waitUntil: "domcontentloaded" });

    const authorizeRequest = await authorizeRequestPromise;
    const currentUrl = new URL(authorizeRequest.url());

    expect(currentUrl.origin).toBe("https://auth.itsdoneai.com");
    expect(currentUrl.pathname).toBe("/oauth2/authorize");
    expect(currentUrl.searchParams.get("response_type")).toBe("code");

    const clientId = currentUrl.searchParams.get("client_id");
    expect(clientId, "missing Cognito client_id query parameter").toBeTruthy();
    expect(clientId).not.toBe("build-time-placeholder");

    const redirectUri = currentUrl.searchParams.get("redirect_uri");
    expect(redirectUri, "missing redirect_uri query parameter").toBeTruthy();

    const parsedRedirectUri = new URL(redirectUri as string);
    expect(["/auth/callback", "/oauth/callback"]).toContain(
      parsedRedirectUri.pathname
    );
    expect([
      "https://itsdoneai.com",
      "http://localhost:5173",
      "http://localhost:4173",
    ]).toContain(parsedRedirectUri.origin);

    expect(currentUrl.searchParams.get("code_challenge")).toBeTruthy();
    expect(currentUrl.searchParams.get("code_challenge_method")).toBe("S256");
    expect(currentUrl.searchParams.get("state")).toBeTruthy();
    expect(currentUrl.searchParams.get("scope")).toContain("openid");
  });
});
