import { mkdirSync, copyFileSync, existsSync } from "node:fs";
import path from "node:path";
import { expect, test, type Page } from "@playwright/test";

import { dismissConsentBannerIfVisible } from "./helpers";

const CAPTURE_BEFORE = process.env.ONBOARD_BEFORE === "1";
const SHOT_DIR = path.join(process.cwd(), "test-results", "onboard");
const INTERNAL_IDENTIFIERS =
  /SignupLoginScreen|ConnectedAccountsScreen|NotificationsSetupScreen|OnboardingCompleteScreen|PhotosConnectScreen/;

const APP_GOLDEN_CANDIDATES: Record<string, string[]> = {
  signup: [
    path.join(
      "/Users/noahmitsuhashi/Code/PackAll/PackApp",
      ".maestro",
      "rel-auth-smoke-empty-welcome.png",
    ),
  ],
  connections: [],
  photos: [],
  notifications: [],
  complete: [],
  "signin-link": [],
};

function e2eJwt(): string {
  const header = Buffer.from(
    JSON.stringify({ alg: "none", typ: "JWT" }),
  ).toString("base64url");
  const payload = Buffer.from(
    JSON.stringify({ sub: "e2e-user", exp: 9999999999 }),
  ).toString("base64url");
  return `${header}.${payload}.e2e`;
}

function shotName(step: string): string {
  if (CAPTURE_BEFORE) {
    return `before-${step}.png`;
  }
  return `${step}.png`;
}

async function injectAuthenticatedSession(page: Page): Promise<void> {
  const jwt = e2eJwt();
  const issuedAt = Date.now();
  const sessionJson = JSON.stringify({
    tokens: {
      accessToken: jwt,
      idToken: jwt,
      refreshToken: "e2e-refresh",
      tokenType: "Bearer",
      issuedAt,
      accessTokenExpiresAt: issuedAt + 60 * 60 * 1000,
    },
  });
  await page.addInitScript((raw: string) => {
    window.sessionStorage.setItem("pack.auth.session.v1", raw);
  }, sessionJson);
}

async function openOnboard(
  page: Page,
  onboardPath = "/onboard",
): Promise<void> {
  await page.goto(onboardPath, { waitUntil: "domcontentloaded" });
  await dismissConsentBannerIfVisible(page);
  await page.locator("h1, h2").first().waitFor({ timeout: 45_000 });
}

async function captureStep(page: Page, step: string): Promise<void> {
  mkdirSync(SHOT_DIR, { recursive: true });
  const fileName = shotName(step);
  await test.step(`screenshot ${fileName}`, async () => {
    await page.screenshot({
      path: path.join(SHOT_DIR, fileName),
      fullPage: true,
    });
  });
  copyAppGoldenIfPresent(step);
}

function copyAppGoldenIfPresent(step: string): void {
  const candidates = APP_GOLDEN_CANDIDATES[step];
  if (candidates === undefined) {
    return;
  }
  for (const source of candidates) {
    if (!existsSync(source)) {
      continue;
    }
    copyFileSync(source, path.join(SHOT_DIR, `app-${step}.png`));
    return;
  }
}

async function assertNoInternalIdentifiers(page: Page): Promise<void> {
  if (CAPTURE_BEFORE) {
    return;
  }
  expect(await page.locator("body").innerText()).not.toMatch(
    INTERNAL_IDENTIFIERS,
  );
}

async function reachConnections(page: Page): Promise<void> {
  await injectAuthenticatedSession(page);
  await openOnboard(page);
  const connections = page.getByRole("heading", { name: "Connections" });
  const welcome = page.getByRole("heading", { name: "Welcome to Pack" });
  await expect(connections.or(welcome)).toBeVisible({ timeout: 45_000 });
  if (await connections.isVisible()) {
    return;
  }
  const continueAuth = page.getByRole("button", { name: "Continue", exact: true });
  await continueAuth.waitFor({ state: "visible", timeout: 15_000 }).catch(() => {});
  if (await continueAuth.isVisible() && (await continueAuth.isEnabled())) {
    await continueAuth.click();
  }
  if (CAPTURE_BEFORE) {
    await page
      .getByRole("heading", { name: /^(Connections|Connect accounts)$/ })
      .waitFor({ timeout: 15_000 })
      .catch(() => {});
    return;
  }
  await expect(
    page.getByRole("heading", { name: /^(Connections|Connect accounts)$/ }),
  ).toBeVisible();
}

async function reachPhotos(page: Page): Promise<void> {
  await reachConnections(page);
  const skip = page.getByRole("button", { name: "Skip for now" });
  if (await skip.isVisible()) {
    await skip.click();
  }
  if (CAPTURE_BEFORE) {
    return;
  }
  await expect(page.getByText(/places you've been/)).toBeVisible();
}

async function reachNotifications(page: Page): Promise<void> {
  await reachPhotos(page);
  const photosSkip = page.getByRole("button", {
    name: "Skip connecting Photos for now",
  });
  if (await photosSkip.isVisible()) {
    await photosSkip.click();
  } else {
    const continueBtn = page.getByRole("button", { name: "Continue", exact: true });
    if (await continueBtn.isVisible() && (await continueBtn.isEnabled())) {
      await continueBtn.click();
    }
  }
  if (CAPTURE_BEFORE) {
    await expect(
      page.getByRole("heading", {
        name: /Turn on trip alerts|Browser notifications/,
      }),
    ).toBeVisible();
    return;
  }
  await expect(
    page.getByRole("heading", { name: "Turn on trip alerts" }),
  ).toBeVisible();
}

async function reachComplete(page: Page): Promise<void> {
  await reachNotifications(page);
  const notNow = page.getByRole("button", { name: "Not now" });
  if (await notNow.isVisible()) {
    await notNow.click();
  } else {
    const skip = page.getByRole("button", { name: "Skip" });
    if (await skip.isVisible()) {
      await skip.click();
    }
  }
  if (CAPTURE_BEFORE) {
    await expect(page.getByText(/You're all set!|You are in/)).toBeVisible();
    return;
  }
  await expect(page.getByText("You're all set!")).toBeVisible();
}

test.describe("Onboard website five-step frames", () => {
  test.use({ viewport: { width: 390, height: 844 } });
  test.setTimeout(120_000);

  test.beforeEach(({}, testInfo) => {
    test.skip(
      testInfo.project.name === "chromium-desktop",
      "390x844 only; skip chromium-desktop double-run",
    );
  });

  test("signup", async ({ page }) => {
    await openOnboard(page);
    await expect(
      page.getByRole("heading", { name: "Welcome to Pack" }),
    ).toBeVisible({ timeout: 45_000 });
    await captureStep(page, "signup");
    await assertNoInternalIdentifiers(page);
  });

  test("connections", async ({ page }) => {
    await reachConnections(page);
    await captureStep(page, "connections");
    await assertNoInternalIdentifiers(page);
  });

  test("photos", async ({ page }) => {
    await reachPhotos(page);
    await captureStep(page, "photos");
    await assertNoInternalIdentifiers(page);
  });

  test("notifications", async ({ page }) => {
    await reachNotifications(page);
    await captureStep(page, "notifications");
    await assertNoInternalIdentifiers(page);
  });

  test("complete", async ({ page }) => {
    await reachComplete(page);
    await captureStep(page, "complete");
    await assertNoInternalIdentifiers(page);
  });

  test("sign-in-link", async ({ page }) => {
    await openOnboard(page, "/onboard?phone=+15551212");
    await expect(
      page.getByRole("heading", { name: "Welcome to Pack" }),
    ).toBeVisible({ timeout: 45_000 });
    await captureStep(page, "signin-link");
    await assertNoInternalIdentifiers(page);
    if (CAPTURE_BEFORE) {
      return;
    }
    await expect(page.getByLabel("Phone number")).toHaveValue("+15551212");
  });
});
