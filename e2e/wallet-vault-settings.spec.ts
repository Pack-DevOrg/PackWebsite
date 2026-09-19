import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { expect, test, type Page } from "@playwright/test";



const AUTH_DIR = path.join(process.cwd(), "test-results", "e2e-auth");
const E2E_USER = "tests@trypackai.com";
const SESSION_STORAGE_KEY = "pack.auth.session.v1";
const ISSUED_AT = "2026-09-18T12:00:00.000Z";

const PUBLIC_CREDENTIAL = {
  id: "cred_e2e_1",
  site: "https://hotels.example",
  username: "pack-e2e",
  secretPresent: true as const,
};

const ISSUED_CARD = {
  id: "ic_e2e_1",
  surrogate: "card_e2e_1",
  merchant: "Example Air",
  amountCents: 18400,
  currency: "usd",
  status: "issued",
  issuedAt: ISSUED_AT,
  uses: [
    {
      id: "use_issue",
      cardId: "ic_e2e_1",
      kind: "issue",
      amountCents: 18400,
      merchant: "Example Air",
      at: ISSUED_AT,
    },
    {
      id: "use_auth",
      cardId: "ic_e2e_1",
      kind: "authorization",
      amountCents: 18400,
      merchant: "Example Air",
      at: "2026-09-18T12:01:00.000Z",
    },
    {
      id: "use_decl",
      cardId: "ic_e2e_1",
      kind: "decline",
      amountCents: 200,
      merchant: "Other Mart",
      at: "2026-09-18T12:02:00.000Z",
    },
  ],
};

function okEnvelope(data: unknown) {
  return JSON.stringify({ success: true, data });
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
      return sessionJsonLooksLive(parsed[SESSION_STORAGE_KEY]);
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
    return parsed[SESSION_STORAGE_KEY];
  }
  return raw.trim();
}

function liveSessionDump(projectName: string): string | null {
  const dumpFile = sessionDumpPath(projectName);
  if (existsSync(dumpFile) === false) {
    return null;
  }
  const dumped = readFileSync(dumpFile, "utf8");
  if (sessionJsonLooksLive(dumped) === false) {
    return null;
  }
  return unwrapSessionJson(dumped);
}

function base64UrlJson(value: Record<string, unknown>): string {
  return Buffer.from(JSON.stringify(value)).toString("base64url");
}

function mintE2eAccountSessionJson(): string {
  const now = Math.floor(Date.now() / 1000);
  const claims = {
    sub: "e2e-tests-trypackai",
    email: E2E_USER,
    name: "Pack Tester",
    iat: now,
    exp: now + 3600,
  };
  const idToken = `${base64UrlJson({ alg: "none", typ: "JWT" })}.${base64UrlJson(claims)}.`;
  const issuedAt = Date.now();
  return JSON.stringify({
    tokens: {
      accessToken: idToken,
      idToken,
      refreshToken: "e2e-refresh",
      tokenType: "Bearer",
      issuedAt,
      accessTokenExpiresAt: issuedAt + 3_600_000,
    },
  });
}

function sessionJsonForE2eAccount(projectName: string): string {
  const dumped = liveSessionDump(projectName);
  if (dumped !== null) {
    return dumped;
  }
  return mintE2eAccountSessionJson();
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

async function stubWalletVaultApis(page: Page): Promise<{
  readonly createdBodies: Array<Record<string, unknown>>;
}> {
  const createdBodies: Array<Record<string, unknown>> = [];
  let credentials: Array<typeof PUBLIC_CREDENTIAL> = [];
  let linkConnected = false;

  await page.route("**/user/wallet/link/session", async (route) => {
    if (route.request().method() !== "POST") {
      await route.fallback();
      return;
    }
    linkConnected = true;
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: okEnvelope({
        url: "https://checkout.stripe.com/c/pay/cs_e2e_link",
      }),
    });
  });

  await page.route("**/user/wallet/link", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: okEnvelope(
        linkConnected
          ? { connected: true, last4: "4242", brand: "visa" }
          : { connected: false },
      ),
    });
  });

  await page.route("**/user/vault/credentials", async (route) => {
    const method = route.request().method();
    if (method === "POST") {
      const raw = route.request().postData();
      const body = raw === null ? {} : (JSON.parse(raw) as Record<string, unknown>);
      createdBodies.push(body);
      credentials = [PUBLIC_CREDENTIAL];
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: okEnvelope(PUBLIC_CREDENTIAL),
      });
      return;
    }
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: okEnvelope({ credentials }),
    });
  });

  await page.route("**/user/vault/credentials/*", async (route) => {
    const method = route.request().method();
    if (method === "PATCH") {
      const raw = route.request().postData();
      const body = raw === null ? {} : (JSON.parse(raw) as Record<string, unknown>);
      createdBodies.push(body);
      credentials = [
        {
          ...PUBLIC_CREDENTIAL,
          site: "https://air.example",
          username: "pack-air",
        },
      ];
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: okEnvelope(credentials[0]),
      });
      return;
    }
    if (method === "DELETE") {
      credentials = [];
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: okEnvelope({}),
      });
      return;
    }
    await route.fallback();
  });

  await page.route("**/user/wallet/cards", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: okEnvelope({ cards: [ISSUED_CARD] }),
    });
  });

  await page.route("**/friends", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: okEnvelope({ friends: [] }),
    });
  });

  await page.route("**/user/information", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: okEnvelope({
        sub: "e2e-tests-trypackai",
        email: E2E_USER,
      }),
    });
  });

  return { createdBodies };
}

test.describe("Wallet & Vault settings e2e", () => {
  test.describe.configure({ timeout: 180000 });

  test("signed-in E2E account walks Link, vault CRUD, and typed card rows", async ({
    page,
  }, testInfo) => {
    const stubs = await stubWalletVaultApis(page);
    await page.route("https://checkout.stripe.com/**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "text/plain",
        body: "stripe-link-fixture",
      });
    });

    await injectAuthenticatedSession(
      page,
      sessionJsonForE2eAccount(testInfo.project.name),
    );
    await page.addInitScript(() => {
      const timestamp = Date.now().toString();
      window.localStorage.setItem("tracking-consent", "granted");
      window.localStorage.setItem("tracking-consent-timestamp", timestamp);
      window.localStorage.setItem(
        "tracking-preferences",
        JSON.stringify({ analytics: false, functional: true, marketing: true }),
      );
      document.cookie = `tracking-consent=granted; path=/; max-age=${180 * 24 * 60 * 60}; samesite=lax`;
    });
    await page.goto("/app/settings/wallet", { waitUntil: "domcontentloaded" });
    await expect(
      page.getByRole("heading", { name: "Wallet & Vault" }).first(),
    ).toBeVisible({ timeout: 45_000 });

    await expect(page.getByText("card_e2e_1").first()).toBeVisible();
    await expect(page.getByText("issue", { exact: true }).first()).toBeVisible();
    await expect(page.getByText("authorization", { exact: true }).first()).toBeVisible();
    await expect(page.getByText("decline", { exact: true }).first()).toBeVisible();

    const popupPromise = page.waitForEvent("popup");
    await page.getByRole("button", { name: "Connect with Stripe Link" }).first().click();
    const popup = await popupPromise;
    await expect(popup).toHaveURL(/checkout\.stripe\.com/);
    await popup.close();
    await expect(
      page.getByRole("heading", { name: "Wallet & Vault" }).first(),
    ).toBeVisible();

    await page.getByLabel("Site").first().fill("https://hotels.example");
    await page.getByLabel("Username").first().fill("pack-e2e");
    await page.getByLabel("Secret").first().fill("hunter2");
    await page.getByRole("button", { name: "Save credential" }).first().click();

    await expect(page.getByText("https://hotels.example").first()).toBeVisible();
    await expect(page.getByText("pack-e2e").first()).toBeVisible();
    await expect(page.getByLabel("Secret").first()).toHaveValue("");
    await expect(page.getByText("hunter2")).toHaveCount(0);
    expect(stubs.createdBodies[0]?.secret).toBe("hunter2");

    await page.getByRole("button", { name: "Edit" }).first().click();
    await expect(page.getByLabel("Secret").first()).toHaveValue("");
    await page.getByLabel("Site").first().fill("https://air.example");
    await page.getByLabel("Username").first().fill("pack-air");
    await page.getByRole("button", { name: "Update credential" }).first().click();
    await expect(page.getByText("https://air.example").first()).toBeVisible();
    expect(stubs.createdBodies[1]?.secret).toBeUndefined();

    await page.getByRole("button", { name: "Remove" }).first().click();
    await page.getByRole("button", { name: "Confirm" }).first().click();
    await expect(page.getByText("No vault credentials yet.").first()).toBeVisible();
  });
});
