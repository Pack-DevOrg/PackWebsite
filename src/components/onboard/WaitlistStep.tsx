import React from 'react';
import {
  OnboardingContent,
  OnboardingSubtitle,
  OnboardingTitle,
} from '@pack/ui-primitives';

export const WAITLIST_TITLE = "Before you're in";
export const WAITLIST_SUBTITLE =
  "You're on the list. We'll text you the moment your spot opens up.";

export function WaitlistStep(): React.ReactElement {
  return (
    <OnboardingContent scrollEnabled={false}>
      <OnboardingTitle>{WAITLIST_TITLE}</OnboardingTitle>
      <OnboardingSubtitle>{WAITLIST_SUBTITLE}</OnboardingSubtitle>
    </OnboardingContent>
  );
}
