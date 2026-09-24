import {readFileSync} from 'node:fs';
import {join} from 'node:path';
import {render, screen} from '@testing-library/react';
import {
  OnboardingPrimaryButton,
  OnboardingPrimaryLink,
  OnboardingSkipButton,
} from '@pack/ui-primitives';

const websiteSource = readFileSync(
  join(
    process.cwd(),
    'packages/ui-primitives/src/onboarding/OnboardingComponents.tsx',
  ),
  'utf8',
);

describe('OnboardingComponents', () => {
  it('does not paste library shims into the website component', () => {
    expect(websiteSource.includes('function LinearGradient')).toBe(false);
    expect(websiteSource.includes('gradientAngle')).toBe(false);
    expect(websiteSource.includes('function SafeAreaView')).toBe(false);
    expect(websiteSource.includes('function ProviderMark')).toBe(false);
    expect(websiteSource.includes('M17.64 9.2045')).toBe(false);
  });

  it('paints Text Pack with the same gradient control as Continue', () => {
    render(
      <>
        <OnboardingPrimaryButton onPress={() => undefined}>
          Continue
        </OnboardingPrimaryButton>
        <OnboardingPrimaryLink href="sms:+1555">Text Pack</OnboardingPrimaryLink>
      </>,
    );
    const link = screen.getByRole('link', {name: 'Text Pack'});
    const label = screen.getByText('Text Pack');
    expect(link.tagName).toBe('A');
    expect(link.contains(label)).toBe(true);
    expect(label.parentElement).not.toBe(link);
    expect(link.innerHTML).toContain('#F0C62D');
    let node: HTMLElement | null = screen.getByText('Continue');
    let paintsGold = false;
    while (node) {
      if ((node.getAttribute('style') ?? '').includes('#F0C62D')) {
        paintsGold = true;
      }
      node = node.parentElement;
    }
    expect(paintsGold).toBe(true);
  });

  it('renders Skip for now on the full-width secondary control', () => {
    render(<OnboardingSkipButton onPress={() => undefined} />);
    const skip = screen.getByTestId('connected-accounts-skip-button');
    expect(skip).toHaveTextContent('Skip for now');
    expect(skip.getAttribute('style') ?? '').not.toMatch(/min-height:\s*32px/);
  });
});
