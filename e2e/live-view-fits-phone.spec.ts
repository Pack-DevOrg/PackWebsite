import path from "node:path";

import { expect, test } from "@playwright/test";

/**
 * The SMS live-view link on an iPhone 15 (393x852): the whole remote screen
 * and "Pack is controlling" are on screen together, and the page never scrolls.
 * The API and the Cloudflare viewer are stubbed; the viewer stub has the real
 * viewer's shape (49 px nav bar, 15 px padding, 393x659 remote page).
 */
const SHORT_ID = "e2eFitPhone";
const VIEWER_URL =
  "https://live.browser.run/ui/view?mode=tab&wss=live.browser.run/api/devtools/browser/e2e/page/e2e?jwt=SYNTHETIC";
const SHOT_DIR = path.join(process.cwd(), "test-results", "live-view-fits-phone");

const VIEWER_STUB_HTML = `<!doctype html><html><head><meta name="viewport" content="width=device-width, initial-scale=1.0" />
<style>
*{box-sizing:border-box;margin:0}
body{overflow:hidden;height:100vh;display:flex;flex-direction:column;background:#1a1a1a;font-family:-apple-system,sans-serif}
.nav{height:49px;flex:none;display:flex;align-items:center;padding:8px 12px;background:#2d2d2d;color:#ccc;font-size:14px}
.vp{flex:1;display:flex;align-items:center;justify-content:center;padding:15px}
.screen{flex:none;width:393px;height:659px;background:#fff;display:flex;flex-direction:column;justify-content:space-between}
.screen p{padding:12px;font-size:16px;color:#000;background:#e6f2e6}
</style></head><body>
<div class="nav">www.ubereats.com/login</div>
<div class="vp"><div class="screen"><p id="remote-top">Remote top: Log in to Uber Eats</p><p id="remote-bottom">Remote bottom: Continue</p></div></div>
</body></html>`;

test.use({
  viewport: { width: 393, height: 852 },
  deviceScaleFactor: 3,
  isMobile: true,
  hasTouch: true,
});

test("the /lv link fits an iPhone 15: whole remote screen and the control toggle visible, no page scroll", async ({ page }) => {
  await page.addInitScript(
    ({ shortId, viewerUrl }) => {
      window.localStorage.setItem("tracking-consent", "granted");
      window.localStorage.setItem("tracking-consent-timestamp", Date.now().toString());
      // A signed-in owner (synthetic tokens; the API below is stubbed).
      window.sessionStorage.setItem(
        "pack.auth.session.v1",
        JSON.stringify({
          tokens: {
            accessToken: "synthetic-access",
            refreshToken: "synthetic-refresh",
            idToken: "synthetic-id",
            accessTokenExpiresAt: Date.now() + 3_600_000,
          },
        }),
      );
      const originalFetch = window.fetch.bind(window);
      window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
        const raw = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;
        const parsed = new URL(raw, window.location.origin);
        if (parsed.origin !== window.location.origin && /\/live-view\/?$/.test(parsed.pathname)) {
          if (parsed.searchParams.get("lv") !== shortId) {
            return new Response("{}", { status: 404 });
          }
          return new Response(
            JSON.stringify({
              success: true,
              data: {
                liveViewUrl: viewerUrl,
                merchantHost: "www.ubereats.com",
                jobId: "job-e2e-fit",
                expiresAtMs: Date.now() + 3_600_000,
              },
            }),
            { status: 200, headers: { "content-type": "application/json" } },
          );
        }
        return originalFetch(input, init);
      };
    },
    { shortId: SHORT_ID, viewerUrl: VIEWER_URL },
  );
  await page.route("https://live.browser.run/**", (route) =>
    route.fulfill({ status: 200, contentType: "text/html", body: VIEWER_STUB_HTML }),
  );

  await page.goto(`/lv/${SHORT_ID}`);

  const instruction = page.getByRole("heading", { name: "Tap and type here to log in, then tap Done" });
  const done = page.getByRole("button", { name: "Pack is controlling" });
  const viewer = page.getByTitle("Merchant checkout live view");
  await expect(instruction).toBeInViewport({ ratio: 1 });
  await expect(done).toBeInViewport({ ratio: 1 });
  await expect(viewer).toBeInViewport({ ratio: 1 });

  const remote = page.frameLocator('iframe[title="Merchant checkout live view"]');
  await expect(remote.locator("#remote-top")).toBeVisible();
  await expect(remote.locator("#remote-bottom")).toBeVisible();

  const box = await viewer.boundingBox();
  const doneBox = await done.boundingBox();
  expect(box).not.toBeNull();
  expect(doneBox).not.toBeNull();
  // Viewer (scaled) ends above Done; both inside the phone.
  expect(box!.y + box!.height).toBeLessThanOrEqual(doneBox!.y);
  expect(box!.x).toBeGreaterThanOrEqual(0);
  expect(box!.x + box!.width).toBeLessThanOrEqual(393);
  expect(doneBox!.y + doneBox!.height).toBeLessThanOrEqual(852);

  const scroll = await page.evaluate(() => ({
    scrollHeight: document.scrollingElement?.scrollHeight ?? 0,
    innerHeight: window.innerHeight,
  }));
  expect(scroll.scrollHeight).toBeLessThanOrEqual(scroll.innerHeight);

  await page.screenshot({ path: path.join(SHOT_DIR, "iphone15-lv.png") });
});
