import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

export const WEB_CLIENT_ID_RE = /^[a-z0-9]{20,}$/;
export const PARKED_AWAITING_TOKEN = "parked-awaiting";
export const IOS_COGNITO_CLIENT_ID = "6qjkv282db2701o9m0uroh6c9k";
export const AUTH_GATE_PROVIDERS = Object.freeze([
  Object.freeze({
    name: "Continue with Google",
    idpHost: "accounts.google.com",
  }),
  Object.freeze({
    name: "Continue with Apple",
    idpHost: "appleid.apple.com",
  }),
]);

export function readViteCognitoWebClientId(envText) {
  const line = String(envText || "")
    .split("\n")
    .find((row) => row.startsWith("VITE_COGNITO_WEB_CLIENT_ID="));
  return line ? line.slice("VITE_COGNITO_WEB_CLIENT_ID=".length).trim() : "";
}

export function expectedWebClientIdFromDisk(cwd = process.cwd(), env = process.env) {
  const fromEnv = String(env.VITE_COGNITO_WEB_CLIENT_ID || "").trim();
  if (fromEnv) {
    return fromEnv;
  }
  return readViteCognitoWebClientId(
    readFileSync(join(cwd, ".env.production"), "utf8"),
  );
}

export function assertAuthorizeClientId(clientId, expectedWebClientId) {
  const value = String(clientId || "");
  if (value.includes(PARKED_AWAITING_TOKEN) || value.startsWith("parked-")) {
    throw new Error(`authorize client_id is parked: ${value}`);
  }
  if (value === IOS_COGNITO_CLIENT_ID) {
    throw new Error("authorize client_id is the iOS client");
  }
  if (!WEB_CLIENT_ID_RE.test(value)) {
    throw new Error(`authorize client_id is not a Cognito web client id: ${value}`);
  }
  if (value !== expectedWebClientId) {
    throw new Error(
      `authorize client_id ${value} !== VITE_COGNITO_WEB_CLIENT_ID ${expectedWebClientId}`,
    );
  }
}

export function assertAuthorizeRedirect(status, location, idpHost) {
  const loc = String(location || "");
  if (/\/error(?:\?|$)/.test(loc)) {
    let query = loc;
    try {
      query = loc.includes("://") ? new URL(loc).search : loc.slice(loc.indexOf("?"));
    } catch {
      query = loc;
    }
    throw new Error(`hosted-UI error ${query}`);
  }
  if (status === 400) {
    throw new Error("authorize answered 400");
  }
  if (status !== 302) {
    throw new Error(`authorize status ${status}, expected 302`);
  }
  let host = "";
  try {
    host = new URL(loc).hostname;
  } catch {
    throw new Error(`authorize Location not a URL: ${loc}`);
  }
  if (host !== idpHost && !host.endsWith(`.${idpHost}`)) {
    throw new Error(`authorize Location host ${host} expected ${idpHost}`);
  }
}

function hostnameIsIdp(host) {
  return (
    host === "accounts.google.com" ||
    host.endsWith(".google.com") ||
    host === "appleid.apple.com" ||
    host.endsWith(".apple.com")
  );
}

export function assertNotHostedUiErrorUrl(url) {
  let parsed;
  try {
    parsed = new URL(String(url || ""));
  } catch {
    return;
  }
  if (hostnameIsIdp(parsed.hostname)) {
    return;
  }
  const hostedUi =
    parsed.hostname === "auth.trypackai.com" ||
    parsed.hostname.endsWith(".auth.trypackai.com") ||
    parsed.hostname.endsWith(".amazoncognito.com") ||
    parsed.pathname === "/error";
  if (
    hostedUi &&
    (parsed.pathname === "/error" || parsed.pathname.endsWith("/error"))
  ) {
    throw new Error(`hosted-UI error ${parsed.search}`);
  }
}

export function findParkedAwaitingInDist(distDir) {
  const root = String(distDir || "").trim();
  if (!root) {
    throw new Error("dist dir is required");
  }
  const hits = [];
  const stack = [root];
  while (stack.length > 0) {
    const dir = stack.pop();
    const entries = readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const full = join(dir, entry.name);
      if (entry.isDirectory()) {
        if (entry.name === "videos" || entry.name === "images") {
          continue;
        }
        stack.push(full);
        continue;
      }
      if (!/\.(js|css|html|json|mjs|cjs|map|txt)$/i.test(entry.name)) {
        continue;
      }
      const text = readFileSync(full, "utf8");
      if (text.includes(PARKED_AWAITING_TOKEN)) {
        hits.push(full);
      }
    }
  }
  return hits;
}

export async function clickOnboardAuthorizeGate(page, options) {
  const expectedClientId = String(options.expectedClientId || "").trim();
  const onboardUrl = String(options.onboardUrl || "").trim();

  for (const provider of AUTH_GATE_PROVIDERS) {
    let captured = null;
    let errorQuery = null;
    const onNavigate = (frame) => {
      try {
        assertNotHostedUiErrorUrl(frame.url());
      } catch (error) {
        errorQuery = error instanceof Error ? error.message : String(error);
      }
    };
    page.on("framenavigated", onNavigate);
    await page.route("**/oauth2/authorize*", async (route) => {
      const requestUrl = route.request().url();
      try {
        const probe = await page.context().request.fetch(requestUrl, {
          maxRedirects: 0,
          failOnStatusCode: false,
        });
        captured = {
          url: requestUrl,
          status: probe.status(),
          location: probe.headers().location || "",
        };
      } catch (error) {
        captured = {
          url: requestUrl,
          status: 0,
          location: "",
          error: error instanceof Error ? error.message : String(error),
        };
      }
      await route.abort("aborted");
    });
    try {
      await page.goto(onboardUrl, {
        waitUntil: "domcontentloaded",
        timeout: 15000,
      });
      const rejectAll = page.getByRole("button", { name: /reject all/i });
      if (await rejectAll.isVisible().catch(() => false)) {
        await rejectAll.click();
      }
      const button = page.getByRole("button", { name: provider.name });
      await button.waitFor({ state: "visible", timeout: 8000 });
      await button.click();
      const deadline = Date.now() + 15000;
      while (!captured && Date.now() < deadline) {
        await page.waitForTimeout(50);
      }
      if (errorQuery) {
        throw new Error(errorQuery);
      }
      if (!captured) {
        throw new Error("authorize request was not intercepted");
      }
      if (captured.error) {
        throw new Error(captured.error);
      }
      assertNotHostedUiErrorUrl(page.url());
      const authorizeUrl = new URL(captured.url);
      assertAuthorizeClientId(
        authorizeUrl.searchParams.get("client_id"),
        expectedClientId,
      );
      assertAuthorizeRedirect(
        captured.status,
        captured.location,
        provider.idpHost,
      );
    } finally {
      page.off("framenavigated", onNavigate);
      await page.unroute("**/oauth2/authorize*");
    }
  }
}
