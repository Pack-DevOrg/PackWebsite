import React from "react";
import { render } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { HelmetProvider } from "react-helmet-async";
import { MemoryRouter } from "react-router-dom";
import { ThemeProvider } from "../styles/ThemeProvider";
import TrackingProvider from "../components/TrackingProvider";
import Layout from "../components/Layout";
import { I18nProvider } from "../i18n/I18nProvider";
import AccessibilityPage from "../pages/Accessibility";
import PrivacyRequestPage from "../pages/PrivacyRequest";
import PrivacyRequestVerificationPage from "../pages/PrivacyRequestVerificationPage";
import Footer from "../components/Footer";
import Features from "../pages/Features";
import FAQ from "../pages/FAQ";
import HowItWorks from "../pages/HowItWorks";

const renderShell = (ui: React.ReactNode, initialEntries: string[]) => (
  <MemoryRouter initialEntries={initialEntries}>
    <HelmetProvider>
      <ThemeProvider>
        <TrackingProvider>
          <I18nProvider>
            {ui}
          </I18nProvider>
        </TrackingProvider>
      </ThemeProvider>
    </HelmetProvider>
  </MemoryRouter>
);

describe("SSR-like render smoke", () => {
  it("renders accessibility shell", () => {
    render(
      renderShell(
        <Layout>
          <AccessibilityPage />
          <Footer />
        </Layout>,
        ["/accessibility"],
      )
    );
  });

  it("renders privacy request shell", () => {
    render(
      renderShell(
        <Layout>
          <PrivacyRequestPage />
          <Footer />
        </Layout>,
        ["/privacy-request"],
      )
    );
  });

  it("renders privacy request verification shell", () => {
    render(
      renderShell(
        <Layout>
          <PrivacyRequestVerificationPage />
          <Footer />
        </Layout>,
        [
          "/privacy-request/verify?requestId=550e8400-e29b-41d4-a716-446655440000&token=verify-token-1234567890",
        ],
      )
    );
  });

  it("renders features for SSR", () => {
    expect(() =>
      renderToString(
        renderShell(
          <Layout>
            <Features />
          </Layout>,
          ["/features"],
        )
      )
    ).not.toThrow();
  });

  it("renders FAQ for SSR", () => {
    expect(() =>
      renderToString(
        renderShell(
          <Layout>
            <FAQ />
          </Layout>,
          ["/faq"],
        )
      )
    ).not.toThrow();
  });

  it("renders how-it-works for SSR", () => {
    expect(() =>
      renderToString(
        renderShell(
          <Layout>
            <HowItWorks />
          </Layout>,
          ["/how-it-works"],
        )
      )
    ).not.toThrow();
  });
});
