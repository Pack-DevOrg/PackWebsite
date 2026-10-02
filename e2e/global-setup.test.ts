import assert from "node:assert/strict";
import test from "node:test";

import { storageStateIsSeeded } from "./global-setup.ts";

const EMPTY_FALLBACK = '{"cookies":[],"origins":[]}\n';

test("the 37-byte empty storage file is not a seed", () => {
  assert.equal(storageStateIsSeeded(EMPTY_FALLBACK), false);
  assert.equal(storageStateIsSeeded("{not json"), false);
});

test("cookies count as a seed for tests@trypackai.com", () => {
  const raw = JSON.stringify({
    cookies: [{ name: "pack-auth-hint", value: "1" }],
    origins: [],
  });
  assert.equal(storageStateIsSeeded(raw), true);
});

test("origin localStorage counts as a seed when cookies are empty", () => {
  const raw = JSON.stringify({
    cookies: [],
    origins: [{ origin: "https://www.trypackai.com", localStorage: [{ name: "k", value: "v" }] }],
  });
  assert.equal(storageStateIsSeeded(raw), true);
});
