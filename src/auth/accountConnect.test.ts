// @ts-expect-error PackApp source is resolved by Vite and Jest, not this tsconfig.
import { CAPABILITY_SPECS } from "@pack/app/screens/settings/ConnectedServices/capabilities";
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
    expect(scope).toContain(CAPABILITY_SPECS.mail_read.requestScope.google);
    expect(scope).toContain(CAPABILITY_SPECS.calendar_read.requestScope.google);
    expect(scope.split(" ").sort()).toEqual([...GOOGLE_CONNECT_SCOPES].sort());
    // Sign-in is read-only: write scopes come later, one per ask (needs_scope).
    expect(scope).not.toMatch(/gmail\.(modify|send|compose)|auth\/calendar(\.events)?(\s|$)/);

    const mailOnlyUrl = new URL(
      buildGoogleAccountConnectUrl({
        state: "state-2",
        clientId: GOOGLE_WEB_CLIENT_ID,
        capabilities: ["mail_read"],
      } as Parameters<typeof buildGoogleAccountConnectUrl>[0]),
    );
    const mailOnlyScopes = (mailOnlyUrl.searchParams.get("scope") ?? "").split(" ");
    expect(mailOnlyScopes).toContain(CAPABILITY_SPECS.mail_read.requestScope.google);
    expect(mailOnlyScopes).not.toContain(CAPABILITY_SPECS.calendar_read.requestScope.google);

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

    const msCalendarOnlyUrl = new URL(
      await buildMicrosoftAccountConnectUrl({
        state: "state-3",
        codeVerifier: "verifier-1",
        capabilities: ["calendar_read"],
      } as Parameters<typeof buildMicrosoftAccountConnectUrl>[0]),
    );
    const msCalendarOnlyScopes = (msCalendarOnlyUrl.searchParams.get("scope") ?? "").split(" ");
    expect(msCalendarOnlyScopes).toContain(CAPABILITY_SPECS.calendar_read.requestScope.microsoft);
    expect(msCalendarOnlyScopes).not.toContain(CAPABILITY_SPECS.mail_read.requestScope.microsoft);
    expect(MICROSOFT_CONNECT_SCOPES).toContain(CAPABILITY_SPECS.mail_read.requestScope.microsoft);
    expect(MICROSOFT_CONNECT_SCOPES).toContain(
      CAPABILITY_SPECS.calendar_read.requestScope.microsoft,
    );
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
