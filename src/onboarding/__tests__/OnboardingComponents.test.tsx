import {existsSync, readFileSync} from 'node:fs';
import {join} from 'node:path';
import React from 'react';
import {render, screen} from '@testing-library/react';

import * as appOnboarding from '@pack/app/onboarding/OnboardingComponents';
import {
  OnboardingPrimaryButton,
  OnboardingPrimaryLink,
  OnboardingSecondaryButton,
  OnboardingSkipButton,
} from '@pack/ui-primitives';

jest.mock('@pack/app/onboarding/OnboardingComponents', () => {
  const React = require('react');
  return {
    ONBOARDING_CTA_MAX_WIDTH: 320,
    OnboardingContainer: ({children}: {children?: React.ReactNode}) =>
      React.createElement('div', {'data-testid': 'app-onboarding-container'}, children),
    OnboardingContent: ({children}: {children?: React.ReactNode}) =>
      React.createElement('div', null, children),
    OnboardingEyebrow: ({children}: {children?: React.ReactNode}) =>
      React.createElement('span', null, children),
    OnboardingHeader: () => null,
    OnboardingPrimaryButton: ({children}: {children?: React.ReactNode}) =>
      React.createElement('div', {'data-testid': 'app-onboarding-primary'}, children),
    OnboardingSecondaryButton: ({
      children,
      fullWidth,
      testID,
    }: {
      children?: React.ReactNode;
      fullWidth?: boolean;
      testID?: string;
    }) =>
      React.createElement(
        'div',
        {
          'data-testid': testID ?? 'app-onboarding-secondary',
          'data-full-width': fullWidth ? 'true' : 'false',
        },
        children,
      ),
    OnboardingSubtitle: ({children}: {children?: React.ReactNode}) =>
      React.createElement('span', null, children),
    OnboardingTitle: ({children}: {children?: React.ReactNode}) =>
      React.createElement('span', null, children),
  };
}, {virtual: true});

jest.mock('@pack/app/icons/GoogleOutlineIcon', () => ({
  GoogleOutlineIcon: () => null,
}), {virtual: true});
jest.mock('@pack/app/icons/AppleOutlineIcon', () => ({
  AppleOutlineIcon: () => null,
}), {virtual: true});
jest.mock('@pack/app/icons/MicrosoftIcon', () => ({
  MicrosoftIcon: () => null,
}), {virtual: true});
jest.mock('@pack/app/icons/ChevronLeftIcon', () => ({
  ChevronLeftIcon: () => null,
}), {virtual: true});

const websiteSource = readFileSync(
  join(process.cwd(), 'packages/ui-primitives/src/onboarding/OnboardingComponents.tsx'),
  'utf8',
);

describe('OnboardingComponents', () => {
  it('re-exports the app primary and secondary controls', () => {
    expect(OnboardingPrimaryButton).toBe(appOnboarding.OnboardingPrimaryButton);
    expect(OnboardingSecondaryButton).toBe(appOnboarding.OnboardingSecondaryButton);

    render(
      <>
        <OnboardingPrimaryButton onPress={() => undefined}>Continue</OnboardingPrimaryButton>
        <OnboardingPrimaryLink href="sms:+1555">Text Pack</OnboardingPrimaryLink>
        <OnboardingSecondaryButton onPress={() => undefined} fullWidth testID="earlier-skip">
          Skip
        </OnboardingSecondaryButton>
        <OnboardingSkipButton onPress={() => undefined} />
      </>,
    );

    expect(screen.getAllByTestId('app-onboarding-primary')[0]).toHaveTextContent('Continue');
    const link = screen.getByRole('link', {name: 'Text Pack'});
    expect(link.getAttribute('href')).toBe('sms:+1555');
    expect(link.querySelector('[data-testid="app-onboarding-primary"]')).not.toBeNull();
    const skip = screen.getByTestId('connected-accounts-skip-button');
    expect(skip).toHaveTextContent('Skip for now');
    expect(skip.getAttribute('data-full-width')).toBe('true');
    expect(screen.getByTestId('earlier-skip').getAttribute('data-full-width')).toBe('true');
  });

  it('fails when the website keeps a copied button or a shim directory', () => {
    expect(websiteSource).toContain("from '@pack/app/onboarding/OnboardingComponents'");
    expect(websiteSource.includes('export function OnboardingPrimaryButton')).toBe(false);
    expect(websiteSource.includes('export const OnboardingPrimaryButton')).toBe(false);
    expect(websiteSource.includes('function LinearGradient')).toBe(false);
    expect(websiteSource.includes('function SafeAreaView')).toBe(false);
    expect(websiteSource.includes('gradientAngle')).toBe(false);
    expect(websiteSource.includes("from '../shims/")).toBe(false);
    expect(websiteSource.includes('M17.64 9.2045')).toBe(false);
    expect(existsSync(join(process.cwd(), 'packages/ui-primitives/src/shims'))).toBe(false);
  });
});
