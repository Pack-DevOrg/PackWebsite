import { act, render, screen } from "@testing-library/react";
import { HelmetProvider } from "react-helmet-async";
import { MemoryRouter } from "react-router-dom";

import { appConfig } from "@/config/appConfig";
import { I18nProvider } from "@/i18n/I18nProvider";
import NonHomeRoutes from "@/routes/NonHomeRoutes";
import { ThemeProvider } from "@/styles/ThemeProvider";

import {
  TripDraftArtifact,
  type TripDraft,
  type TripDraftFetch,
} from "./TripDraftArtifact";

const firstDraft: TripDraft = {
  window: { depart: "Nov 24", return: "Nov 29" },
  legs: [
    {
      kind: "flight",
      from: "LAX",
      to: "TPA",
      options: [{ id: "morning", label: "Morning nonstop" }],
    },
  ],
};

const secondDraft: TripDraft = {
  window: { depart: "Nov 24", return: "Nov 29" },
  legs: [
    {
      kind: "flight",
      from: "LAX",
      to: "TPA",
      options: [
        { id: "morning", label: "Morning nonstop" },
        { id: "evening", label: "Evening nonstop" },
      ],
    },
  ],
};

function renderDraft(fetchDraft: TripDraftFetch) {
  return render(
    <TripDraftArtifact
      token="draft-token"
      fetchDraft={fetchDraft}
      pollIntervalMs={60_000}
    />,
  );
}

describe("TripDraftArtifact", () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it("renders the draft window and LAX to TPA, then an option from the next fetch", async () => {
    const fetchDraft = jest
      .fn<ReturnType<TripDraftFetch>, Parameters<TripDraftFetch>>()
      .mockResolvedValueOnce(firstDraft)
      .mockResolvedValueOnce(secondDraft);

    renderDraft(fetchDraft);

    expect(await screen.findByText("Nov 24")).toBeInTheDocument();
    expect(screen.getByText("Nov 29")).toBeInTheDocument();
    expect(screen.getByText("LAX")).toBeInTheDocument();
    expect(screen.getByText("TPA")).toBeInTheDocument();
    expect(screen.getByText("Morning nonstop")).toBeInTheDocument();
    expect(screen.queryByText("Evening nonstop")).not.toBeInTheDocument();

    act(() => {
      window.dispatchEvent(new Event("focus"));
    });

    expect(await screen.findByText("Evening nonstop")).toBeInTheDocument();
    expect(screen.getByText("Nov 24")).toBeInTheDocument();
    expect(screen.getByText("Nov 29")).toBeInTheDocument();
    expect(screen.getByText("LAX")).toBeInTheDocument();
    expect(screen.getByText("TPA")).toBeInTheDocument();
    expect(fetchDraft).toHaveBeenCalledTimes(2);
    expect(fetchDraft).toHaveBeenNthCalledWith(1, "draft-token");
    expect(fetchDraft).toHaveBeenNthCalledWith(2, "draft-token");
  });

  it("opens /i/:token on the draft", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => firstDraft,
    }) as unknown as typeof fetch;

    render(
      <HelmetProvider>
        <MemoryRouter initialEntries={["/i/draft-token"]}>
          <I18nProvider>
            <ThemeProvider>
              <NonHomeRoutes />
            </ThemeProvider>
          </I18nProvider>
        </MemoryRouter>
      </HelmetProvider>,
    );

    expect(await screen.findByText("Nov 24")).toBeInTheDocument();
    expect(screen.getByText("Nov 29")).toBeInTheDocument();
    expect(screen.getByText("LAX")).toBeInTheDocument();
    expect(screen.getByText("TPA")).toBeInTheDocument();
    expect(screen.getByText("Morning nonstop")).toBeInTheDocument();
    expect(global.fetch).toHaveBeenCalledWith(
      `${appConfig.apiBaseUrl}/i/draft-token`,
    );
    expect(
      screen.queryByRole("heading", { name: "Page not found" }),
    ).not.toBeInTheDocument();
  });

  it("fetches GET /i/:token and renders the PackServer TripDraftPublic payload shape", async () => {
    const publicDraftPayload = {
      draftId: "draft-JMgT5uf_3F",
      window: {
        depart: "2026-11-10",
        return: "2026-11-15",
        flexibility: "±1 day",
      },
      legs: [
        {
          kind: "flight",
          options: [
            { optionId: "opt-nh7", label: "ANA NH7 SFO → NRT ($940)" },
          ],
          chosenOptionId: "opt-nh7",
        },
        {
          kind: "hotel",
          options: [
            { optionId: "opt-pht", label: "Park Hyatt Tokyo ($650/night)" },
            { optionId: "opt-fallback-id" },
          ],
        },
      ],
      travelers: [{ name: "Test User" }],
      origin: "SFO",
      linkSent: true,
    };

    global.fetch = jest.fn(async (input: RequestInfo | URL) => {
      const url = typeof input === "string" ? input : input.toString();
      if (url === `${appConfig.apiBaseUrl}/i/EYD7_2yiR-qgnkFyJxO6m`) {
        return {
          ok: true,
          status: 200,
          json: async () => publicDraftPayload,
        } as Response;
      }
      return {
        ok: false,
        status: 403,
        json: async () => ({ message: "Missing Authentication Token" }),
      } as Response;
    }) as unknown as typeof fetch;

    render(
      <HelmetProvider>
        <MemoryRouter initialEntries={["/i/EYD7_2yiR-qgnkFyJxO6m"]}>
          <I18nProvider>
            <ThemeProvider>
              <NonHomeRoutes />
            </ThemeProvider>
          </I18nProvider>
        </MemoryRouter>
      </HelmetProvider>,
    );

    expect(await screen.findByText("Nov 10")).toBeInTheDocument();
    expect(screen.getByText("Nov 15")).toBeInTheDocument();
    expect(screen.getByText("ANA NH7 SFO → NRT ($940)")).toBeInTheDocument();
    expect(screen.getByText("Park Hyatt Tokyo ($650/night)")).toBeInTheDocument();
    expect(screen.getByText("opt-fallback-id")).toBeInTheDocument();
    expect(
      screen.queryByText("This draft link could not be loaded."),
    ).not.toBeInTheDocument();
    expect(global.fetch).toHaveBeenCalledWith(
      `${appConfig.apiBaseUrl}/i/EYD7_2yiR-qgnkFyJxO6m`,
    );
  });

  it("shows the error state when GET /i/:token returns a malformed leg payload", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        window: { depart: "2026-11-10", return: "2026-11-15" },
        legs: [{ kind: "", options: ["bad"] }],
      }),
    }) as unknown as typeof fetch;

    render(
      <HelmetProvider>
        <MemoryRouter initialEntries={["/i/malformed-token"]}>
          <I18nProvider>
            <ThemeProvider>
              <NonHomeRoutes />
            </ThemeProvider>
          </I18nProvider>
        </MemoryRouter>
      </HelmetProvider>,
    );

    expect(
      await screen.findByText("This draft link could not be loaded."),
    ).toBeInTheDocument();
  });
});
