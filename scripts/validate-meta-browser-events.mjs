import { chromium } from 'playwright';

function parseArgs(argv) {
  let url = 'http://localhost:5173/';
  let timeoutMs = 15000;
  let consentMode = 'granted';

  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];

    if (value === '--url') {
      const next = argv[index + 1];
      if (!next) {
        throw new Error('Expected a value after --url');
      }
      url = next;
      index += 1;
      continue;
    }

    if (value === '--timeout-ms') {
      const next = argv[index + 1];
      if (!next || Number.isNaN(Number(next))) {
        throw new Error('Expected a numeric value after --timeout-ms');
      }
      timeoutMs = Number(next);
      index += 1;
      continue;
    }

    if (value === '--consent') {
      const next = argv[index + 1];
      if (!next || !['granted', 'none', 'rejected'].includes(next)) {
        throw new Error('Expected --consent to be one of: granted, none, rejected');
      }
      consentMode = next;
      index += 1;
      continue;
    }

    throw new Error(`Unknown argument: ${value}`);
  }

  return { url, timeoutMs, consentMode };
}

function summarizeMetaRequest(requestUrl) {
  const parsed = new URL(requestUrl);
  return {
    url: parsed.toString(),
    path: parsed.pathname,
    pixelId: parsed.searchParams.get('id') || undefined,
    eventName: parsed.searchParams.get('ev') || undefined,
  };
}

function summarizeGtmRequest(requestUrl) {
  const parsed = new URL(requestUrl);
  return {
    url: parsed.toString(),
    path: parsed.pathname,
    containerId: parsed.searchParams.get('id') || undefined,
  };
}

async function maybeAcceptConsent(page) {
  const acceptButton = page.getByRole('button', { name: 'Accept All' });
  if (await acceptButton.count()) {
    await acceptButton.first().click();
  }
}

async function seedGrantedConsent(page) {
  await page.addInitScript(() => {
    const timestamp = Date.now().toString();
    const preferences = JSON.stringify({
      analytics: true,
      marketing: true,
      functional: true,
    });

    window.localStorage.setItem('tracking-consent', 'granted');
    window.localStorage.setItem('tracking-consent-timestamp', timestamp);
    window.localStorage.setItem('tracking-preferences', preferences);

    document.cookie = `tracking-consent=granted; path=/; max-age=${180 * 24 * 60 * 60}`;
    document.cookie = `tracking-consent-timestamp=${timestamp}; path=/; max-age=${180 * 24 * 60 * 60}`;
  });
}

async function seedRejectedConsent(page) {
  await page.addInitScript(() => {
    const timestamp = Date.now().toString();
    const preferences = JSON.stringify({
      analytics: false,
      marketing: false,
      functional: true,
    });

    window.localStorage.setItem('tracking-consent', 'rejected');
    window.localStorage.setItem('tracking-consent-timestamp', timestamp);
    window.localStorage.setItem('tracking-preferences', preferences);

    document.cookie = `tracking-consent=rejected; path=/; max-age=${180 * 24 * 60 * 60}`;
    document.cookie = `tracking-consent-timestamp=${timestamp}; path=/; max-age=${180 * 24 * 60 * 60}`;
  });
}

async function main() {
  const { url, timeoutMs, consentMode } = parseArgs(process.argv.slice(2));
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  if (consentMode === 'granted') {
    await seedGrantedConsent(page);
  } else if (consentMode === 'rejected') {
    await seedRejectedConsent(page);
  }

  const scriptRequests = [];
  const trackingRequests = [];
  const gtmRequests = [];

  page.on('request', (request) => {
    const requestUrl = request.url();
    if (requestUrl.includes('connect.facebook.net/en_US/fbevents.js')) {
      scriptRequests.push({ url: requestUrl });
      return;
    }

    if (requestUrl.includes('www.googletagmanager.com/gtm.js')) {
      gtmRequests.push(summarizeGtmRequest(requestUrl));
      return;
    }

    if (requestUrl.includes('www.facebook.com/tr')) {
      trackingRequests.push(summarizeMetaRequest(requestUrl));
    }
  });

  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: timeoutMs });
    await maybeAcceptConsent(page);
    await page.waitForTimeout(4000);

    const { fbqLoaded, gtmLoaded } = await page.evaluate(() => ({
      fbqLoaded: Boolean(window.fbq?.loaded),
      gtmLoaded: Boolean(window.google_tag_manager && Object.keys(window.google_tag_manager).length > 0),
    }));
    const result = {
      checkedUrl: url,
      consentMode,
      gtmLoaded,
      fbqLoaded,
      gtmRequests,
      scriptRequests,
      trackingRequests,
    };

    console.log(JSON.stringify(result, null, 2));

    const shouldSeeMetaTraffic = consentMode === 'granted';
    if (shouldSeeMetaTraffic && (!gtmLoaded || gtmRequests.length === 0 || !fbqLoaded || trackingRequests.length === 0)) {
      process.exitCode = 1;
    }

    if (!shouldSeeMetaTraffic && (gtmLoaded || gtmRequests.length > 0 || fbqLoaded || trackingRequests.length > 0)) {
      process.exitCode = 1;
    }
  } finally {
    await browser.close();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
