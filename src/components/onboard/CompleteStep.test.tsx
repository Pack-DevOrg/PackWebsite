import React from "react";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fireEvent, render, screen } from "@testing-library/react";

import { publicContactConfig } from "../../config/appConfig";
import { copyTextToClipboard } from "../../utils/clipboard";
import {
  COMPLETE_DESKTOP_MIN_WIDTH_PX,
  COMPLETE_SMS_BODY,
  CompleteStep,
  buildCompleteSmsHrefBecauseSendblue,
} from "./CompleteStep";

jest.mock("../../utils/clipboard", () => ({
  copyTextToClipboard: jest.fn(async () => undefined),
}));

const INTERNAL_IDENTIFIERS =
  /OnboardingCompleteScreen|SignupLoginScreen|ConnectedAccountsScreen|PhotosConnectScreen|NotificationsSetupScreen|CompleteStep|data-step/;

const completeStepSource = readFileSync(
  join(process.cwd(), "src/components/onboard/CompleteStep.tsx"),
  "utf8",
);

const MOBILE_WIDTH_PX = 390;

function setViewportWidth(width: number): void {
  Object.defineProperty(window, "innerWidth", {
    configurable: true,
    writable: true,
    value: width,
  });
}

describe("CompleteStep", () => {
  const originalInnerWidth = window.innerWidth;

  afterEach(() => {
    setViewportWidth(originalInnerWidth);
    jest.clearAllMocks();
  });

  it("pins app complete-screen copy, highlight order, and CTA", () => {
    setViewportWidth(MOBILE_WIDTH_PX);
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
      screen.getByRole("link", { name: "Let us handle the rest" })
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

  it("CTA href is sms: to the public Sendblue number with a prefilled body", () => {
    setViewportWidth(MOBILE_WIDTH_PX);
    render(<CompleteStep />);
    const cta = screen.getByRole("link", { name: "Let us handle the rest" });
    const href = cta.getAttribute("href");
    const configured = publicContactConfig.packSmsE164;
    const expected = buildCompleteSmsHrefBecauseSendblue(
      configured,
      COMPLETE_SMS_BODY,
    );

    if (href === null) {
      throw new Error("complete CTA missing href");
    }
    expect(href.startsWith("sms:")).toBe(true);
    expect(href).toContain(configured);
    expect(href).toMatch(/[?&]body=/);
    expect(href).toBe(expected);
    expect(completeStepSource).not.toContain("+13054392989");
    expect(completeStepSource).toContain("publicContactConfig.packSmsE164");
  });

  it("shows the Pack number and a copy button on desktop", () => {
    setViewportWidth(COMPLETE_DESKTOP_MIN_WIDTH_PX);
    render(<CompleteStep />);
    const configured = publicContactConfig.packSmsE164;

    expect(screen.getByText(configured)).toBeVisible();
    expect(screen.getByRole("button", { name: "Copy" })).toBeVisible();

    fireEvent.click(screen.getByRole("button", { name: "Copy" }));
    expect(copyTextToClipboard).toHaveBeenCalledTimes(1);
    expect(copyTextToClipboard).toHaveBeenCalledWith(configured);
  });

  it("hides the Pack number and copy button on a phone-width viewport", () => {
    setViewportWidth(MOBILE_WIDTH_PX);
    render(<CompleteStep />);

    expect(
      screen.queryByTestId("complete-pack-number")
    ).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Copy" })).not.toBeInTheDocument();
  });

  it("renders no progress-dot markup", () => {
    setViewportWidth(MOBILE_WIDTH_PX);
    render(<CompleteStep />);

    expect(screen.queryAllByTestId("onboard-progress-dot")).toHaveLength(0);
    expect(
      screen.queryByTestId("onboard-progress-dots")
    ).not.toBeInTheDocument();
  });
});
