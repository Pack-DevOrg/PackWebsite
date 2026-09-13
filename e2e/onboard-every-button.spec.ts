import { existsSync, mkdirSync, readFileSync } from "node:fs";
import path from "node:path";
import {
  expect,
  test,
  type BrowserContext,
  type Locator,
  type Page,
} from "@playwright/test";

import { dismissConsentBannerIfVisible } from "./helpers";

const SHOT_DIR = path.join(process.cwd(), "test-results", "onboard-every-button");
const AUTH_DIR = path.join(process.cwd(), "test-results", "e2e-auth");
const PACK_VERIFY_E164 = "+13054392989";
const APP_STORE_ID = "6761626050";
const MAX_PIXEL_RATIO = 0.02;

type FlowPageId =
  | "signup"
  | "what-pack-does-1"
  | "what-pack-does-2"
  | "what-pack-does-3"
  | "verify"
  | "connections"
  | "welcome";

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
  {
    id: "what-pack-does-1",
    heading: "Past",
    golden: "what-pack-does-1",
    needsAuth: true,
  },
  {
    id: "what-pack-does-2",
    heading: "Present",
    golden: "what-pack-does-2",
    needsAuth: true,
  },
  {
    id: "what-pack-does-3",
    heading: "Future",
    golden: "what-pack-does-3",
    needsAuth: true,
  },
  {
    id: "verify",
    heading: "Verify your number",
    golden: "verify",
    needsAuth: true,
  },
  {
    id: "connections",
    heading: "Connections",
    golden: "connections",
    needsAuth: true,
  },
  {
    id: "welcome",
    heading: "You're all set!",
    golden: "welcome",
    needsAuth: true,
  },
];

type ControlKind =
  | "advance"
  | "external-door"
  | "toggle"
  | "disabled-named"
  | "chrome-back"
  | "named-provider";

type EnumeratedControl = {
  readonly name: string;
  readonly tag: string;
  readonly href: string;
  readonly role: string;
  readonly disabled: boolean;
};

function authStatePath(projectName: string): string {
  return path.join(AUTH_DIR, `${projectName}.json`);
}

function sessionDumpPath(projectName: string): string {
  return path.join(AUTH_DIR, `${projectName}.session.json`);
}

function emptyObjectBecauseMissing(): Record<string, string> {
  return {};
}

function textBecauseMissing(value: string | null): string {
  if (value === null) {
    return "";
  }
  return value;
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

async function restoreSessionStorage(
  page: Page,
  projectName: string,
): Promise<void> {
  const dumpFile = sessionDumpPath(projectName);
  if (!existsSync(dumpFile)) {
    return;
  }
  const raw = readFileSync(dumpFile, "utf8");
  const parsed = JSON.parse(raw) as Record<string, string>;
  const entries =
    parsed === null || typeof parsed !== "object"
      ? emptyObjectBecauseMissing()
      : parsed;
  await page.addInitScript((data: Record<string, string>) => {
    for (const [key, value] of Object.entries(data)) {
      window.sessionStorage.setItem(key, value);
    }
  }, entries);
}

async function restoreCookies(
  page: Page,
  projectName: string,
): Promise<void> {
  const storageFile = authStatePath(projectName);
  if (!existsSync(storageFile)) {
    return;
  }
  const stored = JSON.parse(readFileSync(storageFile, "utf8")) as {
    cookies?: Parameters<Page["context"]["addCookies"]>[0];
  };
  if (stored.cookies !== undefined && stored.cookies.length > 0) {
    await page.context().addCookies(stored.cookies);
  }
}

async function stubPhoneVerificationPending(page: Page): Promise<void> {
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

async function headingVisible(page: Page, name: string): Promise<boolean> {
  return page
    .getByRole("heading", { name })
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
  await page.goto("/onboard", { waitUntil: "domcontentloaded" });
  await dismissConsentBannerIfVisible(page);
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
  if (href.includes("oauth2/authorize") && href.includes("identity_provider=SignInWithApple")) {
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

function delayBecauseSettle(): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, 400);
  });
}

function isDoorUrl(url: string): boolean {
  return doorNameBecauseHref(url) !== null;
}

function providerDoorBecauseName(name: string): string | null {
  if (/connect google/i.test(name)) {
    return "Google auth";
  }
  if (/connect microsoft/i.test(name)) {
    return "Microsoft auth";
  }
  return null;
}

function expectedNextBecauseBack(fromId: FlowPageId): string | null {
  if (fromId === "connections") {
    return "Verify your number";
  }
  if (fromId === "verify") {
    return "Future";
  }
  if (fromId === "what-pack-does-3") {
    return "Present";
  }
  if (fromId === "what-pack-does-2") {
    return "Past";
  }
  return null;
}

function nextHeadingBecauseAdvance(
  fromId: FlowPageId,
  clickedName: string,
): string | null {
  const skip = /skip/i.test(clickedName);
  const cont = /^continue$/i.test(clickedName);
  if (fromId === "what-pack-does-1" && cont) {
    return "Present";
  }
  if (fromId === "what-pack-does-2" && cont) {
    return "Future";
  }
  if (fromId === "what-pack-does-3" && cont) {
    return "Verify your number";
  }
  if (
    (fromId === "what-pack-does-1" ||
      fromId === "what-pack-does-2" ||
      fromId === "what-pack-does-3") &&
    skip
  ) {
    return "Verify your number";
  }
  if (fromId === "verify" && skip) {
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

async function compareToMaestroGolden(
  page: Page,
  projectName: string,
  step: string,
): Promise<void> {
  mkdirSync(SHOT_DIR, { recursive: true });
  const shotPath = path.join(SHOT_DIR, `${projectName}-${step}.png`);
  await page.screenshot({
    path: shotPath,
    fullPage: true,
    animations: "disabled",
  });
  await expect(page).toHaveScreenshot(`${step}.png`, {
    fullPage: true,
    animations: "disabled",
    maxDiffPixelRatio: MAX_PIXEL_RATIO,
  });
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
  const main = page.locator("main");
  const groups: readonly Locator[] = [
    main.getByRole("button"),
    main.getByRole("link"),
    main.getByRole("textbox"),
  ];
  const seen = new Set<string>();
  const out: EnumeratedControl[] = [];
  for (const loc of groups) {
    const count = await loc.count();
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
  }
  return out;
}

function locatorForControl(page: Page, control: EnumeratedControl): Locator {
  const main = page.locator("main");
  if (control.href.length > 0 && control.tag === "a") {
    return main.locator(`a[href="${control.href}"]`).first();
  }
  if (control.tag === "input" || control.tag === "textarea") {
    return main.getByRole("textbox", { name: control.name }).first();
  }
  if (control.name.length > 0) {
    const byName = main.getByRole("button", { name: control.name });
    return byName.first();
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

async function clickAndClassify(
  page: Page,
  flow: FlowPage,
  control: EnumeratedControl,
  isMobile: boolean,
): Promise<ControlKind> {
  if (control.disabled) {
    return "disabled-named";
  }
  if (control.tag === "input" || control.tag === "textarea") {
    const loc = locatorForControl(page, control);
    const inputType = textBecauseMissing(await loc.getAttribute("type"));
    const looksLikePhone = inputType === "tel" || /phone|sms/i.test(control.name);
    if (looksLikePhone) {
      const value = await loc.inputValue().catch(() => "");
      expect(value).not.toMatch(/[2-9]\d{9}/);
      return "toggle";
    }
    await loc.fill("e2e");
    await expect(loc).toHaveValue("e2e");
    await loc.fill("");
    return "toggle";
  }
  const hrefDoor = doorNameBecauseHref(control.href);
  if (hrefDoor !== null) {
    if (hrefDoor === "SMS deep link") {
      expect(control.href).toMatch(
        new RegExp(`sms:.*${PACK_VERIFY_E164.replace("+", "\\+")}`),
      );
    }
    const loc = locatorForControl(page, control);
    const popupPromise = page
      .waitForEvent("popup", { timeout: 2_000 })
      .catch(() => null);
    await loc.click();
    const popup = await popupPromise;
    if (popup !== null) {
      const popupUrl = popup.url();
      expect(
        doorNameBecauseHref(popupUrl) !== null,
        `popup door ${control.name} ${popupUrl}`,
      ).toBe(true);
      await popup.close();
    }
    return "external-door";
  }

  const beforeHeading = await currentHeading(page);
  const beforeUrl = page.url();
  const beforeToggle = await snapshotToggleState(page, control);
  const loc = locatorForControl(page, control);

  if (/^back$/i.test(control.name)) {
    await loc.click();
    await delayBecauseSettle();
    const afterBack = await currentHeading(page);
    const backDest = expectedNextBecauseBack(flow.id);
    if (afterBack !== beforeHeading) {
      if (backDest !== null) {
        expect(afterBack).toMatch(new RegExp(backDest.replace("!", "\\!")));
      }
      return "advance";
    }
    await expect(loc).toBeVisible();
    return "chrome-back";
  }

  const providerDoor = providerDoorBecauseName(control.name);
  if (providerDoor !== null) {
    const popupWait = page
      .waitForEvent("popup", { timeout: 2_500 })
      .catch(() => null);
    await loc.click();
    const popup = await popupWait;
    if (popup !== null) {
      const popupUrl = popup.url();
      expect(
        doorNameBecauseHref(popupUrl) !== null ||
          /microsoftonline|login\.live|appleid/i.test(popupUrl),
        `provider popup ${control.name} ${popupUrl}`,
      ).toBe(true);
      await popup.close();
      return "external-door";
    }
    await delayBecauseSettle();
    const afterProviderUrl = page.url();
    if (
      isDoorUrl(afterProviderUrl) ||
      /microsoftonline|login\.live|appleid/i.test(afterProviderUrl)
    ) {
      return "external-door";
    }
    await expect(loc).toBeVisible();
    return "named-provider";
  }

  const popupPromise = page
    .waitForEvent("popup", { timeout: 2_500 })
    .catch(() => null);
  const navPromise = page
    .waitForURL((url) => isDoorUrl(url.toString()) || url.toString() !== beforeUrl, {
      timeout: 8_000,
    })
    .catch(() => null);

  await loc.click();

  const popup = await popupPromise;
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

  await navPromise;
  const afterUrl = page.url();
  const urlDoor = doorNameBecauseHref(afterUrl);
  if (urlDoor !== null) {
    return "external-door";
  }

  const googleApple =
    /continue with google/i.test(control.name) ||
    /continue with apple/i.test(control.name);
  if (googleApple) {
    const door =
      /google/i.test(control.name) ? "Google auth" : "Apple auth";
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
    const store =
      afterUrl.includes("apps.apple.com") || afterUrl.includes(APP_STORE_ID);
    expect(store, `complete CTA must open App Store, url=${afterUrl}`).toBe(true);
    return "external-door";
  }

  await delayBecauseSettle();
  const afterHeading = await currentHeading(page);
  const expectedNext = nextHeadingBecauseAdvance(flow.id, control.name);
  if (afterHeading !== beforeHeading) {
    if (expectedNext !== null) {
      expect(afterHeading).toMatch(new RegExp(expectedNext.replace("!", "\\!")));
    }
    return "advance";
  }

  const afterToggle = await snapshotToggleState(page, control);
  if (afterToggle !== beforeToggle) {
    return "toggle";
  }

  if (flow.id === "verify" && isMobile === false && /qr/i.test(control.name)) {
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
    const sessionJson = e2eSessionJson();
    await injectAuthenticatedSession(page.context(), sessionJson);
    await injectAuthenticatedSession(page, sessionJson);
    await restoreCookies(page, projectName);
    await restoreSessionStorage(page, projectName);
    await stubPhoneVerificationPending(page);
  }
  await openOnboard(page);

  if (flow.id === "signup") {
    await expect(
      page.getByRole("heading", { name: flow.heading }),
    ).toBeVisible({ timeout: 45_000 });
    return;
  }

  if (await headingVisible(page, "Welcome to Pack")) {
    await page.evaluate((raw: string) => {
      window.sessionStorage.setItem("pack.auth.session.v1", raw);
    }, e2eSessionJson());
    await page.reload({ waitUntil: "domcontentloaded" });
    await dismissConsentBannerIfVisible(page);
    await page.locator("h1, h2").first().waitFor({ timeout: 45_000 });
  }

  if (await headingVisible(page, "Welcome to Pack")) {
    expect(
      false,
      "authenticated walk still on signup; Cognito session did not stick",
    ).toBe(true);
  }

  if (await headingVisible(page, "Connections")) {
    if (flow.id !== "connections" && flow.id !== "welcome") {
      expect(
        false,
        `step-order expected what-pack-does-1 → what-pack-does-2 → what-pack-does-3 → verify → connections → welcome; Connections immediately after auth is the old prod order (land ${flow.id})`,
      ).toBe(true);
    }
  }

  if (flow.id === "what-pack-does-1") {
    await expect(page.getByRole("heading", { name: "Past" })).toBeVisible({
      timeout: 45_000,
    });
    return;
  }
  if (flow.id === "what-pack-does-2") {
    await expect(page.getByRole("heading", { name: "Past" })).toBeVisible({
      timeout: 45_000,
    });
    await clickFirstVisible(page, /^Continue$/);
    await expect(page.getByRole("heading", { name: "Present" })).toBeVisible();
    return;
  }
  if (flow.id === "what-pack-does-3") {
    await expect(page.getByRole("heading", { name: "Past" })).toBeVisible({
      timeout: 45_000,
    });
    await clickFirstVisible(page, /^Continue$/);
    await expect(page.getByRole("heading", { name: "Present" })).toBeVisible();
    await clickFirstVisible(page, /^Continue$/);
    await expect(page.getByRole("heading", { name: "Future" })).toBeVisible();
    return;
  }
  if (flow.id === "verify") {
    if (await headingVisible(page, "Past")) {
      await clickFirstVisible(page, /^Skip$/);
    }
    await expect(
      page.getByRole("heading", { name: "Verify your number" }),
    ).toBeVisible({ timeout: 45_000 });
    return;
  }
  if (flow.id === "connections") {
    if (await headingVisible(page, "Past")) {
      await clickFirstVisible(page, /^Continue$/);
      await expect(page.getByRole("heading", { name: "Present" })).toBeVisible();
      await clickFirstVisible(page, /^Continue$/);
      await expect(page.getByRole("heading", { name: "Future" })).toBeVisible();
      await clickFirstVisible(page, /^Continue$/);
    }
    if (await headingVisible(page, "Verify your number")) {
      const skippedNow = await clickFirstVisible(page, /^Skip for now$/);
      if (!skippedNow) {
        await clickFirstVisible(page, /^Skip$/);
      }
    }
    await expect(
      page.getByRole("heading", { name: "Connections" }),
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
    page.getByRole("heading", { name: /You're all set!|Welcome/i }),
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
    `${flow.id} must expose at least one button, link, or textbox`,
  ).toBe(true);

  if (flow.id === "verify") {
    await assertNamedQrIfDesktop(page, isMobile);
  }
  if (flow.id === "connections") {
    await expect(page.getByRole("button", { name: /^Back$/ })).toBeVisible();
    await expect(
      page.getByRole("button", { name: /Connect Google/i }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: /Connect Microsoft/i }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: /^Skip for now$/ }),
    ).toBeVisible();
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
          kind === "disabled-named" ||
          kind === "chrome-back" ||
          kind === "named-provider",
        `${control.name} classified ${kind}`,
      ).toBe(true);
      if (kind === "advance" || kind === "external-door") {
        await landOnFlowPage(page, projectName, flow);
      }
    });
  }
}

test.describe("Onboarding works (playwright tested e2e) including all the buttons throughout the flow and it's 1:1 with the mobile golden maestros.", () => {
  for (const flow of FLOW_PAGES) {
    if (flow.needsAuth) {
      continue;
    }
    test.describe(`logged-out ${flow.id}`, () => {
      test.use({ storageState: { cookies: [], origins: [] } });
      test.setTimeout(120_000);

      test(`${flow.id}: screenshot vs Maestro golden and click every control`, async ({
        page,
      }, testInfo) => {
        const projectName = testInfo.project.name;
        const isMobile = projectName === "chromium-mobile";
        await landOnFlowPage(page, projectName, flow);
        await compareToMaestroGolden(page, projectName, flow.golden);
        await exerciseEveryControl(page, projectName, flow, isMobile);
      });
    });
  }

  test.describe("authenticated G order", () => {
    test.setTimeout(180_000);

    for (const flow of FLOW_PAGES) {
      if (!flow.needsAuth) {
        continue;
      }
      test(`${flow.id}: screenshot vs Maestro golden and click every control`, async ({
        page,
      }, testInfo) => {
        const projectName = testInfo.project.name;
        const isMobile = projectName === "chromium-mobile";
        await landOnFlowPage(page, projectName, flow);
        await compareToMaestroGolden(page, projectName, flow.golden);
        await exerciseEveryControl(page, projectName, flow, isMobile);
      });
    }
  });
});
