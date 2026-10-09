import {createServer, request as httpRequest} from 'http';
import {readFileSync} from 'fs';
import {join} from 'path';

const AASA_URL_PATH = '/.well-known/apple-app-site-association';
const APP_ID = 'GW8YNJQZCK.com.packai.app';
const CLIP_ID = `${APP_ID}.Clip`;

function netlifyContentType(toml: string, route: string): string {
  for (const block of toml.split('[[headers]]')) {
    if (!block.includes(`for = "${route}"`)) {
      continue;
    }
    const match = block.match(/Content-Type\s*=\s*"([^"]+)"/);
    if (match?.[1]) {
      return match[1];
    }
  }
  return '';
}

describe('apple-app-site-association', () => {
  const file = join(process.cwd(), 'public/.well-known/apple-app-site-association');

  it('covers /i/* and /lv/* for the full app and names the clip', () => {
    const body = JSON.parse(readFileSync(file, 'utf8')) as {
      applinks: {details: Array<{appIDs: string[]; components: Array<{'/': string}>}>};
      appclips: {apps: string[]};
    };
    expect(file.endsWith('/apple-app-site-association')).toBe(true);
    expect(body.appclips.apps).toEqual([CLIP_ID]);
    expect(body.applinks.details[0]?.appIDs).toEqual([APP_ID]);
    expect(body.applinks.details[0]?.components.map((component) => component['/'])).toEqual(
      expect.arrayContaining(['/i/*', '/lv/*']),
    );
  });

  it('declares applinks for the clip prefixes and keeps the SPA fallback', () => {
    const body = JSON.parse(readFileSync(file, 'utf8')) as {
      applinks: {details: Array<{components: Array<{'/': string}>}>};
    };
    expect(body.applinks.details[0]?.components.map((component) => component['/'])).toEqual(
      expect.arrayContaining(['/a/*', '/i/*', '/sports/*', '/stats/*']),
    );
    const netlify = readFileSync(join(process.cwd(), 'netlify.toml'), 'utf8');
    expect(netlify).toMatch(/from = "\/\*"\s+to = "\/index\.html"\s+status = 200/);
  });

  it('keeps /a/* clip-first: excluded from the app, first in order, with /app/* claimed', () => {
    const body = JSON.parse(readFileSync(file, 'utf8')) as {
      applinks: {details: Array<{components: Array<{'/': string; exclude?: boolean}>}>};
    };
    const components = body.applinks.details[0]?.components ?? [];
    expect(components[0]).toMatchObject({'/': '/a/*', exclude: true});
    expect(components.filter((component) => component['/'] === '/a/*')).toHaveLength(1);
    expect(components.find((component) => component['/'] === '/app/*')?.exclude).toBeUndefined();
  });

  it('keeps the existing application/json header for the extensionless path', () => {
    const netlify = readFileSync(join(process.cwd(), 'netlify.toml'), 'utf8');
    expect(netlifyContentType(netlify, AASA_URL_PATH)).toBe('application/json');
    const deploy = readFileSync(join(process.cwd(), 'scripts/deploy-app-origin.mjs'), 'utf8');
    const stamp = deploy.indexOf('`${distDir}/.well-known/apple-app-site-association`');
    expect(stamp).toBeGreaterThanOrEqual(0);
    expect(deploy.slice(stamp, stamp + 400)).toContain('"application/json"');
  });

  it('fetches the extensionless file as json with no redirect', async () => {
    const body = readFileSync(file);
    const contentType = netlifyContentType(
      readFileSync(join(process.cwd(), 'netlify.toml'), 'utf8'),
      AASA_URL_PATH,
    );
    const server = createServer((request, response) => {
      const url = request.url?.split('?')[0];
      if (url !== AASA_URL_PATH) {
        response.writeHead(404).end();
        return;
      }
      response.writeHead(200, {'content-type': contentType});
      response.end(body);
    });
    await new Promise<void>((resolve) => {
      server.listen(0, '127.0.0.1', () => resolve());
    });
    const address = server.address();
    const port = typeof address === 'object' && address ? address.port : 0;
    try {
      const response = await new Promise<{
        status: number;
        location: string | undefined;
        contentType: string | undefined;
        body: string;
      }>((resolve, reject) => {
        const req = httpRequest(
          {hostname: '127.0.0.1', port, path: AASA_URL_PATH, method: 'GET'},
          (res) => {
            const chunks: Buffer[] = [];
            res.on('data', (chunk: Buffer) => chunks.push(chunk));
            res.on('end', () => {
              resolve({
                status: res.statusCode ?? 0,
                location: res.headers.location,
                contentType: res.headers['content-type'],
                body: Buffer.concat(chunks).toString('utf8'),
              });
            });
          },
        );
        req.on('error', reject);
        req.end();
      });
      expect(response.status).toBe(200);
      expect(response.location).toBeUndefined();
      expect(response.contentType).toBe('application/json');
      const json = JSON.parse(response.body) as {appclips: {apps: string[]}};
      expect(json.appclips.apps).toEqual([CLIP_ID]);
    } finally {
      await new Promise<void>((resolve, reject) => {
        server.close((error) => (error ? reject(error) : resolve()));
      });
    }
  });
});
