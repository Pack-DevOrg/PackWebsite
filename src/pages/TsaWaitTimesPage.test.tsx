import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act } from "@testing-library/react";
import { fireEvent, render, screen } from "@testing-library/react";
import { waitFor } from "@testing-library/react";
import { HelmetProvider } from "react-helmet-async";
import { MemoryRouter } from "react-router-dom";

import TsaWaitTimesPage from "./TsaWaitTimesPage";
import { I18nProvider } from "@/i18n/I18nProvider";
import { ThemeProvider } from "@/styles/ThemeProvider";

const trackCTAClickMock = jest.fn();
const loginMock = jest.fn();
const apiRequestMock = jest.fn();
const requestPublicApiMock = jest.fn();
const useAuthMock = jest.fn();
const googleInitializeMock = jest.fn();
const googleCancelMock = jest.fn();
let googleCredentialCallback:
  | ((response: { credential?: string }) => void)
  | undefined;

jest.mock("@/api/airportSecurity", () => ({
  fetchPublicAirportSecuritySummary: jest.fn(async () => ({
    generatedAt: "2026-03-23T15:00:00.000Z",
    refreshIntervalMinutes: 15,
    airports: [
      {
        airportCode: "JFK",
        airportName: "John F. Kennedy International Airport",
        cityName: "New York City",
        regionName: "NY",
        countryName: "United States",
        latitude: 40.6413,
        longitude: -73.7781,
        snapshot: {
          sourceLabel: "estimated_third_party",
          fetchStatus: "available",
          observedAt: "2026-03-23T14:58:00.000Z",
          fetchedAt: "2026-03-23T14:59:00.000Z",
          refreshIntervalMinutes: 15,
          observations: [
            {
              terminalKey: "terminal-4",
              terminalDisplayName: "Terminal 4",
              checkpointKey: "main",
              checkpointDisplayName: "Main checkpoint",
              locationDisplayName: "Terminal 4 Main checkpoint",
              screeningProgram: "general",
              laneStatus: "open",
              displayWaitText: "8 min",
              exactWaitMinutes: 8,
            },
            {
              terminalKey: "terminal-4",
              terminalDisplayName: "Terminal 4",
              checkpointKey: "secondary",
              checkpointDisplayName: "Secondary checkpoint",
              locationDisplayName: "Terminal 4 Secondary checkpoint",
              screeningProgram: "tsa_precheck",
              laneStatus: "closed",
              displayWaitText: "Closed",
            },
            {
              terminalKey: "terminal-4",
              terminalDisplayName: "Terminal 4",
              checkpointKey: "priority",
              checkpointDisplayName: "Priority checkpoint",
              locationDisplayName: "Terminal 4 Priority checkpoint",
              screeningProgram: "priority",
              laneStatus: "unavailable",
              displayWaitText: "Not available",
            },
          ],
        },
      },
      {
        airportCode: "LAX",
        airportName: "Los Angeles International Airport",
        cityName: "Los Angeles",
        regionName: "CA",
        countryName: "United States",
        latitude: 33.9416,
        longitude: -118.4085,
        snapshot: {
          sourceLabel: "public_airport",
          fetchStatus: "blocked",
          observedAt: "2026-03-23T14:58:00.000Z",
          fetchedAt: "2026-03-23T14:59:00.000Z",
          refreshIntervalMinutes: 15,
          observations: [],
        },
      },
      {
        airportCode: "FAI",
        airportName: "Fairbanks International Airport",
        cityName: "Fairbanks",
        regionName: "AK",
        countryName: "United States",
        latitude: 64.8151,
        longitude: -147.856,
        snapshot: {
          sourceLabel: "public_airport",
          fetchStatus: "guidance_only",
          observedAt: "2026-03-23T14:58:00.000Z",
          fetchedAt: "2026-03-23T14:59:00.000Z",
          refreshIntervalMinutes: 15,
          observations: [
            {
              terminalKey: "airport-wide",
              terminalDisplayName: "Airport-wide",
              checkpointKey: "security",
              checkpointDisplayName: "Security screening",
              locationDisplayName: "Security screening",
              screeningProgram: "general",
              laneStatus: "open",
              displayWaitText: "2 hours before first departure",
            },
          ],
        },
      },
      {
        airportCode: "CDG",
        airportName: "Charles de Gaulle Airport",
        cityName: "Paris",
        regionName: "FR-IDF",
        countryName: "France",
        latitude: 49.0097,
        longitude: 2.5479,
        snapshot: {
          sourceLabel: "public_airport",
          fetchStatus: "blocked",
          observedAt: "2026-03-23T14:58:00.000Z",
          fetchedAt: "2026-03-23T14:59:00.000Z",
          refreshIntervalMinutes: 15,
          observations: [],
        },
      },
      {
        airportCode: "ORY",
        airportName: "Paris Orly Airport",
        cityName: "Paris",
        regionName: "FR-IDF",
        countryName: "France",
        latitude: 48.7262,
        longitude: 2.3652,
        snapshot: {
          sourceLabel: "public_airport",
          fetchStatus: "blocked",
          observedAt: "2026-03-23T14:58:00.000Z",
          fetchedAt: "2026-03-23T14:59:00.000Z",
          refreshIntervalMinutes: 15,
          observations: [],
        },
      },
      {
        airportCode: "LGA",
        airportName: "LaGuardia Airport",
        cityName: "New York",
        regionName: "NY",
        countryName: "United States",
        latitude: 40.7769,
        longitude: -73.874,
        snapshot: {
          sourceLabel: "public_airport",
          fetchStatus: "available",
          observedAt: "2026-03-26T21:01:00.000Z",
          fetchedAt: "2026-03-26T21:01:00.000Z",
          refreshIntervalMinutes: 15,
          observations: [
            {
              terminalKey: "terminal-a",
              terminalDisplayName: "Terminal A",
              checkpointKey: "main",
              checkpointDisplayName: "Main checkpoint",
              locationDisplayName: "Main checkpoint",
              screeningProgram: "general",
              laneStatus: "unavailable",
            },
            {
              terminalKey: "terminal-a",
              terminalDisplayName: "Terminal A",
              checkpointKey: "precheck",
              checkpointDisplayName: "TSA PreCheck",
              locationDisplayName: "TSA PreCheck",
              screeningProgram: "tsa_precheck",
              laneStatus: "unavailable",
            },
          ],
        },
      },
    ],
  })),
}));

jest.mock("@/hooks/useConversionTracking", () => ({
  useConversionTracking: () => ({
    trackCTAClick: trackCTAClickMock,
  }),
}));

jest.mock("@/api/client", () => {
  const actual = jest.requireActual("@/api/client");
  return {
    ...actual,
    requestPublicApi: (...args: unknown[]) => requestPublicApiMock(...args),
  };
});

jest.mock("@/auth/AuthContext", () => ({
  useAuth: () => useAuthMock(),
}));

jest.mock("@/config/appConfig", () => {
  const actual = jest.requireActual("@/config/appConfig");
  return {
    ...actual,
    isTryPackHostname: () => true,
  };
});

jest.mock("@/api/useApiClient", () => ({
  useApiClient: () => ({
    request: apiRequestMock,
  }),
}));

jest.mock("@/components/WaitlistForm", () => () => (
  <div data-testid="waitlist-form">waitlist form</div>
));

describe("TsaWaitTimesPage", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
    loginMock.mockReset();
    apiRequestMock.mockReset();
    requestPublicApiMock.mockReset();
    googleCredentialCallback = undefined;
    googleInitializeMock.mockImplementation(
      ({ callback }: { callback?: (response: { credential?: string }) => void }) => {
        googleCredentialCallback = callback;
      }
    );
    window.google = {
      accounts: {
        id: {
          initialize: googleInitializeMock,
          cancel: googleCancelMock,
        },
      },
    };
    useAuthMock.mockReturnValue({
      status: "unauthenticated",
      login: loginMock,
    });
    window.sessionStorage.clear();
    window.localStorage.clear();
    document.cookie =
      "tsa-waits-email-modal-completed=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/";
    window.history.replaceState({}, "", "/tsa");
  });

  afterEach(() => {
    act(() => {
      jest.runOnlyPendingTimers();
    });
    jest.useRealTimers();
  });

  const renderPage = () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });

    return render(
      <HelmetProvider>
        <MemoryRouter initialEntries={["/tsa"]}>
          <I18nProvider>
            <ThemeProvider>
              <QueryClientProvider client={queryClient}>
                <TsaWaitTimesPage />
              </QueryClientProvider>
            </ThemeProvider>
          </I18nProvider>
        </MemoryRouter>
      </HelmetProvider>
    );
  };

  it("renders airport waits without a manual email CTA", async () => {
    renderPage();

    expect(
      await screen.findByText("John F. Kennedy International Airport")
    ).toBeInTheDocument();
    expect(screen.getByText("Terminal 4")).toBeInTheDocument();
    expect(screen.getByText("8 min")).toBeInTheDocument();
    expect(screen.getByText("Closed")).toBeInTheDocument();
    expect(screen.getByText("Not available")).toBeInTheDocument();
    expect(screen.getByText("Estimated third party")).toBeInTheDocument();
    expect(
      screen.getByLabelText(
        /Estimated from a third-party source, not a live official checkpoint reading\./
      )
    ).toBeInTheDocument();
    expect(screen.getAllByText("Public airport").length).toBeGreaterThan(0);
    expect(
      screen.getAllByLabelText(/Based on publicly available airport information\./).length
    ).toBeGreaterThan(0);
    expect(screen.queryByText("Official")).not.toBeInTheDocument();
    expect(screen.queryByText("Predicted!")).not.toBeInTheDocument();
    expect(
      screen.getAllByText(
        /Unavailable\. The airport source is not exposing usable live wait data right now\./
      ).length
    ).toBeGreaterThan(0);
    expect(screen.getByText("Fairbanks International Airport")).toBeInTheDocument();
    expect(screen.getByText("Guidance only")).toBeInTheDocument();
    expect(
      screen.getByText("2 hours before first departure")
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /get email updates/i })
    ).not.toBeInTheDocument();
  });

  it("auto-opens the waitlist modal once per session", async () => {
    renderPage();

    await screen.findByText("John F. Kennedy International Airport");

    act(() => {
      jest.advanceTimersByTime(3200);
    });

    expect(await screen.findByRole("dialog")).toBeInTheDocument();
    expect(screen.getByTestId("waitlist-form")).toBeInTheDocument();
    expect(window.localStorage.getItem("tsa-waits-email-modal-completed")).toBeNull();
    expect(document.cookie).not.toContain("tsa-waits-email-modal-completed=1");
    expect(trackCTAClickMock).toHaveBeenCalledWith(
      "TSA Waitlist Modal Auto Open",
      "tsa_waits_modal_auto"
    );
  });

  it("shows the clean Google CTA immediately while GIS initializes in the background", async () => {
    renderPage();

    await screen.findByText("John F. Kennedy International Airport");

    act(() => {
      jest.advanceTimersByTime(3200);
    });

    expect(
      await screen.findByRole("button", { name: /sign up with google/i })
    ).toBeInTheDocument();
    expect(googleInitializeMock).toHaveBeenCalled();
  });

  it("captures the GIS email and closes the modal without hosted login", async () => {
    requestPublicApiMock.mockResolvedValue({
      email: "traveler@example.com",
      emailVerified: true,
      cognitoSub: "sub_123",
      cognitoUsername: "google_123",
      status: "existing_google_user",
    });
    window.history.replaceState({}, "", "/tsa?forceModal=1");

    renderPage();

    await screen.findByText("John F. Kennedy International Airport");

    act(() => {
      jest.advanceTimersByTime(3200);
    });

    await waitFor(() => {
      expect(googleInitializeMock).toHaveBeenCalled();
    });

    await act(async () => {
      googleCredentialCallback?.({ credential: "google_jwt" });
    });

    await waitFor(() => {
      expect(requestPublicApiMock).toHaveBeenCalledWith({
        path: "/auth/google/bridge",
        method: "POST",
        body: {
          credential: "google_jwt",
          redirectPath: "/tsa",
          source: "tsa",
        },
      });
    });

    expect(loginMock).not.toHaveBeenCalled();
    expect(window.localStorage.getItem("tsa-waits-email-modal-completed")).toBe("1");
    expect(document.cookie).toContain("tsa-waits-email-modal-completed=1");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("strips forceModal from the Google login return path", async () => {
    window.history.replaceState({}, "", "/tsa?forceModal=1");

    renderPage();

    await screen.findByText("John F. Kennedy International Airport");

    act(() => {
      jest.advanceTimersByTime(3200);
    });

    fireEvent.click(await screen.findByRole("button", { name: /sign up with google/i }));

    expect(loginMock).toHaveBeenCalledWith({
      redirectPath: "/tsa",
      redirectUri: "https://www.trypackai.com/auth/callback",
      useCanonicalOrigin: false,
    });
  });

  it("does not auto-open the modal for authenticated users", async () => {
    useAuthMock.mockReturnValue({
      status: "authenticated",
      login: loginMock,
    });

    renderPage();

    await screen.findByText("John F. Kennedy International Airport");

    act(() => {
      jest.advanceTimersByTime(3200);
    });

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(
      window.localStorage.getItem("tsa-waits-email-modal-completed")
    ).toBe("1");
    expect(apiRequestMock).toHaveBeenCalledWith({
      path: "/user/information",
    });
  });

  it("removes forceModal from the URL after authentication completes", async () => {
    useAuthMock.mockReturnValue({
      status: "authenticated",
      login: loginMock,
    });
    window.history.replaceState({}, "", "/tsa?forceModal=1");

    renderPage();

    await screen.findByText("John F. Kennedy International Airport");

    expect(window.location.pathname).toBe("/tsa");
    expect(window.location.search).toBe("");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("shows the modal with forceModal even when the modal was already dismissed", async () => {
    window.localStorage.setItem("tsa-waits-email-modal-completed", "1");
    window.history.replaceState({}, "", "/tsa?forceModal=1");

    renderPage();

    await screen.findByText("John F. Kennedy International Airport");

    act(() => {
      jest.advanceTimersByTime(3200);
    });

    expect(await screen.findByRole("dialog")).toBeInTheDocument();
    expect(window.localStorage.getItem("tsa-waits-email-modal-completed")).toBeNull();
  });

  it("keeps the modal suppressed when the completion cookie is present", async () => {
    document.cookie = "tsa-waits-email-modal-completed=1; path=/";

    renderPage();

    await screen.findByText("John F. Kennedy International Airport");

    act(() => {
      jest.advanceTimersByTime(3200);
    });

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("filters airports from the search field and shows airport suggestions", async () => {
    renderPage();

    await screen.findByText("John F. Kennedy International Airport");

    const searchInput = screen.getByLabelText("Search airport wait times");

    fireEvent.change(searchInput, {
      target: { value: "JFK" },
    });

    fireEvent.focus(searchInput);
    expect(await screen.findByRole("button", { name: /John F. Kennedy International Airport/i })).toBeInTheDocument();
    expect(screen.getAllByText("New York City, NY").length).toBeGreaterThan(0);

    fireEvent.mouseDown(
      screen.getByRole("button", { name: /John F. Kennedy International Airport/i })
    );
    expect(searchInput).toHaveValue("John F. Kennedy International Airport");
  });

  it("surfaces Charles de Gaulle for a France search", async () => {
    renderPage();

    await screen.findByText("John F. Kennedy International Airport");

    const searchInput = screen.getByLabelText("Search airport wait times");

    fireEvent.focus(searchInput);
    fireEvent.change(searchInput, {
      target: { value: "France" },
    });

    const airportSuggestions = await screen.findAllByRole("button", {
      name: /Airport/i,
    });

    expect(airportSuggestions[0]).toHaveTextContent("Charles de Gaulle Airport");
    expect(airportSuggestions[1]).toHaveTextContent("Paris Orly Airport");
    expect(screen.getAllByText("Charles de Gaulle Airport").length).toBeGreaterThan(0);
  });

  it("orders airports by longest waits first when location is unavailable", async () => {
    renderPage();

    const airportNames = await screen.findAllByText(/International Airport|Los Angeles International Airport/);
    expect(airportNames[0]).toHaveTextContent("John F. Kennedy International Airport");
  });

  it("falls back to the airport availability message when all observation rows are unavailable", async () => {
    renderPage();

    await screen.findByText("LaGuardia Airport");

    fireEvent.change(screen.getByLabelText("Search airport wait times"), {
      target: { value: "LGA" },
    });

    expect(
      await screen.findByText(/We still show it here so you can search for it\./)
    ).toBeInTheDocument();
    expect(screen.queryByText("Terminal A")).not.toBeInTheDocument();
  });
});
