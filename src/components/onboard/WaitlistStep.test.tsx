import React from "react";
import { render as rtlRender, screen } from "@testing-library/react";
import {
  WAITLIST_SUBTITLE,
  WAITLIST_TITLE,
  WaitlistStep,
} from "./WaitlistStep";

// PackApp's onboarding components resolve their own copy of the safe-area library
// (a different module instance than this package's), so the provider must come
// from that same copy. Every onboarding primitive stays real.
function packAppSafeArea(): { SafeAreaProvider: React.ComponentType<any> } {
  const fs = jest.requireActual("node:fs");
  const path = jest.requireActual("node:path");
  const { createRequire } = jest.requireActual("node:module");
  const root = ["PackApp", "../PackApp", "../../PackApp", "../../../PackApp"]
    .map((dir) => path.resolve(process.cwd(), dir))
    .find((dir) => fs.existsSync(path.join(dir, "src")));
  const from = createRequire(path.join(root, "src/components/onboarding/x.js"));
  const pkg = from.resolve("react-native-safe-area-context/package.json");
  return jest.requireActual(
    path.join(path.dirname(pkg), "lib/commonjs/index.js"),
  );
}

const { SafeAreaProvider } = packAppSafeArea();

const initialMetrics = {
  frame: { x: 0, y: 0, width: 390, height: 844 },
  insets: { top: 0, right: 0, bottom: 0, left: 0 },
};

function render(ui: React.ReactElement) {
  return rtlRender(
    <SafeAreaProvider initialMetrics={initialMetrics}>{ui}</SafeAreaProvider>,
  );
}

describe("WaitlistStep", () => {
  it("renders the waitlist screen through the real onboarding primitives", () => {
    const { container } = render(<WaitlistStep />);
    const text = container.textContent ?? "";

    expect(screen.getByText("Before you're in")).toBeInTheDocument();
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
