import React from "react";
import { render, waitFor } from "@testing-library/react";
import { HelmetProvider } from "react-helmet-async";
import { MemoryRouter } from "react-router-dom";
import { ThemeProvider } from "../styles/ThemeProvider";
import { I18nProvider } from "../i18n/I18nProvider";
import TravelContextBenchmark from "./TravelContextBenchmark";
import { latestVerifiedPackRun } from "../data/travelContextBenchmark";

const renderPage = () =>
  render(
    <MemoryRouter initialEntries={["/pack-deeperbench"]}>
      <HelmetProvider>
        <ThemeProvider>
          <I18nProvider>
            <TravelContextBenchmark />
          </I18nProvider>
        </ThemeProvider>
      </HelmetProvider>
    </MemoryRouter>,
  );

describe("TravelContextBenchmark public copy", () => {
  afterEach(() => {
    document.head
      .querySelectorAll("script[type='application/ld+json']")
      .forEach((script) => script.remove());
  });

  it("does not publish a 93/100 pass fraction in JSON-LD or page source", async () => {
    const { container } = renderPage();

    expect(latestVerifiedPackRun.hard100Composite).toBe("100 cases · 4×25");

    await waitFor(() => {
      expect(
        document.head.querySelectorAll("script[type='application/ld+json']")
          .length,
      ).toBeGreaterThan(0);
    });

    const jsonLd = Array.from(
      document.head.querySelectorAll("script[type='application/ld+json']"),
    )
      .map((script) => script.textContent ?? "")
      .join("\n");

    expect(jsonLd).not.toContain("passed 93 of 100");
    expect(jsonLd).toContain("100 cases · 4×25");
    expect(jsonLd).toMatch(/no verified 2\.0 full-run pass count is published/i);

    const pageSource = `${container.textContent ?? ""}\n${jsonLd}`;
    expect(pageSource).not.toContain("passed 93 of 100");
    expect(pageSource).not.toContain("Final pass count");
    expect(pageSource).not.toContain(
      "The reported run covers all 100 hard-corpus cases.",
    );
    expect(pageSource).toContain("100 cases · 4×25");
  });
});
