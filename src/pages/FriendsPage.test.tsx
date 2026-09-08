import {readFileSync} from "node:fs";
import {join} from "node:path";
import React from "react";
import {fireEvent, render, screen, waitFor} from "@testing-library/react";
import {HelmetProvider} from "react-helmet-async";
import {MemoryRouter} from "react-router-dom";

import {FriendsPage} from "./FriendsPage";
import {I18nProvider} from "@/i18n/I18nProvider";
import {ThemeProvider} from "@/styles/ThemeProvider";

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

const TIMESTAMP = "2026-04-24T12:00:00.000Z";
const PENDING_FRIEND_SUB = "subject-pending";
const ACTIVE_FRIEND_SUB = "subject-active";
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
    status: "pending" as const,
    requestDirection: "received" as const,
    requestedBySub: PENDING_FRIEND_SUB,
    displayName: "Traveler Pending",
    planningAccess: NO_PLANNING_ACCESS,
    createdAt: TIMESTAMP,
    updatedAt: TIMESTAMP,
  };
}

function activeListedFriend() {
  return {
    ownerSub: "user-1",
    friendSub: ACTIVE_FRIEND_SUB,
    status: "active" as const,
    requestDirection: "sent" as const,
    requestedBySub: "user-1",
    displayName: "Casey Rivera",
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

describe("FriendsPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    apiRequestMock.mockResolvedValue(okEnvelope({friends: []}));
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
      tokens: {tokenType: "Bearer"},
    });
  });

  const renderPage = () =>
    render(
      <HelmetProvider>
        <MemoryRouter initialEntries={["/app/friends"]}>
          <I18nProvider>
            <ThemeProvider>
              <FriendsPage />
            </ThemeProvider>
          </I18nProvider>
        </MemoryRouter>
      </HelmetProvider>,
    );

  it("renders list, pending, and empty from fixture data", async () => {
    const emptyRender = renderPage();
    expect(
      await screen.findByText("Add a friend to start planning together."),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", {name: "Add a friend"}),
    ).toBeInTheDocument();
    emptyRender.unmount();

    apiRequestMock.mockResolvedValue(
      okEnvelope({friends: [pendingReceivedFriend(), activeListedFriend()]}),
    );
    renderPage();

    expect(await screen.findByText("Casey Rivera")).toBeInTheDocument();
    expect(screen.getByText("Traveler Pending")).toBeInTheDocument();
    expect(screen.getByText("CR")).toBeInTheDocument();
    expect(screen.getByText("TP")).toBeInTheDocument();
    expect(screen.getByRole("button", {name: "Accept"})).toBeInTheDocument();
    expect(screen.getByRole("button", {name: "Ignore"})).toBeInTheDocument();
  });

  it("accept calls respondToFriendRequest once", async () => {
    const pending = pendingReceivedFriend();
    const accepted = {
      ...pending,
      status: "active" as const,
    };
    let serverFriends: Array<typeof pending | typeof accepted> = [pending];
    apiRequestMock.mockImplementation(
      async (options: {path: string; method?: string; body?: unknown}) => {
        if (options.path === "/friends") {
          return okEnvelope({friends: serverFriends});
        }
        if (options.path === `/friends/${PENDING_FRIEND_SUB}/accept`) {
          serverFriends = [accepted];
          return okEnvelope({friend: accepted});
        }
        throw new Error(`unexpected ${options.method} ${options.path}`);
      },
    );

    renderPage();

    await screen.findByText("Traveler Pending");
    fireEvent.click(screen.getByRole("button", {name: "Accept"}));

    await waitFor(() => {
      const acceptCalls = apiRequestMock.mock.calls.filter((call) => {
        const options = call[0] as {path?: string; method?: string};
        return (
          options.path === `/friends/${PENDING_FRIEND_SUB}/accept` &&
          options.method === "POST"
        );
      });
      expect(acceptCalls).toHaveLength(1);
    });

    await waitFor(() => {
      expect(
        screen.queryByRole("button", {name: "Accept"}),
      ).not.toBeInTheDocument();
    });
  });

  it("FriendsPage source has no raw hex or rgba neutrals", () => {
    const source = readFileSync(
      join(process.cwd(), "src/pages/FriendsPage.tsx"),
      "utf8",
    );
    expect(source).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
    expect(source).not.toMatch(/rgba\(/i);
  });
});
