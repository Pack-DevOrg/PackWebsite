import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HelmetProvider } from "react-helmet-async";

import { AuthProvider } from "../auth/AuthContext";
import Layout from "../components/Layout";
import { I18nProvider } from "../i18n/I18nProvider";

const renderLayout = (initialPath = "/") => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  const AnyMemoryRouter = MemoryRouter as unknown as React.ComponentType<{
    readonly initialEntries: readonly string[];
    readonly children: React.ReactNode;
  }>;

  return render(
    <AnyMemoryRouter initialEntries={[initialPath]}>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <HelmetProvider>
            <I18nProvider>
              <Layout>
                <h1>Test page</h1>
                <p>Content</p>
              </Layout>
            </I18nProvider>
          </HelmetProvider>
        </AuthProvider>
      </QueryClientProvider>
    </AnyMemoryRouter>
  );
};

describe("accessibility smoke", () => {
  it("renders without obvious a11y violations", async () => {
    const { container } = renderLayout("/");
    expect(await axe(container)).toHaveNoViolations();
  });

  it("primary navigation is keyboard-accessible", async () => {
    const user = userEvent.setup();
    const { container } = renderLayout("/");

    await waitFor(() => {
      expect(
        screen.getByRole("navigation", { name: /primary/i })
      ).toBeInTheDocument();
    });

    const menuToggle = screen.queryByRole("button", {
      name: /toggle navigation menu/i,
    });

    if (menuToggle) {
      await user.click(menuToggle);
      expect(
        screen.getByRole("dialog", { name: /navigation/i })
      ).toBeInTheDocument();
    } else {
      await user.tab();
      await user.tab();
      await user.tab();
      expect(screen.getByRole("link", { name: /tsa waits/i })).toHaveFocus();
    }

    expect(await axe(container)).toHaveNoViolations();
  });
});
