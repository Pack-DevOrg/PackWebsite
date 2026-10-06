import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, it } from 'node:test';
import vm from 'node:vm';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const source = fs.readFileSync(
  path.join(__dirname, '../cloudfront/app-origin-viewer-request.js'),
  'utf8'
);
const origins = [];
const sandbox = {
  require: (name) => {
    assert.equal(name, 'cloudfront');
    return { updateRequestOrigin: (o) => origins.push(o) };
  },
};
vm.runInNewContext(source, sandbox);

function run(uri, userAgent) {
  origins.length = 0;
  const headers = { host: { value: 'www.trypackai.com' } };
  if (userAgent) headers['user-agent'] = { value: userAgent };
  return sandbox.handler({ request: { uri, headers, querystring: {} } });
}

const APPLE =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_1) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.0.3 Safari/605.1.15 (Applebot/0.1)';
const SAFARI =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1';

describe('app-origin-viewer-request link-preview routing', () => {
  it('routes an Apple link-preview UA on /a/abc to the preview origin', () => {
    const request = run('/a/abc', APPLE);
    assert.equal(request.uri, '/a/abc');
    assert.equal(origins.length, 1);
    assert.equal(origins[0].domainName, 'link-preview.trypackai.com');
  });

  for (const ua of ['Slackbot-LinkExpanding 1.0', 'facebookexternalhit/1.1', 'Twitterbot/1.0', 'Discordbot/2.0']) {
    it('routes ' + ua, () => {
      assert.equal(run('/a/abc', ua).uri, '/a/abc');
      assert.equal(origins.length, 1);
    });
  }

  it('leaves a Safari UA on /a/abc unchanged', () => {
    assert.equal(run('/a/abc', SAFARI).uri, '/a/abc/index.html');
    assert.equal(origins.length, 0);
  });

  it('falls through for a missing UA', () => {
    assert.equal(run('/a/abc').uri, '/a/abc/index.html');
  });

  it('never reroutes /app', () => {
    assert.equal(run('/app', APPLE).uri, '/app');
    assert.equal(origins.length, 0);
    assert.equal(run('/app', SAFARI).uri, '/app');
  });
});
