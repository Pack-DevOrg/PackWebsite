import React from "react";
import fs from "fs";
import path from "path";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { HelmetProvider } from "react-helmet-async";
import { MemoryRouter } from "react-router-dom";
import { ThemeProvider } from "../styles/ThemeProvider";
import TrackingProvider from "../components/TrackingProvider";
import { I18nProvider } from "../i18n/I18nProvider";
import FAQ, { POLICY_SAFEGUARDS_QUOTE } from "./FAQ";

// Spanish is not a publicly routed locale yet (config.test.ts), but its FAQ copy
// ships in the module, so the test forces the locale to render it.
let mockLocaleOverride: "es" | null = null;
jest.mock("../i18n/I18nProvider", () => {
  const actual = jest.requireActual("../i18n/I18nProvider");
  return {
    ...actual,
    useI18n: () => {
      const value = actual.useI18n();
      return mockLocaleOverride ? { ...value, locale: mockLocaleOverride } : value;
    },
  };
});

const PRIVACY_ITEMS = [
  "data-privacy",
  "data-usage",
  "booking-security",
  "technology-security",
] as const;

// Claims that are not sentences of the legally reviewed policy.
const NON_POLICY_CLAIMS =
  /encrypt|cifrad|industry-standard|est[áa]ndar de la industria|est[áa]ndar|gdpr|top priorit|principales prioridades|privacy-focused|enfoque en privacidad|secure|seguro|segur|stored safely|compliance/i;

const renderFaq = (entry: string) =>
  render(
    <MemoryRouter initialEntries={[entry]}>
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

const openAll = () => {
  for (const button of screen.getAllByRole("button", { expanded: false })) {
    if (button.getAttribute("aria-controls")?.startsWith("faq-answer-")) {
      fireEvent.click(button);
    }
  }
};

describe("FAQ privacy answers delegate to the Privacy Policy", () => {
  it("quotes only text that appears verbatim in PrivacyPolicy.md", () => {
    const policy = fs.readFileSync(
      path.resolve(__dirname, "../../public/PrivacyPolicy.md"),
      "utf8",
    );
    expect(policy).toContain(POLICY_SAFEGUARDS_QUOTE);
  });

  it.each([
    ["/faq", "Privacy Policy"],
    ["/es/faq", "Política de Privacidad"],
  ])("%s: each privacy/security answer links the policy and makes no non-policy claims", (entry, linkName) => {
    mockLocaleOverride = entry === "/es/faq" ? "es" : null;
    renderFaq("/faq");
    openAll();

    for (const id of PRIVACY_ITEMS) {
      const answer = document.getElementById(`faq-answer-${id}`)!;
      expect(answer).not.toBeNull();
      expect(within(answer).getByRole("link", { name: linkName })).toHaveAttribute(
        "href",
        "/privacy",
      );
      const text = answer.textContent ?? "";
      expect(text).not.toMatch(NON_POLICY_CLAIMS);
      // Every quoted span must be a verbatim policy sentence.
      for (const quoted of Array.from(answer.querySelectorAll("q"))) {
        expect(quoted.textContent).toBe(POLICY_SAFEGUARDS_QUOTE);
      }
    }

    const choices = within(document.getElementById("faq-answer-data-privacy")!).getByRole(
      "link",
      { name: entry === "/faq" ? "Your Privacy Choices" : "Tus opciones de privacidad" },
    );
    expect(choices).toHaveAttribute("href", "/privacy-request");
  });
});
