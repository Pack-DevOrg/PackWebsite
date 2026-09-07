import { render, screen } from "@testing-library/react";
import { HelmetProvider } from "react-helmet-async";
import { MemoryRouter } from "react-router-dom";

import NonHomeRoutes from "./NonHomeRoutes";
import { I18nProvider } from "@/i18n/I18nProvider";
import { ThemeProvider } from "@/styles/ThemeProvider";

function renderAt(path: string) {
  return render(
    <HelmetProvider>
      <MemoryRouter initialEntries={[path]}>
        <I18nProvider>
          <ThemeProvider>
            <NonHomeRoutes />
          </ThemeProvider>
        </I18nProvider>
      </MemoryRouter>
    </HelmetProvider>,
  );
}

describe("NonHomeRoutes live-view", () => {
  it("renders the live-view page heading at /live-view with no query", async () => {
    renderAt("/live-view");

    expect(
      await screen.findByRole("heading", {
        name: "Pack needs your help — this link expired",
      }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: "Page not found" }),
    ).not.toBeInTheDocument();
  });

  it("renders the live-view page for an invalid query instead of NotFoundPage", async () => {
    renderAt("/live-view?liveViewUrl=not-a-url");

    expect(
      await screen.findByRole("heading", {
        name: "Pack needs your help — this link expired",
      }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: "Page not found" }),
    ).not.toBeInTheDocument();
  });
});
