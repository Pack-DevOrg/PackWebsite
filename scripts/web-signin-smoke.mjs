import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

/** Allow-Headers on the API template before PackServer #1096. */
export const PRE_1096_ALLOW_HEADERS =
  "Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token,X-Requested-With,Origin,Accept,X-Recaptcha-Token,X-Pack-Client-Timestamp,X-Pack-Client-Integrity";

export const DEFAULT_SITE_ORIGIN = "https://www.trypackai.com";
export const DEFAULT_API_BASE = "https://api.trypackai.com/prod";
/** First authenticated call after /auth/callback. */
export const SIGNIN_API_PATH = "/user/information";

const ATTESTATION_HEADER_RE = /WEB_ATTESTATION_HEADER\s*=\s*["']([^"']+)["']/;
const BRACKET_HEADER_RE = /headers\[\s*["']([^"']+)["']\s*\]/g;
const LITERAL_HEADER_RE = /^\s*([A-Z][A-Za-z0-9-]*)\s*:/gm;

function repoRoot() {
  return join(dirname(fileURLToPath(import.meta.url)), "..");
}

function isDirectCli(argv1, moduleUrl) {
  if (typeof argv1 !== "string" || argv1.length === 0) {
    return false;
  }
  return fileURLToPath(moduleUrl) === resolve(argv1);
}

export function readSiteRequestHeaders(attestationSource, clientSource) {
  const names = new Set();
  const attestation = String(attestationSource).match(ATTESTATION_HEADER_RE);
  if (!attestation) {
    throw new Error("WEB_ATTESTATION_HEADER missing from webAttestation.ts");
  }
  names.add(attestation[1]);
  const client = String(clientSource);
  for (const match of client.matchAll(BRACKET_HEADER_RE)) {
    names.add(match[1]);
  }
  for (const match of client.matchAll(LITERAL_HEADER_RE)) {
    names.add(match[1]);
  }
  return [...names].sort((left, right) => left.localeCompare(right));
}

export function missingAllowHeaders(requested, allowValue) {
  const raw = String(allowValue || "")
    .trim()
    .replace(/^'+|'+$/g, "");
  if (raw === "*") {
    return [];
  }
  const allowed = new Set(
    raw
      .split(",")
      .map((part) => part.trim().toLowerCase())
      .filter(Boolean),
  );
  return requested.filter((name) => !allowed.has(String(name).toLowerCase()));
}

function headerGet(headers, name) {
  if (!headers) {
    return "";
  }
  if (typeof headers.get === "function") {
    return String(headers.get(name) || headers.get(name.toLowerCase()) || "");
  }
  const found = Object.keys(headers).find((key) => key.toLowerCase() === name.toLowerCase());
  return found ? String(headers[found]) : "";
}

export async function checkCorsPreflight({ fetchImpl, apiBase, siteOrigin, headers }) {
  const url = `${String(apiBase).replace(/\/+$/, "")}${SIGNIN_API_PATH}`;
  let response;
  try {
    response = await fetchImpl(url, {
      method: "OPTIONS",
      headers: {
        Origin: siteOrigin,
        "Access-Control-Request-Method": "GET",
        "Access-Control-Request-Headers": headers.join(","),
      },
    });
  } catch (error) {
    return {
      ok: false,
      status: 0,
      missing: [...headers],
      allowOrigin: "",
      allowHeaders: "",
      error: error instanceof Error ? error.message : String(error),
    };
  }
  const status = typeof response.status === "number" ? response.status : 0;
  const allowHeaders = headerGet(response.headers, "access-control-allow-headers");
  const allowOrigin = headerGet(response.headers, "access-control-allow-origin").trim();
  const missing = missingAllowHeaders(headers, allowHeaders);
  const originOk = allowOrigin === "*" || allowOrigin === siteOrigin;
  const ok = status >= 200 && status < 300 && originOk && missing.length === 0;
  return { ok, status, missing, allowOrigin, allowHeaders };
}

export async function assertOnboardImages(page, url) {
  const failed = [];
  const onResponse = (response) => {
    if (response.request().resourceType() !== "image") {
      return;
    }
    if (response.status() >= 400) {
      failed.push(response.url());
    }
  };
  const onFailed = (request) => {
    if (request.resourceType() !== "image") {
      return;
    }
    failed.push(request.url());
  };
  page.on("response", onResponse);
  page.on("requestfailed", onFailed);
  let response;
  try {
    response = await page.goto(url, { waitUntil: "load", timeout: 30000 });
  } catch (error) {
    return {
      ok: false,
      broken: failed,
      reason: error instanceof Error ? error.message : String(error),
    };
  }
  const status = response ? response.status() : 0;
  if (status !== 200) {
    return { ok: false, broken: failed, reason: `status=${status}` };
  }
  const zeros = await page.evaluate(() =>
    [...document.querySelectorAll("img")]
      .filter((img) => {
        const src = img.currentSrc || img.src || "";
        if (!src) {
          return false;
        }
        const path = src.split("?")[0].split("#")[0].toLowerCase();
        if (!/\.(png|jpe?g|gif|webp|avif|ico)$/.test(path)) {
          return false;
        }
        return img.complete && img.naturalWidth === 0;
      })
      .map((img) => img.currentSrc || img.src),
  );
  const broken = [...new Set([...failed, ...zeros])];
  return { ok: broken.length === 0, broken, reason: "" };
}

function printPreflightFail(preflight) {
  const missing = preflight.missing.length > 0 ? preflight.missing.join(",") : "-";
  console.error(
    `SMOKE-FAIL preflight status=${preflight.status} missing=${missing} origin=${preflight.allowOrigin || "-"}`,
  );
}

export async function runWebSigninSmoke(options = {}) {
  const siteOrigin = String(
    options.siteOrigin || process.env.WEB_SIGNIN_SITE_ORIGIN || DEFAULT_SITE_ORIGIN,
  ).replace(/\/+$/, "");
  const apiBase = String(
    options.apiBase || process.env.WEB_SIGNIN_API_BASE || DEFAULT_API_BASE,
  ).replace(/\/+$/, "");
  const root = options.root || repoRoot();
  const fetchImpl = options.fetchImpl || globalThis.fetch;
  const readFile = options.readFile || readFileSync;
  let attestationSource = options.attestationSource;
  let clientSource = options.clientSource;
  if (attestationSource === undefined) {
    attestationSource = readFile(join(root, "src/auth/webAttestation.ts"), "utf8");
  }
  if (clientSource === undefined) {
    clientSource = readFile(join(root, "src/api/client.ts"), "utf8");
  }
  let headers;
  try {
    headers = readSiteRequestHeaders(attestationSource, clientSource);
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    return 1;
  }
  const preflight = await checkCorsPreflight({
    fetchImpl,
    apiBase,
    siteOrigin,
    headers,
  });
  if (!preflight.ok) {
    printPreflightFail(preflight);
    return 1;
  }
  if (options.skipBrowser) {
    return 0;
  }
  const launch = options.launch || ((launchOptions) => chromium.launch(launchOptions));
  const browser = await launch({ headless: true });
  try {
    const page = await browser.newPage();
    const images = await assertOnboardImages(page, `${siteOrigin}/onboard`);
    if (!images.ok) {
      console.error(`SMOKE-FAIL images ${images.broken[0] || images.reason || "/onboard"}`);
      return 1;
    }
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    console.error("SMOKE-FAIL images /onboard");
    return 1;
  } finally {
    await browser.close();
  }
  return 0;
}

if (isDirectCli(process.argv[1], import.meta.url)) {
  runWebSigninSmoke({}).then(
    (code) => {
      process.exit(code);
    },
    (error) => {
      console.error(error instanceof Error ? error.message : String(error));
      console.error("SMOKE-FAIL preflight status=0 missing=- origin=-");
      process.exit(1);
    },
  );
}
