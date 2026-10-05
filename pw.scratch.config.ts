import base from "./playwright.config";
import { defineConfig, devices } from "@playwright/test";
export default defineConfig({
  ...base,
  testDir: "./e2e",
  globalSetup: "./e2e/global-setup.ts",
  snapshotPathTemplate: "/private/tmp/claude-501/-Users-noahmitsuhashi-Code-PackAll/6923bb0b-34a7-4dc7-8399-a4f55db0aafa/scratchpad/snaps-web-web/{arg}-{projectName}-darwin{ext}",
  reporter: [["list"]],
  webServer: { ...(base as any).webServer, cwd: "/Users/noahmitsuhashi/Code/PackAll/PackWebsite-session-onboarding-goldens-real-export/PackWebsite" },
  projects: [{ name: "chromium-mobile", use: { baseURL: "http://127.0.0.1:4173", ...devices["Pixel 7"], deviceScaleFactor: 3 } }],
});
