import React from "react";
import { render, screen } from "@testing-library/react";

import {
  PrimaryButton,
  ProgressDots,
  ProviderButton,
  SheetCard,
  StepBody,
  StepTitle,
  onboardTokens,
} from "./OnboardPrimitives";

function stylesheetText(): string {
  return Array.from(document.querySelectorAll("style"))
    .map((node) => node.textContent ?? "")
    .join("\n");
}

function rulesFor(element: Element): string {
  const all = stylesheetText();
  const chunks: string[] = [];
  for (const cls of Array.from(element.classList)) {
    const escaped = cls.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const matches = all.match(new RegExp(`\\.${escaped}[^{]*\\{[^}]*\\}`, "g"));
    if (matches === null) {
      continue;
    }
    chunks.push(
      ...matches.map((rule) =>
        rule.replace(new RegExp(`\\.${escaped}`, "g"), "._")
      )
    );
  }
  return chunks.join("\n");
}

function declaredValue(css: string, property: string): string | undefined {
  const match = css.match(new RegExp(`${property}\\s*:\\s*([^;}]+)`, "i"));
  if (match === null) {
    return undefined;
  }
  const value = match[1];
  if (value === undefined) {
    return undefined;
  }
  return value.trim();
}

function isAbsentOrNone(value: string | undefined): boolean {
  if (value === undefined) {
    return true;
  }
  const normalized = value.toLowerCase();
  return (
    normalized === "none" ||
    normalized === "unset" ||
    normalized === "initial" ||
    normalized === ""
  );
}

describe("onboardTokens", () => {
  it("pins PackApp hex, radius, and spacing values", () => {
    expect(onboardTokens.primary).toBe("#F0C62D");
    expect(onboardTokens.accent).toBe("#F0C62D");
    expect(onboardTokens.textOnPrimary).toBe("#000000");
    expect(onboardTokens.buttonPrimaryText).toBe("#000000");
    expect(onboardTokens.textPrimary).toBe("#FFFFFF");
    expect(onboardTokens.textSecondary).toBe("#909090");
    expect(onboardTokens.darkGray2).toBe("#1E1E1E");
    expect(onboardTokens.darkGray3).toBe("#2C2C2C");
    expect(onboardTokens.borderSubtle).toBe("rgba(255, 255, 255, 0.08)");
    expect(onboardTokens.borderMedium).toBe("rgba(255, 255, 255, 0.2)");
    expect(onboardTokens.overlay70).toBe("rgba(0, 0, 0, 0.7)");
    expect(onboardTokens.buttonHeightL).toBe(55);
    expect(onboardTokens.spacing.xs).toBe(4);
    expect(onboardTokens.spacing.s).toBe(8);
    expect(onboardTokens.spacing.s12).toBe(12);
    expect(onboardTokens.spacing.m).toBe(16);
    expect(onboardTokens.spacing.l).toBe(24);
    expect(onboardTokens.borderRadius.r10).toBe(10);
    expect(onboardTokens.borderRadius.l).toBe(12);
    expect(onboardTokens.borderRadius.r16).toBe(16);
    expect(onboardTokens.borderRadius.r28).toBe(28);
    expect(onboardTokens.fontSize.xs).toBe(12);
    expect(onboardTokens.fontSize.s).toBe(14);
    expect(onboardTokens.fontSize.m).toBe(16);
    expect(onboardTokens.fontSize.m15).toBe(15);
    expect(onboardTokens.fontSize.xl).toBe(20);
    expect(onboardTokens.fontWeight.semibold).toBe("600");
    expect(onboardTokens.fontWeight.bold).toBe("700");
  });
});

describe("OnboardPrimitives", () => {
  it("renders four ProgressDots with only index 1 active in saffron", () => {
    render(<ProgressDots count={4} activeIndex={1} />);

    const row = screen.getByTestId("onboard-progress-dots");
    const dots = screen.getAllByTestId("onboard-progress-dot");
    expect(row).toContainElement(dots[0] as HTMLElement);
    expect(dots).toHaveLength(4);
    expect(dots[0]).toHaveAttribute("data-active", "false");
    expect(dots[1]).toHaveAttribute("data-active", "true");
    expect(dots[2]).toHaveAttribute("data-active", "false");
    expect(dots[3]).toHaveAttribute("data-active", "false");

    const active = dots[1];
    if (active === undefined) {
      throw new Error("expected an active progress dot at index 1");
    }
    const css = rulesFor(active);
    expect(css).toContain("#F0C62D");
  });

  it("renders PrimaryButton with black text on saffron", () => {
    render(<PrimaryButton>Continue</PrimaryButton>);
    const button = screen.getByRole("button", { name: "Continue" });
    const css = rulesFor(button);
    const color = declaredValue(css, "color");
    const background = declaredValue(css, "background");

    expect(color === "#000000" || color === "rgb(0, 0, 0)").toBe(true);
    expect(background).toBe("#F0C62D");
    expect(css).toContain("#000000");
    expect(css).toContain("#F0C62D");
  });

  it("keeps SheetCard free of box-shadow and backdrop-filter", () => {
    const { container } = render(<SheetCard>sheet</SheetCard>);
    const sheet = container.firstElementChild;
    if (sheet === null) {
      throw new Error("SheetCard did not render a root element");
    }
    const css = rulesFor(sheet);

    expect(isAbsentOrNone(declaredValue(css, "box-shadow"))).toBe(true);
    expect(isAbsentOrNone(declaredValue(css, "backdrop-filter"))).toBe(true);
  });

  it("renders ProviderButton brand labels, StepTitle, and StepBody", () => {
    render(
      <>
        <ProviderButton provider="google" />
        <ProviderButton provider="apple" />
        <StepTitle>Title</StepTitle>
        <StepBody>Body copy</StepBody>
      </>
    );

    expect(
      screen.getByRole("button", { name: "Continue with Google" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Continue with Apple" })
    ).toBeInTheDocument();
    expect(screen.getByText("Title")).toBeInTheDocument();
    expect(screen.getByText("Body copy")).toBeInTheDocument();
  });
});
