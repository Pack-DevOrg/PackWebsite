import React from "react";
import { render as rtlRender, screen } from "@testing-library/react";
import { SafeAreaProvider } from "react-native-safe-area-context";

import {
  WAITLIST_SUBTITLE,
  WAITLIST_TITLE,
  WaitlistStep,
} from "./WaitlistStep";

const initialMetrics = {
  frame: { x: 0, y: 0, width: 390, height: 844 },
  insets: { top: 0, left: 0, right: 0, bottom: 0 },
};

function render(ui: React.ReactElement) {
  return rtlRender(
    <SafeAreaProvider initialMetrics={initialMetrics}>{ui}</SafeAreaProvider>
  );
}

describe("WaitlistStep", () => {
  it("renders the waitlist screen through the real onboarding primitives", () => {
    const { container } = render(<WaitlistStep />);
    const text = container.textContent ?? "";

    expect(screen.getByText(WAITLIST_TITLE)).toBeInTheDocument();
    expect(screen.getByText(WAITLIST_SUBTITLE)).toBeInTheDocument();
    expect(text.indexOf(WAITLIST_TITLE)).toBeLessThan(
      text.indexOf(WAITLIST_SUBTITLE)
    );
  });

  it("does not show the approved 'You're in' / 'all set' copy", () => {
    const { container } = render(<WaitlistStep />);
    expect(container.textContent).not.toMatch(/You're all set|You're in!/);
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });
});
