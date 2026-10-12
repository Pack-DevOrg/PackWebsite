import { spawnSync } from "node:child_process";
import type { Page } from "@playwright/test";

/* The E2E account's Cognito Hosted UI login, shared by global-setup and the card sign-in spec. The password comes from SSM and is never printed. */
const E2E_USER = "tests@trypackai.com";

function ssmRegion(): string {
  return process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || "us-east-1";
}

export function readE2EPassword(): string {
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

async function choosePasswordSignIn(page: Page): Promise<void> {
  const byValue = page.locator('input[type="radio"][value="USER_PASSWORD_AUTH"]');
  if ((await byValue.count()) > 0) {
    await byValue.click({ force: true });
    return;
  }
  await page.getByRole("radio", { name: "Password", exact: true }).click();
}

export async function submitHostedUiLogin(page: Page, password: string): Promise<void> {
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
