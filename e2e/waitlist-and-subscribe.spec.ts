import { expect, test } from "playwright/test";
import {
  assertNoHorizontalOverflow,
  dismissConsentBannerIfVisible,
  makeE2EEmail,
} from "./helpers";

const grantTrackingConsent = async (
  page: import("playwright/test").Page
): Promise<void> => {
  await page.waitForLoadState("domcontentloaded");

  const applyConsent = () =>
    page.evaluate(() => {
      const timestamp = Date.now().toString();

      window.localStorage.setItem("tracking-consent", "granted");
      window.localStorage.setItem("tracking-consent-timestamp", timestamp);
      window.localStorage.setItem(
        "tracking-preferences",
        JSON.stringify({ analytics: false, functional: true, marketing: true })
      );

      document.cookie = `tracking-consent=granted; path=/; max-age=${180 * 24 * 60 * 60}; samesite=lax`;
      document.cookie = `tracking-consent-timestamp=${timestamp}; path=/; max-age=${180 * 24 * 60 * 60}; samesite=lax`;
    });

  try {
    await applyConsent();
  } catch (error) {
    if (
      error instanceof Error &&
      /Execution context was destroyed/i.test(error.message)
    ) {
      await page.waitForLoadState("domcontentloaded");
      await applyConsent();
    } else {
      throw error;
    }
  }
};

const denyTrackingConsent = async (
  page: import("playwright/test").Page
): Promise<void> => {
  await page.waitForLoadState("domcontentloaded");

  const clearConsent = () =>
    page.evaluate(() => {
      window.localStorage.removeItem("tracking-consent");
      window.localStorage.removeItem("tracking-consent-timestamp");
      window.localStorage.removeItem("tracking-preferences");

      document.cookie =
        "tracking-consent=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
      document.cookie =
        "tracking-consent-timestamp=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    });

  try {
    await clearConsent();
  } catch (error) {
    if (
      error instanceof Error &&
      /Execution context was destroyed/i.test(error.message)
    ) {
      await page.waitForLoadState("domcontentloaded");
      await clearConsent();
    } else {
      throw error;
    }
  }
};

type WaitlistPayload = {
  marketingConsent?: boolean;
  marketingEmailConsent?: boolean;
  eventId?: string;
};

const mockWaitlistSubscribe = async (
  page: import("playwright/test").Page
): Promise<{ getPayload: () => WaitlistPayload | null }> => {
  let payload: WaitlistPayload | null = null;

  await page.route("**/*subscribe*", async (route) => {
    const raw = route.request().postData() ?? "{}";
    payload = JSON.parse(raw) as WaitlistPayload;

    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        success: true,
        message: "Successfully joined waitlist",
      }),
    });
  });

  return {
    getPayload: () => payload,
  };
};

test.describe("Waitlist subscribe", () => {
  test("submits waitlist payload with marketing consent fields", async ({
    page,
  }) => {
    const waitlistMock = await mockWaitlistSubscribe(page);

    await page.goto("/", { waitUntil: "domcontentloaded" });

    const acceptAllButton = page.getByRole("button", { name: /accept all/i });
    if (await acceptAllButton.isVisible().catch(() => false)) {
      await acceptAllButton.click();
    }

    await grantTrackingConsent(page);
    await assertNoHorizontalOverflow(page);

    const emailInput = page
      .getByRole("textbox", { name: /email address/i })
      .first();
    await expect(emailInput).toBeVisible();
    await emailInput.fill(makeE2EEmail());

    await expect(
      page.getByRole("link", { name: /terms of service/i }).first()
    ).toBeVisible();
    await expect(page.getByRole("link", { name: /privacy policy/i }).first()).toBeVisible();
    await expect(
      page.getByRole("link", { name: /your privacy choices/i }).first()
    ).toBeVisible();

    const marketingEmailCheckbox = page
      .getByRole("checkbox", { name: /marketing email consent/i })
      .first();
    await marketingEmailCheckbox.check();

    await page.getByRole("button", { name: /^done\.$/i }).first().click();

    await expect
      .poll(() => waitlistMock.getPayload(), {
        message: "waitlist payload should be captured",
      })
      .not.toBeNull();

    const payload = waitlistMock.getPayload() as WaitlistPayload;
    expect(payload.marketingConsent).toBe(true);
    expect(payload.marketingEmailConsent).toBe(true);
    expect(typeof payload.eventId).toBe("string");

    await expect(
      page.getByRole("heading", { name: "You're on the list!" })
    ).toBeVisible();
  });

  test("keeps email opt-in independent when tracking consent is denied", async ({
    page,
  }) => {
    const waitlistMock = await mockWaitlistSubscribe(page);

    await page.goto("/", { waitUntil: "domcontentloaded" });
    await dismissConsentBannerIfVisible(page);
    await denyTrackingConsent(page);

    const emailInput = page
      .getByRole("textbox", { name: /email address/i })
      .first();
    await emailInput.fill(makeE2EEmail());

    await expect(
      page.getByRole("link", { name: /terms of service/i }).first()
    ).toBeVisible();
    await expect(page.getByRole("link", { name: /privacy policy/i }).first()).toBeVisible();
    await expect(
      page.getByRole("link", { name: /your privacy choices/i }).first()
    ).toBeVisible();

    const marketingEmailCheckbox = page
      .getByRole("checkbox", { name: /marketing email consent/i })
      .first();
    await marketingEmailCheckbox.check();

    await page.getByRole("button", { name: /^done\.$/i }).first().click();

    await expect
      .poll(() => waitlistMock.getPayload(), {
        message: "waitlist payload should be captured",
      })
      .not.toBeNull();

    const payload = waitlistMock.getPayload() as WaitlistPayload;
    expect(payload.marketingConsent).toBe(false);
    expect(payload.marketingEmailConsent).toBe(true);
    expect(payload.eventId).toBeUndefined();
  });
});
