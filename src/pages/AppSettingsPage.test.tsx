import React from "react";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { HelmetProvider } from "react-helmet-async";
import { MemoryRouter } from "react-router-dom";

import { AppSettingsPage } from "./AppSettingsPage";
import { I18nProvider } from "@/i18n/I18nProvider";
import { ThemeProvider } from "@/styles/ThemeProvider";

const loginMock = jest.fn();
const logoutMock = jest.fn();
const useAuthMock = jest.fn();
const apiRequestMock = jest.fn();
const connectAccountsFetchMock = jest.fn();
const apiClientStub = {
  request: (options: unknown) => apiRequestMock(options),
};

jest.mock("@/auth/AuthContext", () => ({
  useAuth: () => useAuthMock(),
}));

jest.mock("@/api/useApiClient", () => ({
  useApiClient: () => apiClientStub,
}));

const TIMESTAMP = "2026-04-24T12:00:00.000Z";
const PENDING_FRIEND_SUB = "subject-pending";
const ACCESS_TOKEN = "synth-access-token";

const NO_PLANNING_ACCESS = {
  profile: "none" as const,
  availability: "none" as const,
  bookedTravel: "none" as const,
};

function pendingReceivedFriend() {
  return {
    ownerSub: "user-1",
    friendSub: PENDING_FRIEND_SUB,
    status: "pending",
    requestDirection: "received",
    requestedBySub: PENDING_FRIEND_SUB,
    displayName: "Traveler Pending",
    planningAccess: NO_PLANNING_ACCESS,
    createdAt: TIMESTAMP,
    updatedAt: TIMESTAMP,
  };
}

function okEnvelope(data: unknown) {
  return {
    success: true as const,
    data,
  };
}

describe("AppSettingsPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    apiRequestMock.mockResolvedValue(okEnvelope({ friends: [] }));
    connectAccountsFetchMock.mockReset();
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

  const renderPage = (props: React.ComponentProps<typeof AppSettingsPage> = {}) =>
    render(
      <HelmetProvider>
        <MemoryRouter initialEntries={["/app/settings"]}>
          <I18nProvider>
            <ThemeProvider>
              <AppSettingsPage {...props} />
            </ThemeProvider>
          </I18nProvider>
        </MemoryRouter>
      </HelmetProvider>,
    );

  it("renders connect and settings controls for an authenticated session without calling login", async () => {
    renderPage();

    expect(
      screen.getByRole("button", { name: "Connect mail" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Connect calendar" }),
    ).toBeInTheDocument();
    expect(screen.getByText("tests@trypackai.com")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Sign out" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Text Pack" })).toBeInTheDocument();
    expect(loginMock).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "Connect mail" }));
    fireEvent.click(screen.getByRole("button", { name: "Connect calendar" }));
    fireEvent.click(screen.getByRole("button", { name: "Sign out" }));

    expect(loginMock).not.toHaveBeenCalled();
    expect(logoutMock).toHaveBeenCalledTimes(1);
    await waitFor(() => {
      expect(apiRequestMock).toHaveBeenCalled();
    });
  });

  it("renders no account data while unauthenticated and never calls login", () => {
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

    expect(screen.queryByText("hidden@trypackai.com")).not.toBeInTheDocument();
    expect(screen.queryByText("Should Not Render")).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Connect mail" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Connect calendar" }),
    ).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Sign out" })).not.toBeInTheDocument();
    expect(screen.getByText("No account on this session")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Text Pack" })).toBeInTheDocument();
    expect(loginMock).not.toHaveBeenCalled();
  });

  it("does not fetch social or connect accounts while unauthenticated and hides Connect mail", async () => {
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

    expect(
      screen.queryByRole("button", { name: "Connect mail" }),
    ).not.toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByText("No account on this session")).toBeInTheDocument();
    });
    expect(apiRequestMock).not.toHaveBeenCalled();
    expect(connectAccountsFetchMock).not.toHaveBeenCalled();
  });

  it("accepts a pending friend through respondToFriendRequest with status active and refetches the server list", async () => {
    const pending = pendingReceivedFriend();
    const accepted = {
      ...pending,
      status: "active" as const,
    };
    let serverFriends = [pending];
    apiRequestMock.mockImplementation(async (options: { path: string; method?: string; body?: unknown }) => {
      if (options.path === "/friends") {
        return okEnvelope({ friends: serverFriends });
      }
      if (options.path === `/friends/${PENDING_FRIEND_SUB}/accept`) {
        serverFriends = [accepted];
        return okEnvelope({ friend: accepted });
      }
      throw new Error(`unexpected ${options.method} ${options.path}`);
    });

    renderPage();

    await screen.findByText("Traveler Pending");
    fireEvent.click(screen.getByRole("button", { name: "Accept" }));

    await waitFor(() => {
      expect(apiRequestMock).toHaveBeenCalledWith(
        expect.objectContaining({
          path: `/friends/${PENDING_FRIEND_SUB}/accept`,
          method: "POST",
          body: { status: "active" },
        }),
      );
    });

    await waitFor(() => {
      expect(screen.getByText("Active friend.")).toBeInTheDocument();
    });
    expect(screen.queryByRole("button", { name: "Accept" })).not.toBeInTheDocument();
  });

  it("does not flip Connect mail copy to connected without a server-backed connected flag", async () => {
    renderPage();

    const connectMail = await screen.findByRole("button", { name: "Connect mail" });
    expect(screen.getAllByText("Not connected.")).toHaveLength(2);
    fireEvent.click(connectMail);
    expect(
      screen.queryByText("Connected for booking confirmations."),
    ).not.toBeInTheDocument();
    expect(screen.getAllByText("Not connected.")).toHaveLength(2);
  });

  it("shows server-backed connected mail copy only from the connected flag prop", async () => {
    renderPage({ mailConnected: true });

    expect(
      await screen.findByText("Connected for booking confirmations."),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Connect mail" }),
    ).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Disconnect mail" }));
    expect(
      screen.getByText("Connected for booking confirmations."),
    ).toBeInTheDocument();
  });

  it("AppSettingsPage source has no backdrop-filter and no raw hex colors", () => {
    const source = readFileSync(
      path.join(__dirname, "AppSettingsPage.tsx"),
      "utf8",
    );

    expect(source).not.toMatch(/backdrop-filter/);
    expect(source).not.toMatch(/#[0-9a-fA-F]{3,8}/);
  });

  it("renders Connected, Not connected, and Needs attention on connected-services rows", async () => {
    renderPage({
      mailConnected: true,
      calendarNeedsAttention: true,
    });

    expect(await screen.findByText("Connected")).toBeInTheDocument();
    expect(screen.getByText("Needs attention")).toBeInTheDocument();
    expect(screen.getByText("Not connected")).toBeInTheDocument();
  });

  it("does not fire disconnect until the ghost Cancel and destructive Confirm pair resolves", async () => {
    const onDisconnectMail = jest.fn();
    renderPage({ mailConnected: true, onDisconnectMail });

    fireEvent.click(
      await screen.findByRole("button", { name: "Disconnect mail" }),
    );
    expect(onDisconnectMail).not.toHaveBeenCalled();

    expect(screen.getByRole("button", { name: "Cancel" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Confirm" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(onDisconnectMail).not.toHaveBeenCalled();
    expect(
      screen.queryByRole("button", { name: "Confirm" }),
    ).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Disconnect mail" }));
    fireEvent.click(screen.getByRole("button", { name: "Confirm" }));
    expect(onDisconnectMail).toHaveBeenCalledTimes(1);
  });
});
