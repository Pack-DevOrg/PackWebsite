import { readFileSync } from "node:fs";
import path from "node:path";
import {
  expect,
  test,
  type BrowserContext,
  type Page,
} from "@playwright/test";

import { dismissConsentBannerIfVisible } from "./helpers";

type SharedStep = {
  readonly step: string;
  readonly golden?: string;
  readonly title?: string;
  readonly cta?: string;
  readonly pages?: ReadonlyArray<{
    readonly golden: string;
    readonly title: string;
    readonly cta: string;
  }>;
};

type GoldenManifest = {
  readonly shared: readonly SharedStep[];
  readonly verify: {
    readonly step: string;
    readonly title: string;
    readonly ctaMobile: string;
    readonly ctaDesktop: string;
  };
};

const MANIFEST_PATH = path.join(
  process.cwd(),
  "e2e",
  "onboard-golden-parity.manifest.json",
);
const PACK_VERIFY_E164 = "+13054392989";

const MANIFEST = JSON.parse(
  readFileSync(MANIFEST_PATH, "utf8"),
) as GoldenManifest;

function sharedStep(name: string): SharedStep {
  const found = MANIFEST.shared.find((entry) => entry.step === name);
  if (found === undefined) {
    throw new Error(`manifest missing shared step ${name}`);
  }
  return found;
}

function e2eJwt(): string {
  const header = Buffer.from(
    JSON.stringify({ alg: "none", typ: "JWT" }),
  ).toString("base64url");
  const payload = Buffer.from(
    JSON.stringify({ sub: "e2e-user", exp: 9999999999 }),
  ).toString("base64url");
  return `${header}.${payload}.e2e`;
}

function e2eSessionJson(): string {
  const jwt = e2eJwt();
  const issuedAt = Date.now();
  return JSON.stringify({
    tokens: {
      accessToken: jwt,
      idToken: jwt,
      refreshToken: "e2e-refresh",
      tokenType: "Bearer",
      issuedAt,
      accessTokenExpiresAt: issuedAt + 60 * 60 * 1000,
    },
  });
}

async function injectAuthenticatedSession(
  target: Page | BrowserContext,
  sessionJson = e2eSessionJson(),
): Promise<void> {
  await target.addInitScript((raw: string) => {
    window.sessionStorage.setItem("pack.auth.session.v1", raw);
  }, sessionJson);
}

async function stubPhoneVerificationMint(page: Page): Promise<void> {
  const mintBody = {
    code: "A1b2C3d4E5",
    smsHref: `sms:${PACK_VERIFY_E164}?body=A1b2C3d4E5`,
    expiresAt: Date.now() + 60_000,
  };
  await page.route(
    "**/user/information/phone-verification/start",
    async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(mintBody),
      });
    },
  );
  await page.route(
    "**/user/information/phone-verification/check",
    async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ status: "pending" }),
      });
    },
  );
}

async function openOnboard(page: Page): Promise<void> {
  await page.goto("/onboard", { waitUntil: "domcontentloaded" });
  await dismissConsentBannerIfVisible(page);
  await page.locator("h1, h2").first().waitFor({ timeout: 45_000 });
  await page.evaluate(() => document.fonts.ready).catch(() => undefined);
}

async function assertManifestCopy(
  page: Page,
  title: string,
  cta: string,
): Promise<void> {
  await expect(page.getByRole("heading", { name: title })).toBeVisible({
    timeout: 45_000,
  });
  const button = page.getByRole("button", { name: cta });
  const link = page.getByRole("link", { name: cta });
  await expect(button.or(link).first()).toBeVisible();
}

async function snapshotStep(page: Page, step: string): Promise<void> {
  await expect(page).toHaveScreenshot(`${step}.png`, {
    fullPage: true,
    animations: "disabled",
  });
}

async function headingVisible(page: Page, name: string): Promise<boolean> {
  return page
    .getByRole("heading", { name })
    .first()
    .isVisible()
    .catch(() => false);
}

async function clickIfVisible(
  page: Page,
  name: RegExp | string,
): Promise<boolean> {
  const button = page.getByRole("button", { name });
  if (await button.first().isVisible().catch(() => false)) {
    await button.first().click();
    return true;
  }
  return false;
}

async function assertVerifyIfOnScreen(
  page: Page,
  isMobile: boolean,
): Promise<void> {
  const verify = MANIFEST.verify;
  if (!(await headingVisible(page, verify.title))) {
    return;
  }
  await expect(
    page.getByRole("heading", { name: verify.title }),
  ).toBeVisible();
  if (isMobile) {
    const sms = page.getByRole("link", { name: verify.ctaMobile });
    await expect(sms.first()).toBeVisible();
    await expect(sms.first()).toHaveAttribute(
      "href",
      new RegExp(`sms:.*${PACK_VERIFY_E164.replace("+", "\\+")}`),
    );
  } else {
    const qr = page
      .getByTestId("verify-phone-qr")
      .or(page.getByRole("img", { name: verify.ctaDesktop }));
    await expect(qr.first()).toBeVisible();
  }
  await snapshotStep(page, "verify");
  await clickIfVisible(page, /^Skip for now$/);
  await clickIfVisible(page, /^Skip$/);
}

async function assertWhatPackDoesIfOnScreen(page: Page): Promise<void> {
  const whatPackDoes = sharedStep("what-pack-does");
  const pages = whatPackDoes.pages ?? [];
  if (pages.length === 0) {
    throw new Error("manifest what-pack-does has no pages");
  }
  if (!(await headingVisible(page, pages[0].title))) {
    return;
  }
  for (const [index, packPage] of pages.entries()) {
    await assertManifestCopy(page, packPage.title, packPage.cta);
    await snapshotStep(page, `what-pack-does-${index + 1}`);
    await page.getByRole("button", { name: packPage.cta }).click();
  }
}

async function skipNonSharedTowardWelcome(
  page: Page,
  welcomeTitle: string,
): Promise<void> {
  for (let attempt = 0; attempt < 8; attempt += 1) {
    if (await headingVisible(page, welcomeTitle)) {
      return;
    }
    const skippedPhotos = await clickIfVisible(
      page,
      "Skip connecting Photos for now",
    );
    if (skippedPhotos) {
      continue;
    }
    const skippedNow = await clickIfVisible(page, /^Not now$/);
    if (skippedNow) {
      continue;
    }
    const skipped = await clickIfVisible(page, /^Skip for now$/);
    if (skipped) {
      continue;
    }
    const skipExact = await clickIfVisible(page, /^Skip$/);
    if (skipExact) {
      continue;
    }
    const continued = await clickIfVisible(page, /^Continue$/);
    if (continued) {
      continue;
    }
    return;
  }
}

test.describe("Onboard golden parity logged-out signup", () => {
  test.use({ storageState: { cookies: [], origins: [] } });
  test.setTimeout(120_000);

  test("signup heading and CTA match C1 golden manifest", async ({ page }) => {
    await openOnboard(page);
    const signup = sharedStep("signup");
    await assertManifestCopy(page, signup.title ?? "", signup.cta ?? "");
    await snapshotStep(page, "signup");
  });
});

test.describe("Onboard golden parity authenticated G order", () => {
  test.setTimeout(180_000);

  test("shared steps and verify web goldens match manifest", async ({
    page,
    context,
  }, testInfo) => {
    const isMobile = testInfo.project.name === "chromium-mobile";
    const sessionJson = e2eSessionJson();
    await injectAuthenticatedSession(context, sessionJson);
    await injectAuthenticatedSession(page, sessionJson);
    await stubPhoneVerificationMint(page);
    await openOnboard(page);

    const signup = sharedStep("signup");
    const connections = sharedStep("connections");
    const welcome = sharedStep("welcome");
    const whatPackDoes = sharedStep("what-pack-does");
    const firstPackTitle = whatPackDoes.pages?.[0]?.title ?? "Past";

    const postAuthLanding = page
      .getByRole("heading", { name: connections.title ?? "Connections" })
      .or(page.getByRole("heading", { name: welcome.title ?? "" }))
      .or(page.getByRole("heading", { name: firstPackTitle }))
      .or(page.getByRole("heading", { name: MANIFEST.verify.title }));

    const googleCta = page.getByRole("button", { name: signup.cta ?? "" });
    const stillOnSignup = async (): Promise<boolean> =>
      (await headingVisible(page, signup.title ?? "")) &&
      (await googleCta.first().isVisible().catch(() => false));

    if (!(await postAuthLanding.first().isVisible().catch(() => false))) {
      await page.evaluate((raw: string) => {
        window.sessionStorage.setItem("pack.auth.session.v1", raw);
      }, sessionJson);
      await page.reload({ waitUntil: "domcontentloaded" });
      await dismissConsentBannerIfVisible(page);
      await page.locator("h1, h2").first().waitFor({ timeout: 45_000 });
    }

    await expect(postAuthLanding.first()).toBeVisible({ timeout: 45_000 });

    if (await stillOnSignup()) {
      expect(
        false,
        "authenticated walk still on signup; reuse B JWT session inject",
      ).toBe(true);
    }

    await assertWhatPackDoesIfOnScreen(page);
    await assertVerifyIfOnScreen(page, isMobile);

    await page
      .getByRole("heading", { name: connections.title ?? "Connections" })
      .or(page.getByRole("heading", { name: welcome.title ?? "" }))
      .first()
      .waitFor({ state: "visible", timeout: 15_000 })
      .catch(() => undefined);

    if (await headingVisible(page, connections.title ?? "Connections")) {
      await assertManifestCopy(
        page,
        connections.title ?? "",
        connections.cta ?? "",
      );
      await snapshotStep(page, "connections");
      await clickIfVisible(page, connections.cta ?? "Skip for now");
    }

    await skipNonSharedTowardWelcome(page, welcome.title ?? "");

    if (await headingVisible(page, welcome.title ?? "")) {
      await assertManifestCopy(page, welcome.title ?? "", welcome.cta ?? "");
      await snapshotStep(page, "welcome");
    }
  });
});
