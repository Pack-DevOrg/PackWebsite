import {existsSync, readFileSync} from 'node:fs';
import {join} from 'node:path';
import React from 'react';
import {render, screen} from '@testing-library/react';

import {OnboardingPrimaryButton as AppOnboardingPrimaryButton} from 'pack-app/components/onboarding/OnboardingComponents';
import {
  OnboardingContainer,
  OnboardingPrimaryButton,
  OnboardingPrimaryLink,
  OnboardingProviderButton,
  OnboardingSkipButton,
  ProviderMark,
} from '@pack/ui-primitives';

function packAppOnboardingSource(): string {
  const candidates = [
    join(
      process.cwd(),
      '..',
      'PackApp',
      'src',
      'components',
      'onboarding',
      'OnboardingComponents.tsx',
    ),
    join(
      process.cwd(),
      '..',
      '..',
      'PackApp',
      'src',
      'components',
      'onboarding',
      'OnboardingComponents.tsx',
    ),
  ];
  const found = candidates.find((candidate) => existsSync(candidate));
  if (found === undefined) {
    throw new Error('PackApp OnboardingComponents.tsx is not on disk');
  }
  return readFileSync(found, 'utf8');
}

const websiteSource = readFileSync(
  join(
    process.cwd(),
    'packages/ui-primitives/src/onboarding/OnboardingComponents.tsx',
  ),
  'utf8',
);

const appSource = packAppOnboardingSource();

describe('OnboardingComponents', () => {
  it('renders the app button, not a website gradient or shim', () => {
    expect(
      existsSync(join(process.cwd(), 'packages/ui-primitives/src/shims')),
    ).toBe(false);
    expect(websiteSource.includes('gradientAngle')).toBe(false);
    expect(websiteSource.includes('function LinearGradient')).toBe(false);
    expect(websiteSource.includes('function SafeAreaView')).toBe(false);
    expect(websiteSource.includes('M17.64 9.2045')).toBe(false);
    expect(
      websiteSource.includes(
        "from 'pack-app/components/onboarding/OnboardingComponents'",
      ),
    ).toBe(true);
    expect(appSource.includes("from 'expo-linear-gradient'")).toBe(true);
    expect(appSource.includes("from 'react-native-safe-area-context'")).toBe(
      true,
    );
    expect(OnboardingPrimaryButton).toBe(AppOnboardingPrimaryButton);
  });

  it('paints Continue and Text Pack with the app gradient outside of Text', () => {
    render(
      <>
        <OnboardingPrimaryButton onPress={() => undefined}>
          Continue
        </OnboardingPrimaryButton>
        <OnboardingPrimaryLink href="sms:+1555">Text Pack</OnboardingPrimaryLink>
      </>,
    );
    const gradients = screen.getAllByTestId('expo-linear-gradient');
    expect(gradients).toHaveLength(2);
    expect(gradients[0]?.getAttribute('data-colors')).toContain('#F0C62D');
    expect(gradients[1]?.getAttribute('data-colors')).toContain('#F0C62D');
    const link = screen.getByRole('link', {name: 'Text Pack'});
    expect(link.getAttribute('href')).toBe('sms:+1555');
    expect(link.querySelector('[data-testid="expo-linear-gradient"]')).not.toBeNull();
    const label = screen.getByText('Text Pack');
    expect(label.closest('[data-testid="expo-linear-gradient"]')).not.toBeNull();
    expect(label.parentElement?.tagName).not.toBe('A');
  });

  it('wraps the shell in the app safe-area view', () => {
    render(
      <OnboardingContainer showBack={false} showGlobe={false}>
        <OnboardingPrimaryButton onPress={() => undefined}>
          Continue
        </OnboardingPrimaryButton>
      </OnboardingContainer>,
    );
    expect(screen.getByText('Continue')).toBeInTheDocument();
    expect(appSource.includes('<SafeAreaView')).toBe(true);
    expect(websiteSource.includes('<SafeAreaView')).toBe(false);
  });

  it('renders provider marks from the app icon components', () => {
    render(
      <>
        <OnboardingProviderButton provider="google" onPress={() => undefined}>
          Continue with Google
        </OnboardingProviderButton>
        <OnboardingProviderButton provider="apple" onPress={() => undefined}>
          Continue with Apple
        </OnboardingProviderButton>
        <ProviderMark provider="microsoft" size={18} color="#fff" />
      </>,
    );
    expect(screen.getByText('Continue with Google')).toBeInTheDocument();
    expect(screen.getByText('Continue with Apple')).toBeInTheDocument();
    expect(screen.queryByText('G')).toBeNull();
    expect(screen.queryByText('M')).toBeNull();
    expect(screen.queryByText('A')).toBeNull();
    expect(document.querySelectorAll('svg').length).toBeGreaterThanOrEqual(3);
  });

  it('renders Skip for now on the full-width secondary control', () => {
    render(<OnboardingSkipButton onPress={() => undefined} />);
    const skip = screen.getByTestId('connected-accounts-skip-button');
    expect(skip).toHaveTextContent('Skip for now');
    expect(skip.getAttribute('style') ?? '').not.toMatch(/min-height:\s*32px/);
  });
});
