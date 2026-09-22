import { execFileSync } from "node:child_process";

export const SSG_BUILD_SUITE = "npm run build";

function normalizedRepoPath(file) {
  return String(file).replace(/\\/g, "/").replace(/^\.\//, "");
}

export function pathNeedsSsgBuild(file) {
  const rel = normalizedRepoPath(file);
  return (
    rel.startsWith("src/pages/") ||
    rel.startsWith("src/onboarding/") ||
    rel.includes("/src/pages/") ||
    rel.includes("/src/onboarding/")
  );
}

/** Suite list for PackWebsite land. Page and onboarding edits must prerender. */
export function suitesForChangedFiles(files) {
  const list = Array.isArray(files) ? files : [];
  if (list.some(pathNeedsSsgBuild)) {
    return [SSG_BUILD_SUITE];
  }
  return [];
}

function pathsFromEnvList(raw) {
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

export function changedFilesForLand(options = {}) {
  const env = options.env !== undefined ? options.env : process.env;
  const fromEnv = pathsFromEnvList(env.PACK_MERGED_FILES);
  if (fromEnv.length > 0) {
    return fromEnv;
  }
  const exec = options.execFileSync !== undefined ? options.execFileSync : execFileSync;
  const cwd = options.cwd !== undefined ? options.cwd : process.cwd();
  try {
    const out = exec("git", ["diff", "--name-only", "origin/master...HEAD"], {
      encoding: "utf8",
      cwd,
      env,
    });
    return String(out)
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);
  } catch {
    return [];
  }
}
