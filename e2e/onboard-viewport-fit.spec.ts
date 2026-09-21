import { expect, test, type BrowserContext, type Page } from "@playwright/test";

import { dismissConsentBannerIfVisible } from "./helpers";

const PACK_VERIFY_E164 = "+13054392989";

function e2eJwt(): string {
  const header = Buffer.from(
    JSON.stringify({ alg: "none", typ: "JWT" }),
  ).toString("base64url");
  const payload = Buffer.from(
    JSON.stringify({ sub: "e2e-user", exp: 9999999999 }),
  ).toString("base64url");
  return `${header}.${payload}.e2e`;
}

function e2eSessionJson(): string {
  const jwt = e2eJwt();
  const issuedAt = Date.now();
  return JSON.stringify({
    tokens: {
      accessToken: jwt,
      idToken: jwt,
      refreshToken: "e2e-refresh",
      tokenType: "Bearer",
      issuedAt,
      accessTokenExpiresAt: issuedAt + 60 * 60 * 1000,
    },
  });
}

async function injectAuthenticatedSession(
  target: Page | BrowserContext,
  sessionJson = e2eSessionJson(),
): Promise<void> {
  await target.addInitScript((raw: string) => {
    window.sessionStorage.setItem("pack.auth.session.v1", raw);
  }, sessionJson);
}

async function stubPhoneVerificationMint(page: Page): Promise<void> {
  const mintBody = {
    code: "A1b2C3d4E5",
    smsHref: `sms:${PACK_VERIFY_E164}?body=A1b2C3d4E5`,
    expiresAt: Date.now() + 60_000,
  };
  await page.route(
    "**/user/information/phone-verification/start",
    async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(mintBody),
      });
    },
  );
  await page.route(
    "**/user/information/phone-verification/check",
    async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ status: "pending" }),
      });
    },
  );
}

async function openOnboard(page: Page): Promise<void> {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/onboard", { waitUntil: "domcontentloaded" });
  await dismissConsentBannerIfVisible(page);
  await page.locator("h1, h2").first().waitFor({ timeout: 45_000 });
}

/**
 * Parity spec: each onboarding step must fit the phone viewport (390×844)
 * the same way the app Maestro goldens do. Pixel comparison lives in
 * onboard-golden-parity.spec.ts (maxDiffPixelRatio 0.12).
 */
async function assertFitsViewport(page: Page): Promise<void> {
  const metrics = await page.evaluate(() => {
    const scrolling = document.scrollingElement ?? document.documentElement;
    return {
      scrollHeight: scrolling.scrollHeight,
      innerHeight: window.innerHeight,
    };
  });
  expect(
    metrics.scrollHeight,
    `scrollHeight ${metrics.scrollHeight} exceeds innerHeight ${metrics.innerHeight}`,
  ).toBeLessThanOrEqual(metrics.innerHeight);
}

async function headingVisible(page: Page, name: string): Promise<boolean> {
  return page
    .getByRole("heading", { name })
    .first()
    .isVisible()
    .catch(() => false);
}

async function clickIfVisible(
  page: Page,
  name: RegExp | string,
): Promise<boolean> {
  const button = page.getByRole("button", { name });
  if (await button.first().isVisible().catch(() => false)) {
    await button.first().click();
    return true;
  }
  return false;
}

test.describe("Onboard viewport fit at 390x844 logged-out signup", () => {
  test.use({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
    storageState: { cookies: [], origins: [] },
  });
  test.setTimeout(180_000);

  test("signup fits the phone viewport", async ({ page }, testInfo) => {
    test.skip(
      testInfo.project.name !== "chromium-mobile",
      "viewport-fit is chromium-mobile at 390x844",
    );
    await openOnboard(page);
    await expect(
      page.getByRole("heading", { name: "Welcome to Pack" }),
    ).toBeVisible();
    await assertFitsViewport(page);
  });
});

test.describe("Onboard viewport fit at 390x844 authenticated steps", () => {
  test.use({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
  });
  test.setTimeout(180_000);

  test("every authenticated step fits the phone viewport", async ({
    page,
    context,
  }, testInfo) => {
    test.skip(
      testInfo.project.name !== "chromium-mobile",
      "viewport-fit is chromium-mobile at 390x844",
    );
    const sessionJson = e2eSessionJson();
    await injectAuthenticatedSession(context, sessionJson);
    await injectAuthenticatedSession(page, sessionJson);
    await stubPhoneVerificationMint(page);
    await openOnboard(page);

    if (await headingVisible(page, "Welcome to Pack")) {
      await page.evaluate((raw: string) => {
        window.sessionStorage.setItem("pack.auth.session.v1", raw);
      }, sessionJson);
      await page.reload({ waitUntil: "domcontentloaded" });
      await dismissConsentBannerIfVisible(page);
      await page.locator("h1, h2").first().waitFor({ timeout: 45_000 });
    }

    const whatPackTitles = ["Past", "Present", "Future"] as const;
    if (await headingVisible(page, "Past")) {
      for (const title of whatPackTitles) {
        await expect(page.getByRole("heading", { name: title })).toBeVisible();
        await assertFitsViewport(page);
        await page.getByRole("button", { name: "Continue" }).click();
      }
    }

    if (await headingVisible(page, "Verify your number")) {
      await expect(
        page.getByRole("heading", { name: "Verify your number" }),
      ).toBeVisible();
      await assertFitsViewport(page);
      await clickIfVisible(page, /^Skip$/);
    }

    if (await headingVisible(page, "Connections")) {
      await expect(
        page.getByRole("heading", { name: "Connections" }),
      ).toBeVisible();
      await assertFitsViewport(page);
      await clickIfVisible(page, "Skip for now");
    }

    if (await headingVisible(page, "You're all set!")) {
      await expect(
        page.getByRole("heading", { name: "You're all set!" }),
      ).toBeVisible();
      await assertFitsViewport(page);
    }
  });
});
