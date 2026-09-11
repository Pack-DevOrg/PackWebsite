import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";

import { ConnectionsStep } from "./ConnectionsStep";

const INTERNAL_IDENTIFIERS =
  /ConnectionsStep|ConnectedAccountsScreen|ConnectedAccounts|Screen[A-Z]|data-step/;

function attributeBlob(root: HTMLElement): string {
  const parts: string[] = [];
  const elements = [root, ...Array.from(root.querySelectorAll("*"))];
  for (const element of elements) {
    for (const attr of Array.from(element.attributes)) {
      parts.push(attr.name, attr.value);
    }
  }
  return parts.join(" ");
}

describe("ConnectionsStep", () => {
  it("pins Connections heading, account rows, security copy, and progress", () => {
    const { container } = render(<ConnectionsStep />);
    const text = container.textContent ?? "";

    expect(
      screen.getByRole("heading", { name: "Connections" })
    ).toBeInTheDocument();
    expect(text).toContain("Straight from your inbox and calendar.");
    expect(text).toContain(
      "Google-approved auditors have reviewed how we protect your data. Everything stays encrypted between you and Pack."
    );
    expect(text).toContain("Connect Google");
    expect(text).toContain("Connect Microsoft");
    expect(text).toContain("Connect Apple");
    expect(text).toContain("Soon");
    expect(text).toContain("Continue");
    expect(text).toContain("Skip for now");

    expect(text.indexOf("Connections")).toBeLessThan(
      text.indexOf("Straight from your inbox and calendar.")
    );
    expect(
      text.indexOf("Straight from your inbox and calendar.")
    ).toBeLessThan(
      text.indexOf(
        "Google-approved auditors have reviewed how we protect your data."
      )
    );
    expect(text.indexOf("Connect Google")).toBeLessThan(
      text.indexOf("Connect Microsoft")
    );
    expect(text.indexOf("Connect Microsoft")).toBeLessThan(
      text.indexOf("Connect Apple")
    );
    expect(text.indexOf("Connect Apple")).toBeLessThan(text.indexOf("Soon"));
    expect(text.indexOf("Soon")).toBeLessThan(text.indexOf("Continue"));
    expect(text.indexOf("Continue")).toBeLessThan(text.indexOf("Skip for now"));

    expect(
      screen.getByTestId("connected-accounts-why-connect")
    ).toHaveTextContent("Straight from your inbox and calendar.");
    expect(screen.getByTestId("connect-google-button")).toBeInTheDocument();
    expect(screen.getByTestId("connect-microsoft-button")).toBeInTheDocument();
    expect(screen.getByTestId("connect-apple-button")).toBeDisabled();
    expect(
      screen.getByRole("button", { name: "Continue" })
    ).toBeDisabled();
    expect(
      screen.getByTestId("connected-accounts-skip-button")
    ).toHaveTextContent("Skip for now");

    const dots = screen.getAllByTestId("onboard-progress-dot");
    expect(dots).toHaveLength(5);
    expect(dots[0]).toHaveAttribute("data-active", "false");
    expect(dots[1]).toHaveAttribute("data-active", "false");
    expect(dots[2]).toHaveAttribute("data-active", "true");
    expect(dots[3]).toHaveAttribute("data-active", "false");
    expect(dots[4]).toHaveAttribute("data-active", "false");

    expect(container.textContent).not.toMatch(INTERNAL_IDENTIFIERS);
    expect(container.innerHTML).not.toMatch(INTERNAL_IDENTIFIERS);
    expect(attributeBlob(container)).not.toMatch(INTERNAL_IDENTIFIERS);
  });

  it("enables Continue and hides Skip once a provider is connected", () => {
    const { rerender } = render(
      <ConnectionsStep googleConnected googleEmail="ada@pack.test" />
    );

    expect(screen.getByRole("button", { name: "Continue" })).toBeEnabled();
    expect(
      screen.queryByTestId("connected-accounts-skip-button")
    ).not.toBeInTheDocument();
    expect(screen.getByText("Add another Google account")).toBeInTheDocument();
    expect(screen.getByText("Connected: ada@pack.test")).toBeInTheDocument();

    rerender(
      <ConnectionsStep microsoftConnected microsoftEmail="satya@pack.test" />
    );

    expect(screen.getByRole("button", { name: "Continue" })).toBeEnabled();
    expect(
      screen.queryByRole("button", { name: "Skip for now" })
    ).not.toBeInTheDocument();
    expect(
      screen.getByText("Add another Microsoft account")
    ).toBeInTheDocument();
    expect(screen.getByText("Connected: satya@pack.test")).toBeInTheDocument();
  });

  it("shows Connecting labels while a provider is loading", () => {
    render(<ConnectionsStep googleLoading microsoftLoading />);

    const connecting = screen.getAllByText("Connecting...");
    expect(connecting).toHaveLength(2);
    expect(screen.getByTestId("connect-google-button")).toBeDisabled();
    expect(screen.getByTestId("connect-microsoft-button")).toBeDisabled();
  });

  it("calls connect, continue, skip, and back props", () => {
    const onContinue = jest.fn();
    const onSkip = jest.fn();
    const onBack = jest.fn();
    const onConnectGoogle = jest.fn();
    const onConnectMicrosoft = jest.fn();

    const { rerender } = render(
      <ConnectionsStep
        onSkip={onSkip}
        onBack={onBack}
        onConnectGoogle={onConnectGoogle}
        onConnectMicrosoft={onConnectMicrosoft}
      />
    );

    fireEvent.click(screen.getByTestId("connect-google-button"));
    fireEvent.click(screen.getByTestId("connect-microsoft-button"));
    fireEvent.click(screen.getByTestId("connected-accounts-skip-button"));
    fireEvent.click(screen.getByRole("button", { name: "Back" }));

    expect(onConnectGoogle).toHaveBeenCalledTimes(1);
    expect(onConnectMicrosoft).toHaveBeenCalledTimes(1);
    expect(onSkip).toHaveBeenCalledTimes(1);
    expect(onBack).toHaveBeenCalledTimes(1);

    rerender(
      <ConnectionsStep googleConnected onContinue={onContinue} />
    );
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    expect(onContinue).toHaveBeenCalledTimes(1);
  });
});
