import React from "react";
import { render, screen } from "@testing-library/react";
import { HelmetProvider } from "react-helmet-async";
import { BrowserRouter } from "react-router-dom";
import { ThemeProvider } from "styled-components";
import theme from "../styles/theme";
import { I18nProvider } from "../i18n/I18nProvider";
import BookNowCta, { isBookNowCapability } from "./BookNowCta";

const BookNowCtaWrapper = () => (
  <ThemeProvider theme={theme}>
    <HelmetProvider>
      <BrowserRouter>
        <I18nProvider>
          <BookNowCta />
        </I18nProvider>
      </BrowserRouter>
    </HelmetProvider>
  </ThemeProvider>
);

describe("BookNowCta", () => {
  beforeAll(() => {
    class MockIntersectionObserver {
      observe() {}
      disconnect() {}
    }
    (window as unknown as { IntersectionObserver: typeof MockIntersectionObserver }).IntersectionObserver =
      MockIntersectionObserver;
  });

  it("is true only for travel-booking", () => {
    expect(isBookNowCapability("travel-booking")).toBe(true);
    expect(isBookNowCapability("travel-history")).toBe(false);
  });

  it("renders a Book now link to /app", () => {
    render(<BookNowCtaWrapper />);
    const link = screen.getByRole("link", { name: /book now/i });
    expect(link).toHaveAttribute("data-testid", "book-now-cta");
    expect(link.getAttribute("href")).toMatch(/\/app$/);
  });
});
