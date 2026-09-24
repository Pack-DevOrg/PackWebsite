import {existsSync, readFileSync} from 'node:fs';
import {join} from 'node:path';
import React from 'react';
import {render, screen} from '@testing-library/react';

import {OnboardingPrimaryButton as AppOnboardingPrimaryButton} from 'pack-app/components/onboarding/OnboardingComponents';
import {AppleOutlineIcon} from 'pack-app/icons/svg/AppleOutlineIcon';
import {GoogleOutlineIcon} from 'pack-app/icons/svg/GoogleOutlineIcon';
import {MicrosoftIcon} from 'pack-app/icons/svg/MicrosoftIcon';
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
    const painted = Array.from(document.querySelectorAll('div')).filter((node) =>
      (node.getAttribute('style') ?? '').includes('linear-gradient'),
    );
    expect(painted.length).toBeGreaterThanOrEqual(2);
    expect(painted[0]?.getAttribute('style') ?? '').toMatch(/240,\s*198,\s*45|F0C62D/i);
    expect(painted[1]?.getAttribute('style') ?? '').toMatch(/240,\s*198,\s*45|F0C62D/i);
    const link = screen.getByRole('link', {name: 'Text Pack'});
    expect(link.getAttribute('href')).toBe('sms:+1555');
    const label = screen.getByText('Text Pack');
    const gradient = label.parentElement?.closest('div[style*="linear-gradient"]');
    expect(gradient).not.toBeNull();
    expect(gradient?.contains(label)).toBe(true);
    expect(label.querySelector('div[style*="linear-gradient"]')).toBeNull();
    expect(label.parentElement?.tagName).not.toBe('A');
    expect(label.closest('a')).toBe(link);
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
    const {container} = render(
      <>
        <OnboardingProviderButton provider="google" onPress={() => undefined}>
          Continue with Google
        </OnboardingProviderButton>
        <OnboardingProviderButton provider="apple" onPress={() => undefined}>
          Continue with Apple
        </OnboardingProviderButton>
        <ProviderMark provider="microsoft" size={18} color="#fff" />
        <GoogleOutlineIcon size={18} />
        <AppleOutlineIcon size={20} color="#fff" />
        <MicrosoftIcon size={18} />
      </>,
    );
    expect(screen.getByText('Continue with Google')).toBeInTheDocument();
    expect(screen.getByText('Continue with Apple')).toBeInTheDocument();
    expect(screen.queryByText('G')).toBeNull();
    expect(screen.queryByText('M')).toBeNull();
    expect(screen.queryByText('A')).toBeNull();
    const marks = Array.from(container.querySelectorAll('svg')).map(
      (node) => node.innerHTML,
    );
    expect(marks).toHaveLength(6);
    expect(marks[0]).toBe(marks[3]);
    expect(marks[1]).toBe(marks[4]);
    expect(marks[2]).toBe(marks[5]);
    const accounts = [
      join(process.cwd(), '..', 'PackApp', 'src', 'screens', 'onboarding', 'ConnectedAccountsScreen.tsx'),
      join(process.cwd(), '..', '..', 'PackApp', 'src', 'screens', 'onboarding', 'ConnectedAccountsScreen.tsx'),
    ].find((candidate) => existsSync(candidate));
    expect(accounts).toBeDefined();
    const accountsSource = readFileSync(accounts ?? '', 'utf8');
    expect(accountsSource).toContain('OnboardingPrimaryButton');
    expect(accountsSource).toContain(
      "from '@/components/onboarding/OnboardingComponents'",
    );
  });

  it('renders Skip for now on the full-width secondary control', () => {
    render(<OnboardingSkipButton onPress={() => undefined} />);
    const skip = screen.getByTestId('connected-accounts-skip-button');
    expect(skip).toHaveTextContent('Skip for now');
    expect(skip.getAttribute('style') ?? '').not.toMatch(/min-height:\s*32px/);
  });
});
