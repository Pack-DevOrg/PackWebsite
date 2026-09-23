import assert from "node:assert/strict";
import test from "node:test";

import { GOOGLE_REDIRECT_URI } from "../src/auth/accountConnect.ts";
import { googleConsentUrl } from "./onboard-google.mjs";

test("Connect Google consent URL is the Gmail and Calendar authorize request", () => {
  const url = new URL(googleConsentUrl());
  assert.equal(url.hostname, "accounts.google.com");
  assert.equal(url.pathname, "/o/oauth2/v2/auth");
  assert.equal(url.searchParams.get("redirect_uri"), GOOGLE_REDIRECT_URI);
  assert.match(
    url.searchParams.get("scope") ?? "",
    /gmail\.modify/,
  );
  assert.match(
    url.searchParams.get("scope") ?? "",
    /calendar\.readonly/,
  );
});
