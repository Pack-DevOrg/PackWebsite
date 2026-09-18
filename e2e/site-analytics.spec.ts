import { expect, test } from "@playwright/test";
import type { Page, Route } from "@playwright/test";

const POSTHOG_ARRAY_STUB = `window.posthog = window.posthog || {
  __loaded: true,
  init: function (key, options) {
    this.__key = key;
    this.__loaded = true;
    window.__packPosthogInit = true;
    if (options && typeof options.loaded === "function") {
      options.loaded(this);
    }
  },
  capture: function (event, properties) {
    window.__packPhEvents = window.__packPhEvents || [];
    window.__packPhEvents.push({ event: event, properties: properties || {} });
  },
  startSessionRecording: function () {
    window.__packReplayStarted = true;
  }
};
window.__packPosthogInit = true;
`;

const grantAnalyticsConsent = async (page: Page): Promise<void> => {
  await page.addInitScript(() => {
    const timestamp = Date.now().toString();
    window.localStorage.setItem("tracking-consent", "granted");
    window.localStorage.setItem("tracking-consent-timestamp", timestamp);
    window.localStorage.setItem(
      "tracking-preferences",
      JSON.stringify({ analytics: true, functional: true, marketing: true }),
    );
    document.cookie = `tracking-consent=granted; path=/; max-age=${180 * 24 * 60 * 60}; samesite=lax`;
    document.cookie = `tracking-consent-timestamp=${timestamp}; path=/; max-age=${180 * 24 * 60 * 60}; samesite=lax`;
    window.__packPhEvents = [];
  });
};

const stubPostHogAssets = async (page: Page): Promise<void> => {
  const fulfillStub = async (route: Route): Promise<void> => {
    await route.fulfill({
      status: 200,
      contentType: "application/javascript",
      body: POSTHOG_ARRAY_STUB,
    });
  };
  await page.route("https://us-assets.i.posthog.com/**", fulfillStub);
  await page.route("https://us.i.posthog.com/**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: "{}",
    });
  });
};

test.describe("site analytics", () => {
  test.describe.configure({ retries: 1, timeout: 120_000 });

  test("PostHog init, pageview, INP sample, and text-me site_action", async ({
    page,
  }) => {
    await stubPostHogAssets(page);
    await grantAnalyticsConsent(page);

    await page.goto("/", { waitUntil: "load", timeout: 90_000 });
    const textMe = page.getByRole("button", { name: /text me/i });
    await expect(textMe).toBeVisible({ timeout: 60_000 });

    await expect
      .poll(async () => page.evaluate(() => Boolean(window.__packPosthogInit)))
      .toBe(true);

    await expect
      .poll(async () => {
        const events = await page.evaluate(() => window.__packPhEvents ?? []);
        return events.some((row) => row.event === "$pageview");
      })
      .toBe(true);

    await textMe.dispatchEvent("pointerdown");
    await textMe.click({ force: true });

    await expect
      .poll(async () => {
        const events = await page.evaluate(() => window.__packPhEvents ?? []);
        return events.some(
          (row) =>
            row.event === "$web_vitals" &&
            row.properties.$web_vital_name === "INP",
        );
      })
      .toBe(true);

    await expect
      .poll(async () => {
        const events = await page.evaluate(() => window.__packPhEvents ?? []);
        return events.some(
          (row) =>
            row.event === "site_action" &&
            row.properties.action === "text_me" &&
            typeof row.properties.duration_ms === "number",
        );
      })
      .toBe(true);

    await expect
      .poll(async () => page.evaluate(() => Boolean(window.__packReplayStarted)))
      .toBe(true);
  });
});
