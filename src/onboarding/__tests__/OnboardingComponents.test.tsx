import {readFileSync} from 'node:fs';
import {join} from 'node:path';

const source = readFileSync(
  join(process.cwd(), 'packages/ui-primitives/src/onboarding/OnboardingComponents.tsx'),
  'utf8',
);

function sliceBetween(start: string, end: string): string {
  const from = source.indexOf(start);
  const to = source.indexOf(end, from + start.length);
  return source.slice(from, to);
}

describe('OnboardingComponents', () => {
  it('does not import the website shim copies', () => {
    expect(source.includes('shims/')).toBe(false);
  });

  it('paints Text Pack with the same primary gradient as Continue', () => {
    const link = sliceBetween(
      'function OnboardingPrimaryLink',
      'function OnboardingSecondaryButton',
    );
    expect(link.includes('<LinearGradient')).toBe(true);
    expect(link.includes('tokens.colors.primary')).toBe(true);
    expect(link.includes('tokens.colors.primaryDark')).toBe(true);
  });

  it('renders Skip for now with the full-width secondary control', () => {
    const skip = sliceBetween(
      'function OnboardingSkipButton',
      'function OnboardingProgressDots',
    );
    expect(skip.includes('styles.secondaryButtonFullWidth')).toBe(true);
    expect(skip.includes('styles.secondaryButton')).toBe(true);
    expect(skip.includes('styles.skipButton')).toBe(false);
  });
});
