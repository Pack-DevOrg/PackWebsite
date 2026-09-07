import { expect, test, type Page } from "@playwright/test";

async function gotoIgnoringOauthAbort(page: Page, path: string): Promise<void> {
  try {
    await page.goto(path, { waitUntil: "commit", timeout: 180000 });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (
      message.includes("ERR_ABORTED") ||
      message.includes("frame was detached")
    ) {
      return;
    }
    throw error;
  }
}

async function expectCognitoAuthorize(page: Page, path: string): Promise<void> {
  const authorizeRequestPromise = page.waitForRequest(
    (request) => {
      return request.url().includes("auth.trypackai.com/oauth2/authorize");
    },
    { timeout: 180000 },
  );

  await gotoIgnoringOauthAbort(page, path);

  const authorizeRequest = await authorizeRequestPromise;
  const currentUrl = new URL(authorizeRequest.url());

  expect(currentUrl.origin).toBe("https://auth.trypackai.com");
  expect(currentUrl.pathname).toBe("/oauth2/authorize");
  expect(currentUrl.searchParams.get("response_type")).toBe("code");

  const clientId = currentUrl.searchParams.get("client_id");
  expect(clientId, "missing Cognito client_id query parameter").toBeTruthy();
  expect(clientId).not.toBe("build-time-placeholder");

  const redirectUri = currentUrl.searchParams.get("redirect_uri");
  expect(redirectUri, "missing redirect_uri query parameter").toBeTruthy();

  const parsedRedirectUri = new URL(redirectUri as string);
  expect(["/auth/callback", "/oauth/callback"]).toContain(
    parsedRedirectUri.pathname,
  );
  expect(
    [
      "https://www.trypackai.com",
      "https://trypackai.com",
      "http://localhost:5173",
      "http://localhost:4173",
      "http://127.0.0.1:5173",
      "http://127.0.0.1:4173",
    ].includes(parsedRedirectUri.origin),
    `unexpected redirect origin: ${parsedRedirectUri.origin}`,
  ).toBe(true);

  expect(currentUrl.searchParams.get("code_challenge")).toBeTruthy();
  expect(currentUrl.searchParams.get("code_challenge_method")).toBe("S256");
  expect(currentUrl.searchParams.get("state")).toBeTruthy();
  expect(currentUrl.searchParams.get("scope")).toContain("openid");
}

test.describe("App settings grants", () => {
  test.describe.configure({ timeout: 180000 });

  test("unauthenticated /app/settings hits Cognito authorize", async ({
    page,
  }) => {
    await expectCognitoAuthorize(page, "/app/settings");
  });

  test("unauthenticated /en/app/settings hits Cognito authorize", async ({
    page,
  }) => {
    await expectCognitoAuthorize(page, "/en/app/settings");
  });
});
