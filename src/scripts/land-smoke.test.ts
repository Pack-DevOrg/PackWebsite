import { execFileSync, spawn } from "node:child_process";
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { createServer } from "node:http";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

const ROOT = process.cwd();
const SCRIPT = join(ROOT, "scripts/land-smoke.mjs");
const MODULE_URL = pathToFileURL(SCRIPT).href;
const WEB_CLIENT_ID = "4h8pha61va6n081674mdrc0m7";
const IOS_CLIENT_ID = "6qjkv282db2701o9m0uroh6c9k";

function evalLandSmoke(body: string): string {
  const program = `
import * as land from ${JSON.stringify(MODULE_URL)};
${body}
`;
  try {
    return execFileSync(process.execPath, ["--input-type=module", "-e", program], {
      encoding: "utf8",
      cwd: ROOT,
      env: process.env,
    });
  } catch (error) {
    const err = error as { stdout?: string; stderr?: string; message?: string };
    throw new Error(
      [err.stderr, err.stdout, err.message].filter(Boolean).join("\n"),
    );
  }
}

const AUTH_GATE_HTML = `<!doctype html><html><head><title>Onboard | Pack</title></head><body>
<div data-testid="onboard-step" data-step="SignupLoginScreen">
  <h1>Welcome to Pack</h1>
  <button type="button">Continue with Google</button>
  <button type="button">Continue with Apple</button>
</div>
<script>
  document.querySelectorAll("button").forEach((button) => {
    button.addEventListener("click", () => {
      const apple = button.textContent.includes("Apple");
      const idp = apple ? "SignInWithApple" : "Google";
      const params = new URLSearchParams({
        client_id: ${JSON.stringify(WEB_CLIENT_ID)},
        identity_provider: idp,
      });
      location.href = "/oauth2/authorize?" + params.toString();
    });
  });
</script>
</body></html>`;

type AuthorizeMode = "ok" | "parked" | "400" | "error";

function listenAuthorize(mode: AuthorizeMode, clientId = WEB_CLIENT_ID) {
  return new Promise<{ server: ReturnType<typeof createServer>; origin: string }>(
    (resolve) => {
      const server = createServer((req, res) => {
        const url = new URL(req.url || "/", "http://127.0.0.1");
        if (url.pathname === "/oauth2/authorize") {
          if (mode === "400") {
            res.writeHead(400, { "content-type": "text/plain" });
            res.end("bad client");
            return;
          }
          if (mode === "error") {
            res.writeHead(302, {
              Location: "/error?error=invalid_request&client_id=parked-awaiting",
            });
            res.end();
            return;
          }
          if (mode === "parked") {
            res.writeHead(400, { "content-type": "text/plain" });
            res.end("parked");
            return;
          }
          const idp = url.searchParams.get("identity_provider");
          const location =
            idp === "SignInWithApple"
              ? "https://appleid.apple.com/auth/authorize"
              : "https://accounts.google.com/o/oauth2/v2/auth";
          res.writeHead(302, { Location: location });
          res.end();
          return;
        }
        if (url.pathname === "/error") {
          res.writeHead(200, { "content-type": "text/plain" });
          res.end("error");
          return;
        }
        const html =
          mode === "parked"
            ? AUTH_GATE_HTML.replaceAll(WEB_CLIENT_ID, "parked-awaiting-CognitoWebUserPoolClientId")
            : AUTH_GATE_HTML.replaceAll(WEB_CLIENT_ID, clientId);
        res.writeHead(200, { "content-type": "text/html; charset=utf-8" });
        res.end(html);
      });
      server.listen(0, "127.0.0.1", () => {
        const addr = server.address();
        const port = typeof addr === "object" && addr ? addr.port : 0;
        resolve({ server, origin: `http://127.0.0.1:${port}` });
      });
    },
  );
}

function runSmoke(
  origin: string,
  extraArgs: string[],
  env: NodeJS.ProcessEnv = process.env,
): Promise<{ status: number | null; stdout: string; stderr: string }> {
  return new Promise((resolve) => {
    const child = spawn(
      process.execPath,
      [SCRIPT, "--origin", origin, "--routes", "/onboard", ...extraArgs],
      { cwd: ROOT, env },
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

describe("land-smoke authorize client_id", () => {
  it("accepts the pack-web client id", () => {
    const out = evalLandSmoke(`
land.assertAuthorizeClientId(${JSON.stringify(WEB_CLIENT_ID)}, ${JSON.stringify(WEB_CLIENT_ID)});
console.log("OK");
`);
    expect(out).toContain("OK");
  });

  it("rejects parked, iOS, and mismatch", () => {
    expect(() =>
      evalLandSmoke(
        `land.assertAuthorizeClientId("parked-awaiting-CognitoWebUserPoolClientId", ${JSON.stringify(WEB_CLIENT_ID)});`,
      ),
    ).toThrow(/parked/);
    expect(() =>
      evalLandSmoke(
        `land.assertAuthorizeClientId(${JSON.stringify(IOS_CLIENT_ID)}, ${JSON.stringify(WEB_CLIENT_ID)});`,
      ),
    ).toThrow(/iOS/);
    expect(() =>
      evalLandSmoke(
        `land.assertAuthorizeClientId("abcdefghijabcdefghij", ${JSON.stringify(WEB_CLIENT_ID)});`,
      ),
    ).toThrow(/VITE_COGNITO_WEB_CLIENT_ID/);
  });

  it("rejects authorize 400 and /error Location, accepts 302 to the IdP", () => {
    expect(() =>
      evalLandSmoke(
        `land.assertAuthorizeRedirect(400, "https://accounts.google.com/x", "accounts.google.com");`,
      ),
    ).toThrow(/400/);
    expect(() =>
      evalLandSmoke(
        `land.assertAuthorizeRedirect(302, "https://auth.trypackai.com/error?error=invalid_request", "accounts.google.com");`,
      ),
    ).toThrow(/hosted-UI error \?error=invalid_request/);
    const out = evalLandSmoke(`
land.assertAuthorizeRedirect(302, "https://accounts.google.com/o/oauth2/v2/auth", "accounts.google.com");
land.assertAuthorizeRedirect(302, "https://appleid.apple.com/auth/authorize", "appleid.apple.com");
console.log("OK");
`);
    expect(out).toContain("OK");
  });
});

describe("land-smoke dist parked-awaiting guard", () => {
  it("fails when dist contains parked-awaiting", () => {
    const dir = mkdtempSync(join(tmpdir(), "pack-dist-parked-"));
    try {
      mkdirSync(join(dir, "assets"));
      writeFileSync(
        join(dir, "assets", "index.js"),
        'client_id="parked-awaiting-CognitoWebUserPoolClientId"',
      );
      const out = evalLandSmoke(`
const hits = land.findParkedAwaitingInDist(${JSON.stringify(dir)});
if (hits.length === 0) throw new Error("expected parked hit");
console.log("HIT " + hits.length);
`);
      expect(out).toMatch(/HIT 1/);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("passes a clean dist", () => {
    const dir = mkdtempSync(join(tmpdir(), "pack-dist-clean-"));
    try {
      mkdirSync(join(dir, "assets"));
      writeFileSync(
        join(dir, "assets", "index.js"),
        `client_id="${WEB_CLIENT_ID}"`,
      );
      const out = evalLandSmoke(`
const hits = land.findParkedAwaitingInDist(${JSON.stringify(dir)});
if (hits.length !== 0) throw new Error("unexpected " + hits.join(","));
console.log("CLEAN");
`);
      expect(out).toContain("CLEAN");
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});

describe("land-smoke onboard auth-gate", () => {
  it("good authorize 302 exits 0", async () => {
    const dir = mkdtempSync(join(tmpdir(), "pack-dist-clean-"));
    mkdirSync(join(dir, "assets"));
    writeFileSync(join(dir, "assets", "index.js"), `id="${WEB_CLIENT_ID}"`);
    const { server, origin } = await listenAuthorize("ok");
    try {
      const result = await runSmoke(origin, [
        "--auth-gate",
        "--dist",
        dir,
        "--web-client-id",
        WEB_CLIENT_ID,
      ]);
      const out = `${result.stdout || ""}${result.stderr || ""}`;
      expect(out).not.toMatch(/SMOKE-FAIL/);
      expect(result.status).toBe(0);
    } finally {
      rmSync(dir, { recursive: true, force: true });
      await new Promise<void>((resolve) => {
        server.close(() => resolve());
      });
    }
  }, 60000);

  it("parked client_id fails the gate", async () => {
    const { server, origin } = await listenAuthorize("parked");
    try {
      const result = await runSmoke(origin, [
        "--auth-gate",
        "--web-client-id",
        WEB_CLIENT_ID,
      ]);
      const out = `${result.stdout || ""}${result.stderr || ""}`;
      expect(result.status).not.toBe(0);
      expect(out).toMatch(/SMOKE-FAIL route=\/onboard/);
      expect(out).toMatch(/parked/);
    } finally {
      await new Promise<void>((resolve) => {
        server.close(() => resolve());
      });
    }
  }, 60000);

  it("authorize 400 fails the gate", async () => {
    const { server, origin } = await listenAuthorize("400");
    try {
      const result = await runSmoke(origin, [
        "--auth-gate",
        "--web-client-id",
        WEB_CLIENT_ID,
      ]);
      const out = `${result.stdout || ""}${result.stderr || ""}`;
      expect(result.status).not.toBe(0);
      expect(out).toMatch(/SMOKE-FAIL route=\/onboard/);
      expect(out).toMatch(/400/);
    } finally {
      await new Promise<void>((resolve) => {
        server.close(() => resolve());
      });
    }
  }, 60000);

  it("hosted-UI /error Location fails with the query string", async () => {
    const { server, origin } = await listenAuthorize("error");
    try {
      const result = await runSmoke(origin, [
        "--auth-gate",
        "--web-client-id",
        WEB_CLIENT_ID,
      ]);
      const out = `${result.stdout || ""}${result.stderr || ""}`;
      expect(result.status).not.toBe(0);
      expect(out).toMatch(/hosted-UI error/);
      expect(out).toMatch(/invalid_request/);
    } finally {
      await new Promise<void>((resolve) => {
        server.close(() => resolve());
      });
    }
  }, 60000);
});
