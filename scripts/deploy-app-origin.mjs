import { execFileSync } from "node:child_process";
import { rmSync } from "node:fs";
import { resolve } from "node:path";

const appBucket = "s3://app.itsdoneai.com";
const appDistributionId = "E16TJ272T18VKQ";
const distDir = resolve("dist");

const run = (command, args) => {
  execFileSync(command, args, {
    stdio: "inherit",
    cwd: process.cwd(),
    env: process.env,
  });
};

run("npm", ["run", "legal:check"]);
run("npm", ["run", "build:app-origin"]);

rmSync(resolve(distDir, "app"), { recursive: true, force: true });
rmSync(resolve(distDir, "auth", "callback"), { recursive: true, force: true });

run("aws", ["s3", "sync", `${distDir}/`, appBucket, "--delete"]);
run("aws", [
  "cloudfront",
  "create-invalidation",
  "--distribution-id",
  appDistributionId,
  "--paths",
  "/*",
]);
