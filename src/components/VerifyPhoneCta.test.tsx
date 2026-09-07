import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { ThemeProvider } from "@/styles/ThemeProvider";
import VerifyPhoneCta, { PACK_VERIFY_SMS_E164 } from "./VerifyPhoneCta";

const SYNTHETIC_CODE = "A1b2C3d4E5";
const SYNTHETIC_SMS_HREF = "sms:+13054392989?body=A1b2C3d4E5";
const START_PATH = "/user/information/phone-verification/start";
const SETTINGS_HREF = "https://trypackai.com/app/settings";
const IPHONE_UA =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15";
const DESKTOP_UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 13_6) AppleWebKit/537.36 Chrome/120.0.0.0";

const getAccessTokenMock = jest.fn(async () => "synth-access-token");
const useAuthMock = jest.fn();

jest.mock("@/auth/AuthContext", () => ({
  useAuth: () => useAuthMock(),
}));

jest.mock("@/config/appConfig", () => ({
  appConfig: {
    apiBaseUrl: "https://api.example.com/dev",
    environment: "prod",
    apiKey: undefined,
  },
}));

const mintPayload = {
  code: SYNTHETIC_CODE,
  smsHref: SYNTHETIC_SMS_HREF,
  expiresAt: 1_714_000_600_000,
};

const authenticatedAuth = {
  status: "authenticated",
  user: { sub: "user-synth-1", email: "tests@trypackai.com" },
  login: jest.fn(),
  logout: jest.fn(),
  getAccessToken: getAccessTokenMock,
  tokens: { tokenType: "Bearer" },
};

const publicAuth = {
  status: "unauthenticated",
  user: null,
  login: jest.fn(),
  logout: jest.fn(),
  getAccessToken: async () => null,
  tokens: null,
};

function setUserAgent(userAgent: string): void {
  Object.defineProperty(window.navigator, "userAgent", {
    configurable: true,
    get: () => userAgent,
  });
}

function renderCta(locationHrefTarget: { href: string }) {
  return render(
    <ThemeProvider>
      <VerifyPhoneCta locationHrefTarget={locationHrefTarget} />
    </ThemeProvider>,
  );
}

function lastFetchInit(): RequestInit {
  const calls = (global.fetch as jest.Mock).mock.calls;
  expect(calls.length).toBeGreaterThan(0);
  return calls[calls.length - 1][1] as RequestInit;
}

function lastFetchUrl(): string {
  const calls = (global.fetch as jest.Mock).mock.calls;
  expect(calls.length).toBeGreaterThan(0);
  return String(calls[calls.length - 1][0]);
}

describe("VerifyPhoneCta", () => {
  const originalUserAgent = window.navigator.userAgent;
  let locationHrefTarget: { href: string };

  beforeEach(() => {
    jest.clearAllMocks();
    locationHrefTarget = { href: SETTINGS_HREF };
    getAccessTokenMock.mockResolvedValue("synth-access-token");
    useAuthMock.mockReturnValue(authenticatedAuth);
    setUserAgent(IPHONE_UA);
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => JSON.stringify(mintPayload),
    });
  });

  afterEach(() => {
    Object.defineProperty(window.navigator, "userAgent", {
      configurable: true,
      get: () => originalUserAgent,
    });
  });

  it("posts platform web with no phoneNumber and no phone or OTP inputs", async () => {
    renderCta(locationHrefTarget);

    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
    expect(screen.queryByRole("spinbutton")).not.toBeInTheDocument();
    expect(document.querySelector("input")).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Text Pack" }));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled();
    });

    expect(lastFetchUrl()).toContain(START_PATH);
    const init = lastFetchInit();
    expect(init.method).toBe("POST");
    const body = JSON.parse(String(init.body)) as Record<string, unknown>;
    expect(body).toEqual({ platform: "web" });
    expect(body).not.toHaveProperty("phoneNumber");
  });

  it("sends Authorization when authed and credentials include when public", async () => {
    renderCta(locationHrefTarget);
    fireEvent.click(screen.getByRole("button", { name: "Text Pack" }));
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled();
    });
    expect(lastFetchInit().headers).toEqual(
      expect.objectContaining({
        Authorization: "Bearer synth-access-token",
      }),
    );

    useAuthMock.mockReturnValue(publicAuth);
    renderCta(locationHrefTarget);
    fireEvent.click(screen.getAllByRole("button", { name: "Text Pack" })[1]);
    await waitFor(() => {
      expect((global.fetch as jest.Mock).mock.calls.length).toBe(2);
    });
    const publicInit = lastFetchInit();
    expect(publicInit.credentials).toBe("include");
    expect(
      (publicInit.headers as Record<string, string>).Authorization,
    ).toBeUndefined();
  });

  it("navigates to smsHref when sms is supported", async () => {
    renderCta(locationHrefTarget);
    fireEvent.click(screen.getByRole("button", { name: "Text Pack" }));

    await waitFor(() => {
      expect(locationHrefTarget.href).toBe(SYNTHETIC_SMS_HREF);
    });
    expect(locationHrefTarget.href).toBe(mintPayload.smsHref);
  });

  it("shows Pack number and minted code on desktop without navigating", async () => {
    setUserAgent(DESKTOP_UA);
    renderCta(locationHrefTarget);
    fireEvent.click(screen.getByRole("button", { name: "Text Pack" }));

    await waitFor(() => {
      expect(
        screen.getByText(`Text ${PACK_VERIFY_SMS_E164} with ${SYNTHETIC_CODE}`),
      ).toBeInTheDocument();
    });
    expect(locationHrefTarget.href).toBe(SETTINGS_HREF);
    expect(screen.getByText(/\+13054392989/)).toBeInTheDocument();
    expect(screen.getByText(new RegExp(SYNTHETIC_CODE))).toBeInTheDocument();
  });
});
