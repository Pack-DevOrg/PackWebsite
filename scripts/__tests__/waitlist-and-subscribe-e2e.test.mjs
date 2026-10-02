import { spawnSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "../..");
const SPEC = "e2e/waitlist-and-subscribe.spec.ts";

const env = { ...process.env };
if (!env.E2E_BASE_URL) {
  env.E2E_BASE_URL = "https://www.trypackai.com";
}

const result = spawnSync(
  "npx",
  ["--no-install", "playwright", "test", "-c", "playwright.config.ts", SPEC],
  { cwd: ROOT, stdio: "inherit", env },
);

process.exit(result.status ?? 1);
