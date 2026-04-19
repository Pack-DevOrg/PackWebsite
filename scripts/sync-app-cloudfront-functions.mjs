#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

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
  const describe = JSON.parse(
    run("aws", [
      "cloudfront",
      "describe-function",
      "--name",
      target.name,
      "--stage",
      "LIVE",
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
    `Comment=${describe.FunctionSummary.FunctionConfig.Comment},Runtime=${describe.FunctionSummary.FunctionConfig.Runtime}`,
    "--function-code",
    `fileb://${target.sourcePath}`,
  ]);

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
