import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";

import { PhotosConnectStep } from "./PhotosConnectStep";

const INTERNAL_IDENTIFIERS = /PhotosConnectScreen|Screen[A-Z]|data-step/;

const HEADLINE = "Let's see the";
const HEADLINE_ACCENT = "places";
const HEADLINE_TAIL = "you've been";
const SUBTITLE = "Pack matches photos to find things you've visited.";
const STAT_LABELS = ["Countries", "Continents", "Cities"] as const;
const CATEGORY_LABELS = [
  "Restaurants & cafés",
  "Bars",
  "Landmarks",
  "Museums",
  "Parks",
  "Shopping",
  "Activities",
] as const;
const CONNECT_CTA = "Connect Photos";
const SKIP_CTA = "Skip for now";
const SKIP_A11Y = "Skip connecting Photos for now";
const SHEET_TITLE = "Share your photos";
const SHEET_BODY =
  "Pack finds the trips, landmarks, and restaurants hiding in your library.";
const PRIVACY_TITLE = "Private by default";
const PRIVACY_METADATA =
  "Only photo metadata — times, dates, places — is shared with us.";
const PRIVACY_NEVER = "Never your photos.";
const SHARE_CTA = "Share Photos";

describe("PhotosConnectStep", () => {
  it("pins idle copy, stats, categories, and layout order", () => {
    const { container } = render(<PhotosConnectStep />);
    const text = container.textContent ?? "";

    expect(text).toContain(HEADLINE);
    expect(screen.getByText(HEADLINE_ACCENT)).toBeInTheDocument();
    expect(text).toContain(HEADLINE_TAIL);
    expect(screen.getByText(SUBTITLE)).toBeInTheDocument();
    for (const label of STAT_LABELS) {
      expect(screen.getByText(label)).toBeInTheDocument();
    }
    expect(text).toMatch(/0[\s\S]*Countries/);
    expect(text).toMatch(/0[\s\S]*Continents/);
    expect(text).toMatch(/0[\s\S]*Cities/);
    for (const label of CATEGORY_LABELS) {
      expect(screen.getByText(label)).toBeInTheDocument();
    }
    expect(
      screen.getByRole("button", { name: CONNECT_CTA })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: SKIP_A11Y })
    ).toBeInTheDocument();
    expect(screen.getByText(SKIP_CTA)).toBeInTheDocument();

    expect(text.indexOf(HEADLINE)).toBeGreaterThan(-1);
    expect(text.indexOf(HEADLINE)).toBeLessThan(text.indexOf(SUBTITLE));
    expect(text.indexOf(SUBTITLE)).toBeLessThan(text.indexOf("Countries"));
    expect(text.indexOf("Countries")).toBeLessThan(text.indexOf("Continents"));
    expect(text.indexOf("Continents")).toBeLessThan(text.indexOf("Cities"));
    expect(text.indexOf("Cities")).toBeLessThan(
      text.indexOf("Restaurants & cafés")
    );
    expect(text.indexOf("Restaurants & cafés")).toBeLessThan(
      text.indexOf("Bars")
    );
    expect(text.indexOf("Bars")).toBeLessThan(text.indexOf("Landmarks"));
    expect(text.indexOf("Landmarks")).toBeLessThan(text.indexOf("Museums"));
    expect(text.indexOf("Museums")).toBeLessThan(text.indexOf("Parks"));
    expect(text.indexOf("Parks")).toBeLessThan(text.indexOf("Shopping"));
    expect(text.indexOf("Shopping")).toBeLessThan(text.indexOf("Activities"));
    expect(text.indexOf("Activities")).toBeLessThan(text.indexOf(CONNECT_CTA));
    expect(text.indexOf(CONNECT_CTA)).toBeLessThan(text.indexOf(SKIP_CTA));

    expect(container.textContent).not.toMatch(INTERNAL_IDENTIFIERS);
    expect(container.innerHTML).not.toMatch(INTERNAL_IDENTIFIERS);
  });

  it("opens the share sheet from Connect Photos", () => {
    const { container } = render(<PhotosConnectStep />);

    expect(screen.queryByText(SHEET_TITLE)).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: CONNECT_CTA }));

    expect(screen.getByText(SHEET_TITLE)).toBeInTheDocument();
    expect(screen.getByText(SHEET_BODY)).toBeInTheDocument();
    expect(screen.getByText(PRIVACY_TITLE)).toBeInTheDocument();
    expect(container.textContent).toContain(PRIVACY_METADATA);
    expect(container.textContent).toContain(PRIVACY_NEVER);
    expect(
      screen.getByRole("button", { name: SHARE_CTA })
    ).toBeInTheDocument();
    expect(container.textContent).not.toMatch(INTERNAL_IDENTIFIERS);
    expect(container.innerHTML).not.toMatch(INTERNAL_IDENTIFIERS);
  });

  it("calls onSkip from Skip for now and onSharePhotos from Share Photos", () => {
    const onSkip = jest.fn();
    const onSharePhotos = jest.fn();
    render(
      <PhotosConnectStep onSkip={onSkip} onSharePhotos={onSharePhotos} />
    );

    fireEvent.click(screen.getByRole("button", { name: SKIP_A11Y }));
    expect(onSkip).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole("button", { name: CONNECT_CTA }));
    fireEvent.click(screen.getByRole("button", { name: SHARE_CTA }));
    expect(onSharePhotos).toHaveBeenCalledTimes(1);
  });
});
