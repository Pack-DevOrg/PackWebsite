// Node launcher for the waitlist Playwright spec. pack_exit suite.kind=node
// only accepts a .mjs/.js/.cjs path, so this file is the suite.
import { spawnSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const SPEC = "e2e/waitlist-and-subscribe.spec.ts";

const result = spawnSync(
  "npx",
  ["--no-install", "playwright", "test", "-c", "playwright.config.ts", SPEC],
  { cwd: ROOT, stdio: "inherit", env: process.env },
);

process.exit(result.status ?? 1);
