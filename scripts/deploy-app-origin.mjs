import { execFileSync } from "node:child_process";
import { readFileSync, rmSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const DEFAULT_APP_ALIAS_BECAUSE_WWW_TRYPACKAI = "www.trypackai.com";
const DEFAULT_VERIFY_ROUTE_BECAUSE_UNDEPLOYED_ONBOARD = "/onboard";
const ONBOARD_STEP_TOKEN = 'data-testid="onboard-step"';
const ONBOARD_HEADING_TOKEN = "Onboard | Pack";
const MERGED_FILE_TO_PUBLIC_ROUTE = Object.freeze({
  "src/pages/OnboardPage.tsx": "/onboard",
});

export function defaultAppAliasBecauseWwwTrypackai(env = process.env) {
  const fromAlias = env.PACK_APP_DISTRIBUTION_ALIAS;
  if (typeof fromAlias === "string") {
    const trimmed = fromAlias.trim();
    if (trimmed) {
      return trimmed;
    }
  }
  const fromDomain = env.PACK_APP_DOMAIN;
  if (typeof fromDomain === "string") {
    const trimmed = fromDomain.trim();
    if (trimmed) {
      return trimmed;
    }
  }
  return DEFAULT_APP_ALIAS_BECAUSE_WWW_TRYPACKAI;
}

export function parseCommaSeparatedPathsBecauseEnvList(raw) {
  if (typeof raw !== "string" || raw.length === 0) {
    return [];
  }
  const paths = [];
  for (const part of raw.split(",")) {
    const trimmed = part.trim();
    if (trimmed) {
      paths.push(trimmed);
    }
  }
  return paths;
}

export function publicRouteBecausePath(path) {
  const trimmed = path.trim();
  if (!trimmed || trimmed === "/") {
    return "/";
  }
  const withSlash = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
  if (withSlash.length > 1 && withSlash.endsWith("/")) {
    return withSlash.slice(0, -1);
  }
  return withSlash;
}

export function resolveVerifyRoutesBecauseMergedOnboard(env = process.env) {
  const fromEnv = parseCommaSeparatedPathsBecauseEnvList(env.PACK_VERIFY_ROUTES);
  if (fromEnv.length > 0) {
    return fromEnv.map(publicRouteBecausePath);
  }
  const mergedFiles = parseCommaSeparatedPathsBecauseEnvList(env.PACK_MERGED_FILES);
  const fromFiles = [];
  const seen = new Set();
  for (const file of mergedFiles) {
    const route = MERGED_FILE_TO_PUBLIC_ROUTE[file];
    if (route && !seen.has(route)) {
      seen.add(route);
      fromFiles.push(route);
    }
  }
  if (fromFiles.length > 0) {
    return fromFiles;
  }
  return [DEFAULT_VERIFY_ROUTE_BECAUSE_UNDEPLOYED_ONBOARD];
}

export function distHtmlPathForRoute(distDir, route) {
  const publicRoute = publicRouteBecausePath(route);
  if (publicRoute === "/") {
    return resolve(distDir, "index.html");
  }
  return resolve(distDir, publicRoute.slice(1), "index.html");
}

export function defaultDistDirBecauseCwd(cwd = process.cwd()) {
  return resolve(cwd, "dist");
}

export function defaultFetchBecauseGlobalFetch() {
  return globalThis.fetch;
}

export function defaultReadFileSyncBecauseUtf8() {
  return (path) => readFileSync(path, { encoding: "utf8" });
}

export function defaultExecFileSyncBecauseChildProcess() {
  return execFileSync;
}

export function isDirectCliBecauseArgv1(argv1, moduleUrl) {
  if (typeof argv1 !== "string" || argv1.length === 0) {
    return false;
  }
  return fileURLToPath(moduleUrl) === resolve(argv1);
}

function cloudFrontAliasesBecauseItems(items) {
  if (Array.isArray(items)) {
    return items;
  }
  return [];
}

function originDomainBecauseTarget(targetOrigin) {
  if (targetOrigin && typeof targetOrigin.DomainName === "string") {
    return targetOrigin.DomainName;
  }
  return null;
}

function defaultAppBucketBecauseOriginDomain(env, originDomain) {
  const fromEnv = env.PACK_APP_BUCKET;
  if (typeof fromEnv === "string") {
    const trimmed = fromEnv.trim();
    if (trimmed) {
      return trimmed;
    }
  }
  return inferBucketFromOriginDomain(originDomain);
}

function allowSharedDistributionBecauseFlag(env) {
  return env.PACK_ALLOW_SHARED_APP_DISTRIBUTION === "1";
}

function inferBucketFromOriginDomain(originDomain) {
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
}

function distinctiveTokenBecauseRouteHtml(route, routeHtml, homeHtml) {
  if (route === "/onboard") {
    if (routeHtml.includes(ONBOARD_STEP_TOKEN)) {
      return ONBOARD_STEP_TOKEN;
    }
    if (routeHtml.includes(ONBOARD_HEADING_TOKEN)) {
      return ONBOARD_HEADING_TOKEN;
    }
    throw new Error(
      `Local dist HTML for /onboard has neither ${ONBOARD_STEP_TOKEN} nor onboard heading.`,
    );
  }
  const titleMatch = routeHtml.match(/<title>([^<]+)<\/title>/i);
  if (titleMatch && titleMatch[1] && homeHtml.indexOf(titleMatch[1]) === -1) {
    return titleMatch[1];
  }
  const testIdMatch = routeHtml.match(/data-testid="[^"]+"/);
  if (testIdMatch && homeHtml.indexOf(testIdMatch[0]) === -1) {
    return testIdMatch[0];
  }
  throw new Error(`No distinctive token for ${route} versus dist/index.html.`);
}

function deployFailureMessage(error) {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
}

export async function verifyLiveMergedRoutes(options = {}) {
  const env = options.env !== undefined ? options.env : process.env;
  const alias =
    options.alias !== undefined
      ? options.alias
      : defaultAppAliasBecauseWwwTrypackai(env);
  const routes =
    options.routes !== undefined
      ? options.routes
      : resolveVerifyRoutesBecauseMergedOnboard(env);
  const distDir =
    options.distDir !== undefined
      ? options.distDir
      : defaultDistDirBecauseCwd();
  const fetchImpl =
    options.fetchImpl !== undefined
      ? options.fetchImpl
      : defaultFetchBecauseGlobalFetch();
  const readFileImpl =
    options.readFileImpl !== undefined
      ? options.readFileImpl
      : defaultReadFileSyncBecauseUtf8();

  if (typeof fetchImpl !== "function") {
    throw new Error("fetch is not available to verify live merged routes.");
  }

  const homeHtml = readFileImpl(distHtmlPathForRoute(distDir, "/"));
  for (const rawRoute of routes) {
    const route = publicRouteBecausePath(rawRoute);
    const routeHtml =
      route === "/"
        ? homeHtml
        : readFileImpl(distHtmlPathForRoute(distDir, route));
    const token = distinctiveTokenBecauseRouteHtml(route, routeHtml, homeHtml);
    const url = `https://${alias}${route}`;
    const response = await fetchImpl(url);
    if (!response || typeof response.status !== "number") {
      throw new Error(`Live ${url} fetch returned no HTTP status.`);
    }
    if (response.status !== 200) {
      throw new Error(
        `Live ${url} returned HTTP ${response.status}; expected 200.`,
      );
    }
    const liveBody = await response.text();
    if (typeof liveBody !== "string") {
      throw new Error(`Live ${url} body is not text.`);
    }
    if (route !== "/" && liveBody === homeHtml) {
      throw new Error(
        `Live ${url} is still the home/index shell after CloudFront invalidation.`,
      );
    }
    if (!liveBody.includes(token)) {
      throw new Error(
        `Live ${url} lacks ${token} from dist${route === "/" ? "" : route}/index.html.`,
      );
    }
  }
}

export async function runDeployAppOrigin(options = {}) {
  const env = options.env !== undefined ? options.env : process.env;
  const cwd = options.cwd !== undefined ? options.cwd : process.cwd();
  const exec =
    options.execFileSync !== undefined
      ? options.execFileSync
      : defaultExecFileSyncBecauseChildProcess();
  const fetchImpl =
    options.fetchImpl !== undefined
      ? options.fetchImpl
      : defaultFetchBecauseGlobalFetch();
  const readFileImpl =
    options.readFileImpl !== undefined
      ? options.readFileImpl
      : defaultReadFileSyncBecauseUtf8();
  const distDir =
    options.distDir !== undefined
      ? options.distDir
      : defaultDistDirBecauseCwd(cwd);
  const appAlias = defaultAppAliasBecauseWwwTrypackai(env);
  const allowSharedDistribution = allowSharedDistributionBecauseFlag(env);

  const run = (command, args) => {
    exec(command, args, {
      stdio: "inherit",
      cwd,
      env,
    });
  };

  const captureJson = (command, args) =>
    JSON.parse(
      exec(command, args, {
        encoding: "utf8",
        cwd,
        env,
      }),
    );

  const resolveDistribution = () => {
    const explicitIdRaw = env.PACK_APP_DISTRIBUTION_ID;
    const explicitId =
      typeof explicitIdRaw === "string" ? explicitIdRaw.trim() : "";
    if (explicitId) {
      const distribution = captureJson("aws", [
        "cloudfront",
        "get-distribution",
        "--id",
        explicitId,
        "--query",
        "Distribution",
        "--output",
        "json",
      ]);
      const targetOriginId = distribution.DefaultCacheBehavior?.TargetOriginId;
      const targetOrigin = distribution.Origins?.Items?.find(
        (origin) => origin.Id === targetOriginId,
      );
      return {
        id: explicitId,
        aliases: cloudFrontAliasesBecauseItems(distribution.Aliases?.Items),
        originDomain: originDomainBecauseTarget(targetOrigin),
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
      cloudFrontAliasesBecauseItems(distribution.Aliases?.Items).includes(
        appAlias,
      ),
    );

    if (!matchingDistribution?.Id) {
      throw new Error(
        `No CloudFront distribution found for alias ${appAlias}. Set PACK_APP_DISTRIBUTION_ID to deploy explicitly.`,
      );
    }

    const aliases = cloudFrontAliasesBecauseItems(
      matchingDistribution.Aliases?.Items,
    );
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

    const targetOriginId =
      matchingDistribution.DefaultCacheBehavior?.TargetOriginId;
    const targetOrigin = matchingDistribution.Origins?.Items?.find(
      (origin) => origin.Id === targetOriginId,
    );

    return {
      id: matchingDistribution.Id,
      aliases,
      originDomain: originDomainBecauseTarget(targetOrigin),
    };
  };

  const appDistribution = resolveDistribution();
  const appDistributionId = appDistribution.id;
  const appBucket = defaultAppBucketBecauseOriginDomain(
    env,
    appDistribution.originDomain ? appDistribution.originDomain : "",
  );

  console.log(
    `[deploy] Deploying app-origin build to ${appBucket} via CloudFront ${appDistributionId} (${appAlias}).`,
  );

  run("npm", ["run", "legal:check"]);
  run("node", ["scripts/sync-app-cloudfront-functions.mjs"]);
  run("npm", ["run", "build:app-origin"]);
  run("npm", ["run", "stage:city-recommendation-assets"]);

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
    "videos/*",
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
  // Feature demo clips: stable filenames (not fingerprinted), so a day of
  // browser cache — not immutable. Each deploy invalidates the edge, so the
  // CDN always serves the latest within minutes of a ship.
  run("aws", [
    "s3",
    "sync",
    `${distDir}/videos/`,
    `${appBucket}/videos/`,
    "--delete",
    "--cache-control",
    "public, max-age=86400",
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
  // Apple requires the AASA served as application/json; the sync stamps the
  // extensionless file binary/octet-stream, which Apple's CDN only tolerates
  // by grace. Re-stamp just this file (other .well-known docs have their own
  // intended types).
  run("aws", [
    "s3",
    "cp",
    `${distDir}/.well-known/apple-app-site-association`,
    `${appBucket}/.well-known/apple-app-site-association`,
    "--content-type",
    "application/json",
    "--cache-control",
    "public, max-age=3600",
    "--metadata-directive",
    "REPLACE",
  ]);
  // Contact-card PNG is fetched by Linq / vCard PHOTO URI. Stamp image/png
  // and a day of cache so the SPA HTML restamp cannot leave this path as
  // text/html, and so we can iterate the mark without immutable year cache.
  run("aws", [
    "s3",
    "cp",
    `${distDir}/contact-card.png`,
    `${appBucket}/contact-card.png`,
    "--content-type",
    "image/png",
    "--cache-control",
    "public, max-age=86400",
    "--metadata-directive",
    "REPLACE",
  ]);
  // Sendblue vCard media_url must be a public https URL ending in .vcf.
  run("aws", [
    "s3",
    "cp",
    `${distDir}/Pack.vcf`,
    `${appBucket}/Pack.vcf`,
    "--content-type",
    "text/vcard",
    "--cache-control",
    "public, max-age=86400",
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

  await verifyLiveMergedRoutes({
    alias: appAlias,
    env,
    distDir,
    fetchImpl,
    readFileImpl,
  });
}

if (isDirectCliBecauseArgv1(process.argv[1], import.meta.url)) {
  runDeployAppOrigin({}).catch((error) => {
    console.error(deployFailureMessage(error));
    process.exit(1);
  });
}
