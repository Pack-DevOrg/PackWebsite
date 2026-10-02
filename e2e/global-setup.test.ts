jest.mock("@playwright/test", () => ({
  chromium: {},
}));

import { storageStateIsSeeded } from "./global-setup.ts";

const EMPTY_FALLBACK = '{"cookies":[],"origins":[]}\n';

test("the 37-byte empty storage file is not a seed", () => {
  expect(storageStateIsSeeded(EMPTY_FALLBACK)).toBe(false);
  expect(storageStateIsSeeded("{not json")).toBe(false);
});

test("cookies count as a seed for tests@trypackai.com", () => {
  const raw = JSON.stringify({
    cookies: [{ name: "pack-auth-hint", value: "1" }],
    origins: [],
  });
  expect(storageStateIsSeeded(raw)).toBe(true);
});

test("origin localStorage counts as a seed when cookies are empty", () => {
  const raw = JSON.stringify({
    cookies: [],
    origins: [{ origin: "https://www.trypackai.com", localStorage: [{ name: "k", value: "v" }] }],
  });
  expect(storageStateIsSeeded(raw)).toBe(true);
});
