import React from 'react';
import {
  OnboardingContent,
  OnboardingSubtitle,
  OnboardingTitle,
} from '@pack/ui-primitives';

export const WAITLIST_TITLE = "You're on the waitlist";
export const WAITLIST_SUBTITLE =
  "We'll let you know the moment you're in.";

export function WaitlistStep(): React.ReactElement {
  return (
    <OnboardingContent scrollEnabled={false}>
      <OnboardingTitle>{WAITLIST_TITLE}</OnboardingTitle>
      <OnboardingSubtitle>{WAITLIST_SUBTITLE}</OnboardingSubtitle>
    </OnboardingContent>
  );
}
