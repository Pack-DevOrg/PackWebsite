import {existsSync, readFileSync} from 'node:fs';
import {join} from 'node:path';
import React from 'react';
import {render, screen} from '@testing-library/react';

import * as appOnboarding from '@pack/app/onboarding/OnboardingComponents';
import {
  OnboardingPrimaryButton,
  OnboardingPrimaryLink,
  OnboardingSecondaryButton,
  ProviderMark,
} from '@pack/ui-primitives';

const websiteSource = readFileSync(
  join(process.cwd(), 'packages/ui-primitives/src/onboarding/OnboardingComponents.tsx'),
  'utf8',
);

describe('OnboardingComponents', () => {
  it('re-exports the app primary control and renders it', () => {
    expect(OnboardingPrimaryButton).toBe(appOnboarding.OnboardingPrimaryButton);

    render(
      <>
        <OnboardingPrimaryButton onPress={() => undefined}>Continue</OnboardingPrimaryButton>
        <OnboardingPrimaryLink href="sms:+1555">Text Pack</OnboardingPrimaryLink>
        <OnboardingSecondaryButton onPress={() => undefined} fullWidth>
          Skip
        </OnboardingSecondaryButton>
        <ProviderMark provider="google" size={18} color="#111" />
      </>,
    );

    expect(screen.getAllByTestId('app-onboarding-primary')[0]).toHaveTextContent('Continue');
    const link = screen.getByRole('link', {name: 'Text Pack'});
    expect(link.getAttribute('href')).toBe('sms:+1555');
    expect(link.querySelector('[data-testid="app-onboarding-primary"]')).not.toBeNull();
    expect(screen.getByTestId('app-onboarding-secondary').getAttribute('data-full-width')).toBe(
      'true',
    );
    expect(screen.getByTestId('app-google-icon')).toBeTruthy();
  });

  it('fails when the website keeps its own button, mark, or shim', () => {
    expect(websiteSource).toContain(
      "OnboardingPrimaryButton,\n  OnboardingSecondaryButton,\n  OnboardingSubtitle,\n} from '@pack/app/onboarding/OnboardingComponents'",
    );
    expect(websiteSource).toContain("from '@pack/app/icons/GoogleOutlineIcon'");
    expect(websiteSource.includes('export function OnboardingPrimaryButton')).toBe(false);
    expect(websiteSource.includes('export const OnboardingPrimaryButton')).toBe(false);
    expect(websiteSource.includes('export function SafeAreaView')).toBe(false);
    expect(websiteSource.includes('function LinearGradient')).toBe(false);
    expect(websiteSource.includes('function SafeAreaView')).toBe(false);
    expect(websiteSource.includes('gradientAngle')).toBe(false);
    expect(websiteSource.includes("from '../shims/")).toBe(false);
    expect(websiteSource.includes('M17.64 9.2045')).toBe(false);
    expect(existsSync(join(process.cwd(), 'packages/ui-primitives/src/shims'))).toBe(false);
  });
});
