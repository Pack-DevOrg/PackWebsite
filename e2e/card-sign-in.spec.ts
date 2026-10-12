import { mkdirSync } from "node:fs";
import path from "node:path";
import { expect, test, type Page } from "@playwright/test";
import { readE2EPassword, submitHostedUiLogin } from "./global-setup";

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

  const signInThroughHostedUi = async (page: Page): Promise<void> => {
    const password = readE2EPassword();
    await page.getByRole("button", { name: "Sign in to view" }).click();
    await submitHostedUiLogin(page, password);
  };

  test("anonymous sees the private state with a Sign in to view button", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "chromium-desktop", "one browser is enough for the hosted login lane");
    await page.goto(`/a/${OWNER_TOKEN}`);
    await expect(page.locator("#card")).toContainText("This card is private");
    await expect(page.getByRole("button", { name: "Sign in to view" })).toBeVisible();
    await expect(page.locator("#card")).not.toContainText("Tech Week");
    await shot(page, "1-anonymous-private");
  });

  test("the E2E account signs in and sees its own agenda card", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "chromium-desktop", "one browser is enough for the hosted login lane");
    await page.goto(`/a/${OWNER_TOKEN}`);
    await expect(page.getByRole("button", { name: "Sign in to view" })).toBeVisible();
    await signInThroughHostedUi(page);
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

  test("a signed-in account that is not a member gets You do not have access, no card content", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "chromium-desktop", "one browser is enough for the hosted login lane");
    await page.goto(`/a/${FOREIGN_TOKEN}`);
    await expect(page.getByRole("button", { name: "Sign in to view" })).toBeVisible();
    await signInThroughHostedUi(page);
    await page.waitForURL(new RegExp(`/a/${FOREIGN_TOKEN}$`), { timeout: 60_000 });
    await expect(page.locator("#card")).toContainText("You do not have access to this card", { timeout: 30_000 });
    await expect(page.locator("#card")).not.toContainText("Not Yours");
    await shot(page, "3-non-member-no-access");
  });
});
