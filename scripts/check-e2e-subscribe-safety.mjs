/**
 * E2E subscribe safety guard (runs before every playwright lane).
 *
 * Invariant: no default e2e spec may reach the REAL subscribe/unsubscribe
 * backend. Enforced structurally, against the patterns the specs actually
 * use, not against idealized ones:
 *
 * 1. Direct API calls (request.post/fetch of a subscribe URL) are allowed
 *    only in the opt-in contract spec (api-contract.spec.ts), and that spec's
 *    default base URL must be the DEV stage — never prod.
 * 2. Any other spec that mentions subscribe must either
 *    a) install a page.route() interception whose glob REALLY matches the
 *       backend subscribe endpoints (verified by glob-matching the candidate
 *       URLs below), or
 *    b) be a registered navigation-only spec (renders subscribe/unsubscribe
 *       UI without ever submitting), which this guard verifies contains no
 *       submit/network primitives for subscribe.
 *
 * Self-test: `node scripts/check-e2e-subscribe-safety.mjs --self-test`
 * plants violating fixture specs in a temp dir and asserts the guard fails.
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

// Every URL shape the website can actually hit for subscribe flows. A route
// glob only counts as protection when it matches ALL of them.
const REAL_SUBSCRIBE_URLS = [
  'https://api.trypackai.com/prod/subscribe',
  'https://api.trypackai.com/prod/unsubscribe',
  'https://api.trypackai.com/dev/subscribe',
  'https://api.trypackai.com/dev/unsubscribe',
  'https://78o58odzab.execute-api.us-east-1.amazonaws.com/dev/encrypted-subscribe',
];

// Specs allowed to make direct request.post/fetch subscribe calls (opt-in
// contract lane, excluded from plain test:e2e by playwright.config.ts).
const DIRECT_CALL_ALLOWLIST = new Set(['api-contract.spec.ts']);

// Specs that only render subscribe/unsubscribe UI states without submitting.
// The guard verifies the claim (no submit or network primitives near
// subscribe) instead of trusting the list.
const NAVIGATION_ONLY_ALLOWLIST = new Set(['shared-and-unsubscribe.spec.ts']);

/** Convert a playwright route glob (e.g. **\/*subscribe*) to a RegExp. */
function globToRegExp(glob) {
  let pattern = '';
  for (const char of glob) {
    if (char === '*') {
      pattern += '.*';
    } else if ('.+?^${}()|[]\\'.includes(char)) {
      pattern += `\\${char}`;
    } else {
      pattern += char;
    }
  }
  return new RegExp(`^${pattern}$`);
}

/** Extract every string-literal glob passed to page.route()/context.route(). */
function extractRouteGlobs(content) {
  const globs = [];
  const routeCall = /\.route\(\s*(["'`])((?:\\.|(?!\1).)*)\1/g;
  let match;
  while ((match = routeCall.exec(content)) !== null) {
    globs.push(match[2]);
  }
  return globs;
}

function routeGlobCoversSubscribe(glob) {
  const regExp = globToRegExp(glob);
  return REAL_SUBSCRIBE_URLS.every((url) => regExp.test(url));
}

function checkSpecs(e2eDir) {
  const violations = [];
  const files = fs
    .readdirSync(e2eDir)
    .filter((name) => name.endsWith('.spec.ts'))
    .map((name) => ({
      name,
      content: fs.readFileSync(path.join(e2eDir, name), 'utf8'),
    }));

  let interceptingSpecs = 0;

  for (const file of files) {
    const mentionsSubscribe = /subscribe/i.test(file.content);
    if (!mentionsSubscribe) {
      continue;
    }

    const directSubscribeCall =
      /request\.(?:post|fetch)\([^)]*subscribe/i.test(file.content) ||
      /fetch\(\s*[^)]*\/(?:un)?subscribe/i.test(file.content);

    if (DIRECT_CALL_ALLOWLIST.has(file.name)) {
      if (/api\.trypackai\.com\/prod/.test(file.content)) {
        violations.push(
          `${file.name}: contract spec references the PROD api base; its default must stay on the dev stage`
        );
      }
      continue;
    }

    if (directSubscribeCall) {
      violations.push(
        `${file.name}: direct request.post/fetch of a subscribe endpoint outside the opt-in contract spec`
      );
      continue;
    }

    const subscribeGlobs = extractRouteGlobs(file.content).filter((glob) =>
      /subscribe/i.test(glob)
    );
    const hasCoveringRoute = subscribeGlobs.some(routeGlobCoversSubscribe);
    if (hasCoveringRoute) {
      interceptingSpecs += 1;
      continue;
    }

    if (NAVIGATION_ONLY_ALLOWLIST.has(file.name)) {
      // Verify the navigation-only claim: no subscribe submit primitives.
      const submitsSubscribe =
        /waitForResponse\([^)]*subscribe/i.test(file.content) ||
        /click\([^)]*subscribe/i.test(file.content) ||
        /getByRole\(\s*["'\`]button["'\`][^)]*subscribe/i.test(file.content);
      if (submitsSubscribe) {
        violations.push(
          `${file.name}: registered navigation-only but contains subscribe submit/network primitives`
        );
      }
      continue;
    }

    if (subscribeGlobs.length > 0) {
      violations.push(
        `${file.name}: page.route glob(s) [${subscribeGlobs.join(', ')}] do not match the real subscribe endpoints (need e.g. '**/*subscribe*')`
      );
    } else {
      violations.push(
        `${file.name}: exercises subscribe without page.route('**/*subscribe*') interception`
      );
    }
  }

  return { violations, interceptingSpecs };
}

function runGuard(e2eDir) {
  const { violations, interceptingSpecs } = checkSpecs(e2eDir);

  // Anti-vacuity: the corpus is known to contain intercepting waitlist specs.
  // Zero matches means THIS GUARD drifted from the specs' real patterns.
  if (interceptingSpecs === 0 && violations.length === 0) {
    violations.push(
      'guard drift: no spec matched a covering subscribe interception glob; the guard no longer understands the corpus'
    );
  }

  if (violations.length > 0) {
    console.error('E2E subscribe safety guard failed.');
    for (const violation of violations) {
      console.error(`- ${violation}`);
    }
    return 1;
  }

  console.log(
    `E2E subscribe safety guard passed (${interceptingSpecs} spec(s) with verified subscribe interception).`
  );
  return 0;
}

function selfTest() {
  const cases = [
    {
      name: 'direct prod subscribe call outside contract spec',
      file: 'rogue-direct.spec.ts',
      content:
        'await request.post("https://api.trypackai.com/prod/subscribe", { data: {} });\n',
    },
    {
      name: 'subscribe flow with a non-matching route glob',
      file: 'rogue-badglob.spec.ts',
      content:
        'await page.route("**/api/subscribe-form", () => {});\nawait submitWaitlistSubscribe(page);\n',
    },
    {
      name: 'subscribe flow with no interception at all',
      file: 'rogue-nointercept.spec.ts',
      content: 'await submitWaitlistSubscribe(page);\n',
    },
  ];

  let failures = 0;
  for (const testCase of cases) {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'subscribe-guard-'));
    try {
      // A known-good intercepting spec, so anti-vacuity does not mask the case.
      fs.writeFileSync(
        path.join(dir, 'good.spec.ts'),
        'await page.route("**/*subscribe*", () => {});\nawait submitWaitlistSubscribe(page);\n'
      );
      fs.writeFileSync(path.join(dir, testCase.file), testCase.content);
      const { violations } = checkSpecs(dir);
      const caught = violations.some((violation) => violation.startsWith(testCase.file));
      console.log(`self-test [${caught ? 'PASS' : 'FAIL'}]: ${testCase.name}`);
      if (!caught) {
        failures += 1;
      }
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  }
  return failures > 0 ? 1 : 0;
}

const exitCode = process.argv.includes('--self-test')
  ? selfTest()
  : runGuard(path.resolve(process.cwd(), 'e2e'));
process.exit(exitCode);
