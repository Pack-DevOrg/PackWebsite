import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";

import { NotificationsStep } from "./NotificationsStep";

const INTERNAL_IDENTIFIERS =
  /NotificationsSetupScreen|NotificationsStep|Screen[A-Z]|data-step/;

const CONSENT_SUBTITLE =
  "Occasional news and relevant offers. Off unless you say yes — change it anytime in Settings.";

describe("NotificationsStep", () => {
  it("pins app notifications-setup copy, labels, and marketing toggle off", () => {
    const { container } = render(<NotificationsStep />);
    const text = container.textContent ?? "";
    const leaked = `${container.innerHTML}${text}`;

    expect(
      screen.getByRole("heading", { name: "Turn on trip alerts" }),
    ).toBeInTheDocument();
    expect(text).toContain("trip alerts");
    expect(text).toContain("Travel tips & product updates");
    expect(text).not.toContain("Travel tips &amp; product updates");
    expect(text).toContain(CONSENT_SUBTITLE);
    expect(
      screen.getByRole("button", { name: "Turn on notifications" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Not now" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Enable browser notifications" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Skip" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Allow" }),
    ).not.toBeInTheDocument();

    const marketingToggle = screen.getByRole("switch", {
      name: "Travel tips and product updates",
    });
    expect(marketingToggle).toBeInTheDocument();
    expect(marketingToggle).not.toBeChecked();

    expect(leaked).not.toMatch(INTERNAL_IDENTIFIERS);
  });

  it("invokes onContinue from both allow and skip so the step never blocks", () => {
    const onContinueAllow = jest.fn();
    const { unmount } = render(
      <NotificationsStep onContinue={onContinueAllow} />,
    );

    fireEvent.click(
      screen.getByRole("button", { name: "Turn on notifications" }),
    );
    expect(onContinueAllow).toHaveBeenCalledTimes(1);
    unmount();

    const onContinueSkip = jest.fn();
    render(<NotificationsStep onContinue={onContinueSkip} />);
    fireEvent.click(screen.getByRole("button", { name: "Not now" }));
    expect(onContinueSkip).toHaveBeenCalledTimes(1);
  });
});
