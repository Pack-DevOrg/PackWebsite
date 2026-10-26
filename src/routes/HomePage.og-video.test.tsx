import React from "react";
import { render, waitFor } from "@testing-library/react";
import { HelmetProvider } from "react-helmet-async";
import { MemoryRouter } from "react-router-dom";

import { TrackingProvider } from "@/components/TrackingProvider";
import { I18nProvider } from "@/i18n/I18nProvider";
import { ThemeProvider } from "@/styles/ThemeProvider";
import { DEFAULT_SHARE_IMAGE_URL, HERO_SHARE_VIDEO_URL } from "@/seo/pageSeo";
import HomePage from "./HomePage";

describe("HomePage link preview", () => {
  it("advertises the hero share loop as og:video and keeps the og:image card", async () => {
    render(
      <MemoryRouter initialEntries={["/"]}>
        <HelmetProvider>
          <I18nProvider>
            <ThemeProvider>
              <TrackingProvider>
                <HomePage />
              </TrackingProvider>
            </ThemeProvider>
          </I18nProvider>
        </HelmetProvider>
      </MemoryRouter>,
    );

    const meta = (selector: string) =>
      document.head.querySelector(selector)?.getAttribute("content");

    await waitFor(() => {
      expect(meta('meta[property="og:video"]')).toBe(HERO_SHARE_VIDEO_URL);
    });
    expect(meta('meta[property="og:video:secure_url"]')).toBe(HERO_SHARE_VIDEO_URL);
    expect(meta('meta[property="og:video:type"]')).toBe("video/mp4");
    expect(meta('meta[property="og:video:width"]')).toBe("1200");
    expect(meta('meta[property="og:video:height"]')).toBe("630");
    expect(meta('meta[property="og:image"]')).toBe(DEFAULT_SHARE_IMAGE_URL);
    expect(meta('meta[name="twitter:card"]')).toBe("summary_large_image");
  });
});
