// Automated web screenshot capture for compliance evidence.
// Usage: npm run capture:screens:web

import { mkdir } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { chromium } from 'playwright';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const OUTPUT_DIR = path.resolve(__dirname, '..', 'evidence', 'screenshots', 'web');
const TIMESTAMP = new Date().toISOString().replace(/[:.]/g, '-');

const PAGES = [
  {
    name: 'home',
    url: 'https://www.trypackai.com/',
    waitFor: '#booking-preview',
  },
  {
    name: 'booking-preview',
    url: 'https://www.trypackai.com/#booking-preview',
    waitFor: '#booking-preview',
  },
];

async function ensureOutputDir() {
  await mkdir(OUTPUT_DIR, { recursive: true });
}

async function captureScreenshots() {
  await ensureOutputDir();
  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2,
  });

  for (const pageConfig of PAGES) {
    const page = await context.newPage();
    const { url, name, waitFor } = pageConfig;
    console.log(`Navigating to ${url}`);
    await page.goto(url, { waitUntil: 'networkidle' });
    if (waitFor) {
      await page.waitForSelector(waitFor, { timeout: 10000 }).catch(() => {
        console.warn(`Warning: selector "${waitFor}" not found on ${url}`);
      });
    }
    const screenshotPath = path.join(OUTPUT_DIR, `${TIMESTAMP}-${name}.png`);
    await page.screenshot({ path: screenshotPath, fullPage: true });
    console.log(`Saved screenshot: ${screenshotPath}`);
    await page.close();
  }

  await context.close();
  await browser.close();
  console.log('Screenshot capture complete.');
}

captureScreenshots().catch(error => {
  console.error('Failed to capture screenshots:', error);
  process.exitCode = 1;
});
