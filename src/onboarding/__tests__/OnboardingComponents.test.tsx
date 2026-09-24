import {existsSync, mkdirSync, readFileSync, rmSync, writeFileSync} from 'node:fs';
import {dirname, join, relative} from 'node:path';
import React from 'react';
import {render, screen} from '@testing-library/react';

import {
  OnboardingPrimaryButton,
  OnboardingPrimaryLink,
  OnboardingSecondaryButton,
  OnboardingSkipButton,
  ProviderMark,
} from '@pack/ui-primitives';

jest.mock('expo-linear-gradient', () => {
  const React = require('react');
  const {View} = require('react-native');
  return {
    LinearGradient: ({
      colors,
      children,
      style,
    }: {
      colors: readonly string[];
      children?: React.ReactNode;
      style?: object;
    }) =>
      React.createElement(
        View,
        {
          style: [
            style,
            {backgroundImage: `linear-gradient(90deg, ${colors.join(', ')})`},
          ],
          testID: 'app-linear-gradient',
        },
        children,
      ),
  };
}, {virtual: true});

jest.mock('react-native-safe-area-context', () => {
  const React = require('react');
  const {View} = require('react-native');
  return {
    SafeAreaView: ({children, style}: {children?: React.ReactNode; style?: object}) =>
      React.createElement(View, {style, testID: 'app-safe-area'}, children),
    SafeAreaProvider: ({children}: {children?: React.ReactNode}) => children,
    useSafeAreaInsets: () => ({top: 0, right: 0, bottom: 0, left: 0}),
  };
}, {virtual: true});

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({goBack: () => undefined}),
}), {virtual: true});

const stubRels = [
  'src/themes/index.ts',
  'src/components/ui/LavaStepDots.tsx',
  'src/icons/svg/ChevronLeftIcon.tsx',
] as const;

function installMapperStubs(): void {
  const appThemes = appOnboardingPath.replace(
    '/src/components/onboarding/OnboardingComponents.tsx',
    '/src/themes',
  );
  const themeRel = relative(join(process.cwd(), 'src/themes'), appThemes).replaceAll('\\', '/');
  const theme = `export {theme} from '${themeRel}';\n`;
  const files: Record<string, string> = {
    'src/themes/index.ts': theme,
    'src/components/ui/LavaStepDots.tsx': 'export function LavaStepDots() { return null; }\n',
    'src/icons/svg/ChevronLeftIcon.tsx': 'export function ChevronLeftIcon() { return null; }\n',
  };
  for (const rel of stubRels) {
    const path = join(process.cwd(), rel);
    mkdirSync(dirname(path), {recursive: true});
    writeFileSync(path, files[rel] ?? '');
  }
}

function removeMapperStubs(): void {
  for (const rel of stubRels) {
    rmSync(join(process.cwd(), rel), {force: true});
  }
  rmSync(join(process.cwd(), 'src/themes'), {recursive: true, force: true});
}

function firstExisting(candidates: readonly string[]): string {
  const found = candidates.find((candidate) => existsSync(candidate));
  if (found === undefined) {
    throw new Error(`missing ${candidates[0]}`);
  }
  return found;
}

const appOnboardingPath = firstExisting([
  join(process.cwd(), '..', 'PackApp', 'src', 'components', 'onboarding', 'OnboardingComponents.tsx'),
  join(process.cwd(), '..', '..', 'PackApp', 'src', 'components', 'onboarding', 'OnboardingComponents.tsx'),
]);

const appAccountsPath = firstExisting([
  join(process.cwd(), '..', 'PackApp', 'src', 'screens', 'onboarding', 'ConnectedAccountsScreen.tsx'),
  join(process.cwd(), '..', '..', 'PackApp', 'src', 'screens', 'onboarding', 'ConnectedAccountsScreen.tsx'),
]);

const websiteSource = readFileSync(
  join(process.cwd(), 'packages/ui-primitives/src/onboarding/OnboardingComponents.tsx'),
  'utf8',
);

function gradientDivs(): HTMLDivElement[] {
  return Array.from(document.querySelectorAll('div')).filter((node) =>
    (node.getAttribute('style') ?? '').includes('linear-gradient'),
  );
}

describe('OnboardingComponents', () => {
  beforeAll(() => {
    installMapperStubs();
  });

  afterAll(() => {
    removeMapperStubs();
  });

  it('paints Continue and Text Pack with the same gradient as the app button', () => {
    const {OnboardingPrimaryButton: AppOnboardingPrimaryButton, OnboardingContainer} = require(appOnboardingPath) as {
      OnboardingPrimaryButton: React.ComponentType<{onPress: () => void; children: React.ReactNode}>;
      OnboardingContainer: React.ComponentType<{children: React.ReactNode; showBack?: boolean}>;
    };

    render(
      <>
        <OnboardingPrimaryButton onPress={() => undefined}>Continue</OnboardingPrimaryButton>
        <OnboardingPrimaryLink href="sms:+1555">Text Pack</OnboardingPrimaryLink>
        <AppOnboardingPrimaryButton onPress={() => undefined}>App Continue</AppOnboardingPrimaryButton>
        <OnboardingContainer showBack={false}>
          <AppOnboardingPrimaryButton onPress={() => undefined}>Inside app shell</AppOnboardingPrimaryButton>
        </OnboardingContainer>
        <ProviderMark provider="google" size={18} color="#fff" />
        <ProviderMark provider="microsoft" size={18} color="#fff" />
        <ProviderMark provider="apple" size={20} color="#fff" />
      </>,
    );

    const painted = gradientDivs();
    expect(painted.length).toBeGreaterThanOrEqual(3);
    for (const node of painted.slice(0, 3)) {
      expect(node.getAttribute('style') ?? '').toMatch(/#F0C62D/i);
      expect(node.getAttribute('style') ?? '').toMatch(/#D6B025/i);
    }

    const link = screen.getByRole('link', {name: 'Text Pack'});
    expect(link.getAttribute('href')).toBe('sms:+1555');
    const label = screen.getByText('Text Pack');
    expect(label.querySelector('div')).toBeNull();
    expect(link.contains(label)).toBe(true);
    const gradient = label.parentElement?.closest('div[style*="linear-gradient"]');
    expect(gradient).not.toBeNull();
    expect(gradient?.contains(label)).toBe(true);

    const appLabel = screen.getByText('App Continue');
    expect(appLabel.closest('[data-testid="app-linear-gradient"]')).not.toBeNull();
    expect(appLabel.querySelector('div')).toBeNull();
    expect(screen.getByTestId('app-safe-area')).toBeInTheDocument();
    expect(screen.queryByText('G')).toBeNull();
    expect(screen.queryByText('M')).toBeNull();
    expect(screen.queryByText('A')).toBeNull();
    expect(document.querySelectorAll('svg').length).toBeGreaterThanOrEqual(3);
  });

  it('fails when the website file pastes a second gradient, safe area, or mark', () => {
    const appSource = readFileSync(appOnboardingPath, 'utf8');
    const accountsSource = readFileSync(appAccountsPath, 'utf8');
    expect(websiteSource.includes('function LinearGradient')).toBe(false);
    expect(websiteSource.includes('gradientAngle')).toBe(false);
    expect(websiteSource.includes('function SafeAreaView')).toBe(false);
    expect(websiteSource.includes('function ProviderMark')).toBe(false);
    expect(websiteSource.includes('M17.64 9.2045')).toBe(false);
    expect(websiteSource.includes("from '../shims/LinearGradient'")).toBe(true);
    expect(websiteSource.includes("from '../shims/SafeArea'")).toBe(true);
    expect(websiteSource.includes("from '../shims/ProviderMark'")).toBe(true);
    expect(appSource.includes("from 'expo-linear-gradient'")).toBe(true);
    expect(appSource.includes("from 'react-native-safe-area-context'")).toBe(true);
    expect(appSource.includes('<SafeAreaView')).toBe(true);
    expect(accountsSource).toContain('OnboardingPrimaryButton');
    expect(accountsSource).toContain("from '@/components/onboarding/OnboardingComponents'");
  });

  it('renders Skip for now on the full-width secondary control', () => {
    render(
      <>
        <OnboardingSecondaryButton onPress={() => undefined} fullWidth testID="earlier-skip">
          Skip
        </OnboardingSecondaryButton>
        <OnboardingSkipButton onPress={() => undefined} />
      </>,
    );
    const earlier = screen.getByTestId('earlier-skip');
    const skip = screen.getByTestId('connected-accounts-skip-button');
    expect(skip).toHaveTextContent('Skip for now');
    const widthClass = (node: Element): string =>
      (node.getAttribute('class') ?? '').match(/r-width-\S+/)?.[0] ?? '';
    expect(widthClass(skip)).not.toBe('');
    expect(widthClass(skip)).toBe(widthClass(earlier));
    expect(skip.getAttribute('class') ?? '').not.toMatch(/minHeight|min-height/);
    expect(skip.getAttribute('style') ?? '').not.toMatch(/min-height:\s*32px/);
  });
});
