import {existsSync} from 'node:fs';
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

describe('OnboardingComponents', () => {
  it('has no shim directory for libraries that ship a web build', () => {
    expect(
      existsSync(join(process.cwd(), 'packages/ui-primitives/src/shims')),
    ).toBe(false);
  });

  it('paints Continue and Text Pack with expo-linear-gradient', () => {
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
  });

  it('wraps the onboarding shell in the safe-area view', () => {
    render(
      <OnboardingContainer showBack={false} showGlobe={false}>
        <OnboardingPrimaryButton onPress={() => undefined}>
          Continue
        </OnboardingPrimaryButton>
      </OnboardingContainer>,
    );
    expect(screen.getByTestId('app-safe-area')).toBeInTheDocument();
  });

  it('renders provider rows with the app icon components', () => {
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
  });

  it('renders Skip for now with the full-width secondary control', () => {
    render(<OnboardingSkipButton onPress={() => undefined} />);
    const skip = screen.getByTestId('connected-accounts-skip-button');
    expect(skip).toHaveTextContent('Skip for now');
    expect(skip.getAttribute('style') ?? '').not.toMatch(/min-height:\s*32px/);
  });
});
