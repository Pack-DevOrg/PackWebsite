import {existsSync, readFileSync} from 'node:fs';
import {join} from 'node:path';
import React from 'react';
import {render, screen} from '@testing-library/react';

jest.mock('expo-linear-gradient', () => {
  const ReactLib = require('react') as typeof React;
  return {
    LinearGradient: ({
      children,
      colors,
    }: {
      readonly children?: React.ReactNode;
      readonly colors: readonly string[];
    }) =>
      ReactLib.createElement(
        'div',
        {
          'data-testid': 'expo-linear-gradient',
          'data-colors': colors.join(','),
        },
        children,
      ),
  };
});

jest.mock('react-native-safe-area-context', () => {
  const ReactLib = require('react') as typeof React;
  return {
    SafeAreaProvider: ({children}: {readonly children?: React.ReactNode}) =>
      ReactLib.createElement(ReactLib.Fragment, null, children),
    SafeAreaView: ({children}: {readonly children?: React.ReactNode}) =>
      ReactLib.createElement('div', {'data-testid': 'app-safe-area'}, children),
    useSafeAreaInsets: () => ({top: 0, right: 0, bottom: 0, left: 0}),
  };
});

jest.mock('pack-app/icons/svg/GoogleOutlineIcon', () => {
  const ReactLib = require('react') as typeof React;
  return {
    GoogleOutlineIcon: () =>
      ReactLib.createElement('svg', {'data-testid': 'app-google-mark'}),
  };
});

jest.mock('pack-app/icons/svg/AppleOutlineIcon', () => {
  const ReactLib = require('react') as typeof React;
  return {
    AppleOutlineIcon: () =>
      ReactLib.createElement('svg', {'data-testid': 'app-apple-mark'}),
  };
});

jest.mock('pack-app/icons/svg/MicrosoftIcon', () => {
  const ReactLib = require('react') as typeof React;
  return {
    MicrosoftIcon: () =>
      ReactLib.createElement('svg', {'data-testid': 'app-microsoft-mark'}),
  };
});

import {
  OnboardingContainer,
  OnboardingPrimaryButton,
  OnboardingPrimaryLink,
  OnboardingProviderButton,
  OnboardingSkipButton,
  ProviderMark,
} from '@pack/ui-primitives';

const websiteSource = readFileSync(
  join(
    process.cwd(),
    'packages/ui-primitives/src/onboarding/OnboardingComponents.tsx',
  ),
  'utf8',
);

describe('OnboardingComponents', () => {
  it('has no shim directory and does not paste library bodies', () => {
    expect(
      existsSync(join(process.cwd(), 'packages/ui-primitives/src/shims')),
    ).toBe(false);
    expect(websiteSource.includes('gradientAngle')).toBe(false);
    expect(websiteSource.includes('function LinearGradient')).toBe(false);
    expect(websiteSource.includes('function SafeAreaView')).toBe(false);
    expect(websiteSource.includes('M17.64 9.2045')).toBe(false);
    expect(websiteSource.includes("from 'expo-linear-gradient'")).toBe(true);
    expect(websiteSource.includes("from 'react-native-safe-area-context'")).toBe(
      true,
    );
    expect(websiteSource.includes("from 'pack-app/icons/svg/GoogleOutlineIcon'")).toBe(
      true,
    );
    expect(websiteSource.includes("from 'pack-app/icons/svg/MicrosoftIcon'")).toBe(
      true,
    );
    expect(websiteSource.includes("from 'pack-app/icons/svg/AppleOutlineIcon'")).toBe(
      true,
    );
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
    expect(link.querySelector('[data-testid="expo-linear-gradient"]')).not.toBeNull();
    expect(link.querySelector('span [data-testid="expo-linear-gradient"]')).toBeNull();
    const label = screen.getByText('Text Pack');
    expect(link.contains(label)).toBe(true);
    expect(label.parentElement).not.toBe(link);
  });

  it('wraps the onboarding shell in the safe-area view', () => {
    render(
      <OnboardingContainer showBack={false} showGlobe={false}>
        <OnboardingPrimaryButton onPress={() => undefined}>
          Continue
        </OnboardingPrimaryButton>
      </OnboardingContainer>,
    );
    const safe = screen.getByTestId('app-safe-area');
    expect(safe.contains(screen.getByText('Continue'))).toBe(true);
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
    expect(screen.getByTestId('app-google-mark')).toBeInTheDocument();
    expect(screen.getByTestId('app-apple-mark')).toBeInTheDocument();
    expect(screen.getByTestId('app-microsoft-mark')).toBeInTheDocument();
    expect(screen.queryByText('G')).toBeNull();
  });

  it('renders Skip for now on the full-width secondary control', () => {
    render(<OnboardingSkipButton onPress={() => undefined} />);
    const skip = screen.getByTestId('connected-accounts-skip-button');
    expect(skip).toHaveTextContent('Skip for now');
    expect(skip.getAttribute('style') ?? '').not.toMatch(/min-height:\s*32px/);
  });
});
