import { spawn } from "node:child_process";
import { createServer } from "node:http";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { VIEWPORTS } from "../land-smoke.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "../..");
const SCRIPT = join(ROOT, "scripts/land-smoke.mjs");

const GOOD_HTML =
  '<!doctype html><html><head><title>Onboard | Pack</title></head><body>' +
  '<div data-testid="onboard-step" data-step="SignupLoginScreen">Sign up / log in</div>' +
  '<div data-testid="shared-travel-plan">shared item</div>' +
  '<div data-land-smoke>ok</div>' +
  "</body></html>";

const SHELL_HTML =
  '<!doctype html><html><head><title>Pack</title></head><body><div id="root"></div></body></html>';

function listen(html) {
  return new Promise((resolve) => {
    const server = createServer((_req, res) => {
      res.writeHead(200, { "content-type": "text/html; charset=utf-8" });
      res.end(html);
    });
    server.listen(0, "127.0.0.1", () => {
      const addr = server.address();
      resolve({ server, origin: `http://127.0.0.1:${addr.port}` });
    });
  });
}

function runSmoke(origin, routes) {
  return new Promise((resolve) => {
    const child = spawn(
      process.execPath,
      [SCRIPT, "--origin", origin, "--routes", routes],
      { cwd: ROOT, env: process.env },
    );
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (chunk) => {
      stdout += chunk;
    });
    child.stderr.on("data", (chunk) => {
      stderr += chunk;
    });
    child.on("close", (status) => {
      resolve({ status, stdout, stderr });
    });
  });
}

describe("land-smoke origin playwright", () => {
  it("exports two viewports desktop+mobile", () => {
    expect(VIEWPORTS).toHaveLength(2);
    expect(VIEWPORTS[0]).toEqual({ width: 1280, height: 800 });
    expect(VIEWPORTS[1]).toEqual({ width: 390, height: 844 });
  });

  it("good fixture exits 0", async () => {
    const { server, origin } = await listen(GOOD_HTML);
    try {
      const result = await runSmoke(origin, "/onboard,/share/abc");
      const out = `${result.stdout || ""}${result.stderr || ""}`;
      expect(out).not.toMatch(/SMOKE-FAIL route=/);
      expect(result.status).toBe(0);
    } finally {
      await new Promise((resolve) => server.close(resolve));
    }
  }, 60000);

  it("404-shell fixture names the failing route", async () => {
    const { server, origin } = await listen(SHELL_HTML);
    try {
      const result = await runSmoke(origin, "/share/abc");
      const out = `${result.stdout || ""}${result.stderr || ""}`;
      expect(result.status).not.toBe(0);
      expect(out).toMatch(/SMOKE-FAIL route=\/share\/abc/);
    } finally {
      await new Promise((resolve) => server.close(resolve));
    }
  }, 60000);
});
