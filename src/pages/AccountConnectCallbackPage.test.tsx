import { webcrypto } from "node:crypto";
import React from "react";
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { HelmetProvider } from "react-helmet-async";
import { MemoryRouter, Route, Routes } from "react-router-dom";

import {
  accountConnectWindow,
  clearPendingAccountConnect,
  consumeOnboardConnectionsReturn,
  GOOGLE_CONNECT_SCOPES,
  GOOGLE_REDIRECT_URI,
  MICROSOFT_CONNECT_SCOPES,
  pendingMatchesCallback,
  readConnectedMailboxSnapshot,
  startGoogleAccountConnect,
} from "@/auth/accountConnect";
import { clearSession } from "@/auth/tokenStorage";
import { I18nProvider } from "@/i18n/I18nProvider";
import { ONBOARD_PATH, OnboardPage } from "@/pages/OnboardPage";
import { ThemeProvider } from "@/styles/ThemeProvider";
import { AccountConnectCallbackPage } from "./AccountConnectCallbackPage";

const useAuthMock = jest.fn();

jest.mock("@/auth/AuthContext", () => ({
  useAuth: () => useAuthMock(),
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

function mockUserSession(userId: string, email = `${userId}@trypackai.com`) {
  const getAccessToken = jest.fn(async () => `token-${userId}`);
  useAuthMock.mockReturnValue({
    status: "authenticated",
    user: {
      sub: userId,
      email,
      name: userId,
    },
    login: jest.fn(),
    logout: jest.fn(),
    getAccessToken,
    tokens: { tokenType: "Bearer" },
  });
  return getAccessToken;
}

function renderFlow(initialEntry: string) {
  return render(
    <HelmetProvider>
      <MemoryRouter initialEntries={[initialEntry]}>
        <I18nProvider>
          <ThemeProvider>
            <Routes>
              <Route
                path="/api/auth/callback/google"
                element={<AccountConnectCallbackPage />}
              />
              <Route
                path="/api/auth/callback/microsoft"
                element={<AccountConnectCallbackPage />}
              />
              <Route path={ONBOARD_PATH} element={<OnboardPage />} />
            </Routes>
          </ThemeProvider>
        </I18nProvider>
      </MemoryRouter>
    </HelmetProvider>,
  );
}

async function openConnectionsStep(): Promise<void> {
  renderFlow(ONBOARD_PATH);
  fireEvent.click(await screen.findByRole("button", { name: "Skip" }));
  fireEvent.click(await screen.findByRole("button", { name: "Skip" }));
  expect(
    await screen.findByRole("heading", { name: "Connections" }),
  ).toBeInTheDocument();
}

async function startProviderFromOnboard(
  provider: "google" | "microsoft",
): Promise<string> {
  const assignSpy = jest
    .spyOn(accountConnectWindow, "assign")
    .mockImplementation(() => undefined);
  try {
    await openConnectionsStep();
    fireEvent.click(
      screen.getByTestId(
        provider === "google"
          ? "connect-google-button"
          : "connect-microsoft-button",
      ),
    );
    await waitFor(() => {
      expect(assignSpy).toHaveBeenCalledTimes(1);
    });
    const authUrl = new URL(String(assignSpy.mock.calls[0]?.[0]));
    const state = authUrl.searchParams.get("state");
    expect(state).toEqual(expect.any(String));
    return state as string;
  } finally {
    assignSpy.mockRestore();
    cleanup();
  }
}

function jsonResponse(status: number, payload: unknown) {
  return {
    ok: status >= 200 && status < 300,
    status,
    text: async () => JSON.stringify(payload),
    clone() {
      return this;
    },
  };
}

describe("AccountConnectCallbackPage", () => {
  beforeEach(() => {
    Object.defineProperty(globalThis, "crypto", {
      value: webcrypto,
      configurable: true,
    });
    Object.defineProperty(window, "crypto", {
      value: webcrypto,
      configurable: true,
    });
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
    sessionStorage.clear();
    localStorage.clear();
    jest.clearAllMocks();
    global.fetch = jest.fn(async () =>
      jsonResponse(200, { success: true, data: { accounts: [] } }),
    ) as unknown as typeof fetch;
    mockUserSession("user-a", "alice@trypackai.com");
  });

  afterEach(() => {
    clearPendingAccountConnect();
  });

  it("posts the Google code to /user/accounts and returns to /onboard Connections for the same user", async () => {
    const state = await startProviderFromOnboard("google");
    // Consume the initial return flag so callback success itself must mark connections return
    expect(consumeOnboardConnectionsReturn("user-a")).toBe(true);
    const fetchMock = jest.fn(async (_input: RequestInfo | URL, init?: RequestInit) => {
      if (init?.method === "POST") {
        return jsonResponse(201, {
          success: true,
          data: { email: "ada@pack.test", provider: "Google" },
        });
      }
      return jsonResponse(200, { success: true, data: { accounts: [] } });
    });
    global.fetch = fetchMock as unknown as typeof fetch;

    renderFlow(`/api/auth/callback/google?code=server-auth-code&state=${state}`);

    expect(
      await screen.findByRole("heading", { name: "Connections" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Connected: ada@pack.test")).toBeInTheDocument();
    expect(pendingMatchesCallback("google", state, "user-a")).toBeNull();

    const postCalls = fetchMock.mock.calls.filter(
      ([, init]) => init?.method === "POST",
    );
    expect(postCalls).toHaveLength(1);
    const [url, init] = postCalls[0] as [string, RequestInit];
    expect(url).toContain("/user/accounts");
    expect(JSON.parse(String(init.body))).toEqual({
      provider: "Google",
      categories: ["email", "calendar"],
      token: "server-auth-code",
      metadata: {
        requestedScopes: GOOGLE_CONNECT_SCOPES,
        redirectUri: GOOGLE_REDIRECT_URI,
      },
    });
  });

  it("refuses to exchange User A's pending OAuth callback under User B's authenticated session", async () => {
    mockUserSession("user-a", "alice@trypackai.com");
    const aliceState = await startProviderFromOnboard("google");

    mockUserSession("user-b", "bob@trypackai.com");
    const fetchMock = jest.fn(async () =>
      jsonResponse(201, {
        success: true,
        data: { email: "alice@gmail.com", provider: "Google" },
      }),
    );
    global.fetch = fetchMock as unknown as typeof fetch;

    renderFlow(
      `/api/auth/callback/google?code=alice-auth-code&state=${aliceState}`,
    );

    await waitFor(() => {
      expect(screen.getByTestId("account-connect-callback")).toHaveTextContent(
        "This connection link is missing or expired. Return to onboarding and try again.",
      );
    });
    expect(fetchMock).not.toHaveBeenCalled();
    expect(pendingMatchesCallback("google", aliceState, "user-a")).toBeNull();
  });

  it("clears connected mailbox snapshot and onboarding return flag on sign-out so User B never sees User A's email", async () => {
    mockUserSession("user-a", "alice@trypackai.com");
    const aliceState = await startProviderFromOnboard("google");
    global.fetch = jest.fn(async (_input: RequestInfo | URL, init?: RequestInit) => {
      if (init?.method === "POST") {
        return jsonResponse(201, {
          success: true,
          data: { email: "alice@gmail.com", provider: "Google" },
        });
      }
      return jsonResponse(200, { success: true, data: { accounts: [] } });
    }) as unknown as typeof fetch;

    renderFlow(
      `/api/auth/callback/google?code=alice-code&state=${aliceState}`,
    );
    expect(
      await screen.findByRole("heading", { name: "Connections" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Connected: alice@gmail.com")).toBeInTheDocument();
    cleanup();

    clearSession();

    mockUserSession("user-b", "bob@trypackai.com");
    await openConnectionsStep();
    expect(screen.queryByText(/alice@gmail\.com/)).toBeNull();
  });

  it("isolates connected mailbox snapshots per userId so User B connecting Microsoft never merges User A's Google email", async () => {
    mockUserSession("user-a", "alice@trypackai.com");
    const aliceState = await startProviderFromOnboard("google");
    global.fetch = jest.fn(async (_input: RequestInfo | URL, init?: RequestInit) => {
      if (init?.method === "POST") {
        return jsonResponse(201, {
          success: true,
          data: { email: "alice@gmail.com", provider: "Google" },
        });
      }
      return jsonResponse(200, { success: true, data: { accounts: [] } });
    }) as unknown as typeof fetch;

    renderFlow(
      `/api/auth/callback/google?code=alice-code&state=${aliceState}`,
    );
    expect(
      await screen.findByText("Connected: alice@gmail.com"),
    ).toBeInTheDocument();
    cleanup();

    mockUserSession("user-b", "bob@trypackai.com");
    const bobState = await startProviderFromOnboard("microsoft");
    const bobFetch = jest.fn(async (_input: RequestInfo | URL, init?: RequestInit) => {
      if (init?.method === "POST") {
        return jsonResponse(201, {
          success: true,
          data: { email: "bob@outlook.com", provider: "Microsoft" },
        });
      }
      return jsonResponse(200, { success: true, data: { accounts: [] } });
    });
    global.fetch = bobFetch as unknown as typeof fetch;

    renderFlow(
      `/api/auth/callback/microsoft?code=bob-ms-code&state=${bobState}`,
    );
    expect(
      await screen.findByText("Connected: bob@outlook.com"),
    ).toBeInTheDocument();
    expect(screen.queryByText(/alice@gmail\.com/)).toBeNull();

    const postCalls = bobFetch.mock.calls.filter(
      ([, init]) => init?.method === "POST",
    );
    expect(postCalls).toHaveLength(1);
    const parsedBody = JSON.parse(String((postCalls[0]?.[1] as RequestInit).body));
    expect(parsedBody).toMatchObject({
      provider: "Microsoft",
      categories: ["email", "calendar"],
      token: {
        authorizationCode: "bob-ms-code",
        scopes: MICROSOFT_CONNECT_SCOPES,
      },
    });
    expect(parsedBody.token.codeVerifier).toEqual(expect.any(String));
  });

  it("handles OAuth error, missing code/state, unauthenticated callback, in-flight user switch, and save failure", async () => {
    // 1. OAuth error clears user's pending state and displays declined message
    mockUserSession("user-a", "alice@trypackai.com");
    const state1 = await startProviderFromOnboard("google");
    const fetchMock = jest.fn();
    global.fetch = fetchMock as unknown as typeof fetch;

    renderFlow(`/api/auth/callback/google?error=access_denied&state=${state1}`);
    await waitFor(() => {
      expect(screen.getByTestId("account-connect-callback")).toHaveTextContent(
        "Google or Microsoft declined the connection. Return to onboarding and try again.",
      );
    });
    expect(pendingMatchesCallback("google", state1, "user-a")).toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
    cleanup();

    // 2. Missing code (even with a valid pending state) clears pending state and does not call fetch
    const missingCodeState = new URL(
      startGoogleAccountConnect("user-a"),
    ).searchParams.get("state")!;
    renderFlow(`/api/auth/callback/google?state=${missingCodeState}`);
    await waitFor(() => {
      expect(screen.getByTestId("account-connect-callback")).toHaveTextContent(
        "This connection link is missing or expired. Return to onboarding and try again.",
      );
    });
    expect(pendingMatchesCallback("google", missingCodeState, "user-a")).toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
    cleanup();

    renderFlow("/api/auth/callback/google?code=only-code");
    await waitFor(() => {
      expect(screen.getByTestId("account-connect-callback")).toHaveTextContent(
        "This connection link is missing or expired. Return to onboarding and try again.",
      );
    });
    expect(fetchMock).not.toHaveBeenCalled();
    cleanup();

    // 3. Unauthenticated callback or missing user.sub requires sign-in
    useAuthMock.mockReturnValue({
      status: "unauthenticated",
      user: null,
      getAccessToken: async () => null,
      tokens: null,
    });
    renderFlow("/api/auth/callback/google?code=c1&state=s1");
    await waitFor(() => {
      expect(screen.getByTestId("account-connect-callback")).toHaveTextContent(
        "Sign in again, then connect the account from onboarding.",
      );
    });
    expect(fetchMock).not.toHaveBeenCalled();
    cleanup();

    useAuthMock.mockReturnValue({
      status: "authenticated",
      user: { sub: "   " },
      getAccessToken: async () => "token",
      tokens: null,
    });
    renderFlow("/api/auth/callback/google?code=c1&state=s1");
    await waitFor(() => {
      expect(screen.getByTestId("account-connect-callback")).toHaveTextContent(
        "Sign in again, then connect the account from onboarding.",
      );
    });
    expect(fetchMock).not.toHaveBeenCalled();
    cleanup();

    // 4. Waits while loading, runs once authenticated via effect deps, and aborts write if active user changes in flight
    const inflightState = new URL(
      startGoogleAccountConnect("user-a"),
    ).searchParams.get("state")!;
    let resolvePost!: (value: ReturnType<typeof jsonResponse>) => void;
    global.fetch = jest.fn(
      () =>
        new Promise((resolve) => {
          resolvePost = resolve;
        }),
    ) as unknown as typeof fetch;

    useAuthMock.mockReturnValue({
      status: "loading",
      user: null,
      getAccessToken: async () => null,
      tokens: null,
    });

    const inflightView = render(
      <HelmetProvider>
        <MemoryRouter
          initialEntries={[
            `/api/auth/callback/google?code=inflight-code&state=${inflightState}`,
          ]}
        >
          <I18nProvider>
            <ThemeProvider>
              <Routes>
                <Route
                  path="/api/auth/callback/google"
                  element={<AccountConnectCallbackPage />}
                />
                <Route path={ONBOARD_PATH} element={<h1>Landed Onboard</h1>} />
              </Routes>
            </ThemeProvider>
          </I18nProvider>
        </MemoryRouter>
      </HelmetProvider>,
    );

    expect(screen.getByTestId("account-connect-callback")).toHaveTextContent(
      "Connecting your account…",
    );
    expect(global.fetch).not.toHaveBeenCalled();

    mockUserSession("user-a", "alice@trypackai.com");
    inflightView.rerender(
      <HelmetProvider>
        <MemoryRouter
          initialEntries={[
            `/api/auth/callback/google?code=inflight-code&state=${inflightState}`,
          ]}
        >
          <I18nProvider>
            <ThemeProvider>
              <Routes>
                <Route
                  path="/api/auth/callback/google"
                  element={<AccountConnectCallbackPage />}
                />
                <Route path={ONBOARD_PATH} element={<h1>Landed Onboard</h1>} />
              </Routes>
            </ThemeProvider>
          </I18nProvider>
        </MemoryRouter>
      </HelmetProvider>,
    );

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    // Switch active session to user-b before POST /user/accounts settles
    mockUserSession("user-b", "bob@trypackai.com");
    inflightView.rerender(
      <HelmetProvider>
        <MemoryRouter
          initialEntries={[
            `/api/auth/callback/google?code=inflight-code&state=${inflightState}`,
          ]}
        >
          <I18nProvider>
            <ThemeProvider>
              <Routes>
                <Route
                  path="/api/auth/callback/google"
                  element={<AccountConnectCallbackPage />}
                />
                <Route path={ONBOARD_PATH} element={<h1>Landed Onboard</h1>} />
              </Routes>
            </ThemeProvider>
          </I18nProvider>
        </MemoryRouter>
      </HelmetProvider>,
    );

    await act(async () => {
      resolvePost(
        jsonResponse(201, {
          success: true,
          data: { email: "alice@gmail.com", provider: "Google" },
        }),
      );
    });

    expect(readConnectedMailboxSnapshot("user-a")).toEqual({
      googleEmail: null,
      microsoftEmail: null,
    });
    expect(readConnectedMailboxSnapshot("user-b")).toEqual({
      googleEmail: null,
      microsoftEmail: null,
    });
    expect(screen.queryByRole("heading", { name: "Landed Onboard" })).toBeNull();
    cleanup();

    // 5. Failed POST /user/accounts surfaces error status and fallback Bearer header works when tokens is null
    useAuthMock.mockReturnValue({
      status: "authenticated",
      user: { sub: "user-a", email: "alice@trypackai.com" },
      getAccessToken: async () => "token-user-a",
      tokens: { tokenType: "" },
    });
    const failState = new URL(
      startGoogleAccountConnect("user-a"),
    ).searchParams.get("state")!;
    const failFetch = jest.fn(async () =>
      jsonResponse(500, { success: false, error: { message: "boom" } }),
    );
    global.fetch = failFetch as unknown as typeof fetch;

    renderFlow(`/api/auth/callback/google?code=fail-code&state=${failState}`);
    await waitFor(() => {
      expect(screen.getByTestId("account-connect-callback")).toHaveTextContent(
        "Pack could not save that account. Return to onboarding and try again.",
      );
    });
    const failHeaders = new Headers(
      (failFetch.mock.calls[0] as [string, RequestInit])[1]?.headers,
    );
    expect(failHeaders.get("Authorization")).toBe("Bearer token-user-a");
  });
});
