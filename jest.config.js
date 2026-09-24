import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const rootDir = path.dirname(fileURLToPath(import.meta.url));

function packAppRoot() {
  const candidates = [
    path.join(rootDir, '..', 'PackApp'),
    path.join(rootDir, '..', '..', 'PackApp'),
  ];
  return (
    candidates.find((dir) =>
      fs.existsSync(
        path.join(dir, 'src', 'components', 'onboarding', 'OnboardingComponents.tsx'),
      ),
    ) ?? candidates[candidates.length - 1]
  );
}

const appRoot = packAppRoot();
const appIconsDir = path.join(appRoot, 'src', 'icons', 'svg');
const appOnboardingComponents = path.join(
  appRoot,
  'src',
  'components',
  'onboarding',
  'OnboardingComponents.tsx',
);
const appRuntimeStub = path.join(rootDir, 'src', 'onboarding', 'packAppIconPropsStub.ts');
const appLinearGradient = path.join(
  appRoot,
  'node_modules/expo-linear-gradient/build/LinearGradient.js',
);
const appSafeArea = path.join(
  appRoot,
  'node_modules/react-native-safe-area-context/lib/module/index.js',
);
const svgModule = [
  path.join(rootDir, 'node_modules/react-native-svg/lib/module/index.js'),
  path.join(rootDir, '..', 'node_modules/react-native-svg/lib/module/index.js'),
  path.join(rootDir, '..', '..', 'node_modules/react-native-svg/lib/module/index.js'),
].find((candidate) => fs.existsSync(candidate));

export default {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  resolver: '<rootDir>/scripts/jest-web-resolver.cjs',
  moduleNameMapper: {
    '\\.(css|less|scss|sass)$': '<rootDir>/src/__mocks__/styleMock.js',
    '\\.md\\?raw$': '<rootDir>/src/__mocks__/rawTextMock.js',
    '\\.(jpg|jpeg|png|gif|webp|svg)$': '<rootDir>/src/__mocks__/fileMock.js',
    '^@pack/ui-primitives$': '<rootDir>/packages/ui-primitives/src/index.ts',
    '^@pack/ui-primitives/(.*)$': '<rootDir>/packages/ui-primitives/src/$1',
    '^pack-app/icons/svg/(.*)$': `${appIconsDir}/$1`,
    '^pack-app/components/onboarding/OnboardingComponents$': appOnboardingComponents,
    '^expo-linear-gradient$': appLinearGradient,
    '^react-native-safe-area-context$': appSafeArea,
    '^react-native-svg$': svgModule,
    '^react-native-reanimated$': appRuntimeStub,
    '^@react-navigation/native$': appRuntimeStub,
    '^react-native$': '<rootDir>/node_modules/react-native-web',
    // Vendored web effects: mock in jest. The real builds touch browser-only
    // APIs (matchMedia, canvas) that jsdom provides inconsistently across
    // suites, and resolving them through the workspace symlink pulls the
    // repo-root react (invalid hook calls). Real components are covered by
    // the browser preview and the SSR prerender build.
    '^@pack/web-effects/.*$': '<rootDir>/src/__mocks__/webEffectsMock.tsx',
    // PackWebsite is part of a workspace and some deps may be hoisted to the repo root.
    // Prefer the website-local React copy so React + renderer resolve consistently (avoids invalid hook calls when the
    // root workspace pulls a different React major version).
    '^react$': '<rootDir>/node_modules/react/index.js',
    '^react/jsx-runtime$': '<rootDir>/node_modules/react/jsx-runtime.js',
    '^react/jsx-dev-runtime$': '<rootDir>/node_modules/react/jsx-dev-runtime.js',
    '^react-dom$': '<rootDir>/node_modules/react-dom/index.js',
    '^react-dom/client$': '<rootDir>/node_modules/react-dom/client.js',
    '^react-dom/server$': '<rootDir>/node_modules/react-dom/server.js',
    '^react-dom/test-utils$': '<rootDir>/node_modules/react-dom/test-utils.js',
    '^react-dom/(.*)$': '<rootDir>/node_modules/react-dom/$1',
  },
  transform: {
    '^.+\\.(ts|tsx|js|jsx)$': ['ts-jest', {
      useESM: true,
    }],
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  transformIgnorePatterns: [
    '/node_modules/(?!(expo-linear-gradient|react-native-svg|react-native-safe-area-context)/)',
  ],
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.ts'],
  testMatch: ['<rootDir>/src/**/*.test.(ts|tsx|js|jsx)'],
  extensionsToTreatAsEsm: ['.ts', '.tsx'],
  globals: {
    'ts-jest': {
      useESM: true,
      tsconfig: './tsconfig.app.json',
    },
  },
  
  // Performance optimizations
  maxWorkers: '50%',
  cache: true,
  watchman: false,
  bail: 1, // Stop on first failure
  testTimeout: 10000,
  verbose: false,
  detectOpenHandles: false,
  forceExit: false,
};
