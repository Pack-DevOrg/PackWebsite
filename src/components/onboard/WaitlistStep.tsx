import React from 'react';
import {View} from 'react-native';
import {
  OnboardingContent,
  OnboardingPrimaryButton,
  OnboardingSubtitle,
  OnboardingTitle,
} from '@pack/ui-primitives';

export type WaitlistStepProps = {
  /** True once the owner approved the account (`access` is no longer waitlisted). */
  approved: boolean;
  onContinue: () => void;
};

export function WaitlistStep({
  approved,
  onContinue,
}: WaitlistStepProps): React.ReactElement {
  if (approved) {
    return (
      <OnboardingContent scrollEnabled={false}>
        <OnboardingTitle>You&apos;re in</OnboardingTitle>
        <OnboardingSubtitle>
          Your spot is ready. Let&apos;s finish setting up.
        </OnboardingSubtitle>
        <OnboardingPrimaryButton onPress={onContinue}>
          Continue
        </OnboardingPrimaryButton>
      </OnboardingContent>
    );
  }
  return (
    <OnboardingContent scrollEnabled={false}>
      <OnboardingTitle>You&apos;re on the waitlist</OnboardingTitle>
      <OnboardingSubtitle>
        We&apos;ll let you know as soon as your spot opens up.
      </OnboardingSubtitle>
    </OnboardingContent>
  );
}
