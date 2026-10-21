import React from "react";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { HelmetProvider } from "react-helmet-async";
import { MemoryRouter } from "react-router-dom";
import { ThemeProvider } from "../styles/ThemeProvider";
import TrackingProvider from "../components/TrackingProvider";
import { I18nProvider } from "../i18n/I18nProvider";
import FAQ from "./FAQ";

describe("FAQ privacy consistency", () => {
  it("renders policy-consistent privacy protections and controls without claiming personal information is never sold or GDPR compliance", () => {
    render(
      <MemoryRouter initialEntries={["/faq"]}>
        <HelmetProvider>
          <ThemeProvider>
            <TrackingProvider>
              <I18nProvider>
                <FAQ />
              </I18nProvider>
            </TrackingProvider>
          </ThemeProvider>
        </HelmetProvider>
      </MemoryRouter>,
    );

    fireEvent.click(
      screen.getByRole("button", {
        name: "How does Pack protect my personal information?",
      }),
    );

    const privacyAnswer = document.getElementById("faq-answer-data-privacy");
    expect(privacyAnswer).not.toBeNull();
    expect(privacyAnswer).toBeVisible();

    expect(privacyAnswer).not.toHaveTextContent(/never sell your personal information/i);
    expect(privacyAnswer).not.toHaveTextContent(/no selling data/i);
    expect(privacyAnswer).not.toHaveTextContent(/GDPR/i);
    expect(privacyAnswer).toHaveTextContent(/encrypted in transit and at rest/i);
    expect(privacyAnswer).toHaveTextContent(/Google API Services User Data Policy/i);
    expect(privacyAnswer).toHaveTextContent(/Limited Use/i);
    expect(privacyAnswer).toHaveTextContent(
      /disconnect connected accounts or request deletion/i,
    );

    expect(
      within(privacyAnswer!).getByRole("link", { name: "Privacy Policy" }),
    ).toHaveAttribute("href", "/privacy");
    expect(
      within(privacyAnswer!).getByRole("link", { name: "Your Privacy Choices" }),
    ).toHaveAttribute("href", "/privacy-request");
  });
});
