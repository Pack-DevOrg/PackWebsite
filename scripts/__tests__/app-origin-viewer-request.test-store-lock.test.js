import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, it } from 'node:test';
import vm from 'node:vm';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const source = fs.readFileSync(path.join(__dirname, '../cloudfront/app-origin-viewer-request.js'), 'utf8');

const KEY = 'k'.repeat(24) + 'Z'.repeat(24);

function load(kvsValue = KEY) {
  const sandbox = {
    require: (name) =>
      name === 'cloudfront'
        ? {
            updateRequestOrigin: () => undefined,
            kvs: () => ({
              get: async (entry) => {
                if (kvsValue instanceof Error) throw kvsValue;
                assert.equal(entry, 'test-store-key');
                return kvsValue;
              },
            }),
          }
        : null,
  };
  vm.runInNewContext(source, sandbox);
  return sandbox.handler;
}

const run = (handler, uri, { headers = {}, cookies = {}, querystring = {} } = {}) =>
  Promise.resolve(
    handler({
      request: {
        uri,
        headers: { host: { value: 'www.trypackai.com' }, ...headers },
        cookies,
        querystring,
      },
    })
  );

describe('app-origin-viewer-request test-store lock', () => {
  const handler = load();

  it('answers a plain 404 with no key', async () => {
    for (const uri of ['/test-store/', '/test-store/p/trail-runner', '/test-store/store.js', '/test-store']) {
      const res = await run(handler, uri);
      assert.equal(res.statusCode, 404, uri);
      assert.equal(res.headers.location, undefined);
      assert.equal(res.cookies, undefined);
    }
  });

  it('answers 404 for a wrong key in header, cookie or query', async () => {
    const wrong = KEY.slice(0, -1) + 'X';
    assert.equal((await run(handler, '/test-store/p/x', { headers: { 'x-pack-test-key': { value: wrong } } })).statusCode, 404);
    assert.equal((await run(handler, '/test-store/p/x', { cookies: { pack_test_key: { value: wrong } } })).statusCode, 404);
    assert.equal((await run(handler, '/test-store/p/x', { querystring: { k: { value: wrong } } })).statusCode, 404);
    assert.equal((await run(handler, '/test-store/p/x', { headers: { 'x-pack-test-key': { value: '' } } })).statusCode, 404);
  });

  it('passes the header key through to the page', async () => {
    const res = await run(handler, '/test-store/p/trail-runner', { headers: { 'x-pack-test-key': { value: KEY } } });
    assert.equal(res.statusCode, undefined);
    assert.equal(res.uri, '/test-store/p/trail-runner/index.html');
    const home = await run(handler, '/test-store/', { headers: { 'x-pack-test-key': { value: KEY } } });
    assert.equal(home.uri, '/test-store/index.html');
    const js = await run(handler, '/test-store/store.js', { headers: { 'x-pack-test-key': { value: KEY } } });
    assert.equal(js.uri, '/test-store/store.js');
  });

  it('?k= sets the HttpOnly Secure cookie scoped to /test-store and redirects without k', async () => {
    const res = await run(handler, '/test-store/p/trail-runner', { querystring: { k: { value: KEY }, size: { value: '9' } } });
    assert.equal(res.statusCode, 302);
    assert.equal(res.headers.location.value, '/test-store/p/trail-runner?size=9');
    assert.equal(res.cookies.pack_test_key.value, KEY);
    assert.match(res.cookies.pack_test_key.attributes, /HttpOnly/);
    assert.match(res.cookies.pack_test_key.attributes, /Secure/);
    assert.match(res.cookies.pack_test_key.attributes, /Path=\/test-store/);
  });

  it('passes a valid cookie through', async () => {
    const res = await run(handler, '/test-store/search', { cookies: { pack_test_key: { value: KEY } } });
    assert.equal(res.statusCode, undefined);
    assert.equal(res.uri, '/test-store/search/index.html');
  });

  it('fails closed when the key store is unreadable or the key is short', async () => {
    const down = load(new Error('no kvs'));
    assert.equal((await run(down, '/test-store/p/x', { headers: { 'x-pack-test-key': { value: KEY } } })).statusCode, 404);
    const short = load('short');
    assert.equal((await run(short, '/test-store/p/x', { headers: { 'x-pack-test-key': { value: 'short' } } })).statusCode, 404);
  });

  it('leaves every other route as before', async () => {
    const res = await run(handler, '/features');
    assert.equal(res.uri, '/features/index.html');
  });
});

describe('shipped (minified) function code', () => {
  it('fits the CloudFront function limit and still gates the shop', async () => {
    const { shippedCodeBecauseSource, FUNCTION_CODE_LIMIT_BYTES } = await import('../cloudfront-function-code.mjs');
    const code = shippedCodeBecauseSource(path.join(__dirname, '../cloudfront/app-origin-viewer-request.js'));
    assert.ok(Buffer.byteLength(code) <= FUNCTION_CODE_LIMIT_BYTES);
    for (const name of ['app-origin-viewer-request.js', 'app-origin-viewer-response.js']) {
      assert.ok(Buffer.byteLength(shippedCodeBecauseSource(path.join(__dirname, '../cloudfront', name))) <= 10240);
    }
    const sandbox = { require: () => ({ updateRequestOrigin: () => undefined, kvs: () => ({ get: async () => KEY }) }) };
    vm.runInNewContext(code, sandbox);
    const res = await sandbox.handler({ request: { uri: '/test-store/p/x', headers: { host: { value: 'www.trypackai.com' } }, cookies: {}, querystring: {} } });
    assert.equal(res.statusCode, 404);
    const ok = await sandbox.handler({ request: { uri: '/test-store/p/x', headers: { host: { value: 'www.trypackai.com' }, 'x-pack-test-key': { value: KEY } }, cookies: {}, querystring: {} } });
    assert.equal(ok.uri, '/test-store/p/x/index.html');
  });
});
