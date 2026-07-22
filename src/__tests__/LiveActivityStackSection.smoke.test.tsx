import React from "react";
import { renderToString } from "react-dom/server";
import { HelmetProvider } from "react-helmet-async";
import { MemoryRouter } from "react-router-dom";
import ThemeProvider from "../styles/ThemeProvider";
import { TrackingProvider } from "../components/TrackingProvider";
import { I18nProvider } from "../i18n/I18nProvider";
import LiveActivityStackSection from "../components/LiveActivityStackSection";

describe("LiveActivityStackSection", () => {
  it("renders the real Live Activity goldens inside the lock-screen pile", () => {
    const html = renderToString(
      <MemoryRouter initialEntries={["/"]}>
        <HelmetProvider>
          <ThemeProvider>
            <TrackingProvider>
              <I18nProvider>
                <LiveActivityStackSection />
              </I18nProvider>
            </TrackingProvider>
          </ThemeProvider>
        </HelmetProvider>
      </MemoryRouter>
    );
    expect(html).toContain("/images/live-activities/live-activity-flight.webp");
    expect(html).toContain("/images/live-activities/live-activity-event.webp");
    expect(html).toContain("9:41");
    expect(html).toContain("Travel, kept ");
  });
});
