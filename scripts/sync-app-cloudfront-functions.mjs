#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import os from "node:os";
import { shippedCodeBecauseSource } from "./cloudfront-function-code.mjs";

const rootDir = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const sourceDir = path.join(rootDir, "scripts", "cloudfront");

const functions = [
  {
    name: "app-origin-root-redirect-v2",
    sourcePath: path.join(sourceDir, "app-origin-viewer-request.js"),
  },
  {
    name: "app-origin-security-headers-v1",
    sourcePath: path.join(sourceDir, "app-origin-viewer-response.js"),
  },
];

function run(command, args) {
  return execFileSync(command, args, {
    cwd: rootDir,
    env: process.env,
    encoding: "utf8",
  }).trim();
}

for (const target of functions) {
  const shippedPath = path.join(fs.mkdtempSync(path.join(os.tmpdir(), "cf-fn-")), path.basename(target.sourcePath));
  fs.writeFileSync(shippedPath, shippedCodeBecauseSource(target.sourcePath));
  const describe = JSON.parse(
    run("aws", [
      "cloudfront",
      "describe-function",
      "--name",
      target.name,
      // update-function's If-Match must be the DEVELOPMENT-stage ETag; the
      // LIVE ETag diverges as soon as an unpublished edit exists
      // (PreconditionFailed on 2026-09-11).
      "--stage",
      "DEVELOPMENT",
      "--output",
      "json",
    ]),
  );

  const eTag = describe.ETag;
  if (!eTag) {
    throw new Error(`Missing ETag for CloudFront function ${target.name}`);
  }

  run("aws", [
    "cloudfront",
    "update-function",
    "--name",
    target.name,
    "--if-match",
    eTag,
    "--function-config",
    // JSON keeps the function's KeyValueStore associations (the Pack Test Store key lives in one).
    JSON.stringify(describe.FunctionSummary.FunctionConfig),
    "--function-code",
    `fileb://${shippedPath}`,
  ]);

  // Run the shipped code once in CloudFront's own sandbox before it goes live. A syntax or runtime
  // error here aborts the deploy; a role without cloudfront:TestFunction only warns.
  {
    const probe = path.join(path.dirname(shippedPath), "event.json");
    fs.writeFileSync(
      probe,
      JSON.stringify({
        version: "1.0",
        context: { eventType: target.name.includes("headers") ? "viewer-response" : "viewer-request" },
        viewer: { ip: "203.0.113.9" },
        request: { method: "GET", uri: "/features", querystring: {}, headers: { host: { value: "www.trypackai.com" } }, cookies: {} },
        ...(target.name.includes("headers") ? { response: { statusCode: 200, statusDescription: "OK", headers: {}, cookies: {} } } : {}),
      }),
    );
    try {
      const result = JSON.parse(
        run("aws", ["cloudfront", "test-function", "--name", target.name, "--if-match", JSON.parse(run("aws", ["cloudfront", "describe-function", "--name", target.name, "--stage", "DEVELOPMENT", "--output", "json"])).ETag, "--stage", "DEVELOPMENT", "--event-object", `fileb://${probe}`, "--output", "json"]),
      );
      if (result.TestResult?.FunctionErrorMessage) {
        throw new Error(`CloudFront test-function failed for ${target.name}: ${result.TestResult.FunctionErrorMessage}`);
      }
    } catch (error) {
      if (!/AccessDenied/.test(String(error?.stderr ?? error?.message))) {
        throw error;
      }
      console.warn(`test-function skipped for ${target.name}: role lacks cloudfront:TestFunction`);
    }
  }

  const updated = JSON.parse(
    run("aws", [
      "cloudfront",
      "describe-function",
      "--name",
      target.name,
      "--stage",
      "DEVELOPMENT",
      "--output",
      "json",
    ]),
  );

  run("aws", [
    "cloudfront",
    "publish-function",
    "--name",
    target.name,
    "--if-match",
    updated.ETag,
  ]);

  console.log(`Updated and published ${target.name}`);
}
