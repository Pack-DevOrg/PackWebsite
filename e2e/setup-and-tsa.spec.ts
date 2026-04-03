import { expect, test } from "playwright/test";
import {
  assertNoHorizontalOverflow,
  dismissConsentBannerIfVisible,
  mockTsaPublicBoard,
} from "./helpers";

test.describe("Setup and TSA journeys", () => {
  test("email forwarding setup supports provider switching and generated artifacts", async ({
    page,
  }) => {
    await page.goto(
      "/setup/email-forwarding?provider=gmail&forwardTo=trips@itsdoneai.com",
      { waitUntil: "domcontentloaded" },
    );
    await dismissConsentBannerIfVisible(page);

    await expect(
      page.getByRole("heading", { name: /email forwarding setup/i }),
    ).toBeVisible();
    await expect(
      page.locator("code").filter({ hasText: "trips@itsdoneai.com" }).first(),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: /download filters xml/i }),
    ).toBeEnabled();

    await page.getByRole("tab", { name: /outlook/i }).click();
    await expect(page).toHaveURL(/provider=outlook/);
    await expect(page.getByRole("tab", { name: /outlook/i })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    await expect(
      page.getByLabel(/microsoft 365 \/ exchange online inbox rules/i),
    ).toBeVisible();
    await assertNoHorizontalOverflow(page);
  });

  test("tsa board filters airports locally with mocked live board data", async ({
    page,
  }) => {
    await mockTsaPublicBoard(page);

    await page.goto("/tsa", { waitUntil: "domcontentloaded" });
    await dismissConsentBannerIfVisible(page);

    await expect(
      page.getByRole("textbox", { name: /search airport wait times/i }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: /san francisco international airport/i }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: /john f. kennedy international airport/i }),
    ).toBeVisible();

    const search = page.getByRole("textbox", {
      name: /search airport wait times/i,
    });
    await search.fill("SFO");
    await expect(
      page.getByRole("button", { name: /san francisco international airport/i }),
    ).toBeVisible();
    await page
      .getByRole("button", { name: /san francisco international airport/i })
      .click();

    await expect(
      page.getByRole("heading", { name: /san francisco international airport/i }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: /john f. kennedy international airport/i }),
    ).not.toBeVisible();
    await expect(page.getByText(/showing .* of .* tracked airports/i)).toBeVisible();
  });

  test("forced tsa waitlist modal links privacy choices to the privacy request portal", async ({
    page,
  }) => {
    await mockTsaPublicBoard(page);

    await page.goto("/tsa?forceModal=1", { waitUntil: "domcontentloaded" });
    await dismissConsentBannerIfVisible(page);

    await expect(page.getByRole("dialog")).toBeVisible();
    await page.getByRole("link", { name: /your privacy choices/i }).click();

    await expect(page).toHaveURL(/\/privacy-request$/);
    await expect(
      page.getByRole("heading", { name: /your privacy choices/i }),
    ).toBeVisible();
  });
});
