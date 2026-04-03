import { expect, test } from "playwright/test";
import { assertNoHorizontalOverflow, dismissConsentBannerIfVisible } from "./helpers";

test.describe("Responsive visibility", () => {
  test("homepage key content is visible and not clipped", async ({ page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await dismissConsentBannerIfVisible(page);

    await expect(page.getByText(/planning a trip\?/i).first()).toBeVisible();
    await expect(page.getByRole("button", { name: /^done\.$/i }).first()).toBeVisible();
    await assertNoHorizontalOverflow(page);
  });

  test("features page main heading is visible and layout has no horizontal overflow", async ({
    page,
  }) => {
    await page.goto("/features", { waitUntil: "domcontentloaded" });
    await dismissConsentBannerIfVisible(page);

    await expect(page.getByRole("heading", { name: /why travelers use doneai/i }).first()).toBeVisible();
    await assertNoHorizontalOverflow(page);
  });

  test("privacy request form remains visible and usable across viewport sizes", async ({
    page,
  }) => {
    await page.goto("/privacy-request", { waitUntil: "domcontentloaded" });
    await dismissConsentBannerIfVisible(page);

    await expect(page.getByRole("textbox", { name: /email/i }).first()).toBeVisible();
    await expect(page.getByRole("button", { name: /submit privacy request/i }).first()).toBeVisible();
    await assertNoHorizontalOverflow(page);
  });
});
