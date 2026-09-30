import { render, screen } from "@testing-library/react";
import { HelmetProvider } from "react-helmet-async";
import { MemoryRouter } from "react-router-dom";

import { I18nProvider } from "@/i18n/I18nProvider";
import { ThemeProvider } from "@/styles/ThemeProvider";

import NonHomeRoutes from "./NonHomeRoutes";

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

describe("NonHomeRoutes two-factor", () => {
  it("routes /2fa/<ticket> to the one-field code page, not NotFoundPage", async () => {
    renderAt("/2fa/ticket-from-the-text");

    expect(await screen.findByLabelText("Verification code")).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: "Page not found" }),
    ).not.toBeInTheDocument();
  });
});
