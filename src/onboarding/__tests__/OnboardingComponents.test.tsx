import {existsSync, readFileSync, readdirSync, statSync} from 'node:fs';
import {join} from 'node:path';
import React from 'react';
import {render, screen} from '@testing-library/react';

// @ts-expect-error PackApp source is resolved by the Jest resolver, not this tsconfig.
import {OnboardingPrimaryButton as AppOnboardingPrimaryButton} from '@pack/app/components/onboarding/OnboardingComponents';
import {
  OnboardingHeader,
  OnboardingPrimaryButton,
  OnboardingPrimaryLink,
  OnboardingSecondaryButton,
  OnboardingSkipButton,
  ProviderMark,
} from '@pack/ui-primitives';

const ROOT = process.cwd();

function walk(dir: string, acc: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    if (name === 'node_modules' || name === '.git' || name === 'dist' || name === 'dist-ssr') {
      continue;
    }
    const abs = join(dir, name);
    if (statSync(abs).isDirectory()) {
      walk(abs, acc);
    } else {
      acc.push(abs);
    }
  }
  return acc;
}

describe('OnboardingComponents', () => {
  it('renders the app primary button, not a website copy or a shim', () => {
    expect(OnboardingPrimaryButton).toBe(AppOnboardingPrimaryButton);
    expect(existsSync(join(ROOT, 'packages', 'ui-primitives', 'src', 'shims'))).toBe(false);
    const source = readFileSync(
      join(ROOT, 'packages', 'ui-primitives', 'src', 'onboarding', 'OnboardingComponents.tsx'),
      'utf8',
    );
    expect(source).toContain("from '@pack/app/components/onboarding/OnboardingComponents'");
    expect(source).not.toContain('shims/');
    expect(source).not.toContain('function LinearGradient');
    expect(source).not.toContain('gradientAngle');
    expect(source).not.toContain('M17.64 9.2045');
    const owned = walk(join(ROOT, 'packages', 'ui-primitives')).filter((file) =>
      file.split('/').includes('shims'),
    );
    expect(owned).toEqual([]);

    render(
      <>
        <OnboardingPrimaryButton onPress={() => undefined}>Continue</OnboardingPrimaryButton>
        <OnboardingPrimaryLink href="sms:+1555">Text Pack</OnboardingPrimaryLink>
        <ProviderMark provider="google" size={18} color="#fff" />
        <ProviderMark provider="microsoft" size={18} color="#fff" />
        <ProviderMark provider="apple" size={20} color="#fff" />
      </>,
    );

    const painted = Array.from(document.querySelectorAll('div')).filter((node) =>
      (node.getAttribute('style') ?? '').includes('linear-gradient'),
    );
    expect(painted.length).toBeGreaterThanOrEqual(2);
    for (const node of painted) {
      const paint = node.getAttribute('style') ?? '';
      expect(paint).toMatch(/#F0C62D|240,\s*198,\s*45/i);
      expect(paint).toMatch(/#D6B025|214,\s*176,\s*37/i);
    }
    const link = screen.getByRole('link', {name: 'Text Pack'});
    expect(link.getAttribute('href')).toBe('sms:+1555');
    expect(link.querySelector('[role="button"]')).toBeNull();
    expect(screen.queryByText('G')).toBeNull();
    expect(screen.queryByText('M')).toBeNull();
    expect(screen.queryByText('A')).toBeNull();
    expect(document.querySelectorAll('svg').length).toBeGreaterThanOrEqual(3);
  });

  it('keeps header progress and paints Skip with the app secondary button', () => {
    render(
      <>
        <OnboardingHeader currentStep={2} totalSteps={4} showBack onBack={() => undefined} />
        <OnboardingSecondaryButton onPress={() => undefined} fullWidth testID="earlier-skip">
          Skip
        </OnboardingSecondaryButton>
        <OnboardingSkipButton onPress={() => undefined} />
      </>,
    );
    expect(screen.getByText('Step 2 of 4')).toBeInTheDocument();
    const earlier = screen.getByTestId('earlier-skip');
    const skip = screen.getByTestId('connected-accounts-skip-button');
    expect(skip).toHaveTextContent('Skip for now');
    const widthClass = (node: Element): string =>
      (node.getAttribute('class') ?? '').match(/r-width-\S+/)?.[0] ?? '';
    expect(widthClass(skip)).not.toBe('');
    expect(widthClass(skip)).toBe(widthClass(earlier));
    expect(skip.getAttribute('style') ?? '').not.toMatch(/min-height:\s*32px/);
  });

  it('checks PackApp out for CI and the prod build', () => {
    const ci = readFileSync(join(ROOT, '.github/workflows/ci.yml'), 'utf8');
    const deploy = readFileSync(join(ROOT, '.github/workflows/deploy.yml'), 'utf8');
    for (const source of [ci, deploy]) {
      expect(source).toContain('repository: Pack-DevOrg/PackApp');
      expect(source).toMatch(/path: PackApp\n\s+sparse-checkout: \|\n\s+src/);
      expect(source).toMatch(/repositories: \|\n\s+PackApp\n/);
    }
    const vite = readFileSync(join(ROOT, 'vite.config.ts'), 'utf8');
    const resolver = readFileSync(join(ROOT, 'scripts/jest-pack-app-resolver.cjs'), 'utf8');
    const sibling = "path.join(rootDir, 'PackApp')";
    const verifyTree = "path.resolve(rootDir, '../../PackApp')";
    expect(vite.indexOf(sibling)).toBeGreaterThan(-1);
    expect(vite.indexOf(sibling)).toBeLessThan(vite.indexOf(verifyTree));
    expect(vite).not.toContain("path.resolve(rootDir, '../../PackApp/src')");
    expect(resolver.indexOf("path.resolve(__dirname, '../PackApp')")).toBeLessThan(
      resolver.indexOf("path.resolve(__dirname, '../../PackApp')"),
    );
    expect(resolver.indexOf("path.resolve(__dirname, '../../PackApp')")).toBeLessThan(
      resolver.indexOf("path.resolve(__dirname, '../../../PackApp')"),
    );
    expect(resolver).not.toContain("path.resolve(__dirname, '../../../PackApp/src')");
  });
});
