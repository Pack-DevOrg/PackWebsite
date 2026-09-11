import React from "react";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { ThemeProvider } from "@/styles/ThemeProvider";
import {
  VERIFY_DESKTOP_MIN_WIDTH_PX,
  VERIFY_STATUS_POLL_INTERVAL_MS,
  VerifyPhoneStep,
} from "./VerifyPhoneStep";

const SYNTHETIC_CODE = "A1b2C3d4E5";
const SYNTHETIC_SMS_HREF = "sms:+13054392989?body=A1b2C3d4E5";
const START_PATH = "/user/information/phone-verification/start";
const CHECK_PATH = "/user/information/phone-verification/check";
const MOBILE_WIDTH_PX = 390;

jest.mock("@/auth/AuthContext", () => ({
  useAuth: () => ({
    status: "unauthenticated",
    user: null,
    login: jest.fn(),
    logout: jest.fn(),
    getAccessToken: async () => null,
    tokens: null,
  }),
}));

jest.mock("@/config/appConfig", () => ({
  appConfig: {
    apiBaseUrl: "https://api.example.com/dev",
    environment: "prod",
    apiKey: undefined,
  },
}));

type StepMocks = {
  readonly issueVerifyCode: jest.Mock<Promise<void>, [string]>;
  readonly confirmVerifyCode: jest.Mock<Promise<void>, [string]>;
  readonly onVerified: jest.Mock<void, []>;
  readonly onSkip: jest.Mock<void, []>;
};

function defaultIssueVerifyCode(): StepMocks["issueVerifyCode"] {
  return jest.fn(async (_phone: string) => {
    return;
  });
}

function defaultConfirmVerifyCode(): StepMocks["confirmVerifyCode"] {
  return jest.fn(async (_code: string) => {
    return;
  });
}

const mintPayload = {
  code: SYNTHETIC_CODE,
  smsHref: SYNTHETIC_SMS_HREF,
  expiresAt: 1_714_000_600_000,
};

function setViewportWidth(width: number): void {
  Object.defineProperty(window, "innerWidth", {
    configurable: true,
    writable: true,
    value: width,
  });
}

function renderStep(overrides: Partial<StepMocks> = {}): StepMocks {
  const mocks: StepMocks = {
    issueVerifyCode:
      overrides.issueVerifyCode === undefined
        ? defaultIssueVerifyCode()
        : overrides.issueVerifyCode,
    confirmVerifyCode:
      overrides.confirmVerifyCode === undefined
        ? defaultConfirmVerifyCode()
        : overrides.confirmVerifyCode,
    onVerified: overrides.onVerified === undefined ? jest.fn() : overrides.onVerified,
    onSkip: overrides.onSkip === undefined ? jest.fn() : overrides.onSkip,
  };
  render(
    <ThemeProvider>
      <VerifyPhoneStep
        issueVerifyCode={mocks.issueVerifyCode}
        confirmVerifyCode={mocks.confirmVerifyCode}
        onVerified={mocks.onVerified}
        onSkip={mocks.onSkip}
      />
    </ThemeProvider>,
  );
  return mocks;
}

function jsonResponse(body: unknown): Response {
  return {
    ok: true,
    status: 200,
    text: async () => JSON.stringify(body),
  } as Response;
}

function fetchUrl(index: number): string {
  const calls = (global.fetch as jest.Mock).mock.calls;
  return String(calls[index][0]);
}

describe("VerifyPhoneStep", () => {
  const originalInnerWidth = window.innerWidth;
  let checkCalls: number;

  beforeEach(() => {
    jest.clearAllMocks();
    checkCalls = 0;
    setViewportWidth(MOBILE_WIDTH_PX);
    global.fetch = jest.fn(async (input: RequestInfo | URL): Promise<Response> => {
      const href = String(input);
      if (href.includes(START_PATH)) {
        return jsonResponse(mintPayload);
      }
      if (href.includes(CHECK_PATH)) {
        checkCalls += 1;
        const status = checkCalls >= 2 ? "approved" : "pending";
        return jsonResponse({ status });
      }
      throw new Error(`unexpected fetch ${href}`);
    });
  });

  afterEach(() => {
    setViewportWidth(originalInnerWidth);
    jest.useRealTimers();
  });

  it("renders sms href containing the code and never Text me the code", async () => {
    renderStep();
    const cta = await screen.findByRole("link", { name: "Text Pack" });
    expect(cta.getAttribute("href")).toBe(SYNTHETIC_SMS_HREF);
    expect(cta.getAttribute("href")).toContain(SYNTHETIC_CODE);
    expect(cta.getAttribute("href")).toMatch(/^sms:\+13054392989\?body=/);
    expect(screen.queryByText("Text me the code")).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Text me the code" }),
    ).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Phone number")).not.toBeInTheDocument();
    expect(document.querySelector('[autocomplete="one-time-code"]')).toBeNull();
    expect(fetchUrl(0)).toContain(START_PATH);
  });

  it("shows a QR encoding the same sms link on desktop width", async () => {
    setViewportWidth(VERIFY_DESKTOP_MIN_WIDTH_PX);
    renderStep();
    const qr = await screen.findByTestId("verify-phone-qr");
    expect(qr.getAttribute("data-sms-href")).toBe(SYNTHETIC_SMS_HREF);
    expect(qr.getAttribute("data-sms-href")).toContain(SYNTHETIC_CODE);
    expect(screen.queryByRole("link", { name: "Text Pack" })).not.toBeInTheDocument();
    expect(screen.queryByText("Text me the code")).not.toBeInTheDocument();
  });

  it("polls verify-status until confirmed then fires onVerified", async () => {
    jest.useFakeTimers();
    const mocks = renderStep();
    await waitFor(() => {
      expect(checkCalls).toBe(1);
    });
    expect(mocks.onVerified).not.toHaveBeenCalled();
    await act(async () => {
      jest.advanceTimersByTime(VERIFY_STATUS_POLL_INTERVAL_MS);
    });
    await waitFor(() => {
      expect(mocks.onVerified).toHaveBeenCalledTimes(1);
    });
    expect(checkCalls).toBe(2);
    const checkUrl = (global.fetch as jest.Mock).mock.calls.find((call) =>
      String(call[0]).includes(CHECK_PATH),
    );
    expect(checkUrl).toBeDefined();
  });

  it("Skip fires and stops polling", async () => {
    jest.useFakeTimers();
    const mocks = renderStep();
    await screen.findByRole("link", { name: "Text Pack" });
    fireEvent.click(screen.getByRole("button", { name: "Skip" }));
    expect(mocks.onSkip).toHaveBeenCalledTimes(1);
    const checksAtSkip = checkCalls;
    await act(async () => {
      jest.advanceTimersByTime(VERIFY_STATUS_POLL_INTERVAL_MS * 3);
    });
    expect(mocks.onVerified).not.toHaveBeenCalled();
    expect(checkCalls).toBe(checksAtSkip);
    expect(screen.queryByText("Text me the code")).not.toBeInTheDocument();
  });
});
