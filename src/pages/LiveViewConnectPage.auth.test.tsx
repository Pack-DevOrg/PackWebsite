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
const CLOUDFLARE_VIEWER =
  "https://live.browser.run/ui/view?mode=tab&wss=live.browser.run/api/devtools/browser/sess-1?jwt=SIGNED";
const TICKET_BODY = {
  jobId: "job-1",
  merchantHost: "www.ubereats.com",
  expiresAtMs: NOW_MS + 60_000,
};

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
    window.localStorage.clear();
    // @ts-expect-error test double; the shared viewer opens a relay socket
    global.WebSocket = class {
      onopen: (() => void) | null = null;
      onmessage: (() => void) | null = null;
      onclose: (() => void) | null = null;
      onerror: (() => void) | null = null;
      readyState = 0;
      send(): void {}
      close(): void {}
      addEventListener(): void {}
      removeEventListener(): void {}
    };
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

  it("signed in: GET /live-view goes through the authenticated API client, then the shared viewer", async () => {
    mockStatus = "authenticated";
    mockRequest.mockResolvedValue({
      success: true,
      data: TICKET_BODY,
    });
    renderAt("/live-view?token=tok-2");

    expect(await screen.findByTestId("session-viewer")).toBeInTheDocument();
    expect(document.querySelector("iframe")).toBeNull();
    expect(document.body.innerHTML).not.toContain("live.browser.run");
    expect(mockRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        path: "/live-view?token=tok-2",
        method: "GET",
        headers: { "x-pack-install-id": expect.any(String) },
      }),
    );
    const installId = mockRequest.mock.calls[0][0].headers["x-pack-install-id"] as string;
    expect(installId.length).toBeGreaterThan(0);
    expect(installId).not.toContain(CLOUDFLARE_VIEWER);
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
