import {existsSync, readdirSync, readFileSync, statSync} from 'node:fs';
import {basename, join, relative, sep} from 'node:path';

const SRC_DIR = join(process.cwd(), 'src');
const SOURCE_EXTS = new Set(['.ts', '.tsx']);

const MARKETING_ALLOWLIST = new Set([
  'Header.tsx',
  'WaitlistForm.tsx',
  'ValueProp.tsx',
  'Labs.tsx',
  'Hero.tsx',
  'Footer.tsx',
  'ProductFilmSection.tsx',
  'TrustBanner.tsx',
  'BookingTimelineHighlight.tsx',
  'SectionEyebrow.tsx',
  'AmbientVideoBackdrop.tsx',
  'FeatureShowcase.tsx',
  'FeaturePhone.tsx',
  'CarouselTabBand.tsx',
  'AccentWord.tsx',
  'Layout.tsx',
  'About.tsx',
  'Features.tsx',
  'HowItWorks.tsx',
  'FAQ.tsx',
]);

const HEX_COLOR =
  /#(?:[0-9A-Fa-f]{8}|[0-9A-Fa-f]{6}|[0-9A-Fa-f]{4}|[0-9A-Fa-f]{3})(?![0-9A-Za-z])/;
const RGB_COLOR =
  /\brgba?\(\s*([0-9.]+%?)\s*,\s*([0-9.]+%?)\s*,\s*([0-9.]+%?)/i;
const BACKDROP_FILTER = /backdrop-filter\s*:\s*([^;]+)/i;
const BOX_SHADOW_DECL = /(?<=^|[{;\n])[ \t]*box-shadow\s*:\s*([^;]+)/i;
const UPPERCASE_TRANSFORM = /text-transform\s*:\s*uppercase\b/i;
const LETTER_SPACING_DECL = /letter-spacing\s*:/i;
const TEXT_ON_ACCENT =
  /(?:^|[{;\n])\s*color\s*:\s*[^;]*--color-text-on-accent/i;
const ACCENT_IN_BACKGROUND =
  /(?:^|[{;\n])\s*background(?:-color|-image)?\s*:[^;]*--color-accent(?:-soft)?/i;
const SAFFRON_GRADIENT =
  /(?:^|[{;\n])\s*background(?:-color|-image)?\s*:[^;]*linear-gradient\([^;]*--color-accent/i;

type LintHit = {
  readonly file: string;
  readonly line: number;
};

type CssRule = {
  readonly start: number;
  readonly text: string;
  readonly parent: CssRule | undefined;
};

function posixRel(from: string, to: string): string {
  return relative(from, to).split(sep).join('/');
}

function repoRel(absPath: string): string {
  return posixRel(process.cwd(), absPath);
}

function isTestFile(fileName: string): boolean {
  if (fileName.endsWith('.test.ts')) {
    return true;
  }
  if (fileName.endsWith('.test.tsx')) {
    return true;
  }
  return false;
}

function isSourceFile(fileName: string): boolean {
  if (isTestFile(fileName)) {
    return false;
  }
  if (fileName.endsWith('.ts')) {
    return SOURCE_EXTS.has('.ts');
  }
  if (fileName.endsWith('.tsx')) {
    return SOURCE_EXTS.has('.tsx');
  }
  return false;
}

function isQuote(ch: string): boolean {
  if (ch === '\'') {
    return true;
  }
  if (ch === '"') {
    return true;
  }
  return false;
}

function anyTrue(flags: readonly boolean[]): boolean {
  for (const flag of flags) {
    if (flag) {
      return true;
    }
  }
  return false;
}

function walkDir(dir: string): string[] {
  if (existsSync(dir) === false) {
    return [];
  }
  const out: string[] = [];
  for (const entry of readdirSync(dir, {withFileTypes: true})) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...walkDir(full));
      continue;
    }
    if (isSourceFile(entry.name)) {
      out.push(full);
    }
  }
  return out;
}

function collectScanFiles(): string[] {
  const files: string[] = [];
  const pagesDir = join(SRC_DIR, 'pages');
  if (existsSync(pagesDir)) {
    for (const entry of readdirSync(pagesDir)) {
      const full = join(pagesDir, entry);
      if (statSync(full).isDirectory()) {
        continue;
      }
      if (isTestFile(entry)) {
        continue;
      }
      const isAppPage = entry.startsWith('App') && anyTrue([
        entry.endsWith('.tsx'),
        entry.endsWith('.ts'),
      ]);
      if (isAppPage) {
        files.push(full);
      }
      if (entry === 'FriendsPage.tsx') {
        files.push(full);
      }
      if (entry === 'EmailForwardingSetup.tsx') {
        files.push(full);
      }
      if (entry === 'LiveViewConnectPage.tsx') {
        files.push(full);
      }
    }
  }
  files.push(...walkDir(join(SRC_DIR, 'components', 'app')));
  files.push(...walkDir(join(SRC_DIR, 'components', 'ui')));
  const unique = new Set<string>();
  const kept: string[] = [];
  for (const file of files) {
    if (unique.has(file)) {
      continue;
    }
    unique.add(file);
    if (MARKETING_ALLOWLIST.has(basename(file))) {
      continue;
    }
    kept.push(file);
  }
  kept.sort();
  return kept;
}

function lineNumberAt(source: string, index: number): number {
  let line = 1;
  let i = 0;
  while (i < index) {
    if (source.charAt(i) === '\n') {
      line += 1;
    }
    i += 1;
  }
  return line;
}

function isIdent(ch: string): boolean {
  return /[A-Za-z0-9_$]/.test(ch);
}

function skipLineComment(source: string, start: number): number {
  let i = start;
  while (i < source.length && source.charAt(i) !== '\n') {
    i += 1;
  }
  return i;
}

function skipBlockComment(source: string, start: number): number {
  let i = start + 2;
  while (i < source.length - 1) {
    if (source.charAt(i) === '*' && source.charAt(i + 1) === '/') {
      return i + 2;
    }
    i += 1;
  }
  return source.length;
}

function skipQuoted(source: string, start: number): number {
  const quote = source.charAt(start);
  let i = start + 1;
  while (i < source.length) {
    const ch = source.charAt(i);
    if (ch === '\\') {
      i += 2;
      continue;
    }
    if (ch === quote) {
      return i + 1;
    }
    i += 1;
  }
  return source.length;
}

function skipTemplate(source: string, start: number): number {
  let i = start + 1;
  while (i < source.length) {
    const ch = source.charAt(i);
    if (ch === '\\') {
      i += 2;
      continue;
    }
    if (ch === '`') {
      return i + 1;
    }
    if (ch === '$' && source.charAt(i + 1) === '{') {
      i = skipInterpolation(source, i);
      continue;
    }
    i += 1;
  }
  return source.length;
}

function skipInterpolation(source: string, start: number): number {
  let i = start + 2;
  let depth = 1;
  while (i < source.length && depth > 0) {
    const ch = source.charAt(i);
    if (ch === '/' && source.charAt(i + 1) === '/') {
      i = skipLineComment(source, i);
      continue;
    }
    if (ch === '/' && source.charAt(i + 1) === '*') {
      i = skipBlockComment(source, i);
      continue;
    }
    if (isQuote(ch)) {
      i = skipQuoted(source, i);
      continue;
    }
    if (ch === '`') {
      i = skipTemplate(source, i);
      continue;
    }
    if (ch === '{') {
      depth += 1;
      i += 1;
      continue;
    }
    if (ch === '}') {
      depth -= 1;
      i += 1;
      continue;
    }
    i += 1;
  }
  return i;
}

function blankCommentsPreserveLines(source: string): string {
  const chars: string[] = [];
  let i = 0;
  while (i < source.length) {
    const ch = source.charAt(i);
    const next = source.charAt(i + 1);
    if (ch === '/' && next === '/') {
      const end = skipLineComment(source, i);
      while (i < end) {
        if (source.charAt(i) === '\n') {
          chars.push('\n');
        } else {
          chars.push(' ');
        }
        i += 1;
      }
      continue;
    }
    if (ch === '/' && next === '*') {
      const end = skipBlockComment(source, i);
      while (i < end) {
        if (source.charAt(i) === '\n') {
          chars.push('\n');
        } else {
          chars.push(' ');
        }
        i += 1;
      }
      continue;
    }
    if (isQuote(ch)) {
      const end = skipQuoted(source, i);
      while (i < end) {
        chars.push(source.charAt(i));
        i += 1;
      }
      continue;
    }
    if (ch === '`') {
      const end = skipTemplate(source, i);
      while (i < end) {
        chars.push(source.charAt(i));
        i += 1;
      }
      continue;
    }
    chars.push(ch);
    i += 1;
  }
  return chars.join('');
}

function findCssTemplates(source: string): Array<{start: number; end: number}> {
  const templates: Array<{start: number; end: number}> = [];
  let i = 0;
  while (i < source.length) {
    const ch = source.charAt(i);
    const next = source.charAt(i + 1);
    if (ch === '/' && next === '/') {
      i = skipLineComment(source, i);
      continue;
    }
    if (ch === '/' && next === '*') {
      i = skipBlockComment(source, i);
      continue;
    }
    if (isQuote(ch)) {
      i = skipQuoted(source, i);
      continue;
    }
    if (ch === '`') {
      const end = skipTemplate(source, i);
      const inner = source.slice(i + 1, end - 1);
      const looksLikeCss = anyTrue([
        /text-transform\s*:/i.test(inner),
        /background(?:-color|-image)?\s*:/i.test(inner),
        /box-shadow\s*:/i.test(inner),
        /backdrop-filter\s*:/i.test(inner),
        /letter-spacing\s*:/i.test(inner),
        /color\s*:/i.test(inner),
      ]);
      if (looksLikeCss) {
        templates.push({start: i + 1, end: end - 1});
      }
      i = end;
      continue;
    }
    i += 1;
  }
  return templates;
}

function matchingBrace(source: string, openIndex: number): number {
  let i = openIndex + 1;
  let depth = 1;
  while (i < source.length && depth > 0) {
    const ch = source.charAt(i);
    const next = source.charAt(i + 1);
    if (ch === '/' && next === '/') {
      i = skipLineComment(source, i);
      continue;
    }
    if (ch === '/' && next === '*') {
      i = skipBlockComment(source, i);
      continue;
    }
    if (isQuote(ch)) {
      i = skipQuoted(source, i);
      continue;
    }
    if (ch === '`') {
      i = skipTemplate(source, i);
      continue;
    }
    if (ch === '$' && next === '{') {
      i = skipInterpolation(source, i);
      continue;
    }
    if (ch === '{') {
      depth += 1;
      i += 1;
      continue;
    }
    if (ch === '}') {
      depth -= 1;
      if (depth === 0) {
        return i;
      }
      i += 1;
      continue;
    }
    i += 1;
  }
  return source.length;
}

function collectCssRules(
  source: string,
  start: number,
  end: number,
  parent: CssRule | undefined,
  into: CssRule[],
): void {
  const pieces: string[] = [];
  const nested: Array<{start: number; end: number}> = [];
  let i = start;
  while (i < end) {
    const ch = source.charAt(i);
    const next = source.charAt(i + 1);
    if (ch === '$' && next === '{') {
      const interpEnd = skipInterpolation(source, i);
      pieces.push(source.slice(i, interpEnd));
      i = interpEnd;
      continue;
    }
    if (ch === '{') {
      const close = matchingBrace(source, i);
      nested.push({start: i + 1, end: close});
      i = close + 1;
      continue;
    }
    pieces.push(ch);
    i += 1;
  }
  const rule: CssRule = {
    start,
    text: pieces.join(''),
    parent,
  };
  into.push(rule);
  for (const child of nested) {
    collectCssRules(source, child.start, child.end, rule, into);
  }
}

function parsePercentOrNumber(raw: string): number {
  const trimmed = raw.trim();
  if (trimmed.endsWith('%')) {
    const pct = Number.parseFloat(trimmed.slice(0, -1));
    if (Number.isFinite(pct)) {
      return (pct / 100) * 255;
    }
    return 0;
  }
  const n = Number.parseFloat(trimmed);
  if (Number.isFinite(n)) {
    return n;
  }
  return 0;
}

function isNeutralRgb(r: number, g: number, b: number): boolean {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  return max - min <= 40;
}

function isChromeRel(rel: string): boolean {
  return rel === 'src/components/ui/Chrome.tsx';
}

function isIconDiscTintInterpolation(source: string, index: number): boolean {
  let i = index;
  while (i > 0 && isIdent(source.charAt(i - 1))) {
    i -= 1;
  }
  if (i >= 2 && source.charAt(i - 2) === '$' && source.charAt(i - 1) === '{') {
    return true;
  }
  return false;
}

function declarationValueIsNone(value: string): boolean {
  return value.trim().toLowerCase() === 'none';
}

function ruleHasAccentBackground(text: string): boolean {
  return anyTrue([ACCENT_IN_BACKGROUND.test(text), SAFFRON_GRADIENT.test(text)]);
}

function ruleOrAncestorHasTextOnAccent(rule: CssRule): boolean {
  let current: CssRule | undefined = rule;
  while (current !== undefined) {
    if (TEXT_ON_ACCENT.test(current.text)) {
      return true;
    }
    current = current.parent;
  }
  return false;
}

function ruleOrAncestorHasLetterSpacing(rule: CssRule): boolean {
  let current: CssRule | undefined = rule;
  while (current !== undefined) {
    if (LETTER_SPACING_DECL.test(current.text)) {
      return true;
    }
    current = current.parent;
  }
  return false;
}

function chromeAllowsFloatingBoxShadow(chromeSource: string): boolean {
  const templates = findCssTemplates(chromeSource);
  for (const template of templates) {
    const body = chromeSource.slice(template.start, template.end);
    BOX_SHADOW_DECL.lastIndex = 0;
    const match = BOX_SHADOW_DECL.exec(`\n${body}`);
    if (match === null) {
      continue;
    }
    const value = match[1];
    if (value === undefined) {
      continue;
    }
    if (declarationValueIsNone(value) === false) {
      return true;
    }
  }
  return false;
}

function pushHit(hits: LintHit[], file: string, line: number): void {
  for (const existing of hits) {
    if (existing.file === file && existing.line === line) {
      return;
    }
  }
  hits.push({file, line});
}

function scanFile(
  absPath: string,
  chromeFloatingOk: boolean,
): LintHit[] {
  const rel = repoRel(absPath);
  const raw = readFileSync(absPath, 'utf8');
  const source = blankCommentsPreserveLines(raw);
  const hits: LintHit[] = [];
  const chrome = isChromeRel(rel);

  HEX_COLOR.lastIndex = 0;
  let hexSearch = 0;
  while (hexSearch < source.length) {
    const slice = source.slice(hexSearch);
    const found = HEX_COLOR.exec(slice);
    if (found === null) {
      break;
    }
    const at = hexSearch + found.index;
    hexSearch = at + found[0].length;
    if (chrome && isIconDiscTintInterpolation(source, at)) {
      continue;
    }
    pushHit(hits, rel, lineNumberAt(source, at));
  }

  let rgbSearch = 0;
  while (rgbSearch < source.length) {
    const slice = source.slice(rgbSearch);
    const found = RGB_COLOR.exec(slice);
    if (found === null) {
      break;
    }
    const at = rgbSearch + found.index;
    rgbSearch = at + found[0].length;
    const rRaw = found[1];
    const gRaw = found[2];
    const bRaw = found[3];
    if (rRaw === undefined) {
      continue;
    }
    if (gRaw === undefined) {
      continue;
    }
    if (bRaw === undefined) {
      continue;
    }
    const r = parsePercentOrNumber(rRaw);
    const g = parsePercentOrNumber(gRaw);
    const b = parsePercentOrNumber(bRaw);
    if (isNeutralRgb(r, g, b)) {
      pushHit(hits, rel, lineNumberAt(source, at));
    }
  }

  let backdropSearch = 0;
  while (backdropSearch < source.length) {
    const slice = source.slice(backdropSearch);
    const found = BACKDROP_FILTER.exec(slice);
    if (found === null) {
      break;
    }
    const at = backdropSearch + found.index;
    backdropSearch = at + found[0].length;
    const value = found[1];
    if (value === undefined) {
      continue;
    }
    if (declarationValueIsNone(value) === false) {
      pushHit(hits, rel, lineNumberAt(source, at));
    }
  }

  let shadowSearch = 0;
  while (shadowSearch < source.length) {
    const slice = source.slice(shadowSearch);
    const found = BOX_SHADOW_DECL.exec(slice);
    if (found === null) {
      break;
    }
    const at = shadowSearch + found.index;
    const value = found[1];
    shadowSearch = at + (found[0].length < 1 ? 1 : found[0].length);
    if (value === undefined) {
      continue;
    }
    if (declarationValueIsNone(value)) {
      continue;
    }
    if (chrome && chromeFloatingOk) {
      continue;
    }
    pushHit(hits, rel, lineNumberAt(source, at));
  }

  const templates = findCssTemplates(source);
  const rules: CssRule[] = [];
  for (const template of templates) {
    collectCssRules(source, template.start, template.end, undefined, rules);
  }
  for (const rule of rules) {
    if (ruleHasAccentBackground(rule.text) && ruleOrAncestorHasTextOnAccent(rule) === false) {
      pushHit(hits, rel, lineNumberAt(source, rule.start));
    }
    if (UPPERCASE_TRANSFORM.test(rule.text) && ruleOrAncestorHasLetterSpacing(rule) === false) {
      const upper = UPPERCASE_TRANSFORM.exec(rule.text);
      let at = rule.start;
      if (upper !== null) {
        at = rule.start + upper.index;
      }
      pushHit(hits, rel, lineNumberAt(source, at));
    }
  }

  return hits;
}

const LEFTOVER_LINT_PATHS: readonly string[] = [
  'src/components/app/EnhancedTripCard.tsx',
  'src/components/app/FlightRouteMap.tsx',
  'src/components/app/tripCardTheme.ts',
];

function formatHits(hits: LintHit[]): string[] {
  const sorted = [...hits].sort((a, b) => {
    if (a.file < b.file) {
      return -1;
    }
    if (a.file > b.file) {
      return 1;
    }
    return a.line - b.line;
  });
  return sorted.map((hit) => `LINT_GAP ${hit.file}:${hit.line}`);
}

function isLeftoverLintPath(rel: string): boolean {
  for (const leftover of LEFTOVER_LINT_PATHS) {
    if (leftover === rel) {
      return true;
    }
  }
  return false;
}

function uniqueSortedFiles(hits: LintHit[]): string[] {
  const seen = new Set<string>();
  const files: string[] = [];
  for (const hit of hits) {
    if (seen.has(hit.file)) {
      continue;
    }
    seen.add(hit.file);
    files.push(hit.file);
  }
  files.sort();
  return files;
}

function chromeSourceBecauseFileMayBeMissing(chromePath: string): string {
  if (existsSync(chromePath) === false) {
    return '';
  }
  return readFileSync(chromePath, 'utf8');
}

function collectLintHits(): LintHit[] {
  const chromePath = join(SRC_DIR, 'components', 'ui', 'Chrome.tsx');
  const chromeSource = chromeSourceBecauseFileMayBeMissing(chromePath);
  const floatingOk = chromeAllowsFloatingBoxShadow(chromeSource);
  const hits: LintHit[] = [];
  for (const file of collectScanFiles()) {
    hits.push(...scanFile(file, floatingOk));
  }
  return hits;
}

function leftoverHitsBecauseNamedResiduals(hits: LintHit[]): LintHit[] {
  const leftover: LintHit[] = [];
  for (const hit of hits) {
    if (isLeftoverLintPath(hit.file)) {
      leftover.push(hit);
    }
  }
  return leftover;
}

function hitsOutsideLeftovers(hits: LintHit[]): LintHit[] {
  const outside: LintHit[] = [];
  for (const hit of hits) {
    if (isLeftoverLintPath(hit.file) === false) {
      outside.push(hit);
    }
  }
  return outside;
}

describe('signed-in app design-language lint', () => {
  it('has no hex, glass, shadow, saffron-on-white, or untracked uppercase outside named leftovers', () => {
    expect(formatHits(hitsOutsideLeftovers(collectLintHits()))).toEqual([]);
  });

  it('names leftover LINT_GAP files until a later seat tokenizes them', () => {
    expect([...LEFTOVER_LINT_PATHS]).toEqual([
      'src/components/app/EnhancedTripCard.tsx',
      'src/components/app/FlightRouteMap.tsx',
      'src/components/app/tripCardTheme.ts',
    ]);
    const leftoverFiles = uniqueSortedFiles(
      leftoverHitsBecauseNamedResiduals(collectLintHits()),
    );
    expect(leftoverFiles).toEqual([...LEFTOVER_LINT_PATHS]);
  });
});
