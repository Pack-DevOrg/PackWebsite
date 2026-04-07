export default {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
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
    '\\.(css|less|scss|sass)$': '<rootDir>/src/__mocks__/styleMock.js',
    '\\.md\\?raw$': '<rootDir>/src/__mocks__/rawTextMock.js',
    '\\.(jpg|jpeg|png|gif|webp|svg)$': '<rootDir>/src/__mocks__/fileMock.js',
  },
  transform: {
    '^.+\\.(ts|tsx|js|jsx)$': ['ts-jest', {
      useESM: true,
    }],
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
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
