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
const sandbox = { require: (name) => (name === 'cloudfront' ? { updateRequestOrigin: (o) => origins.push(o) } : null) };
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
  for (const ua of [APPLE, 'Slackbot-LinkExpanding 1.0', 'facebookexternalhit/1.1', 'Twitterbot/1.0', 'Discordbot/2.0']) {
    it('swaps the origin to the preview origin for ' + ua, () => {
      const request = run('/a/abc', ua);
      assert.equal(origins.length, 1);
      assert.equal(origins[0].domainName, 'api.trypackai.com');
      assert.equal(request.uri, '/a/abc');
    });
  }

  it('leaves a Safari UA on /a/abc on the SPA origin', () => {
    assert.equal(run('/a/abc', SAFARI).uri, '/a/index.html');
    assert.equal(origins.length, 0);
  });

  it('keeps CFNetwork and com.apple in-app fetches on the SPA', () => {
    for (const ua of ['Pack/1 CFNetwork/1494.0.7 Darwin/23.4.0', 'com.apple.WebKit.Networking/8618', 'iMessage-Client/1']) {
      assert.equal(run('/a/abc', ua).uri, '/a/index.html');
      assert.equal(origins.length, 0);
    }
  });

  it('falls through for a missing UA', () => {
    assert.equal(run('/a/abc').uri, '/a/index.html');
    assert.equal(origins.length, 0);
  });

  it('never reroutes /app', () => {
    assert.equal(run('/app', APPLE).uri, '/app');
    assert.equal(run('/app', SAFARI).uri, '/app');
    assert.equal(origins.length, 0);
  });
});

describe('app-origin-viewer-request apex AASA', () => {
  const apex = (uri) =>
    sandbox.handler({ request: { uri, headers: { host: { value: 'trypackai.com' } }, querystring: {} } });

  it('serves the bare-host AASA without a redirect', () => {
    const request = apex('/.well-known/apple-app-site-association');
    assert.equal(request.statusCode, undefined);
    assert.equal(request.uri, '/.well-known/apple-app-site-association');
  });

  it('still redirects other bare-host paths', () => {
    assert.equal(apex('/about').statusCode, 301);
  });
});
