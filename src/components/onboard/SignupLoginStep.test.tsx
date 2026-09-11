import React from "react";
import { render, screen } from "@testing-library/react";

import { SignupLoginStep } from "./SignupLoginStep";

describe("SignupLoginStep", () => {
  it("pins app welcome copy and provider order with brand icons, no phone login", () => {
    const { container } = render(<SignupLoginStep />);

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

    expect(screen.queryByLabelText("Phone number")).toBeNull();
    expect(screen.queryByLabelText(/Digit 1 of 6/)).toBeNull();
    expect(screen.queryByText("Resend")).toBeNull();

    const google = screen.getByRole("button", { name: "Continue with Google" });
    const apple = screen.getByRole("button", { name: "Continue with Apple" });
    expect(google.querySelector("svg")).not.toBeNull();
    expect(apple.querySelector("svg")).not.toBeNull();

    expect(container.textContent).not.toMatch(
      /SignupLoginScreen|Screen[A-Z]|data-step/
    );
    expect(container.innerHTML).not.toContain("data-step");
  });
});
