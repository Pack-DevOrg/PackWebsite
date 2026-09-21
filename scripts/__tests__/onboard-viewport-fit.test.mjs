import { spawnSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "../..");
const SPEC = "e2e/onboard-viewport-fit.spec.ts";

const result = spawnSync(
  "npx",
  ["--no-install", "playwright", "test", "-c", "playwright.config.ts", SPEC],
  { cwd: ROOT, stdio: "inherit", env: process.env },
);

process.exit(result.status ?? 1);
