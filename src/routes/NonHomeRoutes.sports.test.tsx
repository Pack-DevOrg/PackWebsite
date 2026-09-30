import {render, screen} from "@testing-library/react";
import {HelmetProvider} from "react-helmet-async";
import {MemoryRouter, Outlet} from "react-router-dom";

import NonHomeRoutes from "./NonHomeRoutes";
import {I18nProvider} from "@/i18n/I18nProvider";
import {ThemeProvider} from "@/styles/ThemeProvider";

jest.mock("./ProtectedAppShell", () => ({
  __esModule: true,
  default: function ProtectedAppShellMock() {
    return <Outlet />;
  },
}));

jest.mock("../pages/SportsPage", () => ({
  SportsPage: () => <h1>Your sports</h1>,
}));

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

describe("NonHomeRoutes sports", () => {
  it("renders the sports page at /sports instead of not found", async () => {
    renderAt("/sports");

    expect(
      await screen.findByRole("heading", {name: "Your sports"}),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", {name: "Page not found"}),
    ).not.toBeInTheDocument();
  });
});
