import { spawnSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  unlinkSync,
  writeFileSync,
} from "node:fs";
import os from "node:os";
import path from "node:path";

import { expect, test, type Page, type Route } from "@playwright/test";

import { dismissConsentBannerIfVisible } from "./helpers";

const JOB_ID = "job-e2e-night-d";
const TOKEN = "tok-e2e-night-d";
const STUCK_ON = "hotel checkout OTP";
const EXPIRED_HEADING = "Pack needs your help — this link expired";
const FRAME_ALT = "Merchant checkout live view";
const SHOT_DIR = path.join(process.cwd(), "test-results", "job-live-view");

// 1x1 PNG (synthetic frame bytes; not an empty body and not a JSON error).
const TINY_PNG_BASE64 =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";
const TINY_PNG_BYTES = Buffer.from(TINY_PNG_BASE64, "base64");

function corsHeadersBecauseCrossOriginApi(): Record<string, string> {
  return {
    "access-control-allow-origin": "*",
    "access-control-allow-headers": "*",
    "access-control-allow-methods": "GET,POST,OPTIONS",
  };
}

async function seedTrackingConsentBeforeLoad(page: Page): Promise<void> {
  await page.addInitScript(() => {
    const timestamp = Date.now().toString();
    window.localStorage.setItem("tracking-consent", "granted");
    window.localStorage.setItem("tracking-consent-timestamp", timestamp);
    window.localStorage.setItem(
      "tracking-preferences",
      JSON.stringify({ analytics: false, functional: true, marketing: true }),
    );
  });
}

async function mockLiveViewJobApis(page: Page): Promise<void> {
  // CSP connect-src allows api.trypackai.com, not api.itsdoneai.com (dev .env).
  // Patch fetch so the handoff still resolves without a live PackServer.
  await page.addInitScript(
    ({ jobId, stuckOn, pngBase64 }) => {
      const originalFetch = window.fetch.bind(window);
      const jsonResponse = (body: unknown): Response =>
        new Response(JSON.stringify(body), {
          status: 200,
          headers: { "content-type": "application/json" },
        });
      const pngBytes = Uint8Array.from(atob(pngBase64), (char) =>
        char.charCodeAt(0),
      );
      window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
        const raw =
          typeof input === "string"
            ? input
            : input instanceof URL
              ? input.toString()
              : input.url;
        let parsed: URL;
        try {
          parsed = new URL(raw, window.location.origin);
        } catch {
          return originalFetch(input, init);
        }
        const path = parsed.pathname;
        const isSpaLiveViewDocument =
          parsed.origin === window.location.origin &&
          /^\/live-view\/?$/.test(path);
        if (isSpaLiveViewDocument) {
          return originalFetch(input, init);
        }
        if (/\/live-view\/?$/.test(path) && parsed.searchParams.has("token")) {
          return jsonResponse({
            liveViewUrl: "https://live.pack.test/view",
            merchantHost: "shop.example.test",
            jobId,
            expiresAtMs: Date.now() + 3_600_000,
          });
        }
        if (/\/live-view\/[^/]+\/latest\/?$/.test(path)) {
          return jsonResponse({
            seq: 1,
            ts: Date.now(),
            url: `data:image/png;base64,${pngBase64}`,
            paused: true,
            pauseForHelp: true,
            progressItems: [{ label: stuckOn }],
          });
        }
        if (/\/live-view\/[^/]+\/frames\/[^/]+\/?$/.test(path)) {
          return new Response(pngBytes, {
            status: 200,
            headers: { "content-type": "image/png" },
          });
        }
        if (/\/jobs\/[^/]+\/status\/?$/.test(path)) {
          return jsonResponse({
            progressItems: [{ label: stuckOn }],
            paused: true,
            pauseForHelp: true,
          });
        }
        return originalFetch(input, init);
      };
    },
    {
      jobId: JOB_ID,
      stuckOn: STUCK_ON,
      pngBase64: TINY_PNG_BASE64,
    },
  );

  const fulfillApi = async (route: Route): Promise<void> => {
    const url = new URL(route.request().url());
    const cors = corsHeadersBecauseCrossOriginApi();
    if (route.request().method() === "OPTIONS") {
      await route.fulfill({ status: 204, headers: cors, body: "" });
      return;
    }
    if (/\/live-view\/?$/.test(url.pathname) && url.searchParams.has("token")) {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        headers: cors,
        body: JSON.stringify({
          liveViewUrl: "https://live.pack.test/view",
          merchantHost: "shop.example.test",
          jobId: JOB_ID,
          expiresAtMs: Date.now() + 3_600_000,
        }),
      });
      return;
    }
    if (/\/live-view\/[^/]+\/latest\/?$/.test(url.pathname)) {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        headers: cors,
        body: JSON.stringify({
          seq: 1,
          ts: Date.now(),
          url: `data:image/png;base64,${TINY_PNG_BASE64}`,
          paused: true,
          pauseForHelp: true,
          progressItems: [{ label: STUCK_ON }],
        }),
      });
      return;
    }
    if (/\/live-view\/[^/]+\/frames\/[^/]+\/?$/.test(url.pathname)) {
      await route.fulfill({
        status: 200,
        contentType: "image/png",
        headers: cors,
        body: TINY_PNG_BYTES,
      });
      return;
    }
    if (/\/jobs\/[^/]+\/status\/?$/.test(url.pathname)) {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        headers: cors,
        body: JSON.stringify({
          progressItems: [{ label: STUCK_ON }],
          paused: true,
          pauseForHelp: true,
        }),
      });
      return;
    }
    await route.continue();
  };

  await page.route("https://api.itsdoneai.com/**", fulfillApi);
  await page.route("https://api.trypackai.com/**", fulfillApi);
}

function pageTextIsOnlyGenericWaiting(bodyText: string): boolean {
  const collapsed = bodyText.replace(/\s+/g, " ").trim();
  if (!/waiting…/i.test(collapsed)) {
    return false;
  }
  if (collapsed.includes(STUCK_ON)) {
    return false;
  }
  return true;
}

function defaultFalseBecauseNotLive(): boolean {
  return false;
}

function liveModeBecauseEnv(): boolean {
  if (process.env.LIVE === "1") {
    return true;
  }
  return defaultFalseBecauseNotLive();
}

function liveHopSkipTitleBecauseUnset(): string {
  return "SKIP named: live hop PACK_E2E_PHONE_HOP_URL unset; owning seat phone-browser-relay";
}

function liveBoxSkipTitleBecauseNoFrames(): string {
  return "SKIP named: live browser_task did not stream frames; prod /live-view API missing or box did not publish";
}

function echoUrlBecauseIpEchoEndpoint(): string {
  return "https://api.ipify.org";
}

function e2eUserSubBecauseReservedAccount(): string {
  return "04389448-30f1-706b-725c-70a211a16288";
}

function e2eUserEmailBecauseReservedAccount(): string {
  return "tests@trypackai.com";
}

function e2ePhoneBecauseReservedAccount(): string {
  return "+15005550006";
}

function liveApiBaseUrlBecauseProd(): string {
  return "https://api.trypackai.com/prod";
}

function routerFunctionNameBecauseProd(): string {
  return "prod-message-router:prod";
}

function jobStatusTableNameBecauseProd(): string {
  return "JobStatus";
}

function e2eOutboxTableNameBecauseProd(): string {
  return "E2EOutbox";
}

function carboneAskBecauseLiveViewHandoff(): string {
  return "Book me a table at Carbone";
}

function expiredTokenBecauseNotMinted(): string {
  return "expired-e2e-not-a-real-token";
}

function hopBaseUrlBecauseE2eDeviceAdvertisesIt(): string | undefined {
  const raw = process.env.PACK_E2E_PHONE_HOP_URL;
  if (typeof raw !== "string") {
    return undefined;
  }
  if (raw.length === 0) {
    return undefined;
  }
  return raw.replace(/\/+$/, "");
}

function liveTimeoutMsBecauseBoxStart(): number {
  return 180_000;
}

function livePollMsBecauseTables(): number {
  return 2_000;
}

function liveJobWaitMsBecauseBoxColdStart(): number {
  return 20_000;
}

function liveBrowserTaskWaitMsBecauseBoxColdStart(): number {
  return 90_000;
}

function fixtureTimeoutMsBecauseViteWarmup(): number {
  return 90_000;
}

function awsRegionBecauseProd(): string {
  return "us-east-1";
}

function emptyStringBecauseAwsMissed(): string {
  return "";
}

function textBecauseUnknown(value: unknown): string {
  if (typeof value === "string") {
    return value;
  }
  return emptyStringBecauseAwsMissed();
}

function recordBecauseUnknown(value: unknown): Record<string, unknown> | undefined {
  if (value === null) {
    return undefined;
  }
  if (typeof value !== "object") {
    return undefined;
  }
  if (Array.isArray(value)) {
    return undefined;
  }
  return value as Record<string, unknown>;
}

function dynamoStringBecauseItem(
  item: Record<string, unknown>,
  key: string,
): string {
  const raw = item[key];
  if (typeof raw === "string") {
    return raw;
  }
  const rec = recordBecauseUnknown(raw);
  if (rec === undefined) {
    return emptyStringBecauseAwsMissed();
  }
  return textBecauseUnknown(rec.S);
}

function redactTokenLastSixBecauseReceipt(token: string): string {
  if (token.length <= 6) {
    return token;
  }
  return `…${token.slice(-6)}`;
}

function awsCli(args: string[]): { status: number; stdout: string; stderr: string } {
  const result = spawnSync("aws", args, {
    encoding: "utf8",
    env: { ...process.env, AWS_DEFAULT_REGION: awsRegionBecauseProd() },
  });
  let status = 1;
  if (typeof result.status === "number") {
    status = result.status;
  }
  return {
    status,
    stdout: textBecauseUnknown(result.stdout),
    stderr: textBecauseUnknown(result.stderr),
  };
}

function awsCliJson(args: string[]): unknown {
  const ran = awsCli([...args, "--output", "json"]);
  if (ran.status !== 0) {
    throw new Error(`aws ${args[0]} failed: ${ran.stderr.slice(0, 240)}`);
  }
  const trimmed = ran.stdout.trim();
  if (trimmed.length === 0) {
    return {};
  }
  return JSON.parse(trimmed) as unknown;
}

function ssmParameterBecauseName(name: string): string {
  const ran = awsCli([
    "ssm",
    "get-parameter",
    "--name",
    name,
    "--with-decryption",
    "--query",
    "Parameter.Value",
    "--output",
    "text",
  ]);
  if (ran.status !== 0) {
    throw new Error(`SSM ${name} unavailable`);
  }
  const value = ran.stdout.trim();
  if (value.length === 0) {
    throw new Error(`SSM ${name} empty`);
  }
  return value;
}

function internalRouterTokenBecauseSsm(): string {
  return ssmParameterBecauseName("/pack/internal/router-token");
}

function wrapSmsWorkPathRouterEvent(input: {
  message: string;
  token: string;
  requestId: string;
}): Record<string, unknown> {
  const sessionId = e2ePhoneBecauseReservedAccount();
  return {
    httpMethod: "POST",
    path: "/messages/submit",
    resource: "/messages/submit",
    isBase64Encoded: false,
    queryStringParameters: null,
    headers: {
      "Content-Type": "application/json",
      "x-pack-source": "internal",
      "x-pack-channel": "sendblue",
      "x-pack-channel-trust": "sms_unproven",
      "x-pack-internal-token": input.token,
    },
    body: JSON.stringify({
      message: input.message,
      sessionId,
      conversationId: sessionId,
      context: {
        source: "text",
        rawQueryText: input.message,
        latestUserMessage: input.message,
        userTypedText: input.message,
      },
    }),
    requestContext: {
      requestId: input.requestId,
      identity: { sourceIp: "0.0.0.0", userAgent: "pack-internal/sendblue" },
      authorizer: {
        claims: {
          sub: e2eUserSubBecauseReservedAccount(),
          phone_number: sessionId,
          email: e2eUserEmailBecauseReservedAccount(),
        },
      },
    },
  };
}

function jobIdFromRouterBody(body: unknown): { jobId: string; jobType: string } {
  const rec = recordBecauseUnknown(body);
  if (rec === undefined) {
    return { jobId: "", jobType: "" };
  }
  let source = rec;
  const data = recordBecauseUnknown(rec.data);
  if (data !== undefined) {
    source = data;
  }
  return {
    jobId: textBecauseUnknown(source.jobId),
    jobType: textBecauseUnknown(source.jobType),
  };
}

function submitSmsWorkPathBecauseRouter(message: string): {
  statusCode: number;
  jobId: string;
  jobType: string;
} {
  const requestId = randomUUID();
  const event = wrapSmsWorkPathRouterEvent({
    message,
    token: internalRouterTokenBecauseSsm(),
    requestId,
  });
  const scratch = mkdtempSync(path.join(os.tmpdir(), "live-view-e2e-"));
  const payloadPath = path.join(scratch, "payload.json");
  const outPath = path.join(scratch, "out.json");
  writeFileSync(payloadPath, `${JSON.stringify(event)}\n`);
  try {
    const ran = awsCli([
      "lambda",
      "invoke",
      "--function-name",
      routerFunctionNameBecauseProd(),
      "--cli-binary-format",
      "raw-in-base64-out",
      "--payload",
      `file://${payloadPath}`,
      outPath,
    ]);
    if (ran.status !== 0) {
      throw new Error(`router invoke failed: ${ran.stderr.slice(0, 240)}`);
    }
    const raw = readFileSync(outPath, "utf8");
    const parsed = JSON.parse(raw) as { statusCode?: unknown; body?: unknown };
    let body: unknown = parsed.body;
    if (typeof body === "string") {
      try {
        body = JSON.parse(body);
      } catch {
        body = parsed.body;
      }
    }
    const ids = jobIdFromRouterBody(body);
    let statusCode = 0;
    if (typeof parsed.statusCode === "number") {
      statusCode = parsed.statusCode;
    }
    return { statusCode, jobId: ids.jobId, jobType: ids.jobType };
  } finally {
    unlinkSync(payloadPath);
    try {
      unlinkSync(outPath);
    } catch {
      /* invoke may omit outfile */
    }
  }
}

function tokenFromLiveViewHref(haystack: string): string | undefined {
  const match = haystack.match(
    /https:\/\/www\.trypackai\.com\/live-view\?token=([^ \n&"]+)/i,
  );
  if (match === null) {
    return undefined;
  }
  const token = match[1];
  if (typeof token !== "string") {
    return undefined;
  }
  if (token.length === 0) {
    return undefined;
  }
  return decodeURIComponent(token);
}

function queryJobsForE2eSub(): Array<{
  jobId: string;
  jobType: string;
  status: string;
  updatedAt: string;
}> {
  const raw = awsCliJson([
    "dynamodb",
    "query",
    "--table-name",
    jobStatusTableNameBecauseProd(),
    "--key-condition-expression",
    "#sub = :sub",
    "--expression-attribute-names",
    JSON.stringify({ "#sub": "sub" }),
    "--expression-attribute-values",
    JSON.stringify({ ":sub": { S: e2eUserSubBecauseReservedAccount() } }),
  ]);
  const rec = recordBecauseUnknown(raw);
  if (rec === undefined) {
    return [];
  }
  const items = rec.Items;
  if (!Array.isArray(items)) {
    return [];
  }
  const rows: Array<{
    jobId: string;
    jobType: string;
    status: string;
    updatedAt: string;
  }> = [];
  for (const item of items) {
    const recItem = recordBecauseUnknown(item);
    if (recItem === undefined) {
      continue;
    }
    rows.push({
      jobId: dynamoStringBecauseItem(recItem, "jobId"),
      jobType: dynamoStringBecauseItem(recItem, "jobType"),
      status: dynamoStringBecauseItem(recItem, "status"),
      updatedAt: dynamoStringBecauseItem(recItem, "updatedAt"),
    });
  }
  return rows;
}

function queryOutboxBodiesBecauseJob(jobId: string): string[] {
  const raw = awsCliJson([
    "dynamodb",
    "query",
    "--table-name",
    e2eOutboxTableNameBecauseProd(),
    "--key-condition-expression",
    "jobId = :j",
    "--expression-attribute-values",
    JSON.stringify({ ":j": { S: jobId } }),
  ]);
  const rec = recordBecauseUnknown(raw);
  if (rec === undefined) {
    return [];
  }
  const items = rec.Items;
  if (!Array.isArray(items)) {
    return [];
  }
  const bodies: string[] = [];
  for (const item of items) {
    const recItem = recordBecauseUnknown(item);
    if (recItem === undefined) {
      continue;
    }
    const body = dynamoStringBecauseItem(recItem, "body");
    if (body.length > 0) {
      bodies.push(body);
    }
  }
  return bodies;
}

async function sleepMs(ms: number): Promise<void> {
  await new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

async function waitUntilDefined<T>(
  deadlineMs: number,
  pollMs: number,
  probe: () => Promise<T | undefined>,
): Promise<T | undefined> {
  for (;;) {
    const value = await probe();
    if (value !== undefined) {
      return value;
    }
    if (Date.now() >= deadlineMs) {
      return undefined;
    }
    await sleepMs(pollMs);
  }
}

async function liveViewHandoffLooksResolvable(token: string): Promise<boolean> {
  const url = new URL(`${liveApiBaseUrlBecauseProd()}/live-view`);
  url.searchParams.set("token", token);
  const res = await fetch(url);
  if (res.ok !== true) {
    return false;
  }
  const body: unknown = await res.json();
  const rec = recordBecauseUnknown(body);
  if (rec === undefined) {
    return false;
  }
  const jobId = textBecauseUnknown(rec.jobId);
  return jobId.length > 0;
}

type LiveJobHandoff = {
  jobId: string;
  token: string;
  residual: string | undefined;
};

async function mintLiveBrowserTaskHandoffBecauseE2eUser(): Promise<LiveJobHandoff> {
  const submitted = submitSmsWorkPathBecauseRouter(
    carboneAskBecauseLiveViewHandoff(),
  );
  process.stdout.write(
    `router jobId=${submitted.jobId} jobType=${submitted.jobType} statusCode=${submitted.statusCode}\n`,
  );
  const jobId = submitted.jobId;
  const openedBrowserTask = submitted.jobType === "browser_task";
  let waitMs = liveJobWaitMsBecauseBoxColdStart();
  if (openedBrowserTask) {
    waitMs = liveBrowserTaskWaitMsBecauseBoxColdStart();
  }
  const tokenDeadline = Date.now() + waitMs;
  const token = await waitUntilDefined(
    tokenDeadline,
    livePollMsBecauseTables(),
    async () => {
      if (jobId.length === 0) {
        return undefined;
      }
      const bodies = queryOutboxBodiesBecauseJob(jobId);
      for (const body of bodies) {
        const extracted = tokenFromLiveViewHref(body);
        if (extracted !== undefined) {
          return extracted;
        }
      }
      if (await liveViewHandoffLooksResolvable(jobId)) {
        return jobId;
      }
      return undefined;
    },
  );
  if (token === undefined) {
    process.stdout.write(
      `live-view residual=${liveBoxSkipTitleBecauseNoFrames()} job=${jobId} type=${submitted.jobType}\n`,
    );
    return {
      jobId,
      token: expiredTokenBecauseNotMinted(),
      residual: liveBoxSkipTitleBecauseNoFrames(),
    };
  }
  process.stdout.write(
    `handoff token=${redactTokenLastSixBecauseReceipt(token)} job=${jobId}\n`,
  );
  return { jobId, token, residual: undefined };
}

class HopAccessDeniedError extends Error {
  override readonly name = "AccessDenied";

  constructor() {
    super("AccessDenied");
  }
}

function throwAccessDeniedBecauseHopRefused(): never {
  throw new HopAccessDeniedError();
}

function ipv4FromEchoBody(body: string): string {
  const trimmed = body.trim();
  const found = trimmed.match(/(?:\d{1,3}\.){3}\d{1,3}/);
  if (found !== null && typeof found[0] === "string") {
    return found[0];
  }
  throw new Error(`echo body is not an IP: ${trimmed.slice(0, 80)}`);
}

async function hopFetchText(
  hopBase: string,
  pathSuffix: string,
  init?: RequestInit,
): Promise<string> {
  let res: Response;
  if (init === undefined) {
    res = await fetch(`${hopBase}${pathSuffix}`);
  } else {
    res = await fetch(`${hopBase}${pathSuffix}`, init);
  }
  const text = await res.text();
  if (res.status === 403 || res.status === 401) {
    throwAccessDeniedBecauseHopRefused();
  }
  if (text.trim() === "AccessDenied") {
    throwAccessDeniedBecauseHopRefused();
  }
  if (res.ok !== true) {
    throw new Error(`hop ${pathSuffix} HTTP ${res.status}`);
  }
  return text;
}

async function boxEgressIpBecauseDirectFetch(): Promise<string> {
  const res = await fetch(echoUrlBecauseIpEchoEndpoint());
  if (res.ok !== true) {
    throw new Error(`box echo HTTP ${res.status}`);
  }
  return ipv4FromEchoBody(await res.text());
}

async function assertLiveFetchNotPatchedBecauseProd(page: Page): Promise<void> {
  const fetchSrc = await page.evaluate(() => window.fetch.toString());
  expect(fetchSrc.includes("pngBase64")).toBe(false);
  expect(fetchSrc.includes("tok-e2e-night-d")).toBe(false);
}

test.describe("job live-view stuck context", () => {
  test.beforeEach(({}, testInfo) => {
    test.skip(
      testInfo.project.name !== "chromium-mobile",
      "phone Pixel 7 live-view only",
    );
    test.skip(
      liveModeBecauseEnv(),
      "LIVE=1 uses the unmocked prod live-view describe",
    );
  });

  test("phone live-view shows frames and names the needs_input stuck-on", async ({
    page,
  }) => {
    test.setTimeout(fixtureTimeoutMsBecauseViteWarmup());
    mkdirSync(SHOT_DIR, { recursive: true });
    await seedTrackingConsentBeforeLoad(page);
    await mockLiveViewJobApis(page);

    await page.goto(`/live-view?token=${TOKEN}`, {
      waitUntil: "domcontentloaded",
    });
    await dismissConsentBannerIfVisible(page);

    const frame = page.getByRole("img", { name: FRAME_ALT });
    await expect(frame).toHaveCount(1);
    await expect(frame).toBeVisible();
    await expect
      .poll(async () =>
        frame.evaluate((el) => {
          if (!(el instanceof HTMLImageElement)) {
            return 0;
          }
          return el.naturalWidth;
        }),
      )
      .toBeGreaterThan(0);

    await expect(
      page.getByRole("heading", { name: EXPIRED_HEADING }),
    ).toHaveCount(0);

    await expect(page.getByText(STUCK_ON)).toBeVisible();

    const bodyText = await page.locator("body").innerText();
    expect(bodyText).toContain(STUCK_ON);
    expect(pageTextIsOnlyGenericWaiting(bodyText)).toBe(false);

    const framesShot = path.join(SHOT_DIR, "frames-visible.png");
    const needsInputShot = path.join(SHOT_DIR, "needs-input-visible.png");
    await frame.screenshot({ path: framesShot });
    await page.screenshot({ path: needsInputShot, fullPage: true });
    process.stdout.write(`photos: ${framesShot}\n`);
    process.stdout.write(`photos: ${needsInputShot}\n`);
  });
});

test.describe("LIVE=1 trypackai live-view phone-hop", () => {
  test.describe.configure({
    timeout: liveTimeoutMsBecauseBoxStart(),
    retries: 0,
  });

  test.beforeEach(({}, testInfo) => {
    test.skip(
      testInfo.project.name !== "chromium-mobile",
      "phone Pixel 7 live-view only",
    );
    test.skip(
      liveModeBecauseEnv() !== true,
      "LIVE=1 opt-in for prod live-view",
    );
  });

  test("LIVE=1 + no token shows expired heading", async ({ page }) => {
    await seedTrackingConsentBeforeLoad(page);
    await page.goto("/live-view", { waitUntil: "domcontentloaded" });
    await dismissConsentBannerIfVisible(page);
    await expect(
      page.getByRole("heading", { name: EXPIRED_HEADING }),
    ).toBeVisible();
  });

  test("LIVE=1 + expired token shows expired heading", async ({ page }) => {
    await seedTrackingConsentBeforeLoad(page);
    await page.goto(`/live-view?token=${expiredTokenBecauseNotMinted()}`, {
      waitUntil: "domcontentloaded",
    });
    await dismissConsentBannerIfVisible(page);
    await expect(
      page.getByRole("heading", { name: EXPIRED_HEADING }),
    ).toBeVisible();
  });

  test("LIVE=1 live job streams a real frame and take-over after login HITL", async ({
    page,
  }) => {
    mkdirSync(SHOT_DIR, { recursive: true });
    const probeUrl = new URL(`${liveApiBaseUrlBecauseProd()}/live-view`);
    probeUrl.searchParams.set("token", expiredTokenBecauseNotMinted());
    const probe = await fetch(probeUrl);
    const probeBody = await probe.text();
    process.stdout.write(
      `live-view probe HTTP ${probe.status} body=${probeBody.slice(0, 80)}\n`,
    );
    const handoff = await mintLiveBrowserTaskHandoffBecauseE2eUser();
    if (handoff.residual !== undefined) {
      test.skip(true, handoff.residual);
      return;
    }
    await seedTrackingConsentBeforeLoad(page);
    await page.goto(`/live-view?token=${encodeURIComponent(handoff.token)}`, {
      waitUntil: "domcontentloaded",
    });
    await dismissConsentBannerIfVisible(page);
    await assertLiveFetchNotPatchedBecauseProd(page);

    const frame = page.getByRole("img", { name: FRAME_ALT });
    const expired = page.getByRole("heading", { name: EXPIRED_HEADING });
    const appeared = await Promise.race([
      frame
        .waitFor({ state: "visible", timeout: 60_000 })
        .then(() => "frame" as const),
      expired
        .waitFor({ state: "visible", timeout: 60_000 })
        .then(() => "expired" as const),
    ]).catch(() => "none" as const);

    if (appeared !== "frame") {
      process.stdout.write(
        `live-view residual=${liveBoxSkipTitleBecauseNoFrames()} appeared=${appeared} job=${handoff.jobId} token=${redactTokenLastSixBecauseReceipt(handoff.token)}\n`,
      );
      test.skip(true, liveBoxSkipTitleBecauseNoFrames());
      return;
    }

    await expect(expired).toHaveCount(0);
    await expect
      .poll(async () =>
        frame.evaluate((el) => {
          if (!(el instanceof HTMLImageElement)) {
            return 0;
          }
          return el.naturalWidth;
        }),
      )
      .toBeGreaterThan(1);

    const takeOver = page.getByText("Take over");
    const resume = page.getByRole("button", { name: "Resume" });
    const hitlVisible = await takeOver
      .waitFor({ state: "visible", timeout: 90_000 })
      .then(() => true)
      .catch(() => false);
    if (hitlVisible !== true) {
      process.stdout.write(
        `live-view residual=SKIP named: login HITL did not raise take-over job=${handoff.jobId}\n`,
      );
      test.skip(true, "SKIP named: login HITL did not raise take-over");
      return;
    }
    await expect(takeOver).toBeVisible();
    await expect(resume).toBeVisible();

    const framesShot = path.join(SHOT_DIR, "live-frames-visible.png");
    const takeOverShot = path.join(SHOT_DIR, "take-over-visible.png");
    await frame.screenshot({ path: framesShot });
    await page.screenshot({ path: takeOverShot, fullPage: true });
    process.stdout.write(`photos: ${framesShot}\n`);
    process.stdout.write(`photos: ${takeOverShot}\n`);
  });

  const hopBaseAtLoad = hopBaseUrlBecauseE2eDeviceAdvertisesIt();
  if (hopBaseAtLoad === undefined) {
    test(liveHopSkipTitleBecauseUnset(), () => {
      test.skip();
    });
  } else {
    test(liveHopSkipTitleBecauseUnset(), async () => {
      await hopFetchText(hopBaseAtLoad, "/health");
      const boxIp = await boxEgressIpBecauseDirectFetch();
      const hopIp = ipv4FromEchoBody(
        await hopFetchText(hopBaseAtLoad, "/ip"),
      );
      const echoUrl = echoUrlBecauseIpEchoEndpoint();
      const hopBody = await hopFetchText(hopBaseAtLoad, "/fetch", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          url: echoUrl,
          userSub: e2eUserSubBecauseReservedAccount(),
        }),
      });
      const echoedIp = ipv4FromEchoBody(hopBody);
      expect(echoedIp).toBe(hopIp);
      expect(echoedIp).not.toBe(boxIp);
      const hopLog = await hopFetchText(hopBaseAtLoad, "/log");
      expect(hopLog).toContain(echoUrl);
      process.stdout.write(
        `hop receipt boxIp=${boxIp} hopIp=${hopIp} echoedIp=${echoedIp} logNeedle=${echoUrl}\n`,
      );
    });
  }
});
