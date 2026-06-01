import fs from "node:fs";
import path from "node:path";

const websiteRoot = path.resolve(import.meta.dirname, "..");
const defaultManifestPath = path.resolve(
  websiteRoot,
  "../PackServer/generated/city-image-cache/openai-city-sheet-images.json",
);
const defaultDistDir = path.resolve(websiteRoot, "dist");

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
  JSON.parse(fs.readFileSync(filePath, {encoding: "utf8"}));

const normalizeManifestPath = (value) => {
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
  if (!normalized.endsWith(".webp")) {
    throw new Error(`City image manifest path must be a WebP asset: ${value}`);
  }
  return normalized;
};

const getAssetBasePath = (baseImageUrl) => {
  if (typeof baseImageUrl !== "string" || baseImageUrl.trim().length === 0) {
    throw new Error("City image manifest baseImageUrl must be a URL string.");
  }
  const pathname = new URL(baseImageUrl).pathname.replace(/^\/+|\/+$/g, "");
  if (!pathname.startsWith("assets/city-recommendations/")) {
    throw new Error(
      `City image base path must live under assets/city-recommendations: ${pathname}`,
    );
  }
  return pathname;
};

const getDefaultSourceDir = (manifest) => {
  if (typeof manifest.sourceRun !== "string" || manifest.sourceRun.length === 0) {
    throw new Error("City image manifest sourceRun must be present.");
  }
  return path.resolve(websiteRoot, "../PackServer/tmp", manifest.sourceRun, "tiles");
};

const validateManifest = (manifest) => {
  if (!manifest || typeof manifest !== "object") {
    throw new Error("City image manifest must be an object.");
  }
  if (!Array.isArray(manifest.entries) || manifest.entries.length === 0) {
    throw new Error("City image manifest entries must be a non-empty array.");
  }
  const assetBasePath = getAssetBasePath(manifest.baseImageUrl);
  const entries = manifest.entries.map((entry, index) => {
    if (!entry || typeof entry !== "object") {
      throw new Error(`City image manifest entry ${index} must be an object.`);
    }
    const entryPath = normalizeManifestPath(entry.path);
    return {
      cityCode: String(entry.cityCode ?? ""),
      cityName: String(entry.cityName ?? ""),
      path: entryPath,
    };
  });
  return {assetBasePath, entries};
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

const copyManifestAssets = ({sourceDir, targetDir, entries}) => {
  fs.rmSync(targetDir, {recursive: true, force: true});
  for (const entry of entries) {
    const sourcePath = path.join(sourceDir, entry.path);
    const targetPath = path.join(targetDir, entry.path);
    fs.mkdirSync(path.dirname(targetPath), {recursive: true});
    fs.copyFileSync(sourcePath, targetPath);
  }
};

const main = () => {
  const args = parseArgs(process.argv);
  const manifestPath = path.resolve(args.manifest ?? defaultManifestPath);
  const manifest = readJson(manifestPath);
  const {assetBasePath, entries} = validateManifest(manifest);
  const sourceDir = path.resolve(args["source-dir"] ?? getDefaultSourceDir(manifest));
  const distDir = path.resolve(args["dist-dir"] ?? defaultDistDir);
  const targetDir = path.join(distDir, assetBasePath);

  if (!fs.existsSync(sourceDir)) {
    throw new Error(`Generated city image asset source does not exist: ${sourceDir}`);
  }
  ensureAllSourceFilesExist(sourceDir, entries);

  if (args["dry-run"] !== "true") {
    copyManifestAssets({sourceDir, targetDir, entries});
  }

  console.log(
    `[city-assets] ${args["dry-run"] === "true" ? "Validated" : "Staged"} ${
      entries.length
    } assets from ${sourceDir} to ${targetDir}`,
  );
};

try {
  main();
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}
