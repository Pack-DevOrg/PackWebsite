import {
  buildGoogleAccountConnectUrl,
  buildMicrosoftAccountConnectUrl,
  emailFromAccountConnectResponse,
  googleAccountConnectBody,
  GOOGLE_CONNECT_SCOPES,
  GOOGLE_REDIRECT_URI,
  GOOGLE_WEB_CLIENT_ID,
  mailboxesFromAccountsPayload,
  MICROSOFT_CONNECT_SCOPES,
  USER_ACCOUNTS_PATH,
} from "./accountConnect";

describe("accountConnect", () => {
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
});
