import React from "react";
import { render, screen } from "@testing-library/react";

jest.mock("@pack/ui-primitives", () => {
  const { createElement } = jest.requireActual("react");
  const el = (tag: string) => ({ children }: { children: unknown }) => createElement(tag, null, children);
  return {
    OnboardingContent: el("div"),
    OnboardingTitle: el("h1"),
    OnboardingSubtitle: el("p"),
  };
});

import { accessFromPayload, WaitlistStep } from "./WaitlistStep";

describe("WaitlistStep", () => {
  it("shows the waitlist copy and never the You're in screen", () => {
    render(<WaitlistStep />);
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
