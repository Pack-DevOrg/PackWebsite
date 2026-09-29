import { fireEvent, render, screen } from "@testing-library/react";
import { HelmetProvider } from "react-helmet-async";
import { MemoryRouter } from "react-router-dom";

import { LiveViewConnectPage } from "./LiveViewConnectPage";
import { I18nProvider } from "@/i18n/I18nProvider";
import { ThemeProvider } from "@/styles/ThemeProvider";

const mockLogin = jest.fn();
const mockRequest = jest.fn();
let mockStatus: "loading" | "authenticated" | "unauthenticated" = "unauthenticated";

jest.mock("../auth/AuthContext", () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useAuth: () => ({ status: mockStatus, login: mockLogin }),
}));

jest.mock("../api/useApiClient", () => ({
  useApiClient: () => ({ request: mockRequest }),
}));

const NOW_MS = 1_714_000_000_000;
const VIEWER =
  "https://live.browser.run/ui/view?mode=tab&wss=live.browser.run/api/devtools/browser/sess-1?jwt=SIGNED";

function renderAt(path: string) {
  return render(
    <HelmetProvider>
      <MemoryRouter initialEntries={[path]}>
        <I18nProvider>
          <ThemeProvider>
            <LiveViewConnectPage />
          </ThemeProvider>
        </I18nProvider>
      </MemoryRouter>
    </HelmetProvider>,
  );
}

describe("LiveViewConnectPage owner session", () => {
  beforeEach(() => {
    jest.spyOn(Date, "now").mockReturnValue(NOW_MS);
    mockLogin.mockReset();
    mockRequest.mockReset();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("signed out with a link: asks to sign in and comes back to the same link; resolves nothing", () => {
    mockStatus = "unauthenticated";
    renderAt("/live-view?token=tok-1");

    expect(screen.getByRole("heading", { name: "Sign in to watch Pack work" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Sign in" }));
    expect(mockLogin).toHaveBeenCalledWith({ redirectPath: "/live-view?token=tok-1" });
    expect(mockRequest).not.toHaveBeenCalled();
    expect(document.querySelector("iframe")).toBeNull();
  });

  it("signed in: GET /live-view goes through the authenticated API client, then the viewer iframes", async () => {
    mockStatus = "authenticated";
    mockRequest.mockResolvedValue({
      success: true,
      data: { liveViewUrl: VIEWER, merchantHost: "www.ubereats.com", jobId: "job-1", expiresAtMs: NOW_MS + 60_000 },
    });
    renderAt("/live-view?token=tok-2");

    const frame = await screen.findByTitle("Merchant checkout live view");
    expect(frame).toHaveAttribute("src", VIEWER);
    expect(mockRequest).toHaveBeenCalledWith(
      expect.objectContaining({ path: "/live-view?token=tok-2", method: "GET" }),
    );
  });

  it("signed in but not the owner (404): the expired page, no iframe", async () => {
    mockStatus = "authenticated";
    mockRequest.mockRejectedValue(new Error("404"));
    renderAt("/live-view?token=tok-other");

    expect(
      await screen.findByRole("heading", { name: "Pack needs your help — this link expired" }),
    ).toBeInTheDocument();
    expect(document.querySelector("iframe")).toBeNull();
  });
});
