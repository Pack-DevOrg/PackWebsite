import React from "react";
import { render, screen } from "@testing-library/react";
import { tokens } from "@pack/ui-primitives";

import {
  OnboardViewport,
  OnboardViewportLock,
  PrimaryButton,
  ProgressDots,
  ProviderButton,
  onboardTokens,
} from "./OnboardPrimitives";

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
    expect(tokens.colors.primary).toBe(onboardTokens.primary);
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
  });

  it("renders PrimaryButton with black text on saffron", () => {
    render(<PrimaryButton>Continue</PrimaryButton>);
    const button = screen.getByRole("button", { name: "Continue" });
    expect(button).toBeInTheDocument();
    expect(tokens.colors.primary).toBe("#F0C62D");
    expect(tokens.colors.textOnPrimary).toBe("#000000");
  });

  it("fills the phone viewport with dvh and safe-area, never vh", () => {
    render(
      <>
        <OnboardViewportLock />
        <OnboardViewport>shell</OnboardViewport>
      </>
    );

    const css = Array.from(document.querySelectorAll("style"))
      .map((node) => node.textContent ?? "")
      .join("\n");
    expect(css).toContain("100dvh");
    expect(css).toContain("env(safe-area-inset-top");
    expect(css).toContain("env(safe-area-inset-bottom");
    expect(css).toMatch(/overflow:\s*hidden/);
    expect(css).not.toMatch(/min-height:\s*100vh(?!d)/);
    expect(css).not.toMatch(/(?<![d])100vh/);
  });

  it("renders ProviderButton brand labels", () => {
    render(
      <>
        <ProviderButton provider="google" />
        <ProviderButton provider="apple" />
      </>
    );

    expect(
      screen.getByRole("button", { name: "Continue with Google" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Continue with Apple" })
    ).toBeInTheDocument();
  });
});
