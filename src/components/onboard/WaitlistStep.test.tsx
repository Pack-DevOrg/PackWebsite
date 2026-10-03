import React from "react";
import { render, screen } from "@testing-library/react";

import { WaitlistStep } from "./WaitlistStep";

// OnboardingContent reads safe-area insets from a PackApp-local copy of
// react-native-safe-area-context that no provider here can reach.
jest.mock("@pack/ui-primitives", () => ({
  ...jest.requireActual("@pack/ui-primitives"),
  OnboardingContent: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
}));

describe("WaitlistStep", () => {
  it("shows the waitlist copy and never the 'You're all set' screen or an SMS CTA", () => {
    const { container } = render(<WaitlistStep />);

    expect(screen.getByText("You're on the list!")).toBeInTheDocument();
    expect(
      screen.getByText("We'll let you know the moment you're in.")
    ).toBeInTheDocument();
    expect(screen.queryByText("You're all set!")).not.toBeInTheDocument();
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
    expect(container.innerHTML).not.toMatch(/sms:/);
  });
});
