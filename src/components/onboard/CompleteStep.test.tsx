import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";

import {
  buildAppStoreUrl,
  DEFAULT_APPLE_APP_ID,
} from "../../utils/appDeepLink";
import { CompleteStep, completeStepLocation } from "./CompleteStep";

const APPLE_APP_ID = DEFAULT_APPLE_APP_ID;

const INTERNAL_IDENTIFIERS =
  /OnboardingCompleteScreen|SignupLoginScreen|ConnectedAccountsScreen|PhotosConnectScreen|NotificationsSetupScreen|CompleteStep|data-step/;

describe("CompleteStep", () => {
  it("pins app complete-screen copy, highlight order, and CTA", () => {
    const { container } = render(<CompleteStep />);
    const text = container.textContent ?? "";

    expect(screen.getByText("✓")).toBeInTheDocument();
    expect(screen.getByText("You're all set!")).toBeInTheDocument();
    expect(
      screen.getByText("Relax, we've got you covered.")
    ).toBeInTheDocument();
    expect(screen.getByText("Smart trip planning")).toBeInTheDocument();
    expect(
      screen.getByText("Personalized recommendations")
    ).toBeInTheDocument();
    expect(screen.getByText("Built with love")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Let us handle the rest" })
    ).toBeInTheDocument();

    expect(text.indexOf("✓")).toBeGreaterThan(-1);
    expect(text.indexOf("✓")).toBeLessThan(text.indexOf("You're all set!"));
    expect(text.indexOf("You're all set!")).toBeLessThan(
      text.indexOf("Relax, we've got you covered.")
    );
    expect(text.indexOf("Relax, we've got you covered.")).toBeLessThan(
      text.indexOf("Smart trip planning")
    );
    expect(text.indexOf("Smart trip planning")).toBeLessThan(
      text.indexOf("Personalized recommendations")
    );
    expect(text.indexOf("Personalized recommendations")).toBeLessThan(
      text.indexOf("Built with love")
    );
    expect(text.indexOf("Built with love")).toBeLessThan(
      text.indexOf("Let us handle the rest")
    );

    expect(container.textContent).not.toMatch(INTERNAL_IDENTIFIERS);
    expect(container.innerHTML).not.toMatch(INTERNAL_IDENTIFIERS);
  });

  it("calls onContinue once when the CTA is clicked", () => {
    const onContinue = jest.fn();
    render(<CompleteStep onContinue={onContinue} />);

    fireEvent.click(
      screen.getByRole("button", { name: "Let us handle the rest" })
    );

    expect(onContinue).toHaveBeenCalledTimes(1);
  });

  it("assigns the App Store URL when the CTA is clicked with no onContinue", () => {
    const assign = jest
      .spyOn(completeStepLocation, "assign")
      .mockImplementation(() => undefined);

    try {
      render(<CompleteStep />);
      fireEvent.click(
        screen.getByRole("button", { name: "Let us handle the rest" })
      );

      expect(assign).toHaveBeenCalledTimes(1);
      expect(assign).toHaveBeenCalledWith(buildAppStoreUrl(APPLE_APP_ID));
    } finally {
      assign.mockRestore();
    }
  });

  it("renders no progress-dot markup", () => {
    render(<CompleteStep />);

    expect(screen.queryAllByTestId("onboard-progress-dot")).toHaveLength(0);
    expect(
      screen.queryByTestId("onboard-progress-dots")
    ).not.toBeInTheDocument();
  });
});
