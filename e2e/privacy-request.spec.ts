import { expect, test } from "playwright/test";
import {
  assertNoHorizontalOverflow,
  clearTrackingConsent,
  dismissConsentBannerIfVisible,
  grantTrackingConsent,
  mockPrivacyRequestSubmit,
  mockPrivacyRequestVerification,
} from "./helpers";

test.describe("Privacy request flows", () => {
  test("submits an opt-out request and sends the expected payload", async ({
    page,
  }) => {
    const requestMock = await mockPrivacyRequestSubmit(page);

    await page.goto("/privacy-request/opt-out", {
      waitUntil: "domcontentloaded",
    });
    await dismissConsentBannerIfVisible(page);

    await expect(
      page.getByRole("heading", { name: /your privacy choices/i }),
    ).toBeVisible();
    await assertNoHorizontalOverflow(page);

    await page.getByRole("textbox", { name: /email address/i }).fill("privacy-e2e@doneai-test.invalid");
    await page.getByRole("combobox", { name: /relationship to doneai/i }).selectOption("authorized_agent");
    await page.getByRole("textbox", { name: /state or country/i }).fill("California");
    await page.getByRole("textbox", { name: /first name/i }).fill("Taylor");
    await page.getByRole("textbox", { name: /last name/i }).fill("Rivera");
    await page.getByRole("textbox", { name: /request details/i }).fill(
      "Please opt me out of data sharing and limit sensitive processing.",
    );
    await page.getByRole("checkbox").check();
    await page.getByRole("button", { name: /submit privacy request/i }).click();

    await expect
      .poll(() => requestMock.getPayload())
      .not.toBeNull();

    const payload = requestMock.getPayload();
    expect(payload?.requestType).toBe("opt_out");
    expect(payload?.email).toBe("privacy-e2e@doneai-test.invalid");
    expect(payload?.relationship).toBe("authorized_agent");
    expect(payload?.jurisdiction).toBe("California");
    expect(payload?.details).toContain("opt me out");
    expect(payload?.recaptchaToken).toContain("local-dev-bypass-token");
    expect(payload?.source).toBe("web_portal");

    await expect(
      page.getByText(/your opt-out request has been received/i),
    ).toBeVisible();
  });

  test("delete route keeps the in-app deletion guidance visible", async ({
    page,
  }) => {
    await page.goto("/privacy-request/delete", {
      waitUntil: "domcontentloaded",
    });
    await dismissConsentBannerIfVisible(page);

    await expect(
      page.getByRole("heading", { name: /deleting a doneai account/i }),
    ).toBeVisible();
    await expect(
      page.getByText(/app menu > settings > account > delete account/i),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: /submit privacy request/i }),
    ).not.toBeVisible();
  });

  test("verification flow revokes tracking consent for confirmed opt-out requests", async ({
    page,
  }) => {
    await mockPrivacyRequestVerification(page);
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await grantTrackingConsent(page);

    await page.goto(
      "/privacy-request/verify?requestId=req_e2e_verify&token=test-token",
      { waitUntil: "domcontentloaded" },
    );

    await expect(
      page.getByText(/privacy opt-out request has been confirmed and applied/i),
    ).toBeVisible();

    await expect
      .poll(() =>
        page.evaluate(() => window.localStorage.getItem("tracking-consent")),
      )
      .toBe("revoked");

    await clearTrackingConsent(page);
  });
});
