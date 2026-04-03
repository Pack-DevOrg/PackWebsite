import fs from 'node:fs';
import path from 'node:path';

const e2eDir = path.resolve(process.cwd(), 'e2e');
const allowDirectSubscribe = new Set(['api-contract.spec.ts']);

const files = fs
  .readdirSync(e2eDir)
  .filter((name) => name.endsWith('.spec.ts'))
  .map((name) => ({
    name,
    absolutePath: path.join(e2eDir, name),
    content: fs.readFileSync(path.join(e2eDir, name), 'utf8'),
  }));

const violations = [];

for (const file of files) {
  if (allowDirectSubscribe.has(file.name)) {
    continue;
  }

  const hasSubscribeReference = /\/subscribe/.test(file.content);
  if (!hasSubscribeReference) {
    continue;
  }

  const hasMockedRoute = /page\.route\(\s*["'`]\*\*\/subscribe/.test(file.content);
  if (!hasMockedRoute) {
    violations.push(
      `${file.name}: references /subscribe without page.route('**/subscribe') interception`
    );
  }

  const hasLiveWaitForResponse = /waitForResponse\([\s\S]*?\/subscribe/.test(file.content);
  if (hasLiveWaitForResponse) {
    violations.push(
      `${file.name}: contains waitForResponse(.../subscribe...) which indicates live subscribe network dependency`
    );
  }

  const hasLiveRequestPost = /request\.(post|fetch)\([\s\S]*?\/subscribe/.test(file.content);
  if (hasLiveRequestPost) {
    violations.push(
      `${file.name}: contains request.post/fetch(.../subscribe...) and should be moved to api-contract.spec.ts allowlist`
    );
  }
}

if (violations.length > 0) {
  console.error('E2E subscribe safety guard failed.');
  for (const violation of violations) {
    console.error(`- ${violation}`);
  }
  process.exit(1);
}

console.log('E2E subscribe safety guard passed.');
