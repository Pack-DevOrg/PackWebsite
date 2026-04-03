import { execFileSync } from "node:child_process";
import { rmSync } from "node:fs";
import { resolve } from "node:path";

const distDir = resolve("dist");
const appAlias =
  process.env.DONEAI_APP_DISTRIBUTION_ALIAS?.trim() ||
  process.env.DONEAI_APP_DOMAIN?.trim() ||
  "app.trypackai.com";
const appBucket = process.env.DONEAI_APP_BUCKET?.trim() || `s3://${appAlias}`;
const allowSharedDistribution =
  process.env.DONEAI_ALLOW_SHARED_APP_DISTRIBUTION === "1";

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

const resolveDistribution = () => {
  const explicitId = process.env.DONEAI_APP_DISTRIBUTION_ID?.trim();
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
      `No CloudFront distribution found for alias ${appAlias}. Set DONEAI_APP_DISTRIBUTION_ID to deploy explicitly.`,
    );
  }

  const aliases = matchingDistribution.Aliases?.Items || [];
  const sharesLegacyAlias = aliases.some(
    (alias) => alias !== appAlias && alias.endsWith(".itsdoneai.com"),
  );

  if (sharesLegacyAlias && !allowSharedDistribution) {
    throw new Error(
      `Distribution ${matchingDistribution.Id} for ${appAlias} still shares legacy aliases (${aliases.join(
        ", ",
      )}). Duplicate CloudFront first, then rerun with DONEAI_APP_DISTRIBUTION_ID pointing at the trypack-only distribution.`,
    );
  }

  return {
    id: matchingDistribution.Id,
    aliases,
  };
};

const appDistribution = resolveDistribution();
const appDistributionId = appDistribution.id;

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
