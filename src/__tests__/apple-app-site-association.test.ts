import {createServer, request as httpRequest} from 'http';
import {readFileSync} from 'fs';
import {join} from 'path';

const AASA_URL_PATH = '/.well-known/apple-app-site-association';
const APP_ID = 'GW8YNJQZCK.com.packai.app';
const CLIP_ID = `${APP_ID}.Clip`;

function loadCloudFrontHandler(relativePath: string) {
  const source = readFileSync(join(process.cwd(), relativePath), 'utf8');
  return new Function(`${source}; return handler;`)() as (event: {
    request: {
      uri: string;
      headers?: {host?: {value: string}};
      querystring?: Record<string, never>;
    };
    response?: {headers: Record<string, {value?: string}>};
  }) => {
    statusCode?: number;
    uri?: string;
    headers?: Record<string, {value?: string}>;
  };
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

  it('is served as application/json with no extension rewrite', () => {
    const headers = readFileSync(join(process.cwd(), 'public/_headers'), 'utf8');
    expect(headers).toContain(
      '/.well-known/apple-app-site-association\n  Content-Type: application/json\n',
    );
    const redirects = readFileSync(join(process.cwd(), 'public/_redirects'), 'utf8');
    const keep = redirects.indexOf(
      '/.well-known/apple-app-site-association /.well-known/apple-app-site-association 200',
    );
    const spa = redirects.indexOf('/* /index.html 200');
    expect(keep).toBeGreaterThanOrEqual(0);
    expect(keep).toBeLessThan(spa);
    const netlify = readFileSync(join(process.cwd(), 'netlify.toml'), 'utf8');
    expect(netlify).toContain('for = "/.well-known/apple-app-site-association"');
    expect(netlify).toContain('Content-Type = "application/json"');
    const deploy = readFileSync(join(process.cwd(), 'scripts/deploy-app-origin.mjs'), 'utf8');
    expect(deploy).toContain('`${distDir}/.well-known/apple-app-site-association`');
    expect(deploy).toContain('"application/json"');
  });

  it('does not redirect apex or www and stamps application/json at the edge', () => {
    const onRequest = loadCloudFrontHandler('scripts/cloudfront/app-origin-viewer-request.js');
    const onResponse = loadCloudFrontHandler('scripts/cloudfront/app-origin-viewer-response.js');
    for (const host of ['trypackai.com', 'www.trypackai.com']) {
      const out = onRequest({
        request: {
          uri: AASA_URL_PATH,
          headers: {host: {value: host}},
          querystring: {},
        },
      });
      expect(out.statusCode).toBeUndefined();
      expect(out.uri).toBe(AASA_URL_PATH);
    }
    const response = onResponse({
      request: {uri: AASA_URL_PATH},
      response: {headers: {}},
    });
    expect(response.headers?.['content-type']?.value).toBe('application/json');
  });

  it('fetches the extensionless file as json with no redirect', async () => {
    const body = readFileSync(file);
    const headerText = readFileSync(join(process.cwd(), 'public/_headers'), 'utf8');
    let section = '';
    let contentType = '';
    for (const line of headerText.split('\n')) {
      if (line.length > 0 && !line.startsWith(' ') && !line.startsWith('\t') && !line.startsWith('#')) {
        section = line.trim();
        continue;
      }
      if (section !== AASA_URL_PATH) {
        continue;
      }
      const match = line.match(/^\s*Content-Type:\s*(\S+)/);
      if (match?.[1]) {
        contentType = match[1];
      }
    }
    const server = createServer((request, response) => {
      const url = request.url?.split('?')[0];
      if (url !== AASA_URL_PATH) {
        response.writeHead(404).end();
        return;
      }
      response.writeHead(200, {
        'content-type': contentType,
      });
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
