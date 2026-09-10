import assert from "node:assert/strict";
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import {
  ASSET_CLASSES,
  main,
  resolveDurableSource,
} from "./stage-city-recommendation-assets.mjs";

const REC_SOURCE_RUN = "openai-city-image-generation-chatgpt-latest-4x4-medium";
const HEADER_SOURCE_RUN = "isometric";

const recManifest = {
  sourceRun: REC_SOURCE_RUN,
  baseImageUrl:
    "https://www.trypackai.com/assets/city-recommendations/openai/chatgpt-latest-4x4-medium",
  entries: [{ cityCode: "NYC", cityName: "New York", path: "NYC.webp" }],
};

const headerManifest = {
  sourceRun: HEADER_SOURCE_RUN,
  baseImageUrl: "https://www.trypackai.com/assets/city-headers",
  entries: [
    {
      cityCode: "NYC",
      cityName: "New York",
      path: "images/NYC-new-york-header.png",
    },
  ],
};

const rejectAws = () => {
  throw new Error("aws must not be called from tests");
};

const writeManifest = (rootDir, fileName, manifest) => {
  const manifestPath = join(rootDir, fileName);
  writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
  return manifestPath;
};

const serializeSource = (source) =>
  `${source.kind}:${source.uri ?? source.path ?? ""}`;

test("default source for both asset classes does not join PackServer/tmp and sourceRun", () => {
  const cases = [
    ["city-recommendations", recManifest],
    ["city-headers", headerManifest],
  ];
  for (const [className, manifest] of cases) {
    const source = resolveDurableSource({
      manifest,
      assetClass: ASSET_CLASSES[className],
      args: {},
      env: { PACK_APP_BUCKET: "s3://pack-test-bucket" },
      captureJson: rejectAws,
    });
    const serialized = serializeSource(source);
    assert.equal(
      serialized.includes("PackServer"),
      false,
      `${className} source must not use PackServer: ${serialized}`,
    );
    assert.equal(
      /(?:^|\/)tmp(?:\/|$)/.test(serialized),
      false,
      `${className} source must not use tmp: ${serialized}`,
    );
    assert.equal(
      serialized.includes(manifest.sourceRun),
      false,
      `${className} source must not use sourceRun as a path: ${serialized}`,
    );
  }
});

test("PACK_APP_BUCKET without --source-dir returns s3 URI from baseImageUrl pathname", () => {
  for (const bucket of ["s3://pack-test-bucket", "pack-test-bucket"]) {
    const rec = resolveDurableSource({
      manifest: recManifest,
      assetClass: ASSET_CLASSES["city-recommendations"],
      args: {},
      env: { PACK_APP_BUCKET: bucket },
      captureJson: rejectAws,
    });
    assert.equal(rec.kind, "s3");
    assert.equal(
      rec.uri,
      "s3://pack-test-bucket/assets/city-recommendations/openai/chatgpt-latest-4x4-medium",
    );

    const headers = resolveDurableSource({
      manifest: headerManifest,
      assetClass: ASSET_CLASSES["city-headers"],
      args: {},
      env: { PACK_APP_BUCKET: bucket },
      captureJson: rejectAws,
    });
    assert.equal(headers.kind, "s3");
    assert.equal(headers.uri, "s3://pack-test-bucket/assets/city-headers");
  }
});

test("missing durable source names PACK_APP_BUCKET and --source-dir, not PackServer/tmp", () => {
  const rootDir = mkdtempSync(join(tmpdir(), "city-assets-missing-"));
  const distDir = join(rootDir, "dist");
  const manifestPath = writeManifest(rootDir, "rec.json", recManifest);

  assert.throws(
    () =>
      main({
        argv: [
          "node",
          "stage-city-recommendation-assets.mjs",
          "--class",
          "city-recommendations",
          "--manifest",
          manifestPath,
          "--dist-dir",
          distDir,
        ],
        env: {},
        captureJson: rejectAws,
        s3Sync: rejectAws,
      }),
    (error) => {
      const message = error instanceof Error ? error.message : String(error);
      assert.equal(
        /does not exist:.*(?:PackServer|[\\/])tmp/.test(message),
        false,
        `must not mention missing tmp path: ${message}`,
      );
      assert.match(message, /PACK_APP_BUCKET/);
      assert.match(message, /--source-dir/);
      assert.match(message, /durable S3/i);
      return true;
    },
  );
});

test("mocked s3Sync populates dist-dir from durable S3 when PackServer/tmp is absent", () => {
  const rootDir = mkdtempSync(join(tmpdir(), "city-assets-s3-"));
  const distDir = join(rootDir, "dist");
  const manifestPath = writeManifest(rootDir, "rec.json", recManifest);
  const packServerTmp = join(rootDir, "PackServer", "tmp", REC_SOURCE_RUN);
  assert.equal(existsSync(packServerTmp), false);

  const synced = [];
  main({
    argv: [
      "node",
      "stage-city-recommendation-assets.mjs",
      "--class",
      "city-recommendations",
      "--manifest",
      manifestPath,
      "--dist-dir",
      distDir,
    ],
    env: { PACK_APP_BUCKET: "s3://pack-test-bucket" },
    captureJson: rejectAws,
    s3Sync: (uri, targetDir) => {
      synced.push({ uri, targetDir });
      mkdirSync(targetDir, { recursive: true });
      writeFileSync(join(targetDir, "NYC.webp"), "from-s3");
    },
  });

  assert.equal(synced.length, 1);
  assert.equal(
    synced[0].uri,
    "s3://pack-test-bucket/assets/city-recommendations/openai/chatgpt-latest-4x4-medium",
  );
  const stagedPath = join(
    distDir,
    "assets/city-recommendations/openai/chatgpt-latest-4x4-medium",
    "NYC.webp",
  );
  assert.equal(readFileSync(stagedPath, "utf8"), "from-s3");
  assert.equal(existsSync(packServerTmp), false);
});

test("--source-dir still copies local files", () => {
  const rootDir = mkdtempSync(join(tmpdir(), "city-assets-local-"));
  const sourceDir = join(rootDir, "in");
  const distDir = join(rootDir, "dist");
  mkdirSync(sourceDir, { recursive: true });
  writeFileSync(join(sourceDir, "NYC.webp"), "local-tile");
  const manifestPath = writeManifest(rootDir, "rec.json", recManifest);

  main({
    argv: [
      "node",
      "stage-city-recommendation-assets.mjs",
      "--class",
      "city-recommendations",
      "--manifest",
      manifestPath,
      "--source-dir",
      sourceDir,
      "--dist-dir",
      distDir,
    ],
    env: {},
    captureJson: rejectAws,
    s3Sync: rejectAws,
  });

  const stagedPath = join(
    distDir,
    "assets/city-recommendations/openai/chatgpt-latest-4x4-medium",
    "NYC.webp",
  );
  assert.equal(readFileSync(stagedPath, "utf8"), "local-tile");
});
