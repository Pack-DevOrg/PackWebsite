import { expect, test } from "playwright/test";
import { dismissConsentBannerIfVisible } from "./helpers";

test.describe("Shared and unsubscribe flows", () => {
  test("shared travel link hits backend and renders graceful error state for invalid share id", async ({
    page,
  }) => {
    const shareId = `invalid-e2e-${Date.now()}`;

    const shareRequestPromise = page.waitForRequest(
      (request) => request.method() === "GET" && request.url().includes("/api/share/"),
      { timeout: 20_000 }
    );

    await page.goto(`/share/${shareId}`, { waitUntil: "domcontentloaded" });
    await dismissConsentBannerIfVisible(page);

    const shareRequest = await shareRequestPromise;

    expect(shareRequest.url()).toContain("/api/share/");
    await expect(page.getByRole("heading", { name: /unable to load travel plan/i })).toBeVisible();
  });

  test("unsubscribe without token shows explicit error state", async ({ page }) => {
    await page.goto("/unsubscribe", { waitUntil: "domcontentloaded" });
    await dismissConsentBannerIfVisible(page);

    await expect(page.getByText(/missing unsubscribe token/i)).toBeVisible();
  });
});
