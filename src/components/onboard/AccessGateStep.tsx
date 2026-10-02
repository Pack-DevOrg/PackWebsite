import React from "react";
import {
  OnboardingContent,
  OnboardingPrimaryButton,
  OnboardingSubtitle,
  OnboardingTitle,
} from "@pack/ui-primitives";

export type AccessGateKind = "waitlist" | "youre-in";

/**
 * Waitlisted users stop here. After the owner approves, the same step
 * shows You're in and can continue. Already-active users never mount this.
 */
export function AccessGateStep(props: {
  readonly kind: AccessGateKind;
  readonly onContinue: () => void;
}): React.ReactElement {
  if (props.kind === "waitlist") {
    return (
      <OnboardingContent scrollEnabled={false}>
        <OnboardingTitle>You&apos;re on the waitlist</OnboardingTitle>
        <OnboardingSubtitle>
          We&apos;ll text you when it&apos;s your turn.
        </OnboardingSubtitle>
      </OnboardingContent>
    );
  }

  return (
    <OnboardingContent scrollEnabled={false}>
      <OnboardingTitle>You&apos;re in</OnboardingTitle>
      <OnboardingSubtitle>Welcome to Pack.</OnboardingSubtitle>
      <OnboardingPrimaryButton onPress={props.onContinue}>
        Continue
      </OnboardingPrimaryButton>
    </OnboardingContent>
  );
}
