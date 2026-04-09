import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { imagetools } from 'vite-imagetools';
import {execFileSync} from 'node:child_process';
import {createHmac} from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const rootDir = fileURLToPath(new URL('.', import.meta.url));
const srcDir = path.join(rootDir, 'src');
const repoRootDir = path.join(rootDir, '..');
const packSchemasDir = path.join(rootDir, 'src/schemas');
const normalizePath = (uri: string) => uri.replace(/\\/g, '/');
const localNodeModules = path.join(rootDir, 'node_modules');
const resolveModuleDir = (moduleName: string): string => {
  const localModuleDir = path.join(localNodeModules, moduleName);
  if (fs.existsSync(localModuleDir)) {
    return localModuleDir;
  }

  return path.join(repoRootDir, 'node_modules', moduleName);
};
// Force one React runtime across this monorepo workspace to avoid mixed
// React element objects during SSR/SSG (website package currently has
// dependencies that resolve to root React 19).
const reactModuleDir = resolveModuleDir('react');
const reactDomModuleDir = resolveModuleDir('react-dom');
const styledComponentsModuleDir = resolveModuleDir('styled-components');
const reactDomClientEntry = path.join(reactDomModuleDir, 'client');
const reactDomServerEntry = path.join(reactDomModuleDir, 'server');
const reactJsxRuntimeEntry = path.join(reactModuleDir, 'jsx-runtime.js');
const reactJsxDevRuntimeEntry = path.join(reactModuleDir, 'jsx-dev-runtime.js');
const zodModuleDir = resolveModuleDir('zod');
const AWS_REGION = 'us-east-1';
const LEGACY_SERVER_STACK_PREFIX = 'doneaiserver-';
const TSA_BOARD_STACK_OUTPUT_KEY = 'AirportWaitTimePublicBoardUrl';

function isUsablePublicTsaBoardUrl(
  candidateUrl: string,
  environment: 'dev' | 'prod',
): boolean {
  try {
    const parsedUrl = new URL(candidateUrl);
    const hostname = parsedUrl.hostname.trim().toLowerCase();

    if (environment === 'prod' && hostname.endsWith('.cloudfront.net')) {
      return false;
    }

    return true;
  } catch {
    return false;
  }
}

const getLocalDevBypassAction = (requestPath: string): string | null => {
  // Mirror the backend's action-specific HMAC contract so localhost testing can
  // bypass third-party bot checks without weakening deployed environments.
  if (requestPath.startsWith('/dev/airport-security/public-current')) {
    return 'tsa_wait_times_public_lookup';
  }

  if (requestPath === '/dev/privacy/requests' || requestPath.startsWith('/dev/privacy/requests?')) {
    return 'submit_privacy_request';
  }

  return null;
};

function inferServerEnvironment(
  viteEnv: Record<string, string>,
  mode: string,
): 'dev' | 'prod' | null {
  const candidates = [
    viteEnv.VITE_API_BASE_URL,
    viteEnv.VITE_API_ENDPOINT,
    viteEnv.VITE_VERIFY_ENDPOINT,
  ];

  for (const candidate of candidates) {
    if (typeof candidate !== 'string' || candidate.length === 0) {
      continue;
    }

    if (candidate.includes('/dev')) {
      return 'dev';
    }

    if (candidate.includes('/prod')) {
      return 'prod';
    }
  }

  if (mode === 'development') {
    return 'dev';
  }

  if (mode === 'production') {
    return 'prod';
  }

  return null;
}

function resolvePublicTsaBoardUrlFromStack(
  viteEnv: Record<string, string>,
  mode: string,
): string {
  const explicitUrl = viteEnv.VITE_PUBLIC_TSA_BOARD_URL?.trim();
  if (explicitUrl && explicitUrl.length > 0) {
    const environment = inferServerEnvironment(viteEnv, mode);
    if (!environment || !isUsablePublicTsaBoardUrl(explicitUrl, environment)) {
      return '';
    }

    return explicitUrl;
  }

  const environment = inferServerEnvironment(viteEnv, mode);
  if (!environment) {
    return '';
  }

  try {
    const stackName = `${LEGACY_SERVER_STACK_PREFIX}${environment}`;
    const output = execFileSync(
      'aws',
      [
        'cloudformation',
        'describe-stacks',
        '--stack-name',
        stackName,
        '--region',
        AWS_REGION,
        '--query',
        `Stacks[0].Outputs[?OutputKey=='${TSA_BOARD_STACK_OUTPUT_KEY}'].OutputValue | [0]`,
        '--output',
        'text',
      ],
      {
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'ignore'],
      },
    ).trim();

    if (output === 'None' || !isUsablePublicTsaBoardUrl(output, environment)) {
      return '';
    }

    return output;
  } catch {
    return '';
  }
}

const shouldCompileWithReactCompiler = (filename?: string): boolean => {
  if (!filename) {
    return false;
  }

  const normalized = normalizePath(filename);
  const normalizedSrc = normalizePath(srcDir);

  if (!normalized.startsWith(normalizedSrc)) {
    return false;
  }

  if (normalized.includes('/__tests__/') || normalized.includes('/tests/')) {
    return false;
  }

  if (/\.(test|spec)\.(t|j)sx?$/i.test(normalized)) {
    return false;
  }

  return true;
};

// https://vitejs.dev/config/
export default defineConfig(({ mode, ssrBuild }) => {
  const isSSR = ssrBuild ?? process.argv.includes('--ssr');
  const viteEnv = loadEnv(mode, process.cwd(), 'VITE_');
  const publicTsaBoardUrl = resolvePublicTsaBoardUrlFromStack(viteEnv, mode);
  const allEnv = loadEnv(mode, process.cwd(), '');
  const localDevBypassSecret = allEnv.PACK_LOCAL_DEV_BYPASS_SECRET?.trim() ?? '';
  const babelPlugins: Array<
    | string
    | [string, Record<string, unknown>]
  > = [];

  if (!isSSR) {
    babelPlugins.push([
      'babel-plugin-react-compiler',
      {
        target: '18',
        sources: shouldCompileWithReactCompiler,
      },
    ]);
  }

  babelPlugins.push([
    'babel-plugin-styled-components',
    {
      ssr: true,
      displayName: mode !== 'production',
      minify: mode === 'production',
      pure: true,
    },
  ]);

  const manualChunks = isSSR
    ? undefined
    : (id: string) => {
        if (id.includes('node_modules/react/') ||
            id.includes('node_modules/react-dom/') ||
            id.includes('node_modules/react-router/') ||
            id.includes('node_modules/react-router-dom/')) {
          return 'react-vendor';
        }

        if (id.includes('node_modules/styled-components/')) {
          return 'ui-vendor';
        }

        if (id.includes('node_modules/lucide-react/')) {
          return 'utils-vendor';
        }

        if (id.includes('node_modules/@tanstack/react-query/')) {
          return 'query-vendor';
        }

        if (id.includes('node_modules/date-fns/')) {
          return 'date-vendor';
        }

        if (
          id.includes('node_modules/airports-json/') ||
          id.includes('node_modules/world-atlas/') ||
          id.includes('node_modules/us-atlas/') ||
          id.includes('node_modules/topojson-client/') ||
          id.includes('node_modules/d3-geo/')
        ) {
          return 'travel-map-vendor';
        }

        return undefined;
      };

  const rollupOutput = {
    assetFileNames: (assetInfo: { name: string }) => {
      const info = assetInfo.name.split('.');
      const ext = info[info.length - 1];
      if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(ext)) {
        return `assets/images/[name]-[hash][extname]`;
      }
      if (/css/i.test(ext)) {
        return `assets/css/[name]-[hash][extname]`;
      }
      return `assets/[name]-[hash][extname]`;
    },
    chunkFileNames: 'assets/js/[name]-[hash].js',
    entryFileNames: 'assets/js/[name]-[hash].js',
  } as const;

  if (manualChunks) {
    Object.assign(rollupOutput, { manualChunks });
  }

  const devProxy = {
    '/dev': {
      target: 'https://api.trypackai.com',
      changeOrigin: true,
      secure: true,
      configure: (proxy: {
        on: (
          event: 'proxyReq',
          handler: (
            proxyReq: {
              path?: string;
              setHeader(name: string, value: string): void;
            },
            req: {
              url?: string;
              headers: Record<string, string | string[] | undefined>;
            },
          ) => void,
        ) => void;
      }) => {
        proxy.on('proxyReq', (proxyReq, req) => {
          const requestPath = proxyReq.path ?? req.url ?? '';
          const bypassAction = getLocalDevBypassAction(requestPath);
          if (!bypassAction || localDevBypassSecret.length === 0) {
            return;
          }

          const originHeader = req.headers.origin;
          const hostHeader = req.headers.host;
          const inferredHost =
            typeof hostHeader === 'string'
              ? hostHeader
              : Array.isArray(hostHeader)
                ? hostHeader[0]
                : 'localhost:5173';
          const origin =
            typeof originHeader === 'string' && originHeader.length > 0
              ? originHeader
              : Array.isArray(originHeader) && typeof originHeader[0] === 'string'
                ? originHeader[0]
                : `http://${inferredHost}`;
          const timestamp = Date.now().toString();
          const payload = [origin, timestamp, bypassAction].join(':');
          const signature = createHmac('sha256', localDevBypassSecret)
            .update(payload)
            .digest('hex');

          proxyReq.setHeader('Origin', origin);
          proxyReq.setHeader('X-Pack-Client-Timestamp', timestamp);
          proxyReq.setHeader('X-Pack-Client-Integrity', signature);
        });
      },
    },
  };

  return {
    plugins: [
      react({
        babel: {
          plugins: babelPlugins,
        },
      }),
      imagetools(),
    ],
    // Use absolute root so assets resolve correctly for deep links (e.g., /share/*)
    base: '/',
    css: {
      postcss: {}, // Empty postcss config since we removed tailwind
    },
    resolve: {
      dedupe: ['react', 'react-dom', 'styled-components'],
      alias: {
        '@': normalizePath(srcDir),
        '@doneai/schemas': normalizePath(packSchemasDir),
        react: normalizePath(reactModuleDir),
        'react/jsx-runtime': normalizePath(reactJsxRuntimeEntry),
        'react/jsx-dev-runtime': normalizePath(reactJsxDevRuntimeEntry),
        'react-dom': normalizePath(reactDomModuleDir),
        'react-dom/client': normalizePath(reactDomClientEntry),
        'react-dom/server': normalizePath(reactDomServerEntry),
        'styled-components': normalizePath(styledComponentsModuleDir),
        zod: normalizePath(zodModuleDir),
      },
    },
    optimizeDeps: {
      include: ['react', 'react-dom', 'react-router-dom', 'styled-components', 'lucide-react', 'zod'],
      exclude: ['react-google-recaptcha', 'react-markdown'], // Load these dynamically
    },
    define: {
      __DEV__: mode === 'development',
      __APP_ENV__: JSON.stringify({
        ...viteEnv,
        ...(publicTsaBoardUrl.length > 0
          ? {VITE_PUBLIC_TSA_BOARD_URL: publicTsaBoardUrl}
          : {}),
        DEV: mode === 'development',
      }),
    },
    // Configure esbuild for modern browsers
    esbuild: {
      target: 'es2020',
      legalComments: 'none', // Remove license comments to reduce bundle size
    },
    // Configure build options for optimal performance
    build: {
      sourcemap: false,
      minify: 'terser',
      cssMinify: true,
      chunkSizeWarningLimit: 500,
      manifest: true,
      // Target modern browsers to reduce polyfills
      target: ['es2020', 'edge88', 'firefox78', 'chrome87', 'safari14'],
      rollupOptions: {
        output: rollupOutput,
      },
    },
    ssr: {
      noExternal: [
        'react',
        'react-dom',
        'react-dom/server',
        'react-router',
        'react-router-dom',
        'turbo-stream',
        '@tanstack/react-query',
        '@tanstack/react-query-devtools',
        'react-helmet-async',
        'styled-components',
        'lucide-react',
      ],
    },
    server: {
      fs: {
        allow: [
          normalizePath(rootDir),
          normalizePath(repoRootDir),
        ],
      },
      proxy: devProxy,
    },
  };
});
