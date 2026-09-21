import {readFileSync, readdirSync} from 'node:fs';
import {join} from 'node:path';

const ROOT = process.cwd();
const ONBOARD_DIR = join(ROOT, 'src', 'components', 'onboard');
const EXTRA_FILES = [
  join(ROOT, 'src', 'pages', 'OnboardPage.tsx'),
  join(ROOT, 'src', 'components', 'VerifyPhoneStep.tsx'),
];

const BANNED = [
  'SheetCard',
  'OnboardStepFrame',
  'StepHeroTitle',
  'styled.div',
  'styled.h2',
];

function onboardSourceFiles(): string[] {
  const dirFiles = readdirSync(ONBOARD_DIR)
    .filter(
      (name) =>
        name.endsWith('.tsx') &&
        !name.endsWith('.test.tsx') &&
        name !== 'OnboardPrimitives.tsx',
    )
    .map((name) => join(ONBOARD_DIR, name));
  return [...dirFiles, ...EXTRA_FILES];
}

describe('onboarding markup is ui-primitives', () => {
  it('every onboard screen imports @pack/ui-primitives and bans website-only cards', () => {
    const files = onboardSourceFiles();
    expect(files.length).toBeGreaterThan(5);
    for (const file of files) {
      const source = readFileSync(file, 'utf8');
      const rel = file.slice(ROOT.length + 1);
      expect({rel, hasPrimitives: source.includes('@pack/ui-primitives')}).toEqual({
        rel,
        hasPrimitives: true,
      });
      for (const banned of BANNED) {
        expect({rel, banned, present: source.includes(banned)}).toEqual({
          rel,
          banned,
          present: false,
        });
      }
    }
  });
});
