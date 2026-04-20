import fs from "node:fs/promises";
import path from "node:path";
import {fileURLToPath} from "node:url";
import {chromium} from "playwright";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");
const outputDir = path.join(projectRoot, "public", "images", "hero-captures");
const baseUrl = process.env.HERO_CAPTURE_BASE_URL ?? "http://127.0.0.1:4173";
const captureVariant = process.env.HERO_CAPTURE_VARIANT ?? "desktop";
const CONSENT_COOKIE_MAX_AGE_SECONDS = 180 * 24 * 60 * 60;
const consentPreferences = JSON.stringify({
  analytics: true,
  marketing: true,
  functional: true,
});

const screenDefinitionsByVariant = {
  desktop: [
    {chapterKey: "plan", contentKey: "outline", fileName: "plan-still.png"},
    {chapterKey: "search", contentKey: "search", fileName: "search-still.png"},
    {chapterKey: "booking", contentKey: "booking", fileName: "booking-still.png"},
    {chapterKey: "stats", contentKey: "footprint", fileName: "stats-still.png"},
  ],
  mobileOutline: [
    {chapterKey: "plan", contentKey: "outline", fileName: "plan-mobile.png"},
  ],
};

const screenDefinitions = screenDefinitionsByVariant[captureVariant];

if (!screenDefinitions) {
  throw new Error(`Unsupported HERO_CAPTURE_VARIANT "${captureVariant}".`);
}

const viewportByVariant = {
  desktop: {width: 1440, height: 2200},
  mobileOutline: {width: 390, height: 844},
};

const pageUrlByVariant = {
  desktop: `${baseUrl}/?hero-capture=live-outline-desktop#journey-screen-plan`,
  mobileOutline: `${baseUrl}/?hero-capture=live-outline-mobile#journey`,
};

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

    const previousClone = document.getElementById("__hero-capture-clone");
    if (previousClone) {
      previousClone.remove();
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

    const rect = content.getBoundingClientRect();
    const cloneHost = document.createElement("div");
    cloneHost.id = "__hero-capture-clone";
    cloneHost.style.position = "absolute";
    cloneHost.style.left = "0";
    cloneHost.style.top = "0";
    cloneHost.style.zIndex = "2147483647";
    cloneHost.style.width = `${Math.ceil(rect.width)}px`;
    cloneHost.style.padding = "0";
    cloneHost.style.margin = "0";
    cloneHost.style.background = "#121212";
    cloneHost.style.pointerEvents = "none";

    const clone = content.cloneNode(true);
    if (!(clone instanceof HTMLElement)) {
      throw new Error(`Unable to clone capture content for screen "${screen}".`);
    }

    clone.removeAttribute("id");
    clone.style.transform = "none";
    clone.style.paddingBottom = "0px";
    clone.style.minHeight = "auto";
    clone.style.willChange = "auto";

    clone.querySelectorAll("*").forEach((node) => {
      if (!(node instanceof HTMLElement)) {
        return;
      }

      if (node.dataset.heroScroll === "true") {
        node.style.overflow = "visible";
        node.style.overflowY = "visible";
        node.style.minHeight = "auto";
        node.style.height = "auto";
      }

      if (node.dataset.heroPhoneInner === screen) {
        node.style.height = "auto";
        node.style.overflow = "visible";
        node.style.gridTemplateRows = "auto auto auto auto";
      }

      if (node.dataset.heroScreenContent === screen) {
        node.style.transform = "none";
        node.style.paddingBottom = "0px";
        node.style.minHeight = "auto";
        node.style.willChange = "auto";
      }
    });

    clone.id = "__hero-capture-target";
    cloneHost.appendChild(clone);
    document.body.appendChild(cloneHost);
  }, {screen: contentKey});
};

const main = async () => {
  await fs.mkdir(outputDir, {recursive: true});

  const browser = await chromium.launch({headless: true});
  const page = await browser.newPage({
    viewport: viewportByVariant[captureVariant],
    deviceScaleFactor: 2,
    isMobile: captureVariant === "mobileOutline",
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

  await page.goto(pageUrlByVariant[captureVariant], {waitUntil: "networkidle"});
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
