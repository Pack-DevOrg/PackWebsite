import { expect, test } from "playwright/test";
import {
  assertNoHorizontalOverflow,
  dismissConsentBannerIfVisible,
} from "./helpers";

test.describe("Legal and support journeys", () => {
  test("footer links route to the current legal and support destinations", async ({
    page,
  }) => {
    await page.goto("/support", { waitUntil: "domcontentloaded" });
    await dismissConsentBannerIfVisible(page);

    const privacyRightsLink = page
      .getByRole("link", { name: /your privacy rights/i })
      .last();
    await privacyRightsLink.scrollIntoViewIfNeeded();
    await privacyRightsLink.click();
    await expect(page).toHaveURL(/\/privacy-request$/);
    await expect(
      page.getByRole("heading", { name: /your privacy choices/i }),
    ).toBeVisible();

    await page.goto("/support", { waitUntil: "domcontentloaded" });
    await dismissConsentBannerIfVisible(page);

    await page.getByRole("link", { name: /^privacy$/i }).last().click();
    await expect(page).toHaveURL(/\/privacy$/);
    await expect(
      page.getByRole("heading", { name: "Privacy Policy", exact: true }),
    ).toBeVisible();

    await page.goto("/support", { waitUntil: "domcontentloaded" });
    await dismissConsentBannerIfVisible(page);

    await page.getByRole("link", { name: "Accessibility", exact: true }).click();
    await expect(page).toHaveURL(/\/accessibility$/);
    await expect(
      page.getByRole("heading", { name: /accessibility/i }),
    ).toBeVisible();
    await assertNoHorizontalOverflow(page);
  });

  test("manage cookies re-opens consent controls after dismissal", async ({
    page,
  }) => {
    await page.goto("/support", { waitUntil: "domcontentloaded" });
    await expect(
      page.getByRole("button", { name: /reject all/i }),
    ).toBeVisible();

    await page.getByRole("button", { name: /reject all/i }).click();
    await expect(
      page.getByRole("button", { name: /accept all/i }),
    ).not.toBeVisible();

    const manageCookiesButton = page
      .getByRole("button", { name: /manage cookies/i })
      .last();
    await manageCookiesButton.scrollIntoViewIfNeeded();
    await manageCookiesButton.click();
    await expect(
      page.getByRole("button", { name: /save preferences/i }),
    ).toBeVisible();
  });

  test("support page keeps privacy and accessibility follow-up links wired", async ({
    page,
  }) => {
    await page.goto("/support", { waitUntil: "domcontentloaded" });
    await dismissConsentBannerIfVisible(page);

    await expect(page.getByRole("heading", { name: /^support$/i })).toBeVisible();

    await page.getByRole("link", { name: /privacy request portal/i }).click();
    await expect(page).toHaveURL(/\/privacy-request$/);

    await page.goto("/support", { waitUntil: "domcontentloaded" });
    await dismissConsentBannerIfVisible(page);

    await page.getByRole("link", { name: /accessibility page/i }).click();
    await expect(page).toHaveURL(/\/accessibility$/);
  });

  test("legacy do-not-sell route redirects into privacy choices", async ({
    page,
  }) => {
    await page.goto("/do-not-sell", { waitUntil: "domcontentloaded" });
    await expect(page).toHaveURL(/\/privacy-request$/);
    await expect(
      page.getByRole("heading", { name: /your privacy choices/i }),
    ).toBeVisible();
  });
});
