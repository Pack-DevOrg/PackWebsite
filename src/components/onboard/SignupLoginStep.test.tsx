import React from "react";
import { render, screen } from "@testing-library/react";

import { SignupLoginStep } from "./SignupLoginStep";

describe("SignupLoginStep", () => {
  it("pins app signup copy, provider order, six code boxes, and prefill", () => {
    const { container } = render(
      <SignupLoginStep prefillPhone="+15551212" />
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

    expect(screen.getAllByLabelText(/Digit \d of 6/)).toHaveLength(6);
    expect(screen.getByRole("button", { name: "Resend" })).toBeInTheDocument();
    expect(screen.getByLabelText("Phone number")).toHaveValue("+15551212");

    expect(container.textContent).not.toMatch(
      /SignupLoginScreen|Screen[A-Z]|data-step/
    );
    expect(container.innerHTML).not.toContain("data-step");
  });
});
