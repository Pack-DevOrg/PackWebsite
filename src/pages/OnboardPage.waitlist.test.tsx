import React from "react";
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { HelmetProvider } from "react-helmet-async";
import { MemoryRouter } from "react-router-dom";

import { OnboardPage, ONBOARDING_SEQUENCE } from "./OnboardPage";
import { I18nProvider } from "@/i18n/I18nProvider";
import { ThemeProvider } from "@/styles/ThemeProvider";
import { WAITLIST_TITLE } from "@/components/onboard/WaitlistStep";

const readAccess = jest.fn();

jest.mock("@/components/onboard/readPackAccess", () => ({
  readPackAccessBecauseSession: (...args: unknown[]) => readAccess(...args),
}));
jest.mock("@/auth/AuthContext", () => ({
  useAuth: () => ({
    status: "authenticated",
    user: { sub: "u", email: "u@trypackai.com", name: "U" },
    login: jest.fn(),
    logout: jest.fn(),
    getAccessToken: async () => "t",
    tokens: { tokenType: "Bearer" },
  }),
  AuthProvider: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
}));
// The app primitives need a native navigation + safe-area shell that jsdom cannot
// host here; the access step only needs plain stand-ins for them.
jest.mock("@pack/ui-primitives", () => {
  const R = jest.requireActual("react");
  const box = ({ children }: { children?: React.ReactNode }) =>
    R.createElement("div", null, children);
  return {
    OnboardingContainer: box,
    OnboardingContent: box,
    OnboardingTitle: box,
    OnboardingSubtitle: box,
    OnboardingPrimaryButton: ({
      children,
      onPress,
    }: {
      children?: React.ReactNode;
      onPress?: () => void;
    }) => R.createElement("button", { onClick: onPress }, children),
  };
});
jest.mock("@/components/onboard/OnboardPrimitives", () => ({
  OnboardViewport: ({ children }: { children?: React.ReactNode }) => (
    <>{children}</>
  ),
  OnboardViewportLock: () => null,
}));
jest.mock("@/components/onboard/SignupLoginStep", () => ({
  SignupLoginStep: () => null,
}));
jest.mock("@/components/onboard/CompleteStep", () => ({
  CompleteStep: () => null,
}));
jest.mock("@/components/onboard/ConnectionsStep", () => ({
  ConnectionsStep: () => <div>connections-step</div>,
}));
jest.mock("@/components/onboard/WaitlistStep", () => ({
  WAITLIST_TITLE: "Before you're in",
  WaitlistStep: () => <div>Before you're in</div>,
}));
jest.mock("@/components/onboard/WhatPackDoesStep", () => ({
  WhatPackDoesStep: ({ onNext }: { onNext: () => void }) => (
    <button onClick={onNext}>what-next</button>
  ),
}));
jest.mock("@/components/VerifyPhoneStep", () => ({
  VerifyPhoneStep: ({ onVerified }: { onVerified: () => void }) => (
    <button onClick={onVerified}>verified-phone</button>
  ),
}));

async function reachAccessStep() {
  render(
    <HelmetProvider>
      <MemoryRouter>
        <I18nProvider>
          <ThemeProvider>
            <OnboardPage />
          </ThemeProvider>
        </I18nProvider>
      </MemoryRouter>
    </HelmetProvider>
  );
  fireEvent.click(await screen.findByText("what-next"));
  fireEvent.click(await screen.findByText("verified-phone"));
}

describe("OnboardPage access step", () => {
  beforeEach(() => {
    readAccess.mockReset();
    global.fetch = jest.fn(async () => ({
      ok: true,
      status: 200,
      text: async () =>
        JSON.stringify({ success: true, data: { accounts: [] } }),
      clone() {
        return this;
      },
    })) as unknown as typeof fetch;
  });

  it("puts access after verify-phone", () => {
    expect(ONBOARDING_SEQUENCE.indexOf("access")).toBe(
      ONBOARDING_SEQUENCE.indexOf("verify-phone") + 1
    );
  });

  it("shows the waitlist, then You are in after focus re-poll reads active", async () => {
    readAccess.mockResolvedValueOnce("waitlisted").mockResolvedValue("active");
    await reachAccessStep();
    expect(await screen.findByText(WAITLIST_TITLE)).toBeTruthy();
    act(() => {
      window.dispatchEvent(new Event("focus"));
    });
    expect(await screen.findByText("You are in")).toBeTruthy();
    fireEvent.click(screen.getByText("Continue"));
    expect(await screen.findByText("connections-step")).toBeTruthy();
  });

  it("skips straight to connections for a never-waitlisted active user", async () => {
    readAccess.mockResolvedValue("active");
    await reachAccessStep();
    await waitFor(() => expect(readAccess).toHaveBeenCalled());
    expect(await screen.findByText("connections-step")).toBeTruthy();
    expect(screen.queryByText(WAITLIST_TITLE)).toBeNull();
    expect(screen.queryByText("You are in")).toBeNull();
  });
});
