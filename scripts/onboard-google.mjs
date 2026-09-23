import { chromium } from "playwright";
import { pathToFileURL } from "node:url";

import { buildGoogleAccountConnectUrl } from "../src/auth/accountConnect.ts";

export function googleConsentUrl() {
  return buildGoogleAccountConnectUrl({ state: "onboard-google-e2e" });
}

function isDirectCli() {
  const entry = process.argv[1];
  if (typeof entry !== "string" || entry.length === 0) {
    return false;
  }
  return import.meta.url === pathToFileURL(entry).href;
}

export async function reachGoogleConsent(url = googleConsentUrl()) {
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30_000 });
    const landed = page.url();
    if (!landed.includes("accounts.google.com")) {
      throw new Error(`Google consent did not open: ${landed}`);
    }
    return landed;
  } finally {
    await browser.close();
  }
}

if (isDirectCli()) {
  const landed = await reachGoogleConsent();
  process.stdout.write(`${landed}\n`);
}
