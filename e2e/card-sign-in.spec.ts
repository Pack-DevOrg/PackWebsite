import { mkdirSync } from "node:fs";
import path from "node:path";
import { expect, test, type Page } from "@playwright/test";
import { readE2EPassword, submitHostedUiLogin } from "./hosted-ui-login";

/*
 * "Sign in to view" on a private card page (/a/<token>), live lane only (the Cognito return URL is registered for
 * https://www.trypackai.com). Cards come from PackServer scripts/mint-e2e-agenda-card.ts:
 *   E2E_CARD_OWNER_TOKEN    an agenda the E2E account owns
 *   E2E_CARD_FOREIGN_TOKEN  an agenda the E2E account is not a member of
 * The password is read from SSM by global-setup and never printed.
 */
const OWNER_TOKEN = process.env.E2E_CARD_OWNER_TOKEN ?? "";
const FOREIGN_TOKEN = process.env.E2E_CARD_FOREIGN_TOKEN ?? "";
const SHOTS = path.join(process.cwd(), "test-results", "card-sign-in");

test.describe("card page: Sign in to view", () => {
  test.skip(
    !OWNER_TOKEN || !FOREIGN_TOKEN || !/^https:\/\/www\.trypackai\.com/.test(process.env.E2E_BASE_URL ?? ""),
    "needs E2E_BASE_URL=https://www.trypackai.com, E2E_CARD_OWNER_TOKEN and E2E_CARD_FOREIGN_TOKEN",
  );
  test.describe.configure({ timeout: 150_000 });

  const shot = async (page: Page, name: string): Promise<void> => {
    mkdirSync(SHOTS, { recursive: true });
    await page.screenshot({ path: path.join(SHOTS, `${name}.png`), fullPage: true });
  };

  // The E2E account signs in with a password, which the app's own buttons (Google, Apple) do not offer. ?signin=cognito is the
  // test door that sends Sign in to view to the password page; users only ever get the sheet.
  const signInAsE2EAccount = async (page: Page, token: string): Promise<void> => {
    await page.goto(`/a/${token}?signin=cognito`);
    await page.getByRole("button", { name: "Sign in to view" }).click();
    await submitHostedUiLogin(page, readE2EPassword());
  };

  test("anonymous sees the private state with a Sign in to view button", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "chromium-desktop", "one browser is enough for the hosted login lane");
    await page.goto(`/a/${OWNER_TOKEN}`);
    await expect(page.locator("#card")).toContainText("This card is private");
    await expect(page.getByRole("button", { name: "Sign in to view" })).toBeVisible();
    await expect(page.locator("#card")).not.toContainText("Tech Week");
    await shot(page, "1-anonymous-private");
  });

  test("Sign in to view opens the app's own sheet; each provider goes straight to Google or Apple, never the Cognito page", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "chromium-desktop", "one browser is enough for the hosted login lane");
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`/a/${OWNER_TOKEN}`);
    await page.getByRole("button", { name: "Sign in to view" }).click();
    await expect(page.getByRole("button", { name: "Continue with Google" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Continue with Apple" })).toBeVisible();
    await shot(page, "1b-sign-in-sheet-phone");
    const visited: string[] = [];
    page.on("request", (request) => {
      if (request.isNavigationRequest()) visited.push(request.url());
    });
    await page.getByRole("button", { name: "Continue with Google" }).click();
    await page.waitForURL(/accounts\.google\.com/, { timeout: 30_000 });
    expect(visited.some((url) => /auth\.trypackai\.com\/oauth2\/authorize\?.*identity_provider=Google/.test(url))).toBe(true);
    expect(visited.some((url) => /auth\.trypackai\.com\/login/.test(url))).toBe(false);
    await shot(page, "1c-google-direct");
  });

  test("the E2E account signs in and sees its own agenda card", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "chromium-desktop", "one browser is enough for the hosted login lane");
    await signInAsE2EAccount(page, OWNER_TOKEN);
    await page.waitForURL(new RegExp(`/a/${OWNER_TOKEN}$`), { timeout: 60_000 });
    await expect(page.locator("#card.agendaCard")).toBeVisible({ timeout: 30_000 });
    await expect(page.locator("#card")).toContainText("Tech Week LA");
    await expect(page.locator("#card")).toContainText("Tech Week Breakfast");
    await expect(page.locator("#card")).toContainText("Founders Demo Night");
    await expect(page.locator("#card")).toContainText("Sam Synthetic");
    // The ID token is never written to browser storage or a cookie.
    const stored = await page.evaluate(() => JSON.stringify([{ ...sessionStorage }, { ...localStorage }, document.cookie]));
    expect(stored).not.toMatch(/eyJ[\w-]+\.[\w-]+\.[\w-]+/);
    await shot(page, "2-owner-sees-agenda");
  });

  test("a signed-in account that is not a member sees only the kind and who shared it, with Request access, and no card content", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "chromium-desktop", "one browser is enough for the hosted login lane");
    await signInAsE2EAccount(page, FOREIGN_TOKEN);
    await page.waitForURL(new RegExp(`/a/${FOREIGN_TOKEN}$`), { timeout: 60_000 });
    await expect(page.locator("#card")).toContainText("You need access", { timeout: 30_000 });
    await expect(page.getByRole("button", { name: "Request access" })).toBeVisible();
    await expect(page.locator("#card")).not.toContainText("Not Yours");
    await expect(page.locator("#card")).not.toContainText("Tech Week");
    await shot(page, "3-non-member-request-access");
    // The ask goes to the card's (synthetic) owner; the page then waits and says so.
    await page.getByRole("button", { name: "Request access" }).click();
    await expect(page.locator("#card")).toContainText("Request sent", { timeout: 30_000 });
    await expect(page.getByRole("button", { name: "Request access" })).toHaveCount(0);
    await shot(page, "4-request-sent");
  });
});
