import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium, devices } from "playwright";

import {
  clickOnboardAuthorizeGate,
  expectedWebClientIdFromDisk,
  findParkedAwaitingInDist,
} from "./onboard-auth-gate.mjs";

export {
  AUTH_GATE_PROVIDERS,
  IOS_COGNITO_CLIENT_ID,
  PARKED_AWAITING_TOKEN,
  WEB_CLIENT_ID_RE,
  assertAuthorizeClientId,
  assertAuthorizeRedirect,
  assertNotHostedUiErrorUrl,
  clickOnboardAuthorizeGate,
  expectedWebClientIdFromDisk,
  findParkedAwaitingInDist,
  readViteCognitoWebClientId,
} from "./onboard-auth-gate.mjs";

export const VIEWPORTS = Object.freeze([
  Object.freeze({ width: 1280, height: 800 }),
  Object.freeze({ width: 390, height: 844 }),
]);

export function selectorForRoute(route) {
  const path = String(route || "").split("?")[0];
  if (path === "/onboard" || path.startsWith("/onboard/")) {
    return '[data-testid="onboard-step"]';
  }
  if (path === "/share" || path.startsWith("/share/")) {
    return '[data-testid="shared-travel-plan"]';
  }
  return "[data-land-smoke]";
}

export function parseLandSmokeArgs(argv) {
  let origin = "";
  const routes = [];
  let authGate = false;
  let distDir = "";
  let webClientId = "";
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (token === "--origin") {
      origin = String(argv[i + 1] || "").trim();
      i += 1;
      continue;
    }
    if (token === "--routes") {
      const raw = String(argv[i + 1] || "");
      i += 1;
      for (const part of raw.split(",")) {
        const trimmed = part.trim();
        if (!trimmed) {
          continue;
        }
        routes.push(trimmed.startsWith("/") ? trimmed : `/${trimmed}`);
      }
      continue;
    }
    if (token === "--auth-gate") {
      authGate = true;
      continue;
    }
    if (token === "--dist") {
      distDir = String(argv[i + 1] || "").trim();
      i += 1;
      continue;
    }
    if (token === "--web-client-id") {
      webClientId = String(argv[i + 1] || "").trim();
      i += 1;
    }
  }
  return { origin, routes, authGate, distDir, webClientId };
}

function originUrl(origin, route) {
  const base = String(origin).replace(/\/+$/, "");
  const path = route.startsWith("/") ? route : `/${route}`;
  return `${base}${path}`;
}

function printSmokeFail(route) {
  console.error(`SMOKE-FAIL route=${route}`);
}

function isDirectCli(argv1, moduleUrl) {
  if (typeof argv1 !== "string" || argv1.length === 0) {
    return false;
  }
  return fileURLToPath(moduleUrl) === resolve(argv1);
}

export async function runLandSmoke(options) {
  const origin = String(options.origin || "").trim();
  const routes = Array.isArray(options.routes) ? options.routes : [];
  const authGate = options.authGate === true;
  const distDir = String(options.distDir || "").trim();
  const cwd = options.cwd !== undefined ? options.cwd : process.cwd();
  const env = options.env !== undefined ? options.env : process.env;
  if (!origin) {
    console.error("land-smoke: --origin is required");
    return 1;
  }
  if (routes.length === 0) {
    console.error("land-smoke: --routes is required");
    return 1;
  }

  if (distDir) {
    try {
      const parkedHits = findParkedAwaitingInDist(distDir);
      if (parkedHits.length > 0) {
        console.error(`SMOKE-FAIL dist parked-awaiting ${parkedHits[0]}`);
        return 1;
      }
    } catch (error) {
      console.error(error instanceof Error ? error.message : String(error));
      printSmokeFail("dist");
      return 1;
    }
  }

  const browser = await chromium.launch({ headless: true });
  try {
    for (const route of routes) {
      const selector = selectorForRoute(route);
      const url = originUrl(origin, route);
      for (const viewport of VIEWPORTS) {
        const context = await browser.newContext({ viewport });
        const page = await context.newPage();
        try {
          let response;
          try {
            response = await page.goto(url, {
              waitUntil: "domcontentloaded",
              timeout: 15000,
            });
          } catch {
            printSmokeFail(route);
            return 1;
          }
          const status = response ? response.status() : 0;
          if (status !== 200) {
            printSmokeFail(route);
            return 1;
          }
          try {
            await page.waitForSelector(selector, {
              state: "attached",
              timeout: 8000,
            });
          } catch {
            printSmokeFail(route);
            return 1;
          }
        } finally {
          await context.close();
        }
      }
    }

    if (authGate) {
      const expectedClientId =
        String(options.webClientId || "").trim() ||
        expectedWebClientIdFromDisk(cwd, env);
      const iphone = devices["iPhone 14"] ?? devices["iPhone 13"];
      const context = await browser.newContext({
        ...iphone,
        viewport: iphone.viewport ?? { width: 390, height: 844 },
      });
      const page = await context.newPage();
      try {
        await clickOnboardAuthorizeGate(page, {
          onboardUrl: originUrl(origin, "/onboard"),
          expectedClientId,
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        console.error(message);
        printSmokeFail("/onboard");
        return 1;
      } finally {
        await context.close();
      }
    }
  } finally {
    await browser.close();
  }
  return 0;
}

if (isDirectCli(process.argv[1], import.meta.url)) {
  const parsed = parseLandSmokeArgs(process.argv.slice(2));
  runLandSmoke({
    origin: parsed.origin,
    routes: parsed.routes,
    authGate: parsed.authGate,
    distDir: parsed.distDir,
    webClientId: parsed.webClientId,
  })
    .then((code) => {
      process.exit(code);
    })
    .catch((error) => {
      console.error(error instanceof Error ? error.message : String(error));
      process.exit(1);
    });
}
