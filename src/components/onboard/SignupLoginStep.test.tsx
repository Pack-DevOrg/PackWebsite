import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";

import { SignupLoginStep } from "./SignupLoginStep";

const loginMock = jest.fn();
jest.mock("@/auth/AuthContext", () => ({
  useAuth: () => ({ status: "unauthenticated", login: loginMock }),
}));

describe("SignupLoginStep", () => {
  beforeEach(() => {
    loginMock.mockReset();
  });

  it("is sign-in only like the app: welcome copy, Google then Apple, terms; no phone field, no OTP", () => {
    const { container } = render(<SignupLoginStep />);
    expect(container.textContent).toContain("Welcome to Pack");
    expect(container.textContent).toContain("Choose your preferred sign-in method");
    const buttons = screen.getAllByRole("button").map((b) => b.textContent?.trim());
    expect(buttons).toEqual(["Continue with Google", "Continue with Apple"]);
    expect(screen.queryByLabelText("Phone number")).toBeNull();
    expect(container.textContent).not.toContain("Send code");
    expect(container.textContent).not.toContain("Resend");
    expect(screen.getByRole("link", { name: "Terms of Service" })).toHaveAttribute("href", "/terms/");
    expect(screen.getByRole("link", { name: "Privacy Policy" })).toHaveAttribute("href", "/privacy/");
  });

  it("Google and Apple start sign-in with that identity provider and return to /onboard", () => {
    render(<SignupLoginStep />);
    fireEvent.click(screen.getByRole("button", { name: "Continue with Google" }));
    expect(loginMock).toHaveBeenLastCalledWith({ identityProvider: "Google", redirectPath: "/onboard" });
    fireEvent.click(screen.getByRole("button", { name: "Continue with Apple" }));
    expect(loginMock).toHaveBeenLastCalledWith({ identityProvider: "SignInWithApple", redirectPath: "/onboard" });
  });
});
