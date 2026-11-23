import { webcrypto } from "node:crypto";
import {
  buildGoogleAccountConnectUrl,
  buildMicrosoftAccountConnectUrl,
  clearPendingAccountConnect,
  consumeOnboardConnectionsReturn,
  emailFromAccountConnectResponse,
  googleAccountConnectBody,
  GOOGLE_CONNECT_SCOPES,
  GOOGLE_REDIRECT_URI,
  GOOGLE_WEB_CLIENT_ID,
  mailboxesFromAccountsPayload,
  markOnboardConnectionsReturn,
  microsoftAccountConnectBody,
  MICROSOFT_CONNECT_SCOPES,
  pendingMatchesCallback,
  readConnectedMailboxSnapshot,
  resolveAuthenticatedUserId,
  snapshotWithConnectedEmail,
  startGoogleAccountConnect,
  startMicrosoftAccountConnect,
  USER_ACCOUNTS_PATH,
  writeConnectedMailboxSnapshot,
} from "./accountConnect";
import { clearAccountConnectSessionState } from "./tokenStorage";

describe("accountConnect", () => {
  beforeEach(() => {
    Object.defineProperty(globalThis, "crypto", {
      value: webcrypto,
      configurable: true,
    });
    if (typeof window !== "undefined") {
      Object.defineProperty(window, "crypto", {
        value: webcrypto,
        configurable: true,
      });
      window.sessionStorage.clear();
    }
    if (typeof globalThis.TextEncoder === "undefined") {
      Object.defineProperty(globalThis, "TextEncoder", {
        value: class {
          encode(input: string): Uint8Array {
            return Uint8Array.from(Array.from(input, (ch) => ch.charCodeAt(0)));
          }
        },
        configurable: true,
      });
    }
  });
  it("builds the Gmail and Calendar consent URL the app's web client exchanges", async () => {
    const url = new URL(
      buildGoogleAccountConnectUrl({ state: "state-1", clientId: GOOGLE_WEB_CLIENT_ID }),
    );

    expect(url.origin + url.pathname).toBe(
      "https://accounts.google.com/o/oauth2/v2/auth",
    );
    expect(url.searchParams.get("client_id")).toBe(GOOGLE_WEB_CLIENT_ID);
    expect(url.searchParams.get("redirect_uri")).toBe(GOOGLE_REDIRECT_URI);
    expect(url.searchParams.get("response_type")).toBe("code");
    expect(url.searchParams.get("access_type")).toBe("offline");
    expect(url.searchParams.get("prompt")).toBe("consent");
    const scope = url.searchParams.get("scope") ?? "";
    expect(GOOGLE_CONNECT_SCOPES).toEqual([
      "openid",
      "email",
      "profile",
      "https://www.googleapis.com/auth/userinfo.email",
      "https://www.googleapis.com/auth/userinfo.profile",
      "https://www.googleapis.com/auth/gmail.readonly",
      "https://www.googleapis.com/auth/calendar.readonly",
    ]);
    expect(scope.split(" ")).toEqual(GOOGLE_CONNECT_SCOPES);
    // Sign-in is read-only: write scopes come later, one per ask (needs_scope).
    expect(scope).not.toMatch(/gmail\.(modify|send|compose)|auth\/calendar(\.events)?(\s|$)/);

    if (typeof globalThis.TextEncoder === "undefined") {
      Object.defineProperty(globalThis, "TextEncoder", {
        value: class {
          encode(input: string): Uint8Array {
            return Uint8Array.from(Array.from(input, (ch) => ch.charCodeAt(0)));
          }
        },
        configurable: true,
      });
    }
    if (!globalThis.crypto?.subtle) {
      Object.defineProperty(globalThis.crypto, "subtle", {
        value: {
          digest: async () => new Uint8Array([1, 2, 3, 4]).buffer,
        },
        configurable: true,
      });
    }

    const msUrl = new URL(
      await buildMicrosoftAccountConnectUrl({
        state: "state-3",
        codeVerifier: "verifier-1",
      }),
    );
    expect(MICROSOFT_CONNECT_SCOPES).toEqual([
      "offline_access",
      "openid",
      "profile",
      "email",
      "User.Read",
      "Mail.Read",
      "Calendars.Read",
    ]);
    expect((msUrl.searchParams.get("scope") ?? "").split(" ")).toEqual(
      MICROSOFT_CONNECT_SCOPES,
    );
  });

  it("derives mail_read and calendar_read scopes from canonical CAPABILITY_SPECS without widening on other defaultMode specs", () => {
    jest.isolateModules(() => {
      jest.doMock("@pack/app/screens/settings/ConnectedServices/capabilities", () => ({
        CAPABILITY_SPECS: {
          mail_read: {
            defaultMode: "on",
            requestScope: {
              google: "https://www.googleapis.com/auth/gmail.readonly#canonical",
              microsoft: "Mail.Read#canonical",
            },
          },
          calendar_read: {
            defaultMode: "on",
            requestScope: {
              google: "https://www.googleapis.com/auth/calendar.readonly#canonical",
              microsoft: "Calendars.Read#canonical",
            },
          },
          mail_send: {
            defaultMode: "on",
            requestScope: {
              google: "https://www.googleapis.com/auth/gmail.send",
              microsoft: "Mail.Send",
            },
          },
        },
      }));
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const isolated = require("./accountConnect") as typeof import("./accountConnect");
      expect(isolated.GOOGLE_CONNECT_SCOPES).toEqual([
        "openid",
        "email",
        "profile",
        "https://www.googleapis.com/auth/userinfo.email",
        "https://www.googleapis.com/auth/userinfo.profile",
        "https://www.googleapis.com/auth/gmail.readonly#canonical",
        "https://www.googleapis.com/auth/calendar.readonly#canonical",
      ]);
      expect(isolated.MICROSOFT_CONNECT_SCOPES).toEqual([
        "offline_access",
        "openid",
        "profile",
        "email",
        "User.Read",
        "Mail.Read#canonical",
        "Calendars.Read#canonical",
      ]);
    });
  });

  it("posts the auth code to the same /user/accounts body the app sends", () => {
    expect(USER_ACCOUNTS_PATH).toBe("/user/accounts");
    expect(googleAccountConnectBody("server-auth-code")).toEqual({
      provider: "Google",
      categories: ["email", "calendar"],
      token: "server-auth-code",
      metadata: {
        requestedScopes: GOOGLE_CONNECT_SCOPES,
        redirectUri: GOOGLE_REDIRECT_URI,
      },
    });
  });

  it("reads connected mailbox emails from the accounts list", () => {
    expect(
      mailboxesFromAccountsPayload({
        success: true,
        data: {
          accounts: [
            { provider: "Google", email: "ada@pack.test", status: "connected" },
            { provider: "Microsoft", email: "satya@pack.test" },
          ],
        },
      }),
    ).toEqual([
      { provider: "google", email: "ada@pack.test" },
      { provider: "microsoft", email: "satya@pack.test" },
    ]);
    expect(
      emailFromAccountConnectResponse({
        success: true,
        data: { email: "ada@pack.test" },
      }),
    ).toBe("ada@pack.test");
  });

  it("resolves authenticated userId only when status is authenticated and sub is non-empty", () => {
    expect(resolveAuthenticatedUserId("authenticated", "  user-a  ")).toBe("user-a");
    expect(resolveAuthenticatedUserId("loading", "user-a")).toBeNull();
    expect(resolveAuthenticatedUserId("unauthenticated", "user-a")).toBeNull();
    expect(resolveAuthenticatedUserId("authenticated", "")).toBeNull();
    expect(resolveAuthenticatedUserId("authenticated", "   ")).toBeNull();
    expect(resolveAuthenticatedUserId("authenticated", null)).toBeNull();
    expect(resolveAuthenticatedUserId("authenticated", undefined)).toBeNull();
  });

  it("uses trimmed clientId overrides and falls back when override is blank", async () => {
    const googleCustom = new URL(
      buildGoogleAccountConnectUrl({ state: "s1", clientId: " custom-google-id " }),
    );
    expect(googleCustom.searchParams.get("client_id")).toBe("custom-google-id");
    const googleBlank = new URL(
      buildGoogleAccountConnectUrl({ state: "s2", clientId: "   " }),
    );
    expect(googleBlank.searchParams.get("client_id")).toBe(GOOGLE_WEB_CLIENT_ID);

    const msCustom = new URL(
      await buildMicrosoftAccountConnectUrl({
        state: "s3",
        codeVerifier: "v3",
        clientId: " custom-ms-id ",
      }),
    );
    expect(msCustom.searchParams.get("client_id")).toBe("custom-ms-id");
    const msBlank = new URL(
      await buildMicrosoftAccountConnectUrl({
        state: "s4",
        codeVerifier: "v4",
        clientId: "   ",
      }),
    );
    expect(msBlank.searchParams.get("client_id")).toBe(
      "5be1eac2-56a6-4dcf-a985-336797ed1e27",
    );
  });

  it("binds pending OAuth state and PKCE verifier to userId and rejects cross-user, missing-user, tampered, or expired callbacks", async () => {
    expect(() => startGoogleAccountConnect("")).toThrow(/userId/i);
    expect(() => startGoogleAccountConnect("   ")).toThrow(/userId/i);
    await expect(startMicrosoftAccountConnect("")).rejects.toThrow(/userId/i);

    const googleUrl = new URL(startGoogleAccountConnect(" user-a "));
    const aliceState = googleUrl.searchParams.get("state")!;
    expect(
      window.sessionStorage.getItem("pack.accountConnect.pending.v1"),
    ).toBeNull();
    expect(consumeOnboardConnectionsReturn("user-a")).toBe(true);

    // User B cannot match User A's pending state, and null/blank userId never reads a "null" key
    window.sessionStorage.setItem(
      "pack.accountConnect.pending.v2:null",
      JSON.stringify({
        userId: null,
        provider: "google",
        state: aliceState,
        createdAt: Date.now(),
      }),
    );
    expect(pendingMatchesCallback("google", aliceState, "user-b")).toBeNull();
    expect(pendingMatchesCallback("google", aliceState, "")).toBeNull();
    expect(pendingMatchesCallback("google", aliceState, null)).toBeNull();
    window.sessionStorage.removeItem("pack.accountConnect.pending.v2:null");
    expect(pendingMatchesCallback("google", null, "user-a")).toBeNull();
    expect(pendingMatchesCallback("microsoft", aliceState, "user-a")).toBeNull();
    expect(pendingMatchesCallback("google", "wrong-state", "user-a")).toBeNull();

    const matchedAlice = pendingMatchesCallback("google", aliceState, "user-a");
    expect(matchedAlice).toMatchObject({
      userId: "user-a",
      provider: "google",
      state: aliceState,
    });

    // Tampered storage entry copied under user-b's key with user-a's payload userId is rejected
    window.sessionStorage.setItem(
      "pack.accountConnect.pending.v2:user-b",
      window.sessionStorage.getItem("pack.accountConnect.pending.v2:user-a")!,
    );
    expect(pendingMatchesCallback("google", aliceState, "user-b")).toBeNull();

    // Invalid shapes in pending storage fail closed
    window.sessionStorage.setItem(
      "pack.accountConnect.pending.v2:user-b",
      JSON.stringify({ userId: "user-b", provider: "yahoo", state: "s", createdAt: Date.now() }),
    );
    expect(pendingMatchesCallback("google", "s", "user-b")).toBeNull();

    window.sessionStorage.setItem(
      "pack.accountConnect.pending.v2:user-b",
      JSON.stringify({ userId: "user-b", provider: "google", state: "", createdAt: Date.now() }),
    );
    expect(pendingMatchesCallback("google", "", "user-b")).toBeNull();

    window.sessionStorage.setItem(
      "pack.accountConnect.pending.v2:user-b",
      "{bad-json",
    );
    expect(pendingMatchesCallback("google", "s", "user-b")).toBeNull();

    // Non-number or expired createdAt removes the entry and returns null
    window.sessionStorage.setItem(
      "pack.accountConnect.pending.v2:user-b",
      JSON.stringify({
        userId: "user-b",
        provider: "google",
        state: "expired-state",
        createdAt: Date.now() - 10 * 60 * 1000 - 1,
      }),
    );
    expect(pendingMatchesCallback("google", "expired-state", "user-b")).toBeNull();
    expect(
      window.sessionStorage.getItem("pack.accountConnect.pending.v2:user-b"),
    ).toBeNull();

    window.sessionStorage.setItem(
      "pack.accountConnect.pending.v2:user-b",
      JSON.stringify({
        userId: "user-b",
        provider: "google",
        state: "nan-created",
        createdAt: "not-a-number",
      }),
    );
    expect(pendingMatchesCallback("google", "nan-created", "user-b")).toBeNull();
    expect(
      window.sessionStorage.getItem("pack.accountConnect.pending.v2:user-b"),
    ).toBeNull();

    // Exactly at 10-minute boundary is still valid (not expired)
    const nowSpy = jest.spyOn(Date, "now").mockReturnValue(1_000_000);
    try {
      window.sessionStorage.setItem(
        "pack.accountConnect.pending.v2:user-b",
        JSON.stringify({
          userId: "user-b",
          provider: "google",
          state: "boundary-state",
          createdAt: 1_000_000 - 10 * 60 * 1000,
        }),
      );
      expect(
        pendingMatchesCallback("google", "boundary-state", "user-b"),
      ).toMatchObject({
        userId: "user-b",
        state: "boundary-state",
      });
    } finally {
      nowSpy.mockRestore();
    }

    // Microsoft start stores PKCE verifier scoped to user-b
    const msUrl = new URL(await startMicrosoftAccountConnect("user-b"));
    const bobState = msUrl.searchParams.get("state")!;
    expect(consumeOnboardConnectionsReturn("user-b")).toBe(true);
    const matchedBob = pendingMatchesCallback("microsoft", bobState, "user-b");
    expect(matchedBob?.userId).toBe("user-b");
    expect(matchedBob?.codeVerifier).toEqual(expect.any(String));
    expect(
      microsoftAccountConnectBody("ms-code", matchedBob?.codeVerifier).token
        .codeVerifier,
    ).toBe(matchedBob?.codeVerifier);
    expect(
      microsoftAccountConnectBody("ms-code", undefined).token,
    ).not.toHaveProperty("codeVerifier");

    // Targeted clearPendingAccountConnect("user-a") leaves user-b intact
    window.sessionStorage.setItem("pack.accountConnect.pending.v1", "legacy");
    window.sessionStorage.setItem("unrelated.key", "keep");
    clearPendingAccountConnect("user-a");
    expect(
      window.sessionStorage.getItem("pack.accountConnect.pending.v1"),
    ).toBeNull();
    expect(pendingMatchesCallback("google", aliceState, "user-a")).toBeNull();
    expect(pendingMatchesCallback("microsoft", bobState, "user-b")).not.toBeNull();

    // Unscoped clearPendingAccountConnect() clears all pending keys while keeping unrelated keys
    clearPendingAccountConnect();
    expect(pendingMatchesCallback("microsoft", bobState, "user-b")).toBeNull();
    expect(window.sessionStorage.getItem("unrelated.key")).toBe("keep");
  });

  it("isolates connected mailbox snapshots and onboarding return flags per userId and clears all on sign-out", () => {
    writeConnectedMailboxSnapshot("", {
      googleEmail: "ignored@pack.test",
      microsoftEmail: null,
    });
    writeConnectedMailboxSnapshot(null, {
      googleEmail: "ignored@pack.test",
      microsoftEmail: null,
    });
    expect(window.sessionStorage.length).toBe(0);
    window.sessionStorage.setItem(
      "pack.onboard.connectedMailboxes.v2:null",
      JSON.stringify({
        userId: null,
        googleEmail: "poison@pack.test",
        microsoftEmail: null,
      }),
    );
    expect(readConnectedMailboxSnapshot("")).toEqual({
      googleEmail: null,
      microsoftEmail: null,
    });
    expect(readConnectedMailboxSnapshot(null)).toEqual({
      googleEmail: null,
      microsoftEmail: null,
    });
    window.sessionStorage.removeItem("pack.onboard.connectedMailboxes.v2:null");
    expect(snapshotWithConnectedEmail("", "google", "alice@gmail.com")).toEqual({
      googleEmail: null,
      microsoftEmail: null,
    });

    // User A connects Google, then Microsoft (preserving Google)
    writeConnectedMailboxSnapshot(
      "user-a",
      snapshotWithConnectedEmail("user-a", "google", "alice@gmail.com"),
    );
    writeConnectedMailboxSnapshot(
      "user-a",
      snapshotWithConnectedEmail("user-a", "microsoft", null),
    );
    expect(readConnectedMailboxSnapshot("user-a")).toEqual({
      googleEmail: "alice@gmail.com",
      microsoftEmail: null,
    });
    writeConnectedMailboxSnapshot(
      "user-a",
      snapshotWithConnectedEmail("user-a", "microsoft", "alice@outlook.com"),
    );
    writeConnectedMailboxSnapshot(
      "user-a",
      snapshotWithConnectedEmail("user-a", "google", null),
    );
    writeConnectedMailboxSnapshot(
      "user-a",
      snapshotWithConnectedEmail("user-a", "microsoft", null),
    );
    expect(readConnectedMailboxSnapshot("user-a")).toEqual({
      googleEmail: "alice@gmail.com",
      microsoftEmail: "alice@outlook.com",
    });

    // User B sees clean empty snapshot and does not merge User A's mailboxes
    expect(readConnectedMailboxSnapshot("user-b")).toEqual({
      googleEmail: null,
      microsoftEmail: null,
    });
    writeConnectedMailboxSnapshot(
      "user-b",
      snapshotWithConnectedEmail("user-b", "microsoft", "bob@outlook.com"),
    );
    expect(readConnectedMailboxSnapshot("user-b")).toEqual({
      googleEmail: null,
      microsoftEmail: "bob@outlook.com",
    });

    // Tampered snapshot payload with mismatched userId is refused
    window.sessionStorage.setItem(
      "pack.onboard.connectedMailboxes.v2:user-c",
      JSON.stringify({
        userId: "user-a",
        googleEmail: "alice@gmail.com",
        microsoftEmail: null,
      }),
    );
    expect(readConnectedMailboxSnapshot("user-c")).toEqual({
      googleEmail: null,
      microsoftEmail: null,
    });

    window.sessionStorage.setItem(
      "pack.onboard.connectedMailboxes.v2:user-c",
      "{invalid-json",
    );
    expect(readConnectedMailboxSnapshot("user-c")).toEqual({
      googleEmail: null,
      microsoftEmail: null,
    });

    // Onboarding return flags are isolated per userId and consumed once
    window.sessionStorage.clear();
    markOnboardConnectionsReturn("");
    markOnboardConnectionsReturn(null);
    expect(window.sessionStorage.length).toBe(0);
    expect(consumeOnboardConnectionsReturn("")).toBe(false);
    expect(consumeOnboardConnectionsReturn("user-a")).toBe(false);

    markOnboardConnectionsReturn("user-a");
    expect(consumeOnboardConnectionsReturn("user-b")).toBe(false);
    expect(consumeOnboardConnectionsReturn("user-a")).toBe(true);
    expect(consumeOnboardConnectionsReturn("user-a")).toBe(false);

    // Tampered return flag with wrong userId fails closed and deletes entry
    window.sessionStorage.setItem(
      "pack.onboard.connectionsReturn.v2:user-b",
      "user-a",
    );
    expect(consumeOnboardConnectionsReturn("user-b")).toBe(false);
    expect(
      window.sessionStorage.getItem("pack.onboard.connectionsReturn.v2:user-b"),
    ).toBeNull();

    // Sign-out clear wipes all v1 legacy keys and v2 user-scoped keys while keeping unrelated keys
    startGoogleAccountConnect("user-a");
    markOnboardConnectionsReturn("user-b");
    window.sessionStorage.setItem("pack.accountConnect.pending.v1", "old-pending");
    window.sessionStorage.setItem("pack.onboard.connectionsReturn.v1", "1");
    window.sessionStorage.setItem(
      "pack.onboard.connectedMailboxes.v1",
      JSON.stringify({ googleEmail: "legacy@gmail.com", microsoftEmail: null }),
    );
    window.sessionStorage.setItem("keep.other.feature", "preserved");

    clearAccountConnectSessionState();

    expect(window.sessionStorage.getItem("pack.accountConnect.pending.v1")).toBeNull();
    expect(window.sessionStorage.getItem("pack.onboard.connectionsReturn.v1")).toBeNull();
    expect(window.sessionStorage.getItem("pack.onboard.connectedMailboxes.v1")).toBeNull();
    expect(readConnectedMailboxSnapshot("user-a")).toEqual({
      googleEmail: null,
      microsoftEmail: null,
    });
    expect(readConnectedMailboxSnapshot("user-b")).toEqual({
      googleEmail: null,
      microsoftEmail: null,
    });
    expect(consumeOnboardConnectionsReturn("user-a")).toBe(false);
    expect(consumeOnboardConnectionsReturn("user-b")).toBe(false);
    expect(window.sessionStorage.getItem("keep.other.feature")).toBe("preserved");

    // Storage access failures (disabled storage / SecurityError) fail closed without throwing
    const storageGetterSpy = jest
      .spyOn(window, "sessionStorage", "get")
      .mockImplementation(() => {
        throw new Error("SecurityError");
      });
    try {
      expect(() => clearPendingAccountConnect("user-a")).not.toThrow();
      expect(() => markOnboardConnectionsReturn("user-a")).not.toThrow();
      expect(consumeOnboardConnectionsReturn("user-a")).toBe(false);
      expect(readConnectedMailboxSnapshot("user-a")).toEqual({
        googleEmail: null,
        microsoftEmail: null,
      });
      expect(() =>
        writeConnectedMailboxSnapshot("user-a", {
          googleEmail: "alice@gmail.com",
          microsoftEmail: null,
        }),
      ).not.toThrow();
      expect(() => clearAccountConnectSessionState()).not.toThrow();
    } finally {
      storageGetterSpy.mockRestore();
    }
  });
});
