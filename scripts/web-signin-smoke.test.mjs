import assert from "node:assert/strict";
import { createServer } from "node:http";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

import {
  PRE_1096_ALLOW_HEADERS,
  assertOnboardImages,
  checkCorsPreflight,
  missingAllowHeaders,
  readSiteRequestHeaders,
  runWebSigninSmoke,
} from "./web-signin-smoke.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const ATTESTATION = readFileSync(join(ROOT, "src/auth/webAttestation.ts"), "utf8");
const CLIENT = readFileSync(join(ROOT, "src/api/client.ts"), "utf8");
const PNG_1X1 = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
  "base64",
);

function allowFetch(allowHeaders, allowOrigin = "https://www.trypackai.com") {
  return async () => ({
    status: 200,
    headers: {
      get(name) {
        const key = String(name).toLowerCase();
        if (key === "access-control-allow-headers") {
          return allowHeaders;
        }
        if (key === "access-control-allow-origin") {
          return allowOrigin;
        }
        return "";
      },
    },
  });
}

function listen(handler) {
  return new Promise((resolve, reject) => {
    const server = createServer(handler);
    server.listen(0, "127.0.0.1", () => {
      const addr = server.address();
      if (!addr || typeof addr === "string") {
        reject(new Error("no port"));
        return;
      }
      resolve({ server, origin: `http://127.0.0.1:${addr.port}` });
    });
  });
}

test("site headers come from webAttestation.ts and the api client", () => {
  const headers = readSiteRequestHeaders(ATTESTATION, CLIENT);
  for (const name of ["Accept", "Authorization", "Content-Type", "X-API-Key", "x-pack-web-attestation"]) {
    assert.ok(headers.includes(name), name);
  }
});

test("preflight check fails on the pre-#1096 template", () => {
  const headers = readSiteRequestHeaders(ATTESTATION, CLIENT);
  const missing = missingAllowHeaders(headers, PRE_1096_ALLOW_HEADERS);
  assert.deepEqual(
    missing.map((name) => name.toLowerCase()),
    ["x-pack-web-attestation"],
  );
});

test("preflight passes once the allow list includes every site header", async () => {
  const headers = readSiteRequestHeaders(ATTESTATION, CLIENT);
  const allowed = `${PRE_1096_ALLOW_HEADERS},x-pack-web-attestation`;
  assert.deepEqual(missingAllowHeaders(headers, allowed), []);
  const result = await checkCorsPreflight({
    fetchImpl: allowFetch(allowed),
    apiBase: "https://api.trypackai.com/prod",
    siteOrigin: "https://www.trypackai.com",
    headers,
  });
  assert.equal(result.ok, true);
  assert.equal(result.missing.length, 0);
});

test("runWebSigninSmoke exits 1 on the pre-#1096 allow list", async () => {
  const lines = [];
  const original = console.error;
  console.error = (line) => {
    lines.push(String(line));
  };
  try {
    const code = await runWebSigninSmoke({
      skipBrowser: true,
      fetchImpl: allowFetch(PRE_1096_ALLOW_HEADERS),
      attestationSource: ATTESTATION,
      clientSource: CLIENT,
      siteOrigin: "https://www.trypackai.com",
      apiBase: "https://api.trypackai.com/prod",
    });
    assert.equal(code, 1);
    assert.match(lines.join("\n"), /SMOKE-FAIL preflight/);
    assert.match(lines.join("\n"), /x-pack-web-attestation/);
  } finally {
    console.error = original;
  }
});

test("a wildcard allow-headers list satisfies the preflight", () => {
  const headers = readSiteRequestHeaders(ATTESTATION, CLIENT);
  assert.deepEqual(missingAllowHeaders(headers, "*"), []);
});

test("onboard with a broken image fails and a good image passes", async () => {
  const { server, origin } = await listen((req, res) => {
    const path = (req.url || "").split("?")[0];
    if (path === "/ok.png") {
      res.writeHead(200, { "content-type": "image/png" });
      res.end(PNG_1X1);
      return;
    }
    if (path === "/onboard-good") {
      res.writeHead(200, { "content-type": "text/html" });
      res.end("<!doctype html><img src=\"/ok.png\" alt=\"\">");
      return;
    }
    if (path === "/onboard") {
      res.writeHead(200, { "content-type": "text/html" });
      res.end("<!doctype html><img src=\"/ok.png\" alt=\"\"><img src=\"/missing.png\" alt=\"\">");
      return;
    }
    res.writeHead(404, { "content-type": "text/plain" });
    res.end("missing");
  });
  const browser = await chromium.launch({ headless: true });
  try {
    const bad = await browser.newPage();
    const broken = await assertOnboardImages(bad, `${origin}/onboard`);
    assert.equal(broken.ok, false);
    assert.ok(broken.broken.some((url) => url.includes("missing.png")));
    const good = await browser.newPage();
    const fine = await assertOnboardImages(good, `${origin}/onboard-good`);
    assert.equal(fine.ok, true);
    assert.deepEqual(fine.broken, []);
  } finally {
    await browser.close();
    await new Promise((resolve) => server.close(resolve));
  }
});

test("deploy.yml calls the GitHub-hosted smoke and red posts #auto-errors", () => {
  const deploy = readFileSync(join(ROOT, ".github/workflows/deploy.yml"), "utf8");
  const smoke = readFileSync(join(ROOT, ".github/workflows/web-signin-smoke.yml"), "utf8");
  const ci = readFileSync(join(ROOT, ".github/workflows/ci.yml"), "utf8");
  assert.match(deploy, /signin-smoke:/);
  assert.match(deploy, /needs: deploy/);
  assert.match(deploy, /web-signin-smoke\.yml/);
  assert.match(smoke, /runs-on: ubuntu-latest/);
  assert.match(smoke, /workflow_call:/);
  assert.match(smoke, /repository_dispatch:/);
  assert.match(smoke, /api-stack-deployed/);
  assert.match(smoke, /node scripts\/web-signin-smoke\.mjs/);
  assert.match(smoke, /C0A7YSE1Z0V/);
  assert.match(smoke, /chat\.postMessage/);
  assert.match(ci, /node --test scripts\/web-signin-smoke\.test\.mjs/);
});
