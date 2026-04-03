import {expect, test} from "playwright/test";
import {
  assertNoHorizontalOverflow,
  dismissConsentBannerIfVisible,
} from "./helpers";

test.describe("Additional public page coverage", () => {
  test("terms page renders the approved legal document directly", async ({
    page,
  }) => {
    await page.goto("/terms", {waitUntil: "domcontentloaded"});
    await dismissConsentBannerIfVisible(page);

    await expect(
      page.getByRole("heading", {name: "Terms of Service", exact: true}),
    ).toBeVisible();
    await expect(page.getByText(/effective date: march 23, 2026/i)).toBeVisible();
    await expect(
      page.getByText(/travel bookings, partners, dot, and accessibility/i),
    ).toBeVisible();
    await assertNoHorizontalOverflow(page);
  });

  test("faq page expands answers and keeps the embedded waitlist visible", async ({
    page,
  }) => {
    await page.goto("/faq", {waitUntil: "domcontentloaded"});
    await dismissConsentBannerIfVisible(page);

    await expect(page.getByRole("heading", {name: /pack faq/i})).toBeVisible();

    const question = page.getByRole("button", {name: /what is pack\?/i});
    await question.click();
    await expect(
      page.getByText(/pack is a travel planning app/i),
    ).toBeVisible();

    await expect(
      page.getByRole("heading", {name: /still have questions\?/i}),
    ).toBeVisible();
    await expect(
      page.getByRole("textbox", {name: /email address/i}).last(),
    ).toBeVisible();
    await assertNoHorizontalOverflow(page);
  });

  test("how-it-works page keeps the comparison section and waitlist CTA wired", async ({
    page,
  }) => {
    await page.goto("/how-it-works", {waitUntil: "domcontentloaded"});
    await dismissConsentBannerIfVisible(page);

    await expect(
      page.getByRole("heading", {name: /how doneai works/i}),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", {
        name: /traditional travel planning vs\. the doneai flow/i,
      }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", {name: /traditional method/i}),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", {name: /doneai process/i}),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", {
        name: /see how doneai would handle your next trip/i,
      }),
    ).toBeVisible();
    await expect(
      page.getByRole("textbox", {name: /email address/i}).last(),
    ).toBeVisible();
    await assertNoHorizontalOverflow(page);
  });

  test("linked trip invite landing renders app handoff actions without dropping to the home page", async ({
    page,
  }) => {
    await page.goto("/trip/e2e-linked-trip?t=e2e-token", {
      waitUntil: "domcontentloaded",
    });

    await expect(
      page.getByRole("heading", {name: /shared trip invite/i}),
    ).toBeVisible();
    await expect(
      page.getByRole("button", {name: /open in pack/i}),
    ).toBeVisible();
    await expect(
      page.getByRole("button", {name: /download pack/i}),
    ).toBeVisible();
    await expect(
      page.getByRole("link", {name: /learn more about pack/i}),
    ).toHaveAttribute("href", /itsdoneai\.com/);
    await assertNoHorizontalOverflow(page);
  });
});
