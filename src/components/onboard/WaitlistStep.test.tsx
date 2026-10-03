import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";

import { WaitlistStep } from "./WaitlistStep";

// The shared primitives need a SafeAreaProvider from PackApp's own module copy;
// stub them so this suite pins only the step's copy and callbacks.
jest.mock("@pack/ui-primitives", () => {
  const React = jest.requireActual("react");
  const passthrough = (tag: string) => {
    const Component = ({ children }: { children?: React.ReactNode }) =>
      React.createElement(tag, null, children);
    return Component;
  };
  return {
    OnboardingContent: passthrough("div"),
    OnboardingTitle: passthrough("h1"),
    OnboardingSubtitle: passthrough("p"),
    OnboardingPrimaryButton: ({
      children,
      onPress,
    }: {
      children?: React.ReactNode;
      onPress: () => void;
    }) => React.createElement("button", { onClick: onPress }, children),
  };
});

describe("WaitlistStep", () => {
  it("waitlisted: shows the waitlist copy and no way forward", () => {
    render(<WaitlistStep approved={false} onContinue={jest.fn()} />);

    expect(screen.getByText("You're on the waitlist")).toBeInTheDocument();
    expect(screen.queryByText("You're in")).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Continue" })
    ).not.toBeInTheDocument();
  });

  it("approved: flips the same step to You're in and Continue advances", () => {
    const onContinue = jest.fn();
    const { rerender } = render(
      <WaitlistStep approved={false} onContinue={onContinue} />
    );
    rerender(<WaitlistStep approved onContinue={onContinue} />);

    expect(screen.getByText("You're in")).toBeInTheDocument();
    expect(
      screen.queryByText("You're on the waitlist")
    ).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    expect(onContinue).toHaveBeenCalledTimes(1);
  });
});
