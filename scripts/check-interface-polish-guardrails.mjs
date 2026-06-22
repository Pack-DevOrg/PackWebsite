/**
 * Static interface polish guardrails for high-confidence website regressions.
 *
 * These checks encode a small deterministic subset of the interface guidance:
 * subtle image outlines, explicit transitions, tame active press states, scoped
 * will-change hints, and global text/touch defaults.
 */

import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const MIN_ACTIVE_SCALE = 0.95;
const ALLOWED_WILL_CHANGE_VALUES = new Set([
  'auto',
  'clip-path',
  'filter',
  'opacity',
  'transform',
]);
const ALLOWED_IMAGE_OUTLINE_COLORS = new Set([
  'rgba(255,255,255,0.1)',
  'rgba(0,0,0,0.1)',
]);

const projectRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
);

/**
 * @typedef {{file: string, message: string}} Finding
 */

/**
 * @param {string} dir
 * @returns {string[]}
 */
function listFiles(dir) {
  /** @type {string[]} */
  const results = [];
  /** @type {string[]} */
  const stack = [dir];

  while (stack.length > 0) {
    const current = stack.pop();
    if (!current) {
      continue;
    }

    let entries;
    try {
      entries = fs.readdirSync(current, {withFileTypes: true});
    } catch {
      continue;
    }

    for (const entry of entries) {
      const fullPath = path.join(current, entry.name);
      if (entry.isDirectory()) {
        if (!['dist', 'dist-ssr', 'node_modules'].includes(entry.name)) {
          stack.push(fullPath);
        }
        continue;
      }
      if (entry.isFile() && /\.(css|html|ts|tsx)$/.test(fullPath)) {
        results.push(fullPath);
      }
    }
  }

  return results;
}

/**
 * @param {string} relativeFile
 * @returns {boolean}
 */
function shouldSkipFile(relativeFile) {
  return (
    relativeFile.includes('/__tests__/') ||
    relativeFile.includes('/tests/') ||
    relativeFile.includes('/fixtures/') ||
    relativeFile.endsWith('.d.ts')
  );
}

/**
 * @param {string} value
 * @returns {string}
 */
function normalizeCssColor(value) {
  return value.replace(/\s+/g, '').toLowerCase();
}

/**
 * @param {string} relativeFile
 * @param {string} content
 * @returns {Finding[]}
 */
function checkTransitionSpecificity(relativeFile, content) {
  /** @type {Finding[]} */
  const findings = [];
  const transitionAllRe = /\btransition(?:-property)?\s*:\s*all\b/gi;

  if (transitionAllRe.test(content)) {
    findings.push({
      file: relativeFile,
      message:
        'Use explicit transitioned properties instead of transition: all.',
    });
  }

  return findings;
}

/**
 * @param {string} relativeFile
 * @param {string} content
 * @returns {Finding[]}
 */
function checkWillChange(relativeFile, content) {
  /** @type {Finding[]} */
  const findings = [];
  const willChangeRe = /\bwill-change\s*:\s*([^;`]+)/gi;
  let match;

  while ((match = willChangeRe.exec(content)) !== null) {
    const value = match[1].trim();
    if (value.includes('${') || value.includes('var(')) {
      continue;
    }

    const properties = value
      .split(',')
      .map(property => property.trim().toLowerCase())
      .filter(Boolean);

    for (const property of properties) {
      if (!ALLOWED_WILL_CHANGE_VALUES.has(property)) {
        findings.push({
            file: relativeFile,
            message:
              `will-change: ${value} is too broad; keep will-change scoped to ` +
            'auto, transform, opacity, filter, or clip-path.',
          });
        break;
      }
    }
  }

  return findings;
}

/**
 * @param {string} relativeFile
 * @param {string} content
 * @returns {Finding[]}
 */
function checkStyledImageOutlines(relativeFile, content) {
  /** @type {Finding[]} */
  const findings = [];
  const styledImageRe = /styled\.img(?:<[\s\S]*?>)?\s*`([\s\S]*?)`/g;
  let blockMatch;

  while ((blockMatch = styledImageRe.exec(content)) !== null) {
    const css = blockMatch[1];
    const outlineRe = /\boutline\s*:\s*[^;]*rgba\(([^)]+)\)[^;]*;/gi;
    let outlineMatch;

    while ((outlineMatch = outlineRe.exec(css)) !== null) {
      const color = normalizeCssColor(`rgba(${outlineMatch[1]})`);
      if (!ALLOWED_IMAGE_OUTLINE_COLORS.has(color)) {
        findings.push({
          file: relativeFile,
          message:
            'styled.img outlines should use rgba(255, 255, 255, 0.1) ' +
            'or rgba(0, 0, 0, 0.1).',
        });
      }
    }
  }

  return findings;
}

/**
 * @param {string} relativeFile
 * @param {string} content
 * @returns {Finding[]}
 */
function checkActivePressScale(relativeFile, content) {
  /** @type {Finding[]} */
  const findings = [];
  const activeBlockRe = /:active[^{]*\{([\s\S]*?)\}/g;
  let blockMatch;

  while ((blockMatch = activeBlockRe.exec(content)) !== null) {
    const block = blockMatch[1];
    const scaleRe = /\bscale\(\s*([0-9.]+)\s*\)/g;
    let scaleMatch;

    while ((scaleMatch = scaleRe.exec(block)) !== null) {
      const value = Number(scaleMatch[1]);
      if (Number.isFinite(value) && value > 0 && value < MIN_ACTIVE_SCALE) {
        findings.push({
          file: relativeFile,
          message:
            `:active scale(${value}) is below ${MIN_ACTIVE_SCALE}; ` +
            'keep press feedback subtle so controls do not feel jumpy.',
        });
      }
    }
  }

  return findings;
}

/**
 * @param {string} content
 * @returns {Finding[]}
 */
function checkGlobalStyleDefaults(content) {
  /** @type {Finding[]} */
  const findings = [];
  const file = 'src/styles/GlobalStyles.ts';
  const requiredStrings = [
    {
      value: '-webkit-font-smoothing: antialiased',
      message: 'Keep WebKit font smoothing enabled on html, body.',
    },
    {
      value: '-moz-osx-font-smoothing: grayscale',
      message: 'Keep Firefox macOS font smoothing enabled on html, body.',
    },
    {
      value: 'text-wrap: balance',
      message: 'Keep balanced wrapping on headings.',
    },
    {
      value: 'text-wrap: pretty',
      message: 'Keep pretty wrapping on body copy.',
    },
  ];

  for (const required of requiredStrings) {
    if (!content.includes(required.value)) {
      findings.push({file, message: required.message});
    }
  }

  const buttonDefaultsRe =
    /button\s*\{[\s\S]*?\bmin-height\s*:\s*44px\b[\s\S]*?\btouch-action\s*:\s*manipulation\b[\s\S]*?\}/;
  if (!buttonDefaultsRe.test(content)) {
    findings.push({
      file,
      message:
        'Keep button defaults at min-height: 44px and touch-action: manipulation.',
    });
  }

  return findings;
}

function main() {
  const srcDir = path.join(projectRoot, 'src');
  const files = listFiles(srcDir);

  /** @type {Finding[]} */
  const findings = [];

  for (const filePath of files) {
    const relativeFile = path.relative(projectRoot, filePath);
    if (shouldSkipFile(relativeFile)) {
      continue;
    }

    let content;
    try {
      content = fs.readFileSync(filePath, 'utf8');
    } catch {
      continue;
    }

    findings.push(...checkTransitionSpecificity(relativeFile, content));
    findings.push(...checkWillChange(relativeFile, content));
    findings.push(...checkStyledImageOutlines(relativeFile, content));
    findings.push(...checkActivePressScale(relativeFile, content));

    if (relativeFile === 'src/styles/GlobalStyles.ts') {
      findings.push(...checkGlobalStyleDefaults(content));
    }
  }

  if (findings.length === 0) {
    console.log('[check-interface-polish] OK');
    return;
  }

  console.error('[check-interface-polish] Found interface polish violations:');
  for (const finding of findings) {
    console.error(`- ${finding.file}: ${finding.message}`);
  }
  process.exitCode = 1;
}

main();
