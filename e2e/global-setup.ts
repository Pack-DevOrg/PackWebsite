import { createHash, randomBytes } from "node:crypto";
import { spawnSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { chromium, type Page } from "@playwright/test";

const E2E_USER = "tests@trypackai.com";
// Sign-in alias has an s. The Cognito email attribute on that account does not.
const E2E_MAILBOX = "test@trypackai.com";
const AUTH_DIR = path.join(process.cwd(), "test-results", "e2e-auth");
const BASE_URL = process.env.E2E_BASE_URL ?? "https://www.trypackai.com";
// pack-web's hosted UI returns "Login pages unavailable". The iOS client still
// has a Cognito password page, the www callback, and the prod API scopes.
const PASSWORD_CLIENT_ID =
  process.env.E2E_COGNITO_CLIENT_ID ?? "6qjkv282db2701o9m0uroh6c9k";
const REDIRECT_URI = "https://www.trypackai.com/auth/callback";
const TOKEN_URL = "https://auth.trypackai.com/oauth2/token";
const AUTHORIZE_SCOPES = [
  "openid",
  "email",
  "profile",
  "api.trypackai.com/prod/travel.plan",
  "api.trypackai.com/prod/travel.search",
  "api.trypackai.com/prod/travel.book",
  "api.trypackai.com/prod/jobs.read",
  "api.trypackai.com/prod/jobs.manage",
  "api.trypackai.com/prod/user.accounts",
  "api.trypackai.com/prod/user.preferences",
  "api.trypackai.com/prod/user.information",
  "api.trypackai.com/prod/user.trips",
  "api.trypackai.com/prod/user.queries",
  "api.trypackai.com/prod/user.delete",
].join(" ");
const PROJECTS = ["chromium-desktop", "chromium-mobile"] as const;

const SESSION_STORAGE_KEY = "pack.auth.session.v1";

type StorageStateFile = {
  readonly cookies?: readonly unknown[];
  readonly origins?: readonly {
    readonly localStorage?: readonly unknown[];
    readonly indexedDB?: readonly unknown[];
  }[];
};

function authStatePath(projectName: string): string {
  return path.join(AUTH_DIR, `${projectName}.json`);
}

function sessionDumpPath(projectName: string): string {
  return path.join(AUTH_DIR, `${projectName}.session.json`);
}

/** The 37-byte `{ cookies: [], origins: [] }` file is not a logged-in seed. */
export function storageStateIsSeeded(raw: string): boolean {
  try {
    const parsed = JSON.parse(raw) as StorageStateFile;
    if ((parsed.cookies?.length ?? 0) > 0) {
      return true;
    }
    return (parsed.origins ?? []).some(
      (origin) =>
        (origin.localStorage?.length ?? 0) > 0 ||
        (origin.indexedDB?.length ?? 0) > 0,
    );
  } catch {
    return false;
  }
}

function assertSeededAuthFile(projectName: string): void {
  const raw = readFileSync(authStatePath(projectName), "utf8");
  if (!storageStateIsSeeded(raw)) {
    throw new Error(
      `e2e auth ${projectName}.json is the empty fallback; expected cookies or origin storage for ${E2E_USER}`,
    );
  }
}

export function idTokenIdentifiesE2EUser(idToken: string): boolean {
  const payload = idToken.split(".")[1] ?? "";
  if (payload.length === 0) {
    return false;
  }
  const claims = JSON.parse(
    Buffer.from(payload, "base64url").toString("utf8"),
  ) as { email?: string; "cognito:username"?: string; username?: string };
  const accepted = new Set([E2E_USER, E2E_MAILBOX]);
  const names = [claims.email, claims["cognito:username"], claims.username]
    .filter((value): value is string => typeof value === "string")
    .map((value) => value.trim().toLowerCase());
  return names.some((name) => accepted.has(name));
}

function assertSessionForE2EUser(session: Record<string, string>): void {
  const raw = session[SESSION_STORAGE_KEY] ?? "";
  const parsed = JSON.parse(raw) as { tokens?: { idToken?: string } };
  if (!idTokenIdentifiesE2EUser(parsed.tokens?.idToken ?? "")) {
    throw new Error(`e2e auth session is not ${E2E_USER} or ${E2E_MAILBOX}`);
  }
}

function ssmRegion(): string {
  return process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || "us-east-1";
}

function readE2EPassword(): string {
  const region = ssmRegion();
  const args = [
    "ssm",
    "get-parameter",
    "--region",
    region,
    "--name",
    "/pack/e2e/test-user-password",
    "--with-decryption",
    "--query",
    "Parameter.Value",
    "--output",
    "text",
  ];
  const run = (env: NodeJS.ProcessEnv) =>
    spawnSync("aws", args, {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
      env,
    });
  let result = run({ ...process.env, AWS_REGION: region, AWS_DEFAULT_REGION: region });
  const denied =
    result.status !== 0 && /AccessDenied/i.test(`${result.stderr ?? ""}${result.stdout ?? ""}`);
  if (denied && (process.env.AWS_PROFILE || process.env.AWS_DEFAULT_PROFILE)) {
    const retryEnv = {
      ...process.env,
      AWS_REGION: region,
      AWS_DEFAULT_REGION: region,
    };
    delete retryEnv.AWS_PROFILE;
    delete retryEnv.AWS_DEFAULT_PROFILE;
    result = run(retryEnv);
  }
  if (result.status !== 0) {
    const detail = `${result.stderr ?? ""}`.trim().split("\n")[0] || "aws failed";
    throw new Error(`SSM /pack/e2e/test-user-password unavailable: ${detail}`);
  }
  const value = result.stdout.trim();
  if (value.length === 0) {
    throw new Error("SSM /pack/e2e/test-user-password empty");
  }
  return value;
}

type CognitoTokenResponse = {
  readonly access_token?: string;
  readonly id_token?: string;
  readonly refresh_token?: string;
  readonly token_type?: string;
  readonly expires_in?: number;
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
    [SESSION_STORAGE_KEY]: JSON.stringify(session),
  };
}

function authorizeUrl(verifier: string): string {
  const challenge = createHash("sha256").update(verifier).digest("base64url");
  const url = new URL("https://auth.trypackai.com/oauth2/authorize");
  url.searchParams.set("client_id", PASSWORD_CLIENT_ID);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("redirect_uri", REDIRECT_URI);
  url.searchParams.set("scope", AUTHORIZE_SCOPES);
  url.searchParams.set("state", randomBytes(16).toString("base64url"));
  url.searchParams.set("code_challenge", challenge);
  url.searchParams.set("code_challenge_method", "S256");
  url.searchParams.set("identity_provider", "COGNITO");
  return url.toString();
}

async function choosePasswordSignIn(page: Page): Promise<void> {
  const byValue = page.locator('input[type="radio"][value="USER_PASSWORD_AUTH"]');
  if ((await byValue.count()) > 0) {
    await byValue.click({ force: true });
    return;
  }
  await page.getByRole("radio", { name: "Password", exact: true }).click();
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
  if (!(await secret.first().isVisible().catch(() => false))) {
    await tryAnother.waitFor({ state: "visible", timeout: 15_000 });
    await tryAnother.click();
    await choosePasswordSignIn(page);
    await page.getByRole("button", { name: /^Continue$/i }).click();
  }
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

async function exchangeAuthorizationCode(
  code: string,
  verifier: string,
): Promise<CognitoTokenResponse> {
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    client_id: PASSWORD_CLIENT_ID,
    code,
    redirect_uri: REDIRECT_URI,
    code_verifier: verifier,
  });
  const response = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  const payload = (await response.json()) as CognitoTokenResponse & {
    error?: string;
  };
  if (!response.ok) {
    throw new Error(
      `Cognito token exchange failed: ${payload.error ?? response.status}`,
    );
  }
  return payload;
}

function writeSeededAuth(
  projectName: string,
  sessionRecord: Record<string, string>,
): void {
  assertSessionForE2EUser(sessionRecord);
  const origin = new URL(BASE_URL).origin;
  const state = {
    cookies: [
      {
        name: "pack.auth.hint.v1",
        value: "1",
        domain: ".trypackai.com",
        path: "/",
        expires: Math.floor(Date.now() / 1000) + 60 * 60,
        httpOnly: false,
        secure: true,
        sameSite: "Strict" as const,
      },
    ],
    origins: [
      {
        origin,
        localStorage: [
          {
            name: SESSION_STORAGE_KEY,
            value: sessionRecord[SESSION_STORAGE_KEY],
          },
        ],
      },
    ],
  };
  mkdirSync(AUTH_DIR, { recursive: true });
  writeFileSync(authStatePath(projectName), `${JSON.stringify(state, null, 2)}\n`);
  writeFileSync(
    sessionDumpPath(projectName),
    `${JSON.stringify(sessionRecord)}\n`,
  );
  assertSeededAuthFile(projectName);
}

async function loginE2EUser(password: string): Promise<Record<string, string>> {
  const verifier = randomBytes(32).toString("base64url");
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();
  let callbackUrl = "";
  await page.route("https://www.trypackai.com/auth/callback**", async (route) => {
    callbackUrl = route.request().url();
    await route.fulfill({ status: 200, contentType: "text/plain", body: "ok" });
  });
  await page.route("https://trypackai.com/auth/callback**", async (route) => {
    callbackUrl = route.request().url();
    await route.fulfill({ status: 200, contentType: "text/plain", body: "ok" });
  });
  try {
    await page.goto(authorizeUrl(verifier), { waitUntil: "domcontentloaded" });
    await submitHostedUiLogin(page, password);
    const started = Date.now();
    while (callbackUrl.length === 0) {
      if (Date.now() - started > 60_000) {
        throw new Error("Cognito callback was not captured");
      }
      await new Promise((resolve) => {
        setTimeout(resolve, 250);
      });
    }
    const callback = new URL(callbackUrl);
    const oauthError = callback.searchParams.get("error");
    if (oauthError) {
      throw new Error(`Cognito authorize failed: ${oauthError}`);
    }
    const code = callback.searchParams.get("code") ?? "";
    if (code.length === 0) {
      throw new Error("Cognito callback missing authorization code");
    }
    const tokens = await exchangeAuthorizationCode(code, verifier);
    return sessionDumpFromTokenResponse(tokens);
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
          "hosted-ui.png",
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
  if (!process.env.E2E_BASE_URL) {
    return;
  }

  const password = readE2EPassword();
  const sessionRecord = await loginE2EUser(password);
  for (const projectName of PROJECTS) {
    writeSeededAuth(projectName, sessionRecord);
  }
}

