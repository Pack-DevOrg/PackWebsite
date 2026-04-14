import fs from "node:fs/promises";
import path from "node:path";
import {fileURLToPath} from "node:url";
import {chromium} from "playwright";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");
const outputDir = path.join(projectRoot, "public", "images", "hero-captures");
const baseUrl = process.env.HERO_CAPTURE_BASE_URL ?? "http://127.0.0.1:4173";
const CONSENT_COOKIE_MAX_AGE_SECONDS = 180 * 24 * 60 * 60;
const consentPreferences = JSON.stringify({
  analytics: true,
  marketing: true,
  functional: true,
});

const screenDefinitions = [
  {chapterKey: "plan", contentKey: "outline", fileName: "plan-still.png"},
  {chapterKey: "search", contentKey: "search", fileName: "search-still.png"},
  {chapterKey: "booking", contentKey: "booking", fileName: "booking-still.png"},
  {chapterKey: "stats", contentKey: "footprint", fileName: "stats-still.png"},
];

const wait = (milliseconds) =>
  new Promise((resolve) => setTimeout(resolve, milliseconds));

const removeCaptureOverlays = async (page) => {
  await page.evaluate(() => {
    document.querySelectorAll('[data-testid="consent-banner"]').forEach((element) => {
      element.remove();
    });
  });
};

const waitForChapter = async (page, chapterKey, contentKey) => {
  if (chapterKey !== "plan") {
    await page.locator(`a[href="#journey-screen-${chapterKey}"]`).first().click();
  }

  await page.waitForFunction(
    ({screen}) => {
      const candidates = Array.from(
        document.querySelectorAll(`[data-hero-screen-content="${screen}"]`)
      );
      return candidates.some(
        (element) =>
          element instanceof HTMLElement &&
          element.offsetParent !== null &&
          element.getBoundingClientRect().height > 0
      );
    },
    {screen: contentKey}
  );

  await wait(450);
  await removeCaptureOverlays(page);
};

const exposeCaptureTarget = async (page, contentKey) => {
  await page.evaluate(({screen}) => {
    const contentCandidates = Array.from(
      document.querySelectorAll(`[data-hero-screen-content="${screen}"]`)
    ).filter(
      (element) =>
        element instanceof HTMLElement &&
        element.offsetParent !== null &&
        element.getBoundingClientRect().height > 0
    );

    const content = contentCandidates[0];
    if (!(content instanceof HTMLElement)) {
      throw new Error(`No visible content found for screen "${screen}".`);
    }

    const previousTarget = document.getElementById("__hero-capture-target");
    if (previousTarget) {
      previousTarget.removeAttribute("id");
    }

    const recursiveStill = content.querySelector('img[src*="/images/hero-captures/"]');
    if (recursiveStill instanceof HTMLImageElement) {
      throw new Error(
        `Capture source for "${screen}" is recursive. The page is rendering exported hero stills instead of live showcase markup. Update the capture source before regenerating hero screenshots.`
      );
    }

    content.id = "__hero-capture-target";

    const scroll = content.closest('[data-hero-scroll="true"]');
    const phoneInner = content.closest(`[data-hero-phone-inner="${screen}"]`);
    const phone = content.closest(`[data-hero-phone="${screen}"]`);

    if (scroll instanceof HTMLElement) {
      scroll.style.overflow = "visible";
      scroll.style.overflowY = "visible";
      scroll.style.minHeight = "auto";
      scroll.style.height = "auto";
    }

    if (phoneInner instanceof HTMLElement) {
      phoneInner.style.height = "auto";
      phoneInner.style.overflow = "visible";
      phoneInner.style.gridTemplateRows = "auto auto auto auto";
    }

    if (phone instanceof HTMLElement) {
      phone.style.height = "auto";
      phone.style.minHeight = "auto";
      phone.style.alignSelf = "start";
    }

    content.style.transform = "none";
    content.style.paddingBottom = "0px";
    content.style.minHeight = "auto";
    content.style.willChange = "auto";
  }, {screen: contentKey});
};

const main = async () => {
  await fs.mkdir(outputDir, {recursive: true});

  const browser = await chromium.launch({headless: true});
  const page = await browser.newPage({
    viewport: {width: 1440, height: 2200},
    deviceScaleFactor: 2,
  });

  const consentTimestamp = Date.now().toString();
  await page.addInitScript(
    ({maxAgeSeconds, preferences, timestamp}) => {
      const setCookie = (name, value) => {
        document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${maxAgeSeconds}; SameSite=Lax`;
      };

      window.localStorage.setItem("tracking-consent", "granted");
      window.localStorage.setItem("tracking-consent-timestamp", timestamp);
      window.localStorage.setItem("tracking-preferences", preferences);

      setCookie("tracking-consent", "granted");
      setCookie("tracking-consent-timestamp", timestamp);
    },
    {
      maxAgeSeconds: CONSENT_COOKIE_MAX_AGE_SECONDS,
      preferences: consentPreferences,
      timestamp: consentTimestamp,
    }
  );

  await page.goto(`${baseUrl}/#journey-screen-plan`, {waitUntil: "networkidle"});
  await page.addStyleTag({
    content: `
      *,
      *::before,
      *::after {
        animation: none !important;
        transition: none !important;
        scroll-behavior: auto !important;
      }

      [data-testid="consent-banner"] {
        display: none !important;
        visibility: hidden !important;
        pointer-events: none !important;
      }
    `,
  });

  await page.locator('section').first().waitFor();
  await removeCaptureOverlays(page);

  for (const screen of screenDefinitions) {
    await waitForChapter(page, screen.chapterKey, screen.contentKey);
    await exposeCaptureTarget(page, screen.contentKey);

    const captureTarget = page.locator("#__hero-capture-target");
    await captureTarget.waitFor();
    await captureTarget.screenshot({
      path: path.join(outputDir, screen.fileName),
      type: "png",
    });
  }

  await browser.close();
};

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
