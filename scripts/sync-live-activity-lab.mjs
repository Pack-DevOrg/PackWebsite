import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { spawn } from "node:child_process";
import net from "node:net";

const REPO_ROOT = path.resolve(process.cwd(), "..");
const WEBSITE_ROOT = path.resolve(REPO_ROOT, "PackWebsite");
const MOBILE_ROOT = path.resolve(REPO_ROOT, "PackApp");
const DEFAULT_EXPORT_DIR = path.join(MOBILE_ROOT, "manual-live-activity-review");
const DEFAULT_LAB_ARTIFACT_DIR = path.join(
  WEBSITE_ROOT,
  "artifacts",
  "live-activity-lab",
);
const DEFAULT_URL = "http://127.0.0.1:5173/labs/live-activities?capture=1";
const DEFAULT_PORT = 5173;

function log(message) {
  process.stdout.write(`${message}\n`);
}

function sleep(milliseconds) {
  return new Promise((resolve) => {
    setTimeout(resolve, milliseconds);
  });
}

function runCommand({
  command,
  args,
  cwd,
  env,
  label,
}) {
  return new Promise((resolve, reject) => {
    log(`\n[${label}] ${command} ${args.join(" ")}`);
    const child = spawn(command, args, {
      cwd,
      env: {
        ...process.env,
        ...env,
      },
      stdio: "inherit",
    });

    child.on("error", reject);
    child.on("exit", (code, signal) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(
        new Error(
          `[${label}] failed with ${
            signal ? `signal ${signal}` : `exit code ${code ?? "unknown"}`
          }`,
        ),
      );
    });
  });
}

function isPortOpen(port, host = "127.0.0.1") {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    const finalize = (value) => {
      socket.destroy();
      resolve(value);
    };

    socket.setTimeout(500);
    socket.once("connect", () => finalize(true));
    socket.once("timeout", () => finalize(false));
    socket.once("error", () => finalize(false));
    socket.connect(port, host);
  });
}

async function waitForPort(port, host = "127.0.0.1", timeoutMs = 30_000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (await isPortOpen(port, host)) {
      return;
    }
    await sleep(500);
  }
  throw new Error(`Timed out waiting for ${host}:${port}`);
}

async function resolveBootedSimulatorId() {
  const chunks = [];
  await new Promise((resolve, reject) => {
    const child = spawn(
      "xcrun",
      ["simctl", "list", "devices", "booted", "--json"],
      {
        cwd: REPO_ROOT,
        stdio: ["ignore", "pipe", "inherit"],
      },
    );

    child.stdout.on("data", (chunk) => {
      chunks.push(chunk);
    });
    child.on("error", reject);
    child.on("exit", (code) => {
      if (code === 0) {
        resolve();
        return;
      }
      reject(new Error(`Failed to list booted simulators (exit ${code ?? "unknown"})`));
    });
  });

  const payload = JSON.parse(Buffer.concat(chunks).toString("utf8"));
  const runtimes = Object.values(payload.devices ?? {});
  for (const runtimeEntries of runtimes) {
    if (!Array.isArray(runtimeEntries)) {
      continue;
    }
    const booted = runtimeEntries.find((device) => device.state === "Booted");
    if (booted?.udid) {
      return booted.udid;
    }
  }
  throw new Error("No booted simulator found. Boot a simulator first.");
}

function startDevServer() {
  log("\n[dev-server] starting Vite dev server on 127.0.0.1:5173");
  const child = spawn("npm", ["run", "dev", "--", "--host", "127.0.0.1", "--strictPort"], {
    cwd: WEBSITE_ROOT,
    env: process.env,
    stdio: "inherit",
  });
  return child;
}

async function ensureDirExists(dirPath) {
  await fs.mkdir(dirPath, { recursive: true });
}

async function cleanDirectoryContents(dirPath) {
  await ensureDirExists(dirPath);
  const entries = await fs.readdir(dirPath, { withFileTypes: true });
  await Promise.all(
    entries.map((entry) =>
      fs.rm(path.join(dirPath, entry.name), { recursive: true, force: true }),
    ),
  );
}

async function main() {
  const exportDir =
    process.env.PACK_EXPORT_LIVE_ACTIVITY_REVIEW_DIR ?? DEFAULT_EXPORT_DIR;
  const labArtifactDir =
    process.env.LIVE_ACTIVITY_LAB_OUTPUT_DIR ?? DEFAULT_LAB_ARTIFACT_DIR;
  const targetUrl = process.env.LIVE_ACTIVITY_LAB_URL ?? DEFAULT_URL;

  await cleanDirectoryContents(labArtifactDir);

  // The mobile app owns the canonical Swift review export flow.
  // Rerun this command whenever the native Live Activity review artifacts change.
  await runCommand({
    command: "npm",
    args: ["run", "live-activity:review:clean"],
    cwd: MOBILE_ROOT,
    label: "native-export",
  });

  let devServerChild = null;
  const portAlreadyOpen = await isPortOpen(DEFAULT_PORT);
  if (!portAlreadyOpen) {
    devServerChild = startDevServer();
    try {
      await waitForPort(DEFAULT_PORT);
    } catch (error) {
      devServerChild.kill("SIGTERM");
      throw error;
    }
  } else {
    log("\n[dev-server] reusing existing server on 127.0.0.1:5173");
  }

  try {
    await runCommand({
      command: "node",
      args: ["scripts/capture-live-activity-lab.mjs"],
      cwd: WEBSITE_ROOT,
      env: {
        LIVE_ACTIVITY_LAB_URL: targetUrl,
        LIVE_ACTIVITY_LAB_OUTPUT_DIR: labArtifactDir,
      },
      label: "website-capture",
    });
  } finally {
    if (devServerChild) {
      devServerChild.kill("SIGTERM");
    }
  }

  log("\nLive activity lab assets refreshed.");
  log(`Native review: ${exportDir}`);
  log(`Website captures: ${labArtifactDir}`);
}

main().catch((error) => {
  process.stderr.write(
    `${error instanceof Error ? error.stack ?? error.message : String(error)}\n`,
  );
  process.exitCode = 1;
});
