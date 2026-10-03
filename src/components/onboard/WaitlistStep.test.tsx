import React from "react";
import { render, screen } from "@testing-library/react";

import { SafeAreaProvider } from "react-native-safe-area-context";

import { accessFromPayload, WaitlistStep } from "./WaitlistStep";

describe("WaitlistStep", () => {
  it("shows the waitlist copy and never the You're in screen", () => {
    render(
      <SafeAreaProvider
        initialMetrics={{
          frame: { x: 0, y: 0, width: 390, height: 844 },
          insets: { top: 0, left: 0, right: 0, bottom: 0 },
        }}
      >
        <WaitlistStep />
      </SafeAreaProvider>,
    );
    expect(screen.getByText("You're on the waitlist")).toBeInTheDocument();
    expect(screen.getByText("We'll text you when it's your turn.")).toBeInTheDocument();
    expect(screen.queryByText("You're all set!")).toBeNull();
  });

  it("only a waitlisted payload gates; approved and active pass", () => {
    expect(accessFromPayload({ access: "waitlisted" })).toBe("waitlisted");
    expect(accessFromPayload({ data: { access: "waitlisted" } })).toBe("waitlisted");
    expect(accessFromPayload({ access: "invited" })).toBe("invited");
    expect(accessFromPayload({ access: "active" })).toBe("active");
    expect(accessFromPayload({ accounts: [] })).toBe("active");
    expect(accessFromPayload(null)).toBe("active");
  });
});
