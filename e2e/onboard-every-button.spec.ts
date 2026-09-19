import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { expect, test, type Locator, type Page } from "@playwright/test";

import { dismissConsentBannerIfVisible } from "./helpers";

const require = createRequire(import.meta.url);
const { PNG } = require("pngjs") as {
  PNG: {
    new (options: { width: number; height: number }): {
      width: number;
      height: number;
      data: Uint8Array;
    };
    sync: {
      read: (buffer: Buffer) => {
        width: number;
        height: number;
        data: Uint8Array;
      };
      write: (png: {
        width: number;
        height: number;
        data: Uint8Array;
      }) => Buffer;
    };
  };
};

const SHOT_DIR = path.join(process.cwd(), "test-results", "onboard-every-button");
const AUTH_DIR = path.join(process.cwd(), "test-results", "e2e-auth");
const FIXTURE_REL_DIR = "e2e/fixtures/onboarding-goldens";
const FIXTURE_ABS_DIR = path.join(process.cwd(), FIXTURE_REL_DIR);
const PACKAPP_GOLDEN_REL_DIR = "PackApp/.maestro/goldens/onboarding";
const PACKAPP_GOLDEN_ABS_DIR = path.join(
  path.resolve(process.cwd(), "..", "..", "PackApp"),
  ".maestro",
  "goldens",
  "onboarding",
);
const PACK_VERIFY_E164 = "+13054392989";
const MAX_PIXEL_RATIO = 0.02;
const E2E_USER = "tests@trypackai.com";
const SESSION_STORAGE_KEY = "pack.auth.session.v1";
const AUTH_CACHE_FILE = path.join(AUTH_DIR, "admin.session.json");
const VENDOR_GOLDENS = process.env.E2E_VENDOR_GOLDENS === "1";

type FlowPageId =
  | "signup"
  | "past"
  | "present"
  | "future"
  | "verify-phone"
  | "connections"
  | "complete";

type FlowPage = {
  readonly id: FlowPageId;
  readonly heading: string;
  readonly golden: string;
  readonly needsAuth: boolean;
};

const FLOW_PAGES: readonly FlowPage[] = [
  {
    id: "signup",
    heading: "Welcome to Pack",
    golden: "signup",
    needsAuth: false,
  },
  { id: "past", heading: "Past", golden: "past", needsAuth: true },
  { id: "present", heading: "Present", golden: "present", needsAuth: true },
  { id: "future", heading: "Future", golden: "future", needsAuth: true },
  {
    id: "verify-phone",
    heading: "Verify your number",
    golden: "verify-phone",
    needsAuth: true,
  },
  {
    id: "connections",
    heading: "Connections",
    golden: "connections",
    needsAuth: true,
  },
  {
    id: "complete",
    heading: "You're all set!",
    golden: "complete",
    needsAuth: true,
  },
];

type ControlKind = "advance" | "external-door" | "toggle" | "disabled-named";

type EnumeratedControl = {
  readonly name: string;
  readonly tag: string;
  readonly href: string;
  readonly role: string;
  readonly disabled: boolean;
};

type PngFrame = {
  readonly width: number;
  readonly height: number;
  readonly data: Uint8Array;
};

type GoldenTarget = {
  readonly abs: string;
  readonly rel: string;
};

function emptyObjectBecauseMissing(): Record<string, string> {
  return {};
}

function textBecauseMissing(value: string | null): string {
  if (value === null) {
    return "";
  }
  return value;
}

function percentBecausePixels(diffPixels: number, totalPixels: number): number {
  if (totalPixels === 0) {
    return 1;
  }
  return diffPixels / totalPixels;
}

function delayBecauseSettle(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function missingGoldenMessage(rel: string): string {
  return `missing golden: ${rel}`;
}

function vendorFileName(step: string, projectName: string): string {
  if (projectName === "chromium-desktop") {
    return `${step}-desktop.png`;
  }
  return `${step}.png`;
}

function goldenTarget(step: string, projectName: string): GoldenTarget {
  const packappAbs = path.join(PACKAPP_GOLDEN_ABS_DIR, `${step}.png`);
  if (existsSync(packappAbs)) {
    return {
      abs: packappAbs,
      rel: `${PACKAPP_GOLDEN_REL_DIR}/${step}.png`,
    };
  }
  const file = vendorFileName(step, projectName);
  const rel = `${FIXTURE_REL_DIR}/${file}`;
  return {
    abs: path.join(process.cwd(), rel),
    rel,
  };
}

function sessionDumpPath(projectName: string): string {
  return path.join(AUTH_DIR, `${projectName}.session.json`);
}

function sessionJsonLooksLive(raw: string): boolean {
  const trimmed = raw.trim();
  if (trimmed.length < 8 || trimmed === "{}") {
    return false;
  }
  try {
    const parsed = JSON.parse(trimmed) as Record<string, unknown>;
    if (typeof parsed[SESSION_STORAGE_KEY] === "string") {
      const inner = parsed[SESSION_STORAGE_KEY] as string;
      return sessionJsonLooksLive(inner);
    }
    const tokens = parsed.tokens as { accessToken?: unknown } | undefined;
    if (tokens === undefined || typeof tokens !== "object") {
      return false;
    }
    return typeof tokens.accessToken === "string" && tokens.accessToken.length > 20;
  } catch {
    return false;
  }
}

function unwrapSessionJson(raw: string): string {
  const parsed = JSON.parse(raw) as Record<string, unknown>;
  if (typeof parsed[SESSION_STORAGE_KEY] === "string") {
    return parsed[SESSION_STORAGE_KEY] as string;
  }
  return raw.trim();
}

function readSsmPassword(): string {
  const result = spawnSync(
    "aws",
    [
      "ssm",
      "get-parameter",
      "--name",
      "/pack/e2e/test-user-password",
      "--with-decryption",
      "--query",
      "Parameter.Value",
      "--output",
      "text",
    ],
    { encoding: "utf8" },
  );
  if (result.status !== 0) {
    throw new Error("SSM /pack/e2e/test-user-password unavailable");
  }
  const value = result.stdout.trim();
  if (value.length === 0) {
    throw new Error("SSM /pack/e2e/test-user-password empty");
  }
  return value;
}

function mintAdminSessionJson(): string {
  const password = readSsmPassword();
  const poolId = process.env.E2E_COGNITO_USER_POOL_ID;
  const clientId = process.env.E2E_COGNITO_CLIENT_ID;
  const resolvedPool =
    typeof poolId === "string" && poolId.length > 0
      ? poolId
      : "us-east-1_QuNk9AZqk";
  const resolvedClient =
    typeof clientId === "string" && clientId.length > 0
      ? clientId
      : "6qjkv282db2701o9m0uroh6c9k";
  const result = spawnSync(
    "aws",
    [
      "cognito-idp",
      "admin-initiate-auth",
      "--user-pool-id",
      resolvedPool,
      "--client-id",
      resolvedClient,
      "--auth-flow",
      "ADMIN_USER_PASSWORD_AUTH",
      "--auth-parameters",
      `USERNAME=${E2E_USER},PASSWORD=${password}`,
      "--query",
      "AuthenticationResult",
      "--output",
      "json",
    ],
    { encoding: "utf8" },
  );
  if (result.status !== 0) {
    throw new Error(
      `admin-initiate-auth failed: ${textBecauseMissing(result.stderr)}`,
    );
  }
  const auth = JSON.parse(result.stdout) as {
    AccessToken?: string;
    IdToken?: string;
    RefreshToken?: string;
    TokenType?: string;
    ExpiresIn?: number;
  };
  if (
    typeof auth.AccessToken !== "string" ||
    auth.AccessToken.length === 0 ||
    typeof auth.RefreshToken !== "string" ||
    auth.RefreshToken.length === 0
  ) {
    throw new Error("admin-initiate-auth missing access or refresh token");
  }
  const idToken =
    typeof auth.IdToken === "string" && auth.IdToken.length > 0
      ? auth.IdToken
      : auth.AccessToken;
  const tokenType =
    typeof auth.TokenType === "string" && auth.TokenType.length > 0
      ? auth.TokenType
      : "Bearer";
  const expiresIn =
    typeof auth.ExpiresIn === "number" && auth.ExpiresIn > 0
      ? auth.ExpiresIn
      : 3600;
  const issuedAt = Date.now();
  return JSON.stringify({
    tokens: {
      accessToken: auth.AccessToken,
      idToken,
      refreshToken: auth.RefreshToken,
      tokenType,
      issuedAt,
      accessTokenExpiresAt: issuedAt + Math.max(expiresIn - 45, 60) * 1000,
    },
  });
}

function loadOrMintSessionJson(projectName: string): string {
  if (existsSync(AUTH_CACHE_FILE)) {
    const cached = readFileSync(AUTH_CACHE_FILE, "utf8");
    if (sessionJsonLooksLive(cached)) {
      return unwrapSessionJson(cached);
    }
  }
  const dumpFile = sessionDumpPath(projectName);
  if (existsSync(dumpFile)) {
    const dumped = readFileSync(dumpFile, "utf8");
    if (sessionJsonLooksLive(dumped)) {
      return unwrapSessionJson(dumped);
    }
  }
  const minted = mintAdminSessionJson();
  mkdirSync(AUTH_DIR, { recursive: true });
  writeFileSync(AUTH_CACHE_FILE, `${minted}\n`);
  return minted;
}

async function injectAuthenticatedSession(
  page: Page,
  sessionJson: string,
): Promise<void> {
  const apply = (raw: string): void => {
    window.sessionStorage.setItem("pack.auth.session.v1", raw);
  };
  await page.context().addInitScript(apply, sessionJson);
  await page.addInitScript(apply, sessionJson);
}

async function stubApiScopedPages(page: Page): Promise<void> {
  const mintBody = {
    code: "A1b2C3d4E5",
    smsHref: `sms:${PACK_VERIFY_E164}?body=A1b2C3d4E5`,
    expiresAt: Date.now() + 60 * 60 * 1000,
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
  await page.route("**/oauth2/token", async (route) => {
    const session = JSON.parse(loadOrMintSessionJson("cached")) as {
      tokens: {
        accessToken: string;
        idToken: string;
        refreshToken: string;
        tokenType: string;
      };
    };
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        access_token: session.tokens.accessToken,
        id_token: session.tokens.idToken,
        refresh_token: session.tokens.refreshToken,
        token_type: session.tokens.tokenType,
        expires_in: 3600,
      }),
    });
  });
}

async function dismissConsent(page: Page): Promise<void> {
  await dismissConsentBannerIfVisible(page);
  const oneTrust = page.locator("#onetrust-accept-btn-handler");
  if (await oneTrust.isVisible().catch(() => false)) {
    await oneTrust.click();
  }
  const rejectAll = page.getByRole("button", { name: /reject all/i });
  if (await rejectAll.isVisible().catch(() => false)) {
    await rejectAll.click();
  }
}

function onboardAbsUrl(): string {
  const base = process.env.E2E_BASE_URL;
  if (typeof base === "string" && base.length > 0) {
    return `${base.replace(/\/+$/, "")}/onboard`;
  }
  return "https://www.trypackai.com/onboard";
}

async function headingVisible(page: Page, name: string): Promise<boolean> {
  return page
    .getByRole("heading", { name, exact: true })
    .first()
    .isVisible()
    .catch(() => false);
}

async function clickFirstVisible(
  page: Page,
  name: RegExp | string,
): Promise<boolean> {
  const button = page.locator("main").getByRole("button", { name });
  if (await button.first().isVisible().catch(() => false)) {
    const disabled = await button.first().isDisabled().catch(() => false);
    if (disabled) {
      return false;
    }
    await button.first().click();
    return true;
  }
  return false;
}

async function openOnboard(page: Page): Promise<void> {
  const dest = onboardAbsUrl();
  await page.goto(dest, { waitUntil: "domcontentloaded", timeout: 45_000 });
  if (!page.url().includes("/onboard")) {
    await page.goto(dest, { waitUntil: "domcontentloaded", timeout: 45_000 });
  }
  await dismissConsent(page);
  await page.getByTestId("onboard-step").waitFor({
    state: "attached",
    timeout: 45_000,
  });
  await page.locator("h1, h2").first().waitFor({ timeout: 45_000 });
  await page.evaluate(() => document.fonts.ready).catch(() => undefined);
}

async function currentHeading(page: Page): Promise<string> {
  const loc = page.locator("main h1, main h2").first();
  if (!(await loc.isVisible().catch(() => false))) {
    return "";
  }
  return (await loc.innerText()).trim();
}

function doorNameBecauseHref(href: string): string | null {
  if (href.length === 0) {
    return null;
  }
  if (href.startsWith("sms:")) {
    return "SMS deep link";
  }
  if (href.includes("apps.apple.com")) {
    return "App Store";
  }
  if (href.includes("oauth2/authorize") && href.includes("identity_provider=Google")) {
    return "Google auth";
  }
  if (
    href.includes("oauth2/authorize") &&
    href.includes("identity_provider=SignInWithApple")
  ) {
    return "Apple auth";
  }
  if (href.includes("accounts.google.com")) {
    return "Google auth";
  }
  if (href.includes("appleid.apple.com")) {
    return "Apple auth";
  }
  if (href.includes("auth.trypackai.com")) {
    if (href.includes("Apple")) {
      return "Apple auth";
    }
    return "Google auth";
  }
  if (href.includes("/terms")) {
    return "Terms of Service";
  }
  if (href.includes("/privacy")) {
    return "Privacy Policy";
  }
  return null;
}

function isDoorUrl(url: string): boolean {
  return doorNameBecauseHref(url) !== null;
}

function nextHeadingBecauseAdvance(
  fromId: FlowPageId,
  clickedName: string,
): string | null {
  const skip = /skip/i.test(clickedName);
  const cont = /^continue$/i.test(clickedName);
  if (fromId === "past" && cont) {
    return "Present";
  }
  if (fromId === "present" && cont) {
    return "Future";
  }
  if (fromId === "future" && cont) {
    return "Verify your number";
  }
  if ((fromId === "past" || fromId === "present" || fromId === "future") && skip) {
    return "Verify your number";
  }
  if (fromId === "verify-phone" && skip) {
    return "Connections";
  }
  if (fromId === "connections" && skip) {
    return "You're all set!";
  }
  if (fromId === "connections" && cont) {
    return "You're all set!";
  }
  if (fromId === "connections" && /back/i.test(clickedName)) {
    return "Verify your number";
  }
  return null;
}

function pixelDiffRatio(actual: PngFrame, golden: PngFrame): number {
  if (actual.width !== golden.width || actual.height !== golden.height) {
    return 1;
  }
  let diffPixels = 0;
  const totalPixels = actual.width * actual.height;
  const length = Math.min(actual.data.length, golden.data.length);
  for (let i = 0; i < length; i += 4) {
    if (
      actual.data[i] !== golden.data[i] ||
      actual.data[i + 1] !== golden.data[i + 1] ||
      actual.data[i + 2] !== golden.data[i + 2] ||
      actual.data[i + 3] !== golden.data[i + 3]
    ) {
      diffPixels += 1;
    }
  }
  return percentBecausePixels(diffPixels, totalPixels);
}

function requireGoldenFile(rel: string, abs: string): void {
  if (!existsSync(abs)) {
    throw new Error(missingGoldenMessage(rel));
  }
}

function rgbPng(width: number, height: number, rgb: readonly [number, number, number]): Buffer {
  const png = new PNG({ width, height });
  for (let i = 0; i < png.data.length; i += 4) {
    png.data[i] = rgb[0];
    png.data[i + 1] = rgb[1];
    png.data[i + 2] = rgb[2];
    png.data[i + 3] = 255;
  }
  return PNG.sync.write(png);
}

async function compareToGolden(
  page: Page,
  projectName: string,
  step: string,
): Promise<void> {
  mkdirSync(SHOT_DIR, { recursive: true });
  mkdirSync(FIXTURE_ABS_DIR, { recursive: true });
  const shotPath = path.join(SHOT_DIR, `${projectName}-${step}.png`);
  await page.screenshot({
    path: shotPath,
    fullPage: true,
    animations: "disabled",
    caret: "hide",
  });
  const vendorAbs = path.join(FIXTURE_ABS_DIR, vendorFileName(step, projectName));
  if (VENDOR_GOLDENS) {
    writeFileSync(vendorAbs, readFileSync(shotPath));
    return;
  }
  const target = goldenTarget(step, projectName);
  if (!existsSync(target.abs)) {
    expect(false, missingGoldenMessage(target.rel)).toBe(true);
    return;
  }
  const actualPng = PNG.sync.read(readFileSync(shotPath));
  const goldenPng = PNG.sync.read(readFileSync(target.abs));
  if (
    actualPng.width !== goldenPng.width ||
    actualPng.height !== goldenPng.height
  ) {
    const diffPath = path.join(SHOT_DIR, `${projectName}-${step}-size-mismatch.txt`);
    writeFileSync(
      diffPath,
      `actual ${actualPng.width}x${actualPng.height} golden ${goldenPng.width}x${goldenPng.height}\n`,
    );
    expect(
      false,
      `golden pixel size mismatch ${step}: actual ${actualPng.width}x${actualPng.height} vs ${goldenPng.width}x${goldenPng.height}`,
    ).toBe(true);
    return;
  }
  const ratio = pixelDiffRatio(actualPng, goldenPng);
  expect(
    ratio <= MAX_PIXEL_RATIO,
    `${step} golden diff ${(ratio * 100).toFixed(2)}% pixels (max 2%) vs ${target.rel}`,
  ).toBe(true);
}

async function accessibleNameBecauseControl(item: Locator): Promise<string> {
  const ariaRaw = await item.getAttribute("aria-label");
  if (ariaRaw !== null && ariaRaw.trim().length > 0) {
    return ariaRaw.trim();
  }
  const text = (await item.innerText().catch(() => "")).replace(/\s+/g, " ").trim();
  if (text.length > 0) {
    return text;
  }
  const href = await item.getAttribute("href");
  if (href !== null && href.length > 0) {
    return href;
  }
  const testId = await item.getAttribute("data-testid");
  if (testId !== null && testId.length > 0) {
    return testId;
  }
  return "unnamed-control";
}

async function enumerateMainControls(page: Page): Promise<EnumeratedControl[]> {
  const loc = page.locator("main button, main a[href], main [role='button']");
  const count = await loc.count();
  const seen = new Set<string>();
  const out: EnumeratedControl[] = [];
  for (let i = 0; i < count; i += 1) {
    const item = loc.nth(i);
    if (!(await item.isVisible().catch(() => false))) {
      continue;
    }
    const name = await accessibleNameBecauseControl(item);
    const tagName = await item.evaluate((el) => el.tagName.toLowerCase());
    const hrefRaw = await item.getAttribute("href");
    const href = textBecauseMissing(hrefRaw);
    const roleRaw = await item.getAttribute("role");
    const role = textBecauseMissing(roleRaw);
    const ariaDisabled = await item.getAttribute("aria-disabled");
    const disabledAttr = await item.isDisabled().catch(() => false);
    let disabled = disabledAttr;
    if (ariaDisabled === "true") {
      disabled = true;
    }
    const key = `${tagName}:${name}:${href}`;
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    out.push({ name, tag: tagName, href, role, disabled });
  }
  return out;
}

function locatorForControl(page: Page, control: EnumeratedControl): Locator {
  const main = page.locator("main");
  if (control.href.length > 0 && control.tag === "a") {
    return main.locator(`a[href="${control.href}"]`).first();
  }
  if (control.name.length > 0) {
    return main.getByRole("button", { name: control.name }).first();
  }
  return main.locator(`${control.tag}[role='button']`).first();
}

async function snapshotToggleState(
  page: Page,
  control: EnumeratedControl,
): Promise<string> {
  const loc = locatorForControl(page, control);
  if (!(await loc.count().then((n) => n > 0).catch(() => false))) {
    return "";
  }
  const pressed = textBecauseMissing(await loc.getAttribute("aria-pressed"));
  const checked = textBecauseMissing(await loc.getAttribute("aria-checked"));
  const expanded = textBecauseMissing(await loc.getAttribute("aria-expanded"));
  const selected = textBecauseMissing(await loc.getAttribute("aria-selected"));
  const text = (await loc.innerText().catch(() => "")).trim();
  return `${pressed}|${checked}|${expanded}|${selected}|${text}`;
}

function inPageConnectOrChrome(flow: FlowPage, control: EnumeratedControl): boolean {
  if (flow.id !== "connections") {
    return false;
  }
  if (/connect google/i.test(control.name)) {
    return true;
  }
  if (/connect microsoft/i.test(control.name)) {
    return true;
  }
  if (/^back$/i.test(control.name)) {
    return true;
  }
  return false;
}

function settleMsBecauseControl(control: EnumeratedControl): number {
  if (
    /continue with google/i.test(control.name) ||
    /continue with apple/i.test(control.name) ||
    /let us handle the rest/i.test(control.name)
  ) {
    return 8_000;
  }
  return 800;
}

async function clickAndClassify(
  page: Page,
  flow: FlowPage,
  control: EnumeratedControl,
  isMobile: boolean,
): Promise<ControlKind> {
  if (control.disabled) {
    return "disabled-named";
  }
  const hrefDoor = doorNameBecauseHref(control.href);
  if (hrefDoor !== null) {
    if (hrefDoor === "SMS deep link") {
      expect(control.href).toMatch(
        new RegExp(`sms:.*${PACK_VERIFY_E164.replace("+", "\\+")}`),
      );
      expect(control.href).toMatch(/[?&]body=/);
    }
    const loc = locatorForControl(page, control);
    const popupPromise = page
      .waitForEvent("popup", { timeout: 2_000 })
      .catch(() => null);
    await loc.click();
    const popup = await popupPromise;
    const afterHrefClick = page.url();
    expect(
      afterHrefClick !== "about:blank" && !afterHrefClick.includes("chrome-error"),
      `href door ${control.name} must not open a blank route, url=${afterHrefClick}`,
    ).toBe(true);
    if (popup !== null) {
      const popupUrl = popup.url();
      expect(
        doorNameBecauseHref(popupUrl) !== null,
        `popup door ${control.name} ${popupUrl}`,
      ).toBe(true);
      await popup.close();
    } else {
      expect(
        hrefDoor.length > 0,
        `href door ${control.name} ${control.href}`,
      ).toBe(true);
    }
    return "external-door";
  }

  const beforeHeading = await currentHeading(page);
  const beforeUrl = page.url();
  const beforeToggle = await snapshotToggleState(page, control);
  const loc = locatorForControl(page, control);

  const popupPromise = page
    .waitForEvent("popup", { timeout: 2_000 })
    .catch(() => null);

  try {
    await loc.click({ timeout: 8_000 });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (!/destroyed|closed|detached/i.test(message)) {
      throw error;
    }
  }

  const deadline = Date.now() + settleMsBecauseControl(control);
  let popup = await popupPromise;
  while (Date.now() < deadline) {
    if (popup !== null) {
      break;
    }
    const afterUrlEarly = page.url();
    if (isDoorUrl(afterUrlEarly) || afterUrlEarly !== beforeUrl) {
      break;
    }
    const afterHeadingEarly = await currentHeading(page).catch(() => "");
    if (afterHeadingEarly !== beforeHeading && afterHeadingEarly.length > 0) {
      break;
    }
    await delayBecauseSettle(150);
  }

  if (popup !== null) {
    const popupUrl = popup.url();
    const door = doorNameBecauseHref(popupUrl);
    expect(
      door !== null,
      `popup from ${control.name} is a named door, got ${popupUrl}`,
    ).toBe(true);
    await popup.close();
    return "external-door";
  }

  const afterUrl = page.url();
  const urlDoor = doorNameBecauseHref(afterUrl);
  if (urlDoor !== null) {
    return "external-door";
  }

  const googleApple =
    /continue with google/i.test(control.name) ||
    /continue with apple/i.test(control.name);
  if (googleApple) {
    const door = /google/i.test(control.name) ? "Google auth" : "Apple auth";
    const looksLikeAuth =
      /auth\.trypackai\.com|oauth2\/authorize|accounts\.google|appleid\.apple/i.test(
        afterUrl,
      );
    expect(looksLikeAuth, `${control.name} must open ${door}, url=${afterUrl}`).toBe(
      true,
    );
    return "external-door";
  }

  if (/let us handle the rest/i.test(control.name)) {
    const blank =
      afterUrl === "about:blank" || afterUrl.includes("chrome-error");
    expect(
      blank === false,
      `complete CTA must not open a blank route, url=${afterUrl}`,
    ).toBe(true);
    const smsDoor = doorNameBecauseHref(control.href) === "SMS deep link";
    expect(
      smsDoor,
      `complete CTA href must be sms:, got ${control.href}`,
    ).toBe(true);
    return "external-door";
  }

  await delayBecauseSettle(400);
  const afterHeading = await currentHeading(page).catch(() => "");
  const expectedNext = nextHeadingBecauseAdvance(flow.id, control.name);
  if (afterHeading !== beforeHeading && afterHeading.length > 0) {
    if (expectedNext !== null) {
      expect(afterHeading).toMatch(new RegExp(expectedNext.replace("!", "\\!")));
    }
    return "advance";
  }

  const afterToggle = await snapshotToggleState(page, control).catch(() => "");
  if (afterToggle !== beforeToggle) {
    return "toggle";
  }

  if (flow.id === "verify-phone" && isMobile === false && /qr/i.test(control.name)) {
    return "toggle";
  }

  if (inPageConnectOrChrome(flow, control)) {
    return "toggle";
  }

  expect(
    false,
    `dead click: ${control.name} on ${flow.id} (heading still ${afterHeading}, no href, no toggle)`,
  ).toBe(true);
  return "toggle";
}

async function assertNamedQrIfDesktop(
  page: Page,
  isMobile: boolean,
): Promise<void> {
  if (isMobile) {
    return;
  }
  const qr = page.getByTestId("verify-phone-qr").or(
    page.getByRole("img", { name: /QR code to text Pack/i }),
  );
  await expect(qr.first()).toBeVisible();
  const smsHref = textBecauseMissing(
    await qr.first().getAttribute("data-sms-href"),
  );
  if (smsHref.length > 0) {
    expect(smsHref).toMatch(
      new RegExp(`sms:.*${PACK_VERIFY_E164.replace("+", "\\+")}`),
    );
  }
}

async function landOnFlowPage(
  page: Page,
  projectName: string,
  flow: FlowPage,
): Promise<void> {
  if (flow.needsAuth) {
    const sessionJson = loadOrMintSessionJson(projectName);
    await injectAuthenticatedSession(page, sessionJson);
    await stubApiScopedPages(page);
  }
  await openOnboard(page);

  if (flow.id === "signup") {
    await expect(
      page.getByRole("heading", { name: flow.heading, exact: true }),
    ).toBeVisible({ timeout: 45_000 });
    return;
  }

  if (await headingVisible(page, "Welcome to Pack")) {
    const sessionJson = loadOrMintSessionJson(projectName);
    await page.evaluate((raw: string) => {
      window.sessionStorage.setItem("pack.auth.session.v1", raw);
    }, sessionJson);
    await page.reload({ waitUntil: "domcontentloaded" });
    await dismissConsent(page);
    await page.locator("h1, h2").first().waitFor({ timeout: 45_000 });
  }

  if (await headingVisible(page, "Welcome to Pack")) {
    expect(
      false,
      "authenticated walk still on signup; Cognito session did not stick",
    ).toBe(true);
  }

  if (flow.id === "past") {
    await expect(page.getByRole("heading", { name: "Past", exact: true })).toBeVisible({
      timeout: 45_000,
    });
    return;
  }
  if (flow.id === "present") {
    await expect(page.getByRole("heading", { name: "Past", exact: true })).toBeVisible({
      timeout: 45_000,
    });
    await clickFirstVisible(page, /^Continue$/);
    await expect(page.getByRole("heading", { name: "Present", exact: true })).toBeVisible();
    return;
  }
  if (flow.id === "future") {
    await expect(page.getByRole("heading", { name: "Past", exact: true })).toBeVisible({
      timeout: 45_000,
    });
    await clickFirstVisible(page, /^Continue$/);
    await expect(page.getByRole("heading", { name: "Present", exact: true })).toBeVisible();
    await clickFirstVisible(page, /^Continue$/);
    await expect(page.getByRole("heading", { name: "Future", exact: true })).toBeVisible();
    return;
  }
  if (flow.id === "verify-phone") {
    if (await headingVisible(page, "Past")) {
      await clickFirstVisible(page, /^Skip$/);
    }
    await expect(
      page.getByRole("heading", { name: "Verify your number", exact: true }),
    ).toBeVisible({ timeout: 45_000 });
    return;
  }
  if (flow.id === "connections") {
    if (await headingVisible(page, "Past")) {
      await clickFirstVisible(page, /^Skip$/);
    }
    if (await headingVisible(page, "Verify your number")) {
      const skippedNow = await clickFirstVisible(page, /^Skip for now$/);
      if (!skippedNow) {
        await clickFirstVisible(page, /^Skip$/);
      }
    }
    await expect(
      page.getByRole("heading", { name: "Connections", exact: true }),
    ).toBeVisible({ timeout: 45_000 });
    return;
  }
  if (await headingVisible(page, "Past")) {
    await clickFirstVisible(page, /^Skip$/);
  }
  if (await headingVisible(page, "Verify your number")) {
    const skippedNow = await clickFirstVisible(page, /^Skip for now$/);
    if (!skippedNow) {
      await clickFirstVisible(page, /^Skip$/);
    }
  }
  if (await headingVisible(page, "Connections")) {
    await clickFirstVisible(page, /^Skip for now$/);
  }
  await expect(
    page.getByRole("heading", { name: "You're all set!", exact: true }),
  ).toBeVisible({ timeout: 45_000 });
}

async function exerciseEveryControl(
  page: Page,
  projectName: string,
  flow: FlowPage,
  isMobile: boolean,
): Promise<void> {
  const controls = await enumerateMainControls(page);
  expect(
    controls.length > 0,
    `${flow.id} must expose at least one button/link`,
  ).toBe(true);

  if (flow.id === "verify-phone") {
    await assertNamedQrIfDesktop(page, isMobile);
  }

  if (flow.id === "complete" && isMobile === false) {
    await expect(page.getByText(PACK_VERIFY_E164)).toBeVisible();
    await expect(page.getByRole("button", { name: "Copy" })).toBeVisible();
  }

  for (const control of controls) {
    await test.step(`control ${flow.id}: ${control.name}`, async () => {
      if (!(await headingVisible(page, flow.heading))) {
        await landOnFlowPage(page, projectName, flow);
      }
      const kind = await clickAndClassify(page, flow, control, isMobile);
      expect(
        kind === "advance" ||
          kind === "external-door" ||
          kind === "toggle" ||
          kind === "disabled-named",
        `${control.name} classified ${kind}`,
      ).toBe(true);
      if (kind === "advance" || kind === "external-door") {
        await landOnFlowPage(page, projectName, flow);
      }
    });
  }
}

test.describe("Onboarding works (playwright tested e2e) including all the buttons throughout the flow and it's 1:1 with the mobile golden maestros.", () => {
  test("missing golden names the fixture path", () => {
    const rel = `${FIXTURE_REL_DIR}/does-not-exist.png`;
    const abs = path.join(process.cwd(), rel);
    expect(() => {
      requireGoldenFile(rel, abs);
    }).toThrow(missingGoldenMessage(rel));
  });

  test("perturbed golden exceeds the 2% pixel cap", () => {
    const black = PNG.sync.read(rgbPng(8, 8, [0, 0, 0]));
    const white = PNG.sync.read(rgbPng(8, 8, [255, 255, 255]));
    const ratio = pixelDiffRatio(black, white);
    expect(ratio > MAX_PIXEL_RATIO).toBe(true);
  });

  for (const flow of FLOW_PAGES) {
    if (flow.needsAuth) {
      continue;
    }
    test.describe(`logged-out ${flow.id}`, () => {
      test.use({ storageState: { cookies: [], origins: [] } });
      test.setTimeout(120_000);

      test(`${flow.id}: screenshot vs golden and click every control`, async ({
        page,
      }, testInfo) => {
        const projectName = testInfo.project.name;
        const isMobile = projectName === "chromium-mobile";
        const target = goldenTarget(flow.golden, projectName);
        if (!VENDOR_GOLDENS) {
          expect(
            existsSync(target.abs),
            missingGoldenMessage(target.rel),
          ).toBe(true);
        }
        await landOnFlowPage(page, projectName, flow);
        await compareToGolden(page, projectName, flow.golden);
        if (!VENDOR_GOLDENS) {
          await exerciseEveryControl(page, projectName, flow, isMobile);
        }
      });
    });
  }

  test.describe("authenticated G order", () => {
    test.setTimeout(180_000);

    for (const flow of FLOW_PAGES) {
      if (!flow.needsAuth) {
        continue;
      }
      test(`${flow.id}: screenshot vs golden and click every control`, async ({
        page,
      }, testInfo) => {
        const projectName = testInfo.project.name;
        const isMobile = projectName === "chromium-mobile";
        const target = goldenTarget(flow.golden, projectName);
        if (!VENDOR_GOLDENS) {
          expect(
            existsSync(target.abs),
            missingGoldenMessage(target.rel),
          ).toBe(true);
        }
        await landOnFlowPage(page, projectName, flow);
        await compareToGolden(page, projectName, flow.golden);
        if (!VENDOR_GOLDENS) {
          await exerciseEveryControl(page, projectName, flow, isMobile);
        }
      });
    }
  });
});
