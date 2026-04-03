import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { HelmetProvider } from "react-helmet-async";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { ThemeProvider } from "../styles/ThemeProvider";
import TrackingProvider from "../components/TrackingProvider";
import { I18nProvider } from "../i18n/I18nProvider";
import PrivacyRequestPage from "./PrivacyRequest";

jest.mock("../utils/recaptcha", () => ({
  executeRecaptchaAction: jest.fn(),
  loadRecaptchaScript: jest.fn(() => Promise.resolve()),
}));

const LocationProbe: React.FC = () => {
  const location = useLocation();
  return <div data-testid="location-path">{location.pathname}</div>;
};

const renderPrivacyRequestRoute = (initialEntry: string) =>
  render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <HelmetProvider>
        <ThemeProvider>
          <TrackingProvider>
            <I18nProvider>
              <Routes>
                <Route path="/privacy-request" element={<PrivacyRequestPage />} />
                <Route
                  path="/privacy-request/:requestType"
                  element={<PrivacyRequestPage />}
                />
              </Routes>
              <LocationProbe />
            </I18nProvider>
          </TrackingProvider>
        </ThemeProvider>
      </HelmetProvider>
    </MemoryRouter>,
  );

describe("PrivacyRequestPage", () => {
  it("renders the updated privacy choices heading and description", () => {
    renderPrivacyRequestRoute("/privacy-request");

    expect(
      screen.getByRole("heading", { name: "Your Privacy Choices" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        /Submit a request to access, delete, correct, or manage certain privacy choices related to Pack/i,
      ),
    ).toBeInTheDocument();
  });

  it("preselects the limit processing request for /privacy-request/limit", () => {
    renderPrivacyRequestRoute("/privacy-request/limit");

    expect(screen.getByLabelText("Request Type *")).toHaveValue(
      "limit_processing",
    );
  });

  it("preselects the opt out request for /privacy-request/opt-out", () => {
    renderPrivacyRequestRoute("/privacy-request/opt-out");

    expect(screen.getByLabelText("Request Type *")).toHaveValue("opt_out");
  });

  it("falls back to access for unknown request slugs", () => {
    renderPrivacyRequestRoute("/privacy-request/not-a-real-request");

    expect(screen.getByLabelText("Request Type *")).toHaveValue("access");
  });

  it("updates the URL when the request type selection changes", () => {
    renderPrivacyRequestRoute("/privacy-request/limit");

    fireEvent.change(screen.getByLabelText("Request Type *"), {
      target: { value: "opt_out" },
    });

    expect(screen.getByTestId("location-path")).toHaveTextContent(
      "/privacy-request/opt-out",
    );
    expect(screen.getByLabelText("Request Type *")).toHaveValue("opt_out");
  });
});
