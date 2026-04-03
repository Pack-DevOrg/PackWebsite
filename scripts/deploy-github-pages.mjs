import {execFileSync} from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import {fileURLToPath} from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');
const distPath = path.join(repoRoot, 'dist');
const cnamePath = path.join(distPath, 'CNAME');
const noJekyllPath = path.join(distPath, '.nojekyll');
const pagesDomain =
  process.env.DONEAI_GITHUB_PAGES_DOMAIN?.trim() ||
  process.env.VITE_WEBSITE_URL?.trim()?.replace(/^https?:\/\//i, '').replace(/\/.*$/, '') ||
  'trypackai.com';

function runCommand(command, args, options = {}) {
  return execFileSync(command, args, {
    cwd: repoRoot,
    stdio: 'inherit',
    encoding: 'utf8',
    ...options,
  });
}

function captureCommand(command, args) {
  return execFileSync(command, args, {
    cwd: repoRoot,
    encoding: 'utf8',
  }).trim();
}

function ensureMasterBranch() {
  const branch = captureCommand('git', ['rev-parse', '--abbrev-ref', 'HEAD']);
  if (branch !== 'master') {
    throw new Error(
      `Website deploys are only allowed from master. Current branch: ${branch}`,
    );
  }
}

function ensureCleanWorktree() {
  const status = captureCommand('git', ['status', '--porcelain']);
  if (status !== '') {
    throw new Error(
      'Website deploy requires a clean worktree. Commit or stash changes before deploying.',
    );
  }
}

function ensureLegalLock() {
  runCommand('npm', ['run', 'legal:check']);
}

function buildSite() {
  runCommand('npm', ['run', 'build']);
}

function preparePagesOutput() {
  if (!fs.existsSync(distPath)) {
    throw new Error(`Build output missing at ${distPath}`);
  }

  fs.writeFileSync(cnamePath, `${pagesDomain}\n`, 'utf8');
  fs.closeSync(fs.openSync(noJekyllPath, 'w'));
}

function publishToGhPages({dryRun}) {
  const args = ['gh-pages', '-d', 'dist', '--dotfiles'];
  if (dryRun) {
    args.push('--dry-run');
  }
  runCommand('npx', args, {
    env: {
      ...process.env,
      DONEAI_ALLOW_GH_PAGES_PUSH: '1',
    },
  });
}

function main() {
  const dryRun = process.argv.includes('--dry-run');

  ensureMasterBranch();
  ensureCleanWorktree();
  ensureLegalLock();
  buildSite();
  preparePagesOutput();
  publishToGhPages({dryRun});

  if (dryRun) {
    console.log('[deploy] Dry run completed. No gh-pages changes were pushed.');
  } else {
    console.log(`[deploy] GitHub Pages publish completed from master for ${pagesDomain}.`);
  }
}

try {
  main();
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`[deploy] ${message}`);
  process.exit(1);
}
