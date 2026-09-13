import { mkdirSync } from "node:fs";
import path from "node:path";

import { expect, test, type Page, type Route } from "@playwright/test";

import { dismissConsentBannerIfVisible } from "./helpers";

const JOB_ID = "job-e2e-night-d";
const TOKEN = "tok-e2e-night-d";
const STUCK_ON = "hotel checkout OTP";
const EXPIRED_HEADING = "Pack needs your help — this link expired";
const FRAME_ALT = "Merchant checkout live view";
const SHOT_DIR = path.join(process.cwd(), "test-results", "job-live-view");

// 1x1 PNG (synthetic frame bytes; not an empty body and not a JSON error).
const TINY_PNG_BASE64 =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";
const TINY_PNG_BYTES = Buffer.from(TINY_PNG_BASE64, "base64");

function corsHeadersBecauseCrossOriginApi(): Record<string, string> {
  return {
    "access-control-allow-origin": "*",
    "access-control-allow-headers": "*",
    "access-control-allow-methods": "GET,POST,OPTIONS",
  };
}

async function seedTrackingConsentBeforeLoad(page: Page): Promise<void> {
  await page.addInitScript(() => {
    const timestamp = Date.now().toString();
    window.localStorage.setItem("tracking-consent", "granted");
    window.localStorage.setItem("tracking-consent-timestamp", timestamp);
    window.localStorage.setItem(
      "tracking-preferences",
      JSON.stringify({ analytics: false, functional: true, marketing: true }),
    );
  });
}

async function mockLiveViewJobApis(page: Page): Promise<void> {
  // CSP connect-src allows api.trypackai.com, not api.itsdoneai.com (dev .env).
  // Patch fetch so the handoff still resolves without a live PackServer.
  await page.addInitScript(
    ({ jobId, stuckOn, pngBase64 }) => {
      const originalFetch = window.fetch.bind(window);
      const jsonResponse = (body: unknown): Response =>
        new Response(JSON.stringify(body), {
          status: 200,
          headers: { "content-type": "application/json" },
        });
      const pngBytes = Uint8Array.from(atob(pngBase64), (char) =>
        char.charCodeAt(0),
      );
      window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
        const raw =
          typeof input === "string"
            ? input
            : input instanceof URL
              ? input.toString()
              : input.url;
        let parsed: URL;
        try {
          parsed = new URL(raw, window.location.origin);
        } catch {
          return originalFetch(input, init);
        }
        const path = parsed.pathname;
        const isSpaLiveViewDocument =
          parsed.origin === window.location.origin &&
          /^\/live-view\/?$/.test(path);
        if (isSpaLiveViewDocument) {
          return originalFetch(input, init);
        }
        if (/\/live-view\/?$/.test(path) && parsed.searchParams.has("token")) {
          return jsonResponse({
            liveViewUrl: "https://live.pack.test/view",
            merchantHost: "shop.example.test",
            jobId,
            expiresAtMs: Date.now() + 3_600_000,
          });
        }
        if (/\/live-view\/[^/]+\/latest\/?$/.test(path)) {
          return jsonResponse({
            seq: 1,
            ts: Date.now(),
            url: `data:image/png;base64,${pngBase64}`,
            paused: true,
            pauseForHelp: true,
            progressItems: [{ label: stuckOn }],
          });
        }
        if (/\/live-view\/[^/]+\/frames\/[^/]+\/?$/.test(path)) {
          return new Response(pngBytes, {
            status: 200,
            headers: { "content-type": "image/png" },
          });
        }
        if (/\/jobs\/[^/]+\/status\/?$/.test(path)) {
          return jsonResponse({
            progressItems: [{ label: stuckOn }],
            paused: true,
            pauseForHelp: true,
          });
        }
        return originalFetch(input, init);
      };
    },
    {
      jobId: JOB_ID,
      stuckOn: STUCK_ON,
      pngBase64: TINY_PNG_BASE64,
    },
  );

  const fulfillApi = async (route: Route): Promise<void> => {
    const url = new URL(route.request().url());
    const cors = corsHeadersBecauseCrossOriginApi();
    if (route.request().method() === "OPTIONS") {
      await route.fulfill({ status: 204, headers: cors, body: "" });
      return;
    }
    if (/\/live-view\/?$/.test(url.pathname) && url.searchParams.has("token")) {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        headers: cors,
        body: JSON.stringify({
          liveViewUrl: "https://live.pack.test/view",
          merchantHost: "shop.example.test",
          jobId: JOB_ID,
          expiresAtMs: Date.now() + 3_600_000,
        }),
      });
      return;
    }
    if (/\/live-view\/[^/]+\/latest\/?$/.test(url.pathname)) {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        headers: cors,
        body: JSON.stringify({
          seq: 1,
          ts: Date.now(),
          url: `data:image/png;base64,${TINY_PNG_BASE64}`,
          paused: true,
          pauseForHelp: true,
          progressItems: [{ label: STUCK_ON }],
        }),
      });
      return;
    }
    if (/\/live-view\/[^/]+\/frames\/[^/]+\/?$/.test(url.pathname)) {
      await route.fulfill({
        status: 200,
        contentType: "image/png",
        headers: cors,
        body: TINY_PNG_BYTES,
      });
      return;
    }
    if (/\/jobs\/[^/]+\/status\/?$/.test(url.pathname)) {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        headers: cors,
        body: JSON.stringify({
          progressItems: [{ label: STUCK_ON }],
          paused: true,
          pauseForHelp: true,
        }),
      });
      return;
    }
    await route.continue();
  };

  await page.route("https://api.itsdoneai.com/**", fulfillApi);
  await page.route("https://api.trypackai.com/**", fulfillApi);
}

function pageTextIsOnlyGenericWaiting(bodyText: string): boolean {
  const collapsed = bodyText.replace(/\s+/g, " ").trim();
  if (!/waiting…/i.test(collapsed)) {
    return false;
  }
  if (collapsed.includes(STUCK_ON)) {
    return false;
  }
  return true;
}

test.describe("job live-view stuck context", () => {
  test.beforeEach(({}, testInfo) => {
    test.skip(
      testInfo.project.name !== "chromium-mobile",
      "phone Pixel 7 live-view only",
    );
  });

  test("phone live-view shows frames and names the needs_input stuck-on", async ({
    page,
  }) => {
    mkdirSync(SHOT_DIR, { recursive: true });
    await seedTrackingConsentBeforeLoad(page);
    await mockLiveViewJobApis(page);

    await page.goto(`/live-view?token=${TOKEN}`, {
      waitUntil: "domcontentloaded",
    });
    await dismissConsentBannerIfVisible(page);

    const frame = page.getByRole("img", { name: FRAME_ALT });
    await expect(frame).toHaveCount(1);
    await expect(frame).toBeVisible();
    await expect
      .poll(async () =>
        frame.evaluate((el) => {
          if (!(el instanceof HTMLImageElement)) {
            return 0;
          }
          return el.naturalWidth;
        }),
      )
      .toBeGreaterThan(0);

    await expect(
      page.getByRole("heading", { name: EXPIRED_HEADING }),
    ).toHaveCount(0);

    await expect(page.getByText(STUCK_ON)).toBeVisible();

    const bodyText = await page.locator("body").innerText();
    expect(bodyText).toContain(STUCK_ON);
    expect(pageTextIsOnlyGenericWaiting(bodyText)).toBe(false);

    const framesShot = path.join(SHOT_DIR, "frames-visible.png");
    const needsInputShot = path.join(SHOT_DIR, "needs-input-visible.png");
    await frame.screenshot({ path: framesShot });
    await page.screenshot({ path: needsInputShot, fullPage: true });
    process.stdout.write(`photos: ${framesShot}\n`);
    process.stdout.write(`photos: ${needsInputShot}\n`);
  });
});
