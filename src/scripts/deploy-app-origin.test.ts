import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

const DEPLOY_SCRIPT = join(process.cwd(), "scripts/deploy-app-origin.mjs");
const DEPLOY_MODULE_URL = pathToFileURL(DEPLOY_SCRIPT).href;

const HOME_HTML =
  '<!doctype html><html><head><title>Pack</title></head><body><div id="root">home-shell-2026-08-14</div></body></html>';
const ONBOARD_HTML =
  '<!doctype html><html><head><title>Onboard | Pack</title></head><body><div data-testid="onboard-step" data-step="SignupLoginScreen">Sign up / log in</div></body></html>';

function expectVerifyExportBecauseTestsImportHelpers(): void {
  const source = readFileSync(DEPLOY_SCRIPT, "utf8");
  expect(source).toMatch(/export async function verifyLiveMergedRoutes\b/);
}

function runVerifyLiveOnboard(liveHtml: string): { stdout: string; stderr: string } {
  const program = `
import { verifyLiveMergedRoutes } from ${JSON.stringify(DEPLOY_MODULE_URL)};

const HOME_HTML = ${JSON.stringify(HOME_HTML)};
const ONBOARD_HTML = ${JSON.stringify(ONBOARD_HTML)};
const liveHtml = ${JSON.stringify(liveHtml)};

function readFileImpl(path) {
  const normalized = String(path).replaceAll("\\\\", "/");
  if (normalized.endsWith("/onboard/index.html")) {
    return ONBOARD_HTML;
  }
  return HOME_HTML;
}

const fetchImpl = async (url) => {
  if (url !== "https://www.trypackai.com/onboard") {
    throw new Error("unexpected url " + url);
  }
  return { status: 200, text: async () => liveHtml };
};

try {
  await verifyLiveMergedRoutes({
    alias: "www.trypackai.com",
    routes: ["/onboard"],
    distDir: "/tmp/pack-dist-synthetic",
    fetchImpl,
    readFileImpl,
  });
  console.log("VERIFY_OK");
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  console.error(message);
  process.exit(2);
}
`;

  try {
    const stdout = execFileSync(process.execPath, ["--input-type=module", "-e", program], {
      encoding: "utf8",
      cwd: process.cwd(),
      stdio: ["ignore", "pipe", "pipe"],
      env: process.env,
    });
    return { stdout, stderr: "" };
  } catch (error) {
    const err = error as { stdout?: string; stderr?: string; status?: number };
    const stderr = typeof err.stderr === "string" ? err.stderr : "";
    const stdout = typeof err.stdout === "string" ? err.stdout : "";
    const message = stderr
      ? stderr
      : stdout
        ? stdout
        : "verifyLiveMergedRoutes failed";
    throw new Error(message);
  }
}

describe("deploy-app-origin live merged-route verify", () => {
  it("/onboard live body equal to home index fails", () => {
    expectVerifyExportBecauseTestsImportHelpers();
    expect(() => runVerifyLiveOnboard(HOME_HTML)).toThrow(/home\/index shell/i);
  });

  it("/onboard live body containing onboard-step and matching dist token passes", () => {
    expectVerifyExportBecauseTestsImportHelpers();
    const result = runVerifyLiveOnboard(ONBOARD_HTML);
    expect(result.stdout).toContain("VERIFY_OK");
  });

  it("verifyLiveMergedRoutes runs after create-invalidation", () => {
    const source = readFileSync(DEPLOY_SCRIPT, "utf8");
    const invalidationAt = source.indexOf('"create-invalidation"');
    const verifyCallAt = source.indexOf("await verifyLiveMergedRoutes(");
    expect(invalidationAt).toBeGreaterThan(-1);
    expect(verifyCallAt).toBeGreaterThan(invalidationAt);
  });
});
