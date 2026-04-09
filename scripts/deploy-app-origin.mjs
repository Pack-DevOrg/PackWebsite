import { execFileSync } from "node:child_process";
import { rmSync } from "node:fs";
import { resolve } from "node:path";

const distDir = resolve("dist");
const appAlias =
  process.env.PACK_APP_DISTRIBUTION_ALIAS?.trim() ||
  process.env.PACK_APP_DOMAIN?.trim() ||
  "www.trypackai.com";
const allowSharedDistribution =
  process.env.PACK_ALLOW_SHARED_APP_DISTRIBUTION === "1";

const run = (command, args) => {
  execFileSync(command, args, {
    stdio: "inherit",
    cwd: process.cwd(),
    env: process.env,
  });
};

const captureJson = (command, args) =>
  JSON.parse(
    execFileSync(command, args, {
      encoding: "utf8",
      cwd: process.cwd(),
      env: process.env,
    }),
  );

const inferBucketFromOriginDomain = (originDomain) => {
  const websiteMatch = originDomain.match(
    /^(?<bucket>.+)\.s3-website[.-][^.]+\.amazonaws\.com$/i,
  );
  if (websiteMatch?.groups?.bucket) {
    return `s3://${websiteMatch.groups.bucket}`;
  }

  const regionalMatch = originDomain.match(
    /^(?<bucket>.+)\.s3[.-][^.]+\.amazonaws\.com$/i,
  );
  if (regionalMatch?.groups?.bucket) {
    return `s3://${regionalMatch.groups.bucket}`;
  }

  const globalMatch = originDomain.match(
    /^(?<bucket>.+)\.s3\.amazonaws\.com$/i,
  );
  if (globalMatch?.groups?.bucket) {
    return `s3://${globalMatch.groups.bucket}`;
  }

  throw new Error(
    `CloudFront origin ${originDomain} is not an S3 origin. Set PACK_APP_BUCKET explicitly before deploying.`,
  );
};

const resolveDistribution = () => {
  const explicitId = process.env.PACK_APP_DISTRIBUTION_ID?.trim();
  if (explicitId) {
    return {
      id: explicitId,
      aliases: [],
    };
  }

  const response = captureJson("aws", [
    "cloudfront",
    "list-distributions",
    "--query",
    "DistributionList.Items[]",
    "--output",
    "json",
  ]);

  const matchingDistribution = response.find((distribution) =>
    distribution.Aliases?.Items?.includes(appAlias),
  );

  if (!matchingDistribution?.Id) {
    throw new Error(
      `No CloudFront distribution found for alias ${appAlias}. Set PACK_APP_DISTRIBUTION_ID to deploy explicitly.`,
    );
  }

  const aliases = matchingDistribution.Aliases?.Items || [];
  const sharesLegacyAlias = aliases.some(
    (alias) =>
      alias !== appAlias &&
      alias !== "trypackai.com" &&
      !alias.endsWith(".trypackai.com"),
  );

  if (sharesLegacyAlias && !allowSharedDistribution) {
    throw new Error(
      `Distribution ${matchingDistribution.Id} for ${appAlias} still shares legacy aliases (${aliases.join(
        ", ",
      )}). Duplicate CloudFront first, then rerun with PACK_APP_DISTRIBUTION_ID pointing at the trypack-only distribution.`,
    );
  }

  return {
    id: matchingDistribution.Id,
    aliases,
    originDomain:
      matchingDistribution.Origins?.Items?.[0]?.DomainName || null,
  };
};

const appDistribution = resolveDistribution();
const appDistributionId = appDistribution.id;
const appBucket =
  process.env.PACK_APP_BUCKET?.trim() ||
  inferBucketFromOriginDomain(appDistribution.originDomain || "");

console.log(
  `[deploy] Deploying app-origin build to ${appBucket} via CloudFront ${appDistributionId} (${appAlias}).`,
);

run("npm", ["run", "legal:check"]);
run("npm", ["run", "build:app-origin"]);

rmSync(resolve(distDir, "app"), { recursive: true, force: true });
rmSync(resolve(distDir, "auth", "callback"), { recursive: true, force: true });

run("aws", [
  "s3",
  "sync",
  `${distDir}/`,
  appBucket,
  "--delete",
  "--exclude",
  "assets/*",
  "--exclude",
  "*.html",
]);
run("aws", [
  "s3",
  "sync",
  `${distDir}/assets/`,
  `${appBucket}/assets/`,
  "--delete",
  "--cache-control",
  "public, max-age=31536000, immutable",
]);
run("aws", [
  "s3",
  "cp",
  `${distDir}/`,
  appBucket,
  "--recursive",
  "--exclude",
  "*",
  "--include",
  "*.html",
  "--cache-control",
  "no-cache, no-store, must-revalidate",
  "--content-type",
  "text/html",
  "--metadata-directive",
  "REPLACE",
]);
run("aws", [
  "cloudfront",
  "create-invalidation",
  "--distribution-id",
  appDistributionId,
  "--paths",
  "/*",
]);
