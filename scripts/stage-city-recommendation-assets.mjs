import fs from "node:fs";
import path from "node:path";

const websiteRoot = path.resolve(import.meta.dirname, "..");
const packServerRoot = path.resolve(websiteRoot, "../PackServer");
const defaultDistDir = path.resolve(websiteRoot, "dist");

// One entry per published city-image asset class. Both classes ship through
// the same deploy path (deploy-app-origin.mjs syncs dist/assets with
// `public, max-age=31536000, immutable`); URLs embed `?v=<generatedAt>` so
// invalidation is always "new URL", never in-place refresh.
const ASSET_CLASSES = {
  "city-recommendations": {
    // Square recommendation tiles sliced from OpenAI city sheets.
    manifestPath: path.join(
      packServerRoot,
      "generated/city-image-cache/openai-city-sheet-images.json",
    ),
    basePathPrefix: "assets/city-recommendations/",
    extension: ".webp",
    // Tile paths are relative to the run's tiles/ directory.
    sourceDirFor: (manifest) =>
      path.join(packServerRoot, "tmp", manifest.sourceRun, "tiles"),
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
    sourceDirFor: (manifest) =>
      path.join(packServerRoot, "tmp", manifest.sourceRun),
  },
};

const parseArgs = (argv) => {
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

const getAssetBasePath = (baseImageUrl, basePathPrefix) => {
  if (typeof baseImageUrl !== "string" || baseImageUrl.trim().length === 0) {
    throw new Error("City image manifest baseImageUrl must be a URL string.");
  }
  const pathname = new URL(baseImageUrl).pathname.replace(/^\/+|\/+$/g, "");
  if (!pathname.startsWith(basePathPrefix)) {
    throw new Error(
      `City image base path must live under ${basePathPrefix}: ${pathname}`,
    );
  }
  return pathname;
};

const validateManifest = (manifest, assetClass) => {
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

const copyManifestAssets = ({ sourceDir, targetDir, entries }) => {
  fs.rmSync(targetDir, { recursive: true, force: true });
  for (const entry of entries) {
    const sourcePath = path.join(sourceDir, entry.path);
    const targetPath = path.join(targetDir, entry.path);
    fs.mkdirSync(path.dirname(targetPath), { recursive: true });
    fs.copyFileSync(sourcePath, targetPath);
  }
};

const stageAssetClass = ({ className, assetClass, args, distDir }) => {
  const manifestPath = path.resolve(args.manifest ?? assetClass.manifestPath);
  const manifest = readJson(manifestPath);
  const { assetBasePath, entries } = validateManifest(manifest, assetClass);
  const sourceDir = path.resolve(
    args["source-dir"] ?? assetClass.sourceDirFor(manifest),
  );
  const targetDir = path.join(distDir, assetBasePath);

  if (!fs.existsSync(sourceDir)) {
    throw new Error(
      `Generated city image asset source does not exist: ${sourceDir}`,
    );
  }
  ensureAllSourceFilesExist(sourceDir, entries);

  if (args["dry-run"] !== "true") {
    copyManifestAssets({ sourceDir, targetDir, entries });
  }

  console.log(
    `[city-assets] ${args["dry-run"] === "true" ? "Validated" : "Staged"} ${
      entries.length
    } ${className} assets from ${sourceDir} to ${targetDir}`,
  );
};

const main = () => {
  const args = parseArgs(process.argv);
  const distDir = path.resolve(args["dist-dir"] ?? defaultDistDir);
  const selectedClass = args.class ?? "all";
  const classNames =
    selectedClass === "all" ? Object.keys(ASSET_CLASSES) : [selectedClass];
  if ((args.manifest || args["source-dir"]) && selectedClass === "all") {
    throw new Error(
      "--manifest/--source-dir overrides require --class <city-recommendations|city-headers>.",
    );
  }
  for (const className of classNames) {
    const assetClass = ASSET_CLASSES[className];
    if (!assetClass) {
      throw new Error(
        `Unknown asset class: ${className}. Expected one of ${Object.keys(
          ASSET_CLASSES,
        ).join(", ")} or all.`,
      );
    }
    stageAssetClass({ className, assetClass, args, distDir });
  }
};

try {
  main();
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}
