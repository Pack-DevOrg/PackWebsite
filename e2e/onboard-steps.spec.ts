import { existsSync, mkdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { expect, test, type Page } from "@playwright/test";

import { dismissConsentBannerIfVisible } from "./helpers";

const SHOT_DIR = path.join(process.cwd(), "test-results", "onboard");
const AUTH_DIR = path.join(process.cwd(), "test-results", "e2e-auth");
const PACK_VERIFY_E164 = "+13054392989";
const INTERNAL_IDENTIFIERS =
  /SignupLoginScreen|ConnectedAccountsScreen|NotificationsSetupScreen|OnboardingCompleteScreen|PhotosConnectScreen|WhatPackDoesStep|VerifyPhoneStep/;

const EXPECTED_ORDER = [
  "signup",
  "what-Pack-does",
  "verify",
  "connections",
  "welcome",
] as const;

function authStatePath(projectName: string): string {
  return path.join(AUTH_DIR, `${projectName}.json`);
}

function sessionDumpPath(projectName: string): string {
  return path.join(AUTH_DIR, `${projectName}.session.json`);
}

async function restoreSessionStorage(
  page: Page,
  projectName: string,
): Promise<void> {
  const dumpFile = sessionDumpPath(projectName);
  if (!existsSync(dumpFile)) {
    return;
  }
  const raw = readFileSync(dumpFile, "utf8");
  const entries = JSON.parse(raw) as Record<string, string>;
  await page.addInitScript((data: Record<string, string>) => {
    for (const [key, value] of Object.entries(data)) {
      window.sessionStorage.setItem(key, value);
    }
  }, entries);
}

async function openOnboard(
  page: Page,
  onboardPath = "/onboard",
): Promise<void> {
  await page.goto(onboardPath, { waitUntil: "domcontentloaded" });
  await dismissConsentBannerIfVisible(page);
  await page.locator("h1, h2").first().waitFor({ timeout: 45_000 });
}

async function captureStep(
  page: Page,
  projectName: string,
  step: string,
): Promise<void> {
  mkdirSync(SHOT_DIR, { recursive: true });
  const fileName = `${projectName}-${step}.png`;
  await test.step(`screenshot ${fileName}`, async () => {
    await page.screenshot({
      path: path.join(SHOT_DIR, fileName),
      fullPage: true,
    });
  });
}

async function assertNoInternalIdentifiers(page: Page): Promise<void> {
  expect(await page.locator("body").innerText()).not.toMatch(
    INTERNAL_IDENTIFIERS,
  );
}

async function clickIfVisible(page: Page, name: RegExp | string): Promise<void> {
  const button = page.getByRole("button", { name });
  if (await button.first().isVisible().catch(() => false)) {
    await button.first().click();
  }
}

test.describe("Onboard logged-out signup", () => {
  test.use({ storageState: { cookies: [], origins: [] } });
  test.setTimeout(120_000);

  test("signup heading and CTAs", async ({ page }, testInfo) => {
    await openOnboard(page);
    await expect(
      page.getByRole("heading", { name: "Welcome to Pack" }),
    ).toBeVisible({ timeout: 45_000 });
    await expect(
      page.getByRole("button", { name: "Continue with Google" }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Continue with Apple" }),
    ).toBeVisible();
    await captureStep(page, testInfo.project.name, "signup");
    await assertNoInternalIdentifiers(page);
    const skip = page.getByRole("button", { name: /Skip/i });
    if (await skip.isVisible().catch(() => false)) {
      await expect(skip).toBeVisible();
    }
  });
});

test.describe("Onboard authenticated G order", () => {
  test.setTimeout(180_000);

  test(
    "walks signup → what-Pack-does → verify → connections → welcome",
    async ({ page, context }, testInfo) => {
    const projectName = testInfo.project.name;
    const storageFile = authStatePath(projectName);
    if (existsSync(storageFile)) {
      const stored = JSON.parse(readFileSync(storageFile, "utf8")) as {
        cookies?: Parameters<typeof context.addCookies>[0];
      };
      if (stored.cookies && stored.cookies.length > 0) {
        await context.addCookies(stored.cookies);
      }
    }
    const isMobile = projectName === "chromium-mobile";
    await restoreSessionStorage(page, projectName);
    await openOnboard(page);
    await captureStep(page, projectName, "authenticated-land");

    const connectionsHeading = page.getByRole("heading", {
      name: /^Connections$/,
    });
    if (await connectionsHeading.isVisible().catch(() => false)) {
      expect(
        false,
        `step-order expected ${EXPECTED_ORDER.join(" → ")}; Connections immediately after signup/auth is the old prod order (expected-red until G deploys)`,
      ).toBe(true);
    }
    if (
      await page
        .getByRole("heading", { name: "Welcome to Pack" })
        .isVisible()
        .catch(() => false)
    ) {
      expect(
        false,
        "authenticated walk still on signup; Cognito session did not stick — expected-red until G deploys",
      ).toBe(true);
    }

    const whatPackDoes = page.getByRole("heading", {
      name: /^(Past|What Pack does|Present|Future)$/,
    });
    await expect(whatPackDoes.first()).toBeVisible();
    await expect(
      page.getByRole("button", { name: /Continue|Skip/i }).first(),
    ).toBeVisible();
    const whatSkip = page.getByRole("button", { name: /Skip/i });
    if (await whatSkip.isVisible().catch(() => false)) {
      await expect(whatSkip).toBeVisible();
    }
    await captureStep(page, projectName, "what-pack-does");
    await assertNoInternalIdentifiers(page);

    await clickIfVisible(page, /Skip for now|Skip/i);
    await clickIfVisible(page, /^Continue$/);

    await expect(
      page.getByRole("heading", { name: "Verify your number" }),
    ).toBeVisible();
    // The E2E account is already bound (verifiedPhone true): the step mints,
    // polls, sees approved, and advances on its own — racing the link/QR
    // render. Accept whichever lands first; assert the verify UI only while
    // the step is still on screen.
    const connectionsAfterVerify = page.getByRole("heading", { name: "Connections" });
    const textPackLink = page.getByRole("link", { name: "Text Pack" });
    const qr = page.locator(
      'canvas, img[alt*="QR" i], [data-testid*="qr" i], svg[aria-label*="QR" i]',
    );
    await expect(
      connectionsAfterVerify.or(textPackLink).or(qr).first(),
    ).toBeVisible({ timeout: 20000 });
    if (await connectionsAfterVerify.isVisible()) {
      await captureStep(page, projectName, "verify-auto-advanced");
    } else {
      if (isMobile) {
        await expect(textPackLink).toBeVisible();
        const sms = page.locator('a[href^="sms:"]');
        await expect(sms.first()).toHaveAttribute(
          "href",
          new RegExp(`sms:.*${PACK_VERIFY_E164.replace("+", "\\+")}`),
        );
      } else {
        await expect(qr.first()).toBeVisible();
      }
      await expect(
        page.getByRole("button", { name: /^Skip( for now)?$/ }),
      ).toBeVisible();
      await captureStep(page, projectName, "verify");
      await assertNoInternalIdentifiers(page);
    }

    await clickIfVisible(page, "Skip for now");

    await expect(
      page.getByRole("heading", { name: "Connections" }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Skip for now" }),
    ).toBeVisible();
    await captureStep(page, projectName, "connections");
    await assertNoInternalIdentifiers(page);

    await clickIfVisible(page, "Skip for now");

    await expect(
      page.getByRole("heading", { name: /You're all set!|Welcome/i }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: /Let us handle the rest|Continue/i }),
    ).toBeVisible();
    await captureStep(page, projectName, "welcome");
    await assertNoInternalIdentifiers(page);
  },
  );
});
