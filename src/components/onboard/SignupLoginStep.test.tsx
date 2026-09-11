import React from "react";
import { act, fireEvent, render, screen } from "@testing-library/react";

import { SignupLoginStep } from "./SignupLoginStep";

const SYNTHETIC_PHONE = "+15555550100";

describe("SignupLoginStep", () => {
  it("pins welcome copy, labeled phone, provider order; no otp or Resend until send", () => {
    const { container } = render(
      <SignupLoginStep prefillPhone={SYNTHETIC_PHONE} />
    );

    expect(container.textContent).toContain("Welcome to Pack");
    expect(container.textContent).toContain(
      "Choose your preferred sign-in method"
    );
    expect(container.textContent).toContain("Continue with Google");
    expect(container.textContent).toContain("Continue with Apple");
    expect(container.textContent).toContain("Terms of Service");
    expect(container.textContent).toContain("Privacy Policy");
    expect(container.textContent).toContain("By continuing you agree to our");

    const text = container.textContent ?? "";
    const googleAt = text.indexOf("Continue with Google");
    const appleAt = text.indexOf("Continue with Apple");
    expect(googleAt).toBeGreaterThanOrEqual(0);
    expect(googleAt).toBeLessThan(appleAt);

    expect(screen.getByText("Phone number")).toBeInTheDocument();
    expect(screen.getByLabelText("Phone number")).toHaveValue(SYNTHETIC_PHONE);
    expect(screen.queryAllByLabelText(/Digit \d of 6/)).toHaveLength(0);
    expect(screen.queryByRole("button", { name: "Resend" })).toBeNull();

    const google = screen.getByRole("button", { name: "Continue with Google" });
    const apple = screen.getByRole("button", { name: "Continue with Apple" });
    expect(google.querySelector("svg")).not.toBeNull();
    expect(apple.querySelector("svg")).not.toBeNull();

    expect(container.textContent).not.toMatch(
      /SignupLoginScreen|Screen[A-Z]|data-step/
    );
    expect(container.innerHTML).not.toContain("data-step");
  });

  it("shows six otp boxes and Resend after mocked send-success", async () => {
    const sendCode = jest.fn(async () => {
      return;
    });
    render(
      <SignupLoginStep prefillPhone={SYNTHETIC_PHONE} sendCode={sendCode} />
    );

    expect(screen.queryAllByLabelText(/Digit \d of 6/)).toHaveLength(0);
    expect(screen.queryByRole("button", { name: "Resend" })).toBeNull();

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Send code" }));
    });

    expect(sendCode).toHaveBeenCalledWith(SYNTHETIC_PHONE);
    expect(screen.getAllByLabelText(/Digit \d of 6/)).toHaveLength(6);
    expect(screen.getByRole("button", { name: "Resend" })).toBeInTheDocument();
  });

  it("keeps otp and Resend hidden when send rejects", async () => {
    const sendCode = jest.fn(async () => {
      throw new Error("send-failed");
    });
    render(
      <SignupLoginStep prefillPhone={SYNTHETIC_PHONE} sendCode={sendCode} />
    );

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Send code" }));
    });

    expect(sendCode).toHaveBeenCalledWith(SYNTHETIC_PHONE);
    expect(screen.queryAllByLabelText(/Digit \d of 6/)).toHaveLength(0);
    expect(screen.queryByRole("button", { name: "Resend" })).toBeNull();
  });
});
