import { spawnSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import {
  chromium,
  devices,
  type BrowserContext,
  type Page,
} from "@playwright/test";

import { dismissConsentBannerIfVisible } from "./helpers";

const E2E_USER = "tests@trypackai.com";
const AUTH_DIR = path.join(process.cwd(), "test-results", "e2e-auth");
const BASE_URL = process.env.E2E_BASE_URL ?? "https://www.trypackai.com";

const EMPTY_STORAGE = {
  cookies: [] as [],
  origins: [] as [],
};

type ProjectAuthTarget = {
  readonly name: string;
  readonly contextOptions: {
    readonly viewport?: { width: number; height: number };
    readonly userAgent?: string;
    readonly isMobile?: boolean;
    readonly hasTouch?: boolean;
    readonly deviceScaleFactor?: number;
  };
};

function emptyStorageJson(): string {
  return `${JSON.stringify(EMPTY_STORAGE, null, 2)}\n`;
}

function writeEmptyAuth(projectName: string): void {
  mkdirSync(AUTH_DIR, { recursive: true });
  writeFileSync(path.join(AUTH_DIR, `${projectName}.json`), emptyStorageJson());
  writeFileSync(
    path.join(AUTH_DIR, `${projectName}.session.json`),
    "{}\n",
  );
}

function readE2EPassword(): string {
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
    {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    },
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

async function stripGoogleIdentityProvider(context: BrowserContext): Promise<void> {
  await context.route("**/oauth2/authorize*", async (route) => {
    const parsed = new URL(route.request().url());
    if (!parsed.searchParams.has("identity_provider")) {
      await route.continue();
      return;
    }
    parsed.searchParams.delete("identity_provider");
    await route.continue({ url: parsed.toString() });
  });
}

type CognitoTokenResponse = {
  readonly access_token?: string;
  readonly id_token?: string;
  readonly refresh_token?: string;
  readonly token_type?: string;
  readonly expires_in?: number;
  readonly refresh_token_expires_in?: number;
};

function sessionDumpFromTokenResponse(
  payload: CognitoTokenResponse,
): Record<string, string> {
  const accessToken = payload.access_token ?? "";
  const idToken = payload.id_token ?? "";
  const refreshToken = payload.refresh_token ?? "";
  const tokenType = payload.token_type ?? "Bearer";
  const expiresIn = payload.expires_in ?? 3600;
  if (accessToken.length === 0 || refreshToken.length === 0) {
    throw new Error("Cognito token response missing access or refresh token");
  }
  const issuedAt = Date.now();
  const session = {
    tokens: {
      accessToken,
      idToken,
      refreshToken,
      tokenType,
      issuedAt,
      accessTokenExpiresAt: issuedAt + Math.max(expiresIn - 45, 60) * 1000,
    },
  };
  return {
    "pack.auth.session.v1": JSON.stringify(session),
  };
}

async function submitHostedUiLogin(page: Page, password: string): Promise<void> {
  await page.waitForURL(/auth\.trypackai\.com/i, { timeout: 45_000 });
  const username = page.locator(
    'input[name="username"], input[name="email"], input[type="email"], #signInFormUsername',
  );
  const secret = page.locator(
    'input[name="password"], #signInFormPassword, input[type="password"]',
  );
  await username.first().waitFor({ state: "visible", timeout: 45_000 });
  await username.first().fill(E2E_USER);
  const firstContinue = page.getByRole("button", { name: /^(Continue|Next)$/i });
  if (
    (await firstContinue.isVisible().catch(() => false)) &&
    !(await secret.first().isVisible().catch(() => false))
  ) {
    await firstContinue.click();
  }
  const tryAnother = page.getByRole("button", { name: /try another way/i });
  await tryAnother.waitFor({ state: "visible", timeout: 15_000 });
  await tryAnother.click();
  const passwordRadio = page.getByRole("radio", { name: "Password", exact: true });
  await passwordRadio.waitFor({ state: "visible", timeout: 15_000 });
  await passwordRadio.click();
  await page.getByRole("button", { name: /^Continue$/i }).click();
  await secret.first().waitFor({ state: "visible", timeout: 45_000 });
  await secret.first().fill(password);
  const submit = page.getByRole("button", { name: /sign in/i });
  if (await submit.isVisible().catch(() => false)) {
    await submit.click();
    return;
  }
  const afterPasswordContinue = page.getByRole("button", {
    name: /^(Continue|Next)$/i,
  });
  if (await afterPasswordContinue.isVisible().catch(() => false)) {
    await afterPasswordContinue.click();
    return;
  }
  await page
    .locator('input[name="signInSubmitButton"], input[type="submit"]')
    .first()
    .click();
}

async function loginProject(target: ProjectAuthTarget, password: string): Promise<void> {
  const browser = await chromium.launch();
  const context = await browser.newContext({
    ...target.contextOptions,
    baseURL: BASE_URL,
  });
  const page = await context.newPage();
  let tokenPayload: CognitoTokenResponse | null = null;
  page.on("response", (response) => {
    const url = response.url();
    if (url.includes("/oauth2/token")) {
      process.stderr.write(
        `e2e global-setup ${target.name}: token ${response.status()}\n`,
      );
    }
    if (!url.includes("/oauth2/token") || !response.ok()) {
      return;
    }
    void response
      .json()
      .then((body: CognitoTokenResponse) => {
        tokenPayload = body;
      })
      .catch(() => undefined);
  });
  try {
    await stripGoogleIdentityProvider(context);
    await page.goto("/app", { waitUntil: "domcontentloaded" });
    await submitHostedUiLogin(page, password);
    await page.waitForURL(/\/auth\/callback/i, { timeout: 45_000 }).catch(() => undefined);
    const tokenWaitStarted = Date.now();
    while (tokenPayload === null) {
      if (Date.now() - tokenWaitStarted > 60_000) {
        throw new Error("Cognito token response not captured");
      }
      await new Promise((resolve) => {
        setTimeout(resolve, 250);
      });
    }
    await page.waitForURL(
      (url) =>
        url.hostname.endsWith("trypackai.com") &&
        !url.pathname.startsWith("/auth/callback"),
      { timeout: 60_000 },
    );
    await dismissConsentBannerIfVisible(page).catch(() => undefined);
    mkdirSync(AUTH_DIR, { recursive: true });
    await context.storageState({
      path: path.join(AUTH_DIR, `${target.name}.json`),
      indexedDB: true,
    });
    writeFileSync(
      path.join(AUTH_DIR, `${target.name}.session.json`),
      `${JSON.stringify(sessionDumpFromTokenResponse(tokenPayload))}\n`,
    );
  } catch (error) {
    mkdirSync(path.join(process.cwd(), "test-results", "onboard"), {
      recursive: true,
    });
    await page
      .screenshot({
        path: path.join(
          process.cwd(),
          "test-results",
          "onboard",
          `${target.name}-hosted-ui.png`,
        ),
        fullPage: true,
      })
      .catch(() => undefined);
    throw error;
  } finally {
    await context.close();
    await browser.close();
  }
}

export default async function globalSetup(): Promise<void> {
  const pixel7 = devices["Pixel 7"];
  const targets: ProjectAuthTarget[] = [
    {
      name: "chromium-desktop",
      contextOptions: {
        viewport: { width: 1440, height: 900 },
      },
    },
    {
      name: "chromium-mobile",
      contextOptions: {
        viewport: pixel7.viewport,
        userAgent: pixel7.userAgent,
        isMobile: pixel7.isMobile,
        hasTouch: pixel7.hasTouch,
        deviceScaleFactor: pixel7.deviceScaleFactor,
      },
    },
  ];

  for (const target of targets) {
    writeEmptyAuth(target.name);
  }

  if (!process.env.E2E_BASE_URL) {
    return;
  }

  let password: string;
  try {
    password = readE2EPassword();
  } catch (error) {
    const message = error instanceof Error ? error.message : "password read failed";
    process.stderr.write(`e2e global-setup: ${message}\n`);
    return;
  }

  for (const target of targets) {
    try {
      await loginProject(target, password);
    } catch (error) {
      const message = error instanceof Error ? error.message : "login failed";
      process.stderr.write(`e2e global-setup ${target.name}: ${message}\n`);
      writeEmptyAuth(target.name);
    }
  }
}
