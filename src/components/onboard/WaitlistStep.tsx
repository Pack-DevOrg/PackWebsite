import React from 'react';
import {
  OnboardingContent,
  OnboardingSubtitle,
  OnboardingTitle,
} from '@pack/ui-primitives';

export type OnboardAccess = 'waitlisted' | 'invited' | 'active';

export const WAITLIST_TITLE = "You're on the waitlist";
export const WAITLIST_SUBTITLE = "We'll text you when it's your turn.";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

/** Reads `access` from the server payload (top level or under `data`). Anything but "waitlisted" lets the user through. */
export function accessFromPayload(payload: unknown): OnboardAccess {
  if (!isRecord(payload)) {
    return 'active';
  }
  const raw = payload.access ?? (isRecord(payload.data) ? payload.data.access : undefined);
  return raw === 'waitlisted' ? 'waitlisted' : raw === 'invited' ? 'invited' : 'active';
}

export function WaitlistStep(): React.ReactElement {
  return (
    <OnboardingContent scrollEnabled={false}>
      <OnboardingTitle>{WAITLIST_TITLE}</OnboardingTitle>
      <OnboardingSubtitle>{WAITLIST_SUBTITLE}</OnboardingSubtitle>
    </OnboardingContent>
  );
}
