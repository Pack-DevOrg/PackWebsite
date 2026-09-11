import { existsSync, readFileSync } from "node:fs";
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

const AUTH_DIR = path.join(process.cwd(), "test-results", "e2e-auth");
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

function authStatePath(projectName: string): string {
  return path.join(AUTH_DIR, `${projectName}.json`);
}

function sessionDumpPath(projectName: string): string {
  return path.join(AUTH_DIR, `${projectName}.session.json`);
}

async function restoreSessionStorage(
  page: Page,
  projectName: string,
): Promise<void> {
  const dumpFile = sessionDumpPath(projectName);
  if (!existsSync(dumpFile)) {
    return;
  }
  const raw = readFileSync(dumpFile, "utf8");
  const entries = JSON.parse(raw) as Record<string, string>;
  await page.addInitScript((data: Record<string, string>) => {
    for (const [key, value] of Object.entries(data)) {
      window.sessionStorage.setItem(key, value);
    }
  }, entries);
}

async function restoreStorageState(
  page: Page,
  context: BrowserContext,
  projectName: string,
): Promise<void> {
  const storageFile = authStatePath(projectName);
  if (existsSync(storageFile)) {
    const stored = JSON.parse(readFileSync(storageFile, "utf8")) as {
      cookies?: Parameters<BrowserContext["addCookies"]>[0];
    };
    if (stored.cookies && stored.cookies.length > 0) {
      await context.addCookies(stored.cookies);
    }
  }
  await restoreSessionStorage(page, projectName);
}

async function openOnboard(page: Page): Promise<void> {
  await page.goto("/onboard", { waitUntil: "domcontentloaded" });
  await dismissConsentBannerIfVisible(page);
  await page.locator("h1, h2").first().waitFor({ timeout: 45_000 });
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

async function clickIfVisible(
  page: Page,
  name: RegExp | string,
): Promise<void> {
  const button = page.getByRole("button", { name });
  if (await button.first().isVisible().catch(() => false)) {
    await button.first().click();
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
    const projectName = testInfo.project.name;
    const isMobile = projectName === "chromium-mobile";
    await restoreStorageState(page, context, projectName);
    await openOnboard(page);

    const signup = sharedStep("signup");
    const stillOnSignup = await page
      .getByRole("heading", { name: signup.title ?? "" })
      .isVisible()
      .catch(() => false);
    if (stillOnSignup) {
      expect(
        false,
        "authenticated walk still on signup; reuse B storageState (do not fork auth)",
      ).toBe(true);
    }

    const whatPackDoes = sharedStep("what-pack-does");
    const pages = whatPackDoes.pages ?? [];
    if (pages.length === 0) {
      throw new Error("manifest what-pack-does has no pages");
    }

    for (const [index, packPage] of pages.entries()) {
      await assertManifestCopy(page, packPage.title, packPage.cta);
      await snapshotStep(page, `what-pack-does-${index + 1}`);
      if (index < pages.length - 1) {
        await page.getByRole("button", { name: packPage.cta }).click();
      }
    }
    await clickIfVisible(page, /^Continue$/);
    await clickIfVisible(page, /^Skip$/);

    const verify = MANIFEST.verify;
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

    const connections = sharedStep("connections");
    await assertManifestCopy(
      page,
      connections.title ?? "",
      connections.cta ?? "",
    );
    await snapshotStep(page, "connections");
    await clickIfVisible(page, connections.cta ?? "Skip for now");

    const welcome = sharedStep("welcome");
    await assertManifestCopy(page, welcome.title ?? "", welcome.cta ?? "");
    await snapshotStep(page, "welcome");
  });
});
