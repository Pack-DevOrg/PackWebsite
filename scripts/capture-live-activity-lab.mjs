import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";

import { chromium } from "playwright";

const DEFAULT_URL = "http://localhost:5173/labs/live-activities?capture=1";
const DEFAULT_OUTPUT_DIR = path.resolve(process.cwd(), "artifacts/live-activity-lab");

function sanitizeFileSegment(value) {
  return value.replace(/[^a-z0-9-_]+/gi, "-").replace(/-+/g, "-").replace(/^-|-$/g, "").toLowerCase();
}

async function ensureDir(dirPath) {
  await fs.mkdir(dirPath, { recursive: true });
}

async function captureLocatorClip(page, selector, outputPath) {
  let lastError = null;

  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      const locator = page.locator(selector).first();
      await locator.waitFor({ state: "visible", timeout: 5_000 });
      await locator.scrollIntoViewIfNeeded();
      await page.waitForTimeout(100);
      await locator.screenshot({
        path: outputPath,
      });
      return;
    } catch (error) {
      lastError = error;
      await page.waitForTimeout(100);
    }
  }

  throw lastError;
}

async function captureStateSurfaces(page, outputDir) {
  const stateCards = page.locator("[data-state-key]");
  const stateCount = await stateCards.count();

  if (stateCount === 0) {
    throw new Error(
      "Live Activity capture page rendered zero [data-state-key] cards. Capture mode is broken."
    );
  }

  const stateKeys = [];
  for (let index = 0; index < stateCount; index += 1) {
    const stateKey = await stateCards.nth(index).getAttribute("data-state-key");
    if (stateKey) {
      stateKeys.push(stateKey);
    }
  }

  for (const stateKey of stateKeys) {
    const stateCard = page.locator(`[data-state-key="${stateKey}"]`).first();
    await stateCard.waitFor({ state: "visible", timeout: 15_000 });

    const stateDir = path.join(outputDir, sanitizeFileSegment(stateKey));
    await ensureDir(stateDir);

    await captureLocatorClip(
      page,
      `[data-state-key="${stateKey}"]`,
      path.join(stateDir, "state-card.png"),
    );

    const surfaces = [
      { selector: '[data-capture-target="lock-screen-raw"]', fileName: "lock-screen.png" },
      { selector: '[data-capture-target="dynamic-island-expanded-raw"]', fileName: "dynamic-island-expanded.png" },
      { selector: '[data-capture-target="dynamic-island-compact-raw"]', fileName: "dynamic-island-compact.png" },
      { selector: '[data-capture-target="dynamic-island-minimal-raw"]', fileName: "dynamic-island-minimal.png" },
      { selector: '[data-capture-target="watch-small-raw"]', fileName: "watch-small.png" },
    ];

    for (const surface of surfaces) {
      await captureLocatorClip(
        page,
        `[data-state-key="${stateKey}"] ${surface.selector}`,
        path.join(stateDir, surface.fileName),
      );
    }
  }
}

async function main() {
  const targetUrl = process.env.LIVE_ACTIVITY_LAB_URL ?? DEFAULT_URL;
  const outputDir = path.resolve(
    process.cwd(),
    process.env.LIVE_ACTIVITY_LAB_OUTPUT_DIR ?? DEFAULT_OUTPUT_DIR,
  );

  await ensureDir(outputDir);

  const browser = await chromium.launch({ headless: true });

  try {
    const page = await browser.newPage({
      viewport: { width: 1720, height: 2800 },
      deviceScaleFactor: 2,
    });

    await page.addInitScript(() => {
      try {
        window.localStorage.setItem("tracking-consent", "granted");
        window.localStorage.setItem("tracking-consent-timestamp", String(Date.now()));
      } catch {}

      document.cookie = "tracking-consent=granted; path=/";
      document.cookie = `tracking-consent-timestamp=${Date.now()}; path=/`;
    });

    await page.goto(targetUrl, { waitUntil: "networkidle", timeout: 60_000 });
    await page.locator('h1:text("Live Activity State Mockups")').waitFor({
      timeout: 15_000,
    });

    await page
      .locator('[data-testid="consent-banner"]')
      .evaluateAll((elements) => {
        for (const element of elements) {
          if (element instanceof HTMLElement) {
            element.style.display = "none";
            element.setAttribute("aria-hidden", "true");
          }
        }
      })
      .catch(() => {});

    await page.screenshot({
      path: path.join(outputDir, "full-page.png"),
      fullPage: true,
    });

    await captureStateSurfaces(page, outputDir);

    process.stdout.write(
      `Captured live activity lab images to ${outputDir}\n`,
    );
  } finally {
    await browser.close();
  }
}

main().catch((error) => {
  process.stderr.write(`${error instanceof Error ? error.stack ?? error.message : String(error)}\n`);
  process.exitCode = 1;
});
