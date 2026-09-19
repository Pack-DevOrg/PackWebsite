import React from "react";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HelmetProvider } from "react-helmet-async";
import { MemoryRouter } from "react-router-dom";

import { WalletVaultSettingsPage } from "./WalletVaultSettingsPage";
import { I18nProvider } from "@/i18n/I18nProvider";
import { ThemeProvider } from "@/styles/ThemeProvider";
import {
  VAULT_CREDENTIALS_PATH,
  WALLET_CARDS_PATH,
  WALLET_LINK_PATH,
  WALLET_LINK_SESSION_PATH,
} from "@/schemas/wallet-vault";

const loginMock = jest.fn();
const logoutMock = jest.fn();
const useAuthMock = jest.fn();
const apiRequestMock = jest.fn();
const apiClientStub = {
  request: (options: unknown) => apiRequestMock(options),
};

jest.mock("@/auth/AuthContext", () => ({
  useAuth: () => useAuthMock(),
}));

jest.mock("@/api/useApiClient", () => ({
  useApiClient: () => apiClientStub,
}));

const ACCESS_TOKEN = "synth-access-token";
const ISSUED_AT = "2026-09-18T12:00:00.000Z";

function okEnvelope(data: unknown) {
  return {
    success: true as const,
    data,
  };
}

function publicCredential(overrides: Record<string, unknown> = {}) {
  return {
    id: "cred_e2e_1",
    site: "https://hotels.example",
    username: "pack-e2e",
    secretPresent: true as const,
    ...overrides,
  };
}

function issuedCard() {
  return {
    id: "ic_e2e_1",
    surrogate: "card_e2e_1",
    merchant: "Example Air",
    amountCents: 18400,
    currency: "usd",
    status: "issued" as const,
    issuedAt: ISSUED_AT,
    uses: [
      {
        id: "use_issue",
        cardId: "ic_e2e_1",
        kind: "issue" as const,
        amountCents: 18400,
        merchant: "Example Air",
        at: ISSUED_AT,
      },
      {
        id: "use_auth",
        cardId: "ic_e2e_1",
        kind: "authorization" as const,
        amountCents: 18400,
        merchant: "Example Air",
        at: "2026-09-18T12:01:00.000Z",
      },
    ],
  };
}

function renderPage(
  props: React.ComponentProps<typeof WalletVaultSettingsPage> = {},
) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  return render(
    <HelmetProvider>
      <MemoryRouter initialEntries={["/app/settings/wallet"]}>
        <I18nProvider>
          <ThemeProvider>
            <QueryClientProvider client={queryClient}>
              <WalletVaultSettingsPage {...props} />
            </QueryClientProvider>
          </ThemeProvider>
        </I18nProvider>
      </MemoryRouter>
    </HelmetProvider>,
  );
}

describe("WalletVaultSettingsPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    apiRequestMock.mockImplementation(async (options: { path: string; method?: string; body?: unknown }) => {
      if (options.path === WALLET_LINK_PATH) {
        return okEnvelope({ connected: false });
      }
      if (options.path === VAULT_CREDENTIALS_PATH && options.method !== "POST") {
        return okEnvelope({ credentials: [] });
      }
      if (options.path === WALLET_CARDS_PATH) {
        return okEnvelope({ cards: [issuedCard()] });
      }
      throw new Error(`unexpected ${options.method} ${options.path}`);
    });
    useAuthMock.mockReturnValue({
      status: "authenticated",
      user: {
        sub: "user-1",
        email: "tests@trypackai.com",
        name: "Pack Tester",
      },
      login: loginMock,
      logout: logoutMock,
      getAccessToken: async () => ACCESS_TOKEN,
      tokens: { tokenType: "Bearer" },
    });
  });

  it("connects Stripe Link, saves a vault credential without echoing secret, and lists typed card rows", async () => {
    const openLinkUrl = jest.fn();
    let credentials: ReturnType<typeof publicCredential>[] = [];
    apiRequestMock.mockImplementation(async (options: { path: string; method?: string; body?: Record<string, unknown> }) => {
      if (options.path === WALLET_LINK_PATH) {
        return okEnvelope({ connected: false });
      }
      if (options.path === WALLET_LINK_SESSION_PATH) {
        return okEnvelope({ url: "https://checkout.stripe.com/c/pay/cs_e2e_link" });
      }
      if (options.path === VAULT_CREDENTIALS_PATH && options.method === "POST") {
        expect(options.body).toEqual({
          site: "https://hotels.example",
          username: "pack-e2e",
          secret: "hunter2",
        });
        credentials = [publicCredential()];
        return okEnvelope(credentials[0]);
      }
      if (options.path === VAULT_CREDENTIALS_PATH) {
        return okEnvelope({ credentials });
      }
      if (options.path === WALLET_CARDS_PATH) {
        return okEnvelope({ cards: [issuedCard()] });
      }
      throw new Error(`unexpected ${options.method} ${options.path}`);
    });

    renderPage({ openLinkUrl });

    fireEvent.click(
      await screen.findByRole("button", { name: "Connect with Stripe Link" }),
    );
    await waitFor(() => {
      expect(openLinkUrl).toHaveBeenCalledWith(
        "https://checkout.stripe.com/c/pay/cs_e2e_link",
      );
    });

    fireEvent.change(screen.getByLabelText("Site"), {
      target: { value: "https://hotels.example" },
    });
    fireEvent.change(screen.getByLabelText("Username"), {
      target: { value: "pack-e2e" },
    });
    fireEvent.change(screen.getByLabelText("Secret"), {
      target: { value: "hunter2" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save credential" }));

    expect(await screen.findByRole("button", { name: "Edit" })).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByLabelText("Secret")).toHaveValue("");
    });
    expect(screen.getByLabelText("Site")).toHaveValue("");
    expect(screen.queryByText("hunter2")).not.toBeInTheDocument();

    expect(screen.getByText("card_e2e_1")).toBeInTheDocument();
    expect(screen.getByText("issue")).toBeInTheDocument();
    expect(screen.getByText("authorization")).toBeInTheDocument();
    expect(loginMock).not.toHaveBeenCalled();
  });

  it("edits and removes a vault credential without showing secret", async () => {
    let stored = publicCredential();
    apiRequestMock.mockImplementation(async (options: { path: string; method?: string; body?: Record<string, unknown> }) => {
      if (options.path === WALLET_LINK_PATH) {
        return okEnvelope({ connected: true, last4: "4242", brand: "visa" });
      }
      if (options.path === VAULT_CREDENTIALS_PATH) {
        return okEnvelope({ credentials: [stored] });
      }
      if (options.path === `${VAULT_CREDENTIALS_PATH}/cred_e2e_1` && options.method === "PATCH") {
        expect(options.body?.secret).toBeUndefined();
        stored = publicCredential({ site: "https://air.example", username: "pack-air" });
        return okEnvelope(stored);
      }
      if (options.path === `${VAULT_CREDENTIALS_PATH}/cred_e2e_1` && options.method === "DELETE") {
        stored = publicCredential({ id: "gone" });
        return okEnvelope({});
      }
      if (options.path === WALLET_CARDS_PATH) {
        return okEnvelope({ cards: [] });
      }
      throw new Error(`unexpected ${options.method} ${options.path}`);
    });

    renderPage();

    fireEvent.click(await screen.findByRole("button", { name: "Edit" }));
    expect(screen.getByLabelText("Secret")).toHaveValue("");
    fireEvent.change(screen.getByLabelText("Site"), {
      target: { value: "https://air.example" },
    });
    fireEvent.change(screen.getByLabelText("Username"), {
      target: { value: "pack-air" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Update credential" }));

    expect(await screen.findByText("https://air.example")).toBeInTheDocument();
    expect(screen.getByText("pack-air")).toBeInTheDocument();
    expect(screen.queryByText("hunter2")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Remove" }));
    fireEvent.click(screen.getByRole("button", { name: "Confirm" }));
    await waitFor(() => {
      expect(apiRequestMock).toHaveBeenCalledWith(
        expect.objectContaining({
          path: `${VAULT_CREDENTIALS_PATH}/cred_e2e_1`,
          method: "DELETE",
        }),
      );
    });
  });

  it("hides wallet controls while unauthenticated and never calls login", () => {
    useAuthMock.mockReturnValue({
      status: "unauthenticated",
      user: {
        sub: "leaked-user",
        email: "hidden@trypackai.com",
        name: "Should Not Render",
      },
      login: loginMock,
      logout: logoutMock,
      getAccessToken: async () => null,
      tokens: null,
    });

    renderPage();

    expect(screen.getByText("No account on this session")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Connect with Stripe Link" }),
    ).not.toBeInTheDocument();
    expect(apiRequestMock).not.toHaveBeenCalled();
    expect(loginMock).not.toHaveBeenCalled();
  });

  it("WalletVaultSettingsPage source has no backdrop-filter and no raw hex colors", () => {
    const source = readFileSync(
      path.join(__dirname, "WalletVaultSettingsPage.tsx"),
      "utf8",
    );

    expect(source).not.toMatch(/backdrop-filter/);
    expect(source).not.toMatch(/#[0-9a-fA-F]{3,8}/);
  });
});
