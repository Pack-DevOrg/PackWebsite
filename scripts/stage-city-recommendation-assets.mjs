import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const websiteRoot = path.resolve(import.meta.dirname, "..");
const packServerRoot = path.resolve(websiteRoot, "../PackServer");
const defaultDistDir = path.resolve(websiteRoot, "dist");

const MISSING_DURABLE_SOURCE =
  "No durable S3 source for city assets. Set PACK_APP_BUCKET, pass --bucket, or --source-dir. Default is durable S3 (the published baseImageUrl prefix on the app-origin bucket), not PackServer/tmp.";

// One entry per published city-image asset class. Both classes ship through
// the same deploy path (deploy-app-origin.mjs syncs dist/assets with
// `public, max-age=31536000, immutable`); URLs embed `?v=<generatedAt>` so
// invalidation is always "new URL", never in-place refresh.
// Default inbound source is the already-published S3 prefix for
// `baseImageUrl`. `sourceRun` stays as manifest metadata and is not a
// filesystem path.
export const ASSET_CLASSES = {
  "city-recommendations": {
    // Square recommendation tiles sliced from OpenAI city sheets.
    manifestPath: path.join(
      packServerRoot,
      "generated/city-image-cache/openai-city-sheet-images.json",
    ),
    basePathPrefix: "assets/city-recommendations/",
    extension: ".webp",
  },
  "city-headers": {
    // Wide header-art banners (assetClass: 'header'); entry paths are
    // relative to the run root (images/<code>-<city>-<variant>.png).
    manifestPath: path.join(
      packServerRoot,
      "generated/city-image-cache/openai-city-headers.json",
    ),
    basePathPrefix: "assets/city-headers/",
    extension: ".png",
  },
};

export const parseArgs = (argv) => {
  const args = {};
  for (let index = 2; index < argv.length; index += 1) {
    const key = argv[index];
    if (!key.startsWith("--")) {
      throw new Error(`Unexpected argument: ${key}`);
    }
    const nextValue = argv[index + 1];
    if (!nextValue || nextValue.startsWith("--")) {
      args[key.slice(2)] = "true";
      continue;
    }
    args[key.slice(2)] = nextValue;
    index += 1;
  }
  return args;
};

const readJson = (filePath) =>
  JSON.parse(fs.readFileSync(filePath, { encoding: "utf8" }));

const normalizeManifestPath = (value, extension) => {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error("City image manifest entry path must be a non-empty string.");
  }
  const normalized = path.posix.normalize(value.trim());
  if (
    normalized.startsWith("../") ||
    normalized === ".." ||
    path.posix.isAbsolute(normalized)
  ) {
    throw new Error(`Unsafe city image manifest path: ${value}`);
  }
  if (!normalized.endsWith(extension)) {
    throw new Error(
      `City image manifest path must be a ${extension} asset: ${value}`,
    );
  }
  return normalized;
};

export const getAssetBasePath = (baseImageUrl, basePathPrefix) => {
  if (typeof baseImageUrl !== "string" || baseImageUrl.trim().length === 0) {
    throw new Error("City image manifest baseImageUrl must be a URL string.");
  }
  const pathname = new URL(baseImageUrl).pathname.replace(/^\/+|\/+$/g, "");
  const prefix = basePathPrefix.replace(/^\/+|\/+$/g, "");
  if (pathname !== prefix && !pathname.startsWith(`${prefix}/`)) {
    throw new Error(
      `City image base path must live under ${basePathPrefix}: ${pathname}`,
    );
  }
  return pathname;
};

export const validateManifest = (manifest, assetClass) => {
  if (!manifest || typeof manifest !== "object") {
    throw new Error("City image manifest must be an object.");
  }
  if (!Array.isArray(manifest.entries) || manifest.entries.length === 0) {
    throw new Error("City image manifest entries must be a non-empty array.");
  }
  if (typeof manifest.sourceRun !== "string" || manifest.sourceRun.length === 0) {
    throw new Error("City image manifest sourceRun must be present.");
  }
  const assetBasePath = getAssetBasePath(
    manifest.baseImageUrl,
    assetClass.basePathPrefix,
  );
  const entries = manifest.entries.map((entry, index) => {
    if (!entry || typeof entry !== "object") {
      throw new Error(`City image manifest entry ${index} must be an object.`);
    }
    const entryPath = normalizeManifestPath(entry.path, assetClass.extension);
    return {
      cityCode: String(entry.cityCode ?? ""),
      cityName: String(entry.cityName ?? ""),
      path: entryPath,
    };
  });
  return { assetBasePath, entries };
};

const ensureAllSourceFilesExist = (sourceDir, entries) => {
  const missing = entries
    .map((entry) => ({
      ...entry,
      sourcePath: path.join(sourceDir, entry.path),
    }))
    .filter((entry) => !fs.existsSync(entry.sourcePath));

  if (missing.length > 0) {
    const sample = missing
      .slice(0, 5)
      .map((entry) => `${entry.cityCode} ${entry.cityName}: ${entry.path}`)
      .join("\n");
    throw new Error(
      `Missing ${missing.length} generated city image assets under ${sourceDir}:\n${sample}`,
    );
  }
};

export const inferBucketFromOriginDomain = (originDomain) => {
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

export const normalizeBucketUri = (value) => {
  const trimmed = String(value ?? "").trim();
  const withoutScheme = trimmed.replace(/^s3:\/\//i, "").replace(/\/+$/, "");
  if (!withoutScheme) {
    throw new Error(MISSING_DURABLE_SOURCE);
  }
  return `s3://${withoutScheme}`;
};

export const defaultCaptureJson = (command, args, env = process.env) =>
  JSON.parse(
    execFileSync(command, args, {
      encoding: "utf8",
      cwd: process.cwd(),
      env,
    }),
  );

export const defaultS3Sync = (uri, targetDir, env = process.env) => {
  execFileSync("aws", ["s3", "sync", uri, targetDir], {
    stdio: "inherit",
    cwd: process.cwd(),
    env,
  });
};

const resolveDistribution = ({ env, captureJson }) => {
  const appAlias =
    env.PACK_APP_DISTRIBUTION_ALIAS?.trim() ||
    env.PACK_APP_DOMAIN?.trim() ||
    "www.trypackai.com";
  const allowSharedDistribution =
    env.PACK_ALLOW_SHARED_APP_DISTRIBUTION === "1";
  const explicitId = env.PACK_APP_DISTRIBUTION_ID?.trim();
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
      aliases: distribution.Aliases?.Items || [],
      originDomain: targetOrigin?.DomainName || null,
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

  const targetOriginId =
    matchingDistribution.DefaultCacheBehavior?.TargetOriginId;
  const targetOrigin = matchingDistribution.Origins?.Items?.find(
    (origin) => origin.Id === targetOriginId,
  );

  return {
    id: matchingDistribution.Id,
    aliases,
    originDomain: targetOrigin?.DomainName || null,
  };
};

export const resolveAppBucket = ({
  env = process.env,
  args = {},
  captureJson,
} = {}) => {
  const fromEnv = String(env.PACK_APP_BUCKET ?? "").trim();
  if (fromEnv) {
    return normalizeBucketUri(fromEnv);
  }
  const fromArgs = String(args.bucket ?? "").trim();
  if (fromArgs) {
    return normalizeBucketUri(fromArgs);
  }
  if (typeof captureJson !== "function") {
    throw new Error(MISSING_DURABLE_SOURCE);
  }
  try {
    const distribution = resolveDistribution({ env, captureJson });
    return inferBucketFromOriginDomain(distribution.originDomain || "");
  } catch (error) {
    throw new Error(
      `${MISSING_DURABLE_SOURCE} CloudFront inference failed: ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
  }
};

export const resolveDurableSource = ({
  manifest,
  assetClass,
  args = {},
  env = process.env,
  captureJson,
} = {}) => {
  if (args["source-dir"]) {
    return { kind: "local", path: path.resolve(args["source-dir"]) };
  }
  const bucket = resolveAppBucket({ env, args, captureJson });
  const prefix = getAssetBasePath(
    manifest.baseImageUrl,
    assetClass.basePathPrefix,
  );
  return { kind: "s3", uri: `${bucket}/${prefix}` };
};

const copyManifestAssets = ({ sourceDir, targetDir, entries }) => {
  fs.rmSync(targetDir, { recursive: true, force: true });
  for (const entry of entries) {
    const sourcePath = path.join(sourceDir, entry.path);
    const targetPath = path.join(targetDir, entry.path);
    fs.mkdirSync(path.dirname(targetPath), { recursive: true });
    fs.copyFileSync(sourcePath, targetPath);
  }
};

const syncDurablePrefix = ({ uri, targetDir, s3Sync }) => {
  fs.rmSync(targetDir, { recursive: true, force: true });
  fs.mkdirSync(targetDir, { recursive: true });
  s3Sync(uri, targetDir);
};

export const stageAssetClass = ({
  className,
  assetClass,
  args,
  distDir,
  env = process.env,
  s3Sync,
  captureJson,
}) => {
  const manifestPath = path.resolve(args.manifest ?? assetClass.manifestPath);
  const manifest = readJson(manifestPath);
  const { assetBasePath, entries } = validateManifest(manifest, assetClass);
  const source = resolveDurableSource({
    manifest,
    assetClass,
    args,
    env,
    captureJson,
  });
  const targetDir = path.join(distDir, assetBasePath);
  const fromLabel = source.kind === "s3" ? source.uri : source.path;
  const dryRun = args["dry-run"] === "true";

  if (source.kind === "local") {
    if (!fs.existsSync(source.path)) {
      throw new Error(
        `Generated city image asset source does not exist: ${source.path}. Pass a real --source-dir or use durable S3 via PACK_APP_BUCKET / --bucket.`,
      );
    }
    ensureAllSourceFilesExist(source.path, entries);
    if (!dryRun) {
      copyManifestAssets({ sourceDir: source.path, targetDir, entries });
    }
  } else if (!dryRun) {
    const sync =
      s3Sync ?? ((uri, dest) => defaultS3Sync(uri, dest, env));
    syncDurablePrefix({ uri: source.uri, targetDir, s3Sync: sync });
  }

  console.log(
    `[city-assets] ${dryRun ? "Validated" : "Staged"} ${
      entries.length
    } ${className} assets from ${fromLabel} to ${targetDir}`,
  );
};

export const main = ({
  argv = process.argv,
  env = process.env,
  s3Sync,
  captureJson,
} = {}) => {
  const args = parseArgs(argv);
  const distDir = path.resolve(args["dist-dir"] ?? defaultDistDir);
  const selectedClass = args.class ?? "all";
  const classNames =
    selectedClass === "all" ? Object.keys(ASSET_CLASSES) : [selectedClass];
  if ((args.manifest || args["source-dir"]) && selectedClass === "all") {
    throw new Error(
      "--manifest/--source-dir overrides require --class <city-recommendations|city-headers>.",
    );
  }
  const jsonCapture =
    captureJson ??
    ((command, awsArgs) => defaultCaptureJson(command, awsArgs, env));
  for (const className of classNames) {
    const assetClass = ASSET_CLASSES[className];
    if (!assetClass) {
      throw new Error(
        `Unknown asset class: ${className}. Expected one of ${Object.keys(
          ASSET_CLASSES,
        ).join(", ")} or all.`,
      );
    }
    stageAssetClass({
      className,
      assetClass,
      args,
      distDir,
      env,
      s3Sync,
      captureJson: jsonCapture,
    });
  }
};

const isExecutedAsScript = () => {
  const entry = process.argv[1];
  if (!entry) {
    return false;
  }
  return path.resolve(entry) === fileURLToPath(import.meta.url);
};

if (isExecutedAsScript()) {
  try {
    main();
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}
