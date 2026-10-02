jest.mock("@playwright/test", () => ({
  chromium: {},
}));

import { idTokenIdentifiesE2EUser, storageStateIsSeeded } from "./global-setup.ts";

function idToken(claims: Record<string, string>): string {
  const payload = Buffer.from(JSON.stringify(claims)).toString("base64url");
  return `header.${payload}.sig`;
}

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

test("mailbox test@trypackai.com counts even when cognito:username is a sub", () => {
  const token = idToken({
    email: "test@trypackai.com",
    "cognito:username": "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
  });
  expect(idTokenIdentifiesE2EUser(token)).toBe(true);
});

test("the sign-in alias tests@trypackai.com still counts", () => {
  const token = idToken({
    "cognito:username": "tests@trypackai.com",
  });
  expect(idTokenIdentifiesE2EUser(token)).toBe(true);
});

test("a different mailbox still fails the e2e identity check", () => {
  const token = idToken({
    email: "other@trypackai.com",
    "cognito:username": "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
  });
  expect(idTokenIdentifiesE2EUser(token)).toBe(false);
});

test("origin localStorage counts as a seed when cookies are empty", () => {
  const raw = JSON.stringify({
    cookies: [],
    origins: [{ origin: "https://www.trypackai.com", localStorage: [{ name: "k", value: "v" }] }],
  });
  expect(storageStateIsSeeded(raw)).toBe(true);
});
