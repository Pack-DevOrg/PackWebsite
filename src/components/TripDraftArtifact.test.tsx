import { act, render, screen } from "@testing-library/react";
import { HelmetProvider } from "react-helmet-async";
import { MemoryRouter } from "react-router-dom";

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
    expect(
      screen.queryByRole("heading", { name: "Page not found" }),
    ).not.toBeInTheDocument();
  });
});
