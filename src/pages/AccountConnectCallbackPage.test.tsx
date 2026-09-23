import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";

import {
  clearPendingAccountConnect,
  GOOGLE_CONNECT_SCOPES,
  GOOGLE_REDIRECT_URI,
} from "@/auth/accountConnect";
import { AccountConnectCallbackPage } from "./AccountConnectCallbackPage";

const getAccessToken = jest.fn(async () => "synth-access-token");
const useAuthMock = jest.fn();

jest.mock("@/auth/AuthContext", () => ({
  useAuth: () => useAuthMock(),
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

function renderCallback(search: string) {
  return render(
    <MemoryRouter initialEntries={[`/api/auth/callback/google${search}`]}>
      <Routes>
        <Route
          path="/api/auth/callback/google"
          element={<AccountConnectCallbackPage />}
        />
        <Route path="/onboard" element={<h1>Onboard return</h1>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("AccountConnectCallbackPage", () => {
  beforeEach(() => {
    sessionStorage.clear();
    jest.clearAllMocks();
    useAuthMock.mockReturnValue({
      status: "authenticated",
      getAccessToken,
      tokens: { tokenType: "Bearer" },
    });
  });

  afterEach(() => {
    clearPendingAccountConnect();
  });

  it("posts the Google code to /user/accounts and returns to /onboard", async () => {
    sessionStorage.setItem(
      "pack.accountConnect.pending.v1",
      JSON.stringify({
        provider: "google",
        state: "state-1",
        createdAt: Date.now(),
      }),
    );
    const fetchMock = jest.fn(async () => ({
      ok: true,
      status: 201,
      text: async () =>
        JSON.stringify({
          success: true,
          data: { email: "ada@pack.test", provider: "Google" },
        }),
      clone() {
        return this;
      },
    }));
    global.fetch = fetchMock as unknown as typeof fetch;

    renderCallback("?code=server-auth-code&state=state-1");

    await screen.findByRole("heading", { name: "Onboard return" });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toContain("/user/accounts");
    expect(init.method).toBe("POST");
    expect(JSON.parse(String(init.body))).toEqual({
      provider: "Google",
      categories: ["email", "calendar"],
      token: "server-auth-code",
      metadata: {
        requestedScopes: GOOGLE_CONNECT_SCOPES,
        redirectUri: GOOGLE_REDIRECT_URI,
      },
    });
    expect(JSON.parse(sessionStorage.getItem("pack.onboard.connectedMailboxes.v1") ?? "")).toEqual({
      googleEmail: "ada@pack.test",
      microsoftEmail: null,
    });
    await waitFor(() => {
      expect(sessionStorage.getItem("pack.onboard.connectionsReturn.v1")).toBe("1");
    });
  });
});
