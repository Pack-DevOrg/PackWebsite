import {
  buildGoogleAccountConnectUrl,
  emailFromAccountConnectResponse,
  googleAccountConnectBody,
  GOOGLE_CONNECT_SCOPES,
  GOOGLE_REDIRECT_URI,
  GOOGLE_WEB_CLIENT_ID,
  mailboxesFromAccountsPayload,
  USER_ACCOUNTS_PATH,
} from "./accountConnect";

describe("accountConnect", () => {
  it("builds the Gmail and Calendar consent URL the app's web client exchanges", () => {
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
    expect(scope).toContain("https://www.googleapis.com/auth/gmail.modify");
    expect(scope).toContain("https://www.googleapis.com/auth/calendar.readonly");
    expect(scope.split(" ").sort()).toEqual([...GOOGLE_CONNECT_SCOPES].sort());
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
