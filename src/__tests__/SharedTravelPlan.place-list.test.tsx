import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { HelmetProvider } from "react-helmet-async";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { I18nProvider } from "../i18n/I18nProvider";
import { SharedTravelPlan } from "../pages/SharedTravelPlan";

const base = { version: "1", title: "Lunch spots", createdAt: "2026-10-01T00:00:00Z", chunks: [], outlineChunks: [] };
const places = [
  { id: "a", name: "Alpha Cafe", lat: 37.77, lng: -122.42, distanceMeters: 400, openNow: true, hours: "9-5", why: "Great coffee" },
  { id: "b", name: "Beta Bar", lat: 37.78, lng: -122.41, distanceMeters: 1500, openNow: false },
  { id: "c", name: "Gamma Deli", lat: 37.76, lng: -122.43 },
];

const mockFetch = (data: unknown): void => {
  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    headers: { get: () => "application/json" },
    text: async () => JSON.stringify({ success: true, data }),
  }) as unknown as typeof fetch;
};

const renderPage = () =>
  render(
    <MemoryRouter initialEntries={["/a/tok"]}>
      <HelmetProvider>
        <I18nProvider>
          <Routes>
            <Route path="/a/:shareId" element={<SharedTravelPlan />} />
          </Routes>
        </I18nProvider>
      </HelmetProvider>
    </MemoryRouter>,
  );

describe("SharedTravelPlan place list", () => {
  it("renders map pins, ranked rows, and directions links", async () => {
    mockFetch({ ...base, placeList: places });
    renderPage();
    const rows = await screen.findAllByTestId("place-row");
    expect(rows).toHaveLength(3);
    expect(rows.map((r) => r.querySelector("strong")?.textContent)).toEqual(["Alpha Cafe", "Beta Bar", "Gamma Deli"]);
    expect(screen.getAllByTestId("place-pin")).toHaveLength(3);
    const links = screen.getAllByTestId("place-directions");
    expect(links).toHaveLength(3);
    expect(links[0].getAttribute("href")).toContain("maps.apple.com");
    expect(screen.getAllByTestId("place-directions-google")[0].getAttribute("href")).toContain("google.com/maps");
    fireEvent.click(screen.getAllByTestId("place-pin")[0]);
    expect(await screen.findByTestId("place-details")).toHaveTextContent("9-5");
  });

  it("renders the existing view without placeList", async () => {
    mockFetch(base);
    renderPage();
    expect(await screen.findByRole("heading", { level: 1, name: "Lunch spots" })).toBeTruthy();
    expect(screen.queryByTestId("place-list")).toBeNull();
  });
});
