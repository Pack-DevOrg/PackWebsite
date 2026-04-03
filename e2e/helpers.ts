import { expect, Page } from "playwright/test";

const withStablePage = async <T>(
  page: Page,
  action: () => Promise<T>,
): Promise<T> => {
  try {
    return await action();
  } catch (error) {
    if (
      error instanceof Error &&
      /Execution context was destroyed|Target page, context or browser has been closed/i.test(
        error.message,
      )
    ) {
      await page.waitForLoadState("domcontentloaded");
      return action();
    }
    throw error;
  }
};

export const dismissConsentBannerIfVisible = async (page: Page): Promise<void> => {
  const rejectAllButton = page.getByRole("button", { name: /reject all/i });
  if (await rejectAllButton.isVisible().catch(() => false)) {
    await rejectAllButton.click();
  }
};

const updateTrackingConsent = async (
  page: Page,
  update: () => void,
): Promise<void> => {
  await page.waitForLoadState("domcontentloaded");

  try {
    await page.evaluate(update);
  } catch (error) {
    if (
      error instanceof Error &&
      /Execution context was destroyed/i.test(error.message)
    ) {
      await page.waitForLoadState("domcontentloaded");
      await page.evaluate(update);
      return;
    }

    throw error;
  }
};

export const grantTrackingConsent = async (page: Page): Promise<void> => {
  await updateTrackingConsent(page, () => {
    const timestamp = Date.now().toString();

    window.localStorage.setItem("tracking-consent", "granted");
    window.localStorage.setItem("tracking-consent-timestamp", timestamp);
    window.localStorage.setItem(
      "tracking-preferences",
      JSON.stringify({ analytics: false, functional: true, marketing: true }),
    );

    document.cookie = `tracking-consent=granted; path=/; max-age=${180 * 24 * 60 * 60}; samesite=lax`;
    document.cookie = `tracking-consent-timestamp=${timestamp}; path=/; max-age=${180 * 24 * 60 * 60}; samesite=lax`;
  });
};

export const clearTrackingConsent = async (page: Page): Promise<void> => {
  await updateTrackingConsent(page, () => {
    window.localStorage.removeItem("tracking-consent");
    window.localStorage.removeItem("tracking-consent-timestamp");
    window.localStorage.removeItem("tracking-preferences");

    document.cookie =
      "tracking-consent=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    document.cookie =
      "tracking-consent-timestamp=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
  });
};

export const assertNoHorizontalOverflow = async (page: Page): Promise<void> => {
  await page.waitForLoadState("domcontentloaded");

  const overflow = await withStablePage(page, () =>
    page.evaluate(() => {
      const doc = document.documentElement;
      const body = document.body;
      const maxWidth = Math.max(
        doc.scrollWidth,
        body?.scrollWidth ?? 0,
        doc.offsetWidth,
        body?.offsetWidth ?? 0
      );

      return {
        maxWidth,
        innerWidth: window.innerWidth,
        hasOverflow: maxWidth - window.innerWidth > 2,
      };
    })
  );

  expect(overflow.hasOverflow, `horizontal overflow: ${JSON.stringify(overflow)}`).toBe(false);
};

export const makeE2EEmail = (): string =>
  `e2e+${Date.now()}-${Math.random().toString(36).slice(2, 8)}@doneai-test.invalid`;

export type PrivacyRequestPayload = {
  requestType: string;
  email: string;
  relationship?: string;
  jurisdiction?: string;
  details?: string;
  recaptchaToken?: string;
  source?: string;
};

export const mockPrivacyRequestSubmit = async (
  page: Page,
  responseBody: Record<string, unknown> = {
    success: true,
    data: {
      requestId: "req_e2e_privacy_request",
      requiresVerification: true,
    },
  },
): Promise<{ getPayload: () => PrivacyRequestPayload | null }> => {
  let payload: PrivacyRequestPayload | null = null;

  await page.route("**/privacy/requests", async (route) => {
    const raw = route.request().postData() ?? "{}";
    payload = JSON.parse(raw) as PrivacyRequestPayload;

    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(responseBody),
    });
  });

  return {
    getPayload: () => payload,
  };
};

export const mockPrivacyRequestVerification = async (
  page: Page,
  responseBody: Record<string, unknown> = {
    success: true,
    message: "Your privacy opt-out request has been confirmed and applied.",
    data: {
      requestType: "opt_out",
      message: "Your privacy opt-out request has been confirmed and applied.",
    },
  },
): Promise<void> => {
  await page.route("**/privacy/requests/verify", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(responseBody),
    });
  });
};

export const mockTsaPublicBoard = async (page: Page): Promise<void> => {
  const board = {
    generatedAt: "2026-04-02T12:00:00.000Z",
    refreshIntervalMinutes: 10,
    airports: [
      {
        airportCode: "SFO",
        airportName: "San Francisco International Airport",
        cityName: "San Francisco",
        regionName: "California",
        countryName: "United States",
        latitude: 37.6213,
        longitude: -122.379,
        snapshot: {
          fetchStatus: "available",
          observedAt: "2026-04-02T11:56:00.000Z",
          fetchedAt: "2026-04-02T11:57:00.000Z",
          refreshIntervalMinutes: 10,
          sourceLabel: "public_airport",
          observations: [
            {
              locationDisplayName: "Terminal 3 Checkpoint",
              screeningProgram: "general",
              laneStatus: "open",
              displayWaitText: "12 min",
              exactWaitMinutes: 12,
              terminalDisplayName: "Terminal 3",
              checkpointDisplayName: "Checkpoint",
            },
          ],
          exactWaitMinutes: 12,
        },
      },
      {
        airportCode: "JFK",
        airportName: "John F. Kennedy International Airport",
        cityName: "New York",
        regionName: "New York",
        countryName: "United States",
        latitude: 40.6413,
        longitude: -73.7781,
        snapshot: {
          fetchStatus: "available",
          observedAt: "2026-04-02T11:56:00.000Z",
          fetchedAt: "2026-04-02T11:57:00.000Z",
          refreshIntervalMinutes: 10,
          sourceLabel: "public_airport",
          observations: [
            {
              locationDisplayName: "Terminal 4 Main Checkpoint",
              screeningProgram: "general",
              laneStatus: "open",
              displayWaitText: "18 min",
              exactWaitMinutes: 18,
              terminalDisplayName: "Terminal 4",
              checkpointDisplayName: "Main Checkpoint",
            },
          ],
          exactWaitMinutes: 18,
        },
      },
    ],
  };

  await page.route("**/airport-wait-times/public/current.json", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(board),
    });
  });

  await page.route("**/airport-security/public-current", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        success: true,
        data: board,
      }),
    });
  });
};
