import React from "react";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { ThemeProvider } from "@/styles/ThemeProvider";
import { VerifyPhoneStep } from "./VerifyPhoneStep";

const SYNTHETIC_PHONE = "+15555550100";
const SYNTHETIC_CODE = "123456";

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

function pickIssueVerifyCode(
  override: StepMocks["issueVerifyCode"] | undefined,
): StepMocks["issueVerifyCode"] {
  if (override === undefined) {
    return defaultIssueVerifyCode();
  }
  return override;
}

function pickConfirmVerifyCode(
  override: StepMocks["confirmVerifyCode"] | undefined,
): StepMocks["confirmVerifyCode"] {
  if (override === undefined) {
    return defaultConfirmVerifyCode();
  }
  return override;
}

function pickOnVerified(override: StepMocks["onVerified"] | undefined): StepMocks["onVerified"] {
  if (override === undefined) {
    return jest.fn();
  }
  return override;
}

function pickOnSkip(override: StepMocks["onSkip"] | undefined): StepMocks["onSkip"] {
  if (override === undefined) {
    return jest.fn();
  }
  return override;
}

function renderStep(overrides: Partial<StepMocks> = {}): StepMocks {
  const mocks: StepMocks = {
    issueVerifyCode: pickIssueVerifyCode(overrides.issueVerifyCode),
    confirmVerifyCode: pickConfirmVerifyCode(overrides.confirmVerifyCode),
    onVerified: pickOnVerified(overrides.onVerified),
    onSkip: pickOnSkip(overrides.onSkip),
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

async function sendCodeToOtp(issueVerifyCode: StepMocks["issueVerifyCode"]): Promise<void> {
  fireEvent.change(screen.getByLabelText("Phone number"), {
    target: { value: SYNTHETIC_PHONE },
  });
  await act(async () => {
    fireEvent.click(screen.getByRole("button", { name: "Text me the code" }));
  });
  expect(issueVerifyCode).toHaveBeenCalledWith(SYNTHETIC_PHONE);
}

describe("VerifyPhoneStep", () => {
  it("sets one-time-code autocomplete on OTP controls after sending", async () => {
    const mocks = renderStep();
    expect(document.querySelector('[autocomplete="one-time-code"]')).toBeNull();
    await sendCodeToOtp(mocks.issueVerifyCode);
    const otpControl = document.querySelector('[autocomplete="one-time-code"]');
    expect(otpControl).not.toBeNull();
    expect(otpControl?.getAttribute("autocomplete")).toBe("one-time-code");
  });

  it("locks Resend until 30s then enables it", async () => {
    jest.useFakeTimers();
    try {
      const mocks = renderStep();
      await sendCodeToOtp(mocks.issueVerifyCode);
      const resend = screen.getByRole("button", { name: "Resend" });
      expect(resend).toBeDisabled();
      act(() => {
        jest.advanceTimersByTime(29_999);
      });
      expect(resend).toBeDisabled();
      act(() => {
        jest.advanceTimersByTime(1);
      });
      expect(resend).toBeEnabled();
    } finally {
      jest.useRealTimers();
    }
  });

  it("fires onSkip without issuing a code", () => {
    const mocks = renderStep();
    fireEvent.click(screen.getByRole("button", { name: "Skip for now" }));
    expect(mocks.onSkip).toHaveBeenCalledTimes(1);
    expect(mocks.issueVerifyCode).not.toHaveBeenCalled();
  });

  it("distributes a pasted 123456 across the six OTP boxes", async () => {
    const mocks = renderStep();
    await sendCodeToOtp(mocks.issueVerifyCode);
    const boxes = screen.getAllByLabelText(/digit/i);
    expect(boxes).toHaveLength(6);
    await act(async () => {
      fireEvent.paste(boxes[0], {
        clipboardData: {
          getData: () => SYNTHETIC_CODE,
        },
      });
    });
    expect((boxes[0] as HTMLInputElement).value).toBe("1");
    expect((boxes[1] as HTMLInputElement).value).toBe("2");
    expect((boxes[2] as HTMLInputElement).value).toBe("3");
    expect((boxes[3] as HTMLInputElement).value).toBe("4");
    expect((boxes[4] as HTMLInputElement).value).toBe("5");
    expect((boxes[5] as HTMLInputElement).value).toBe("6");
  });

  it("shows warm short error copy without for security", async () => {
    const mocks = renderStep({
      confirmVerifyCode: jest.fn(async (_code: string) => {
        throw new Error("mismatch");
      }),
    });
    await sendCodeToOtp(mocks.issueVerifyCode);
    const boxes = screen.getAllByLabelText(/digit/i);
    await act(async () => {
      fireEvent.paste(boxes[0], {
        clipboardData: {
          getData: () => SYNTHETIC_CODE,
        },
      });
    });
    await waitFor(() => {
      expect(mocks.confirmVerifyCode).toHaveBeenCalledWith(SYNTHETIC_CODE);
    });
    const alert = await screen.findByRole("alert");
    expect(alert.textContent).toMatch(/didn't match/i);
    expect(alert.textContent?.toLowerCase()).not.toContain("for security");
  });

  it("confirms the code and fires onVerified", async () => {
    const mocks = renderStep();
    await sendCodeToOtp(mocks.issueVerifyCode);
    const boxes = screen.getAllByLabelText(/digit/i);
    await act(async () => {
      fireEvent.paste(boxes[0], {
        clipboardData: {
          getData: () => SYNTHETIC_CODE,
        },
      });
    });
    await waitFor(() => {
      expect(mocks.confirmVerifyCode).toHaveBeenCalledWith(SYNTHETIC_CODE);
    });
    await waitFor(() => {
      expect(mocks.onVerified).toHaveBeenCalledTimes(1);
    });
  });
});
