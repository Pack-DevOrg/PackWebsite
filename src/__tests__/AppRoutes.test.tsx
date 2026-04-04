import React from "react";
import { render, screen } from "@testing-library/react";
import { HelmetProvider } from "react-helmet-async";
import { MemoryRouter } from "react-router-dom";
import { AppRoutes } from "@/App";

const mockTrackPageView = jest.fn();

jest.mock("@/routes/HomePage", () => ({
  __esModule: true,
  default: () => <div>marketing-home</div>,
}));

jest.mock("@/routes/NonHomeRoutes", () => ({
  __esModule: true,
  default: () => <div>non-home-routes</div>,
}));

jest.mock("@/components/ConsentBanner", () => ({
  __esModule: true,
  default: () => null,
}));

jest.mock("@/components/TrackingProvider", () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useTracking: () => ({
    trackPageView: mockTrackPageView,
  }),
}));

describe("AppRoutes", () => {
  beforeEach(() => {
    mockTrackPageView.mockClear();
  });

  it("renders the marketing homepage at the root path", () => {
    render(
      <MemoryRouter initialEntries={["/"]}>
        <HelmetProvider>
          <AppRoutes />
        </HelmetProvider>
      </MemoryRouter>
    );

    expect(screen.getByText("marketing-home")).toBeInTheDocument();
    expect(screen.queryByText("non-home-routes")).not.toBeInTheDocument();
    expect(mockTrackPageView).toHaveBeenCalledWith("/");
  });
});
