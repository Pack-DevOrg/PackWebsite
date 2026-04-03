export type ViteEnv = Record<string, unknown> & {
  DEV?: boolean;
};

declare const __APP_ENV__: string | ViteEnv | undefined;

const resolveViteEnv = (): ViteEnv | undefined => {
  if (typeof __APP_ENV__ !== 'undefined') {
    if (typeof __APP_ENV__ === 'string') {
      try {
        return JSON.parse(__APP_ENV__) as ViteEnv;
      } catch (error) {
        return undefined;
      }
    }
    return __APP_ENV__;
  }

  try {
    // Fallback for tooling that still expects import.meta evaluation
    const fn = new Function(
      'return typeof import.meta !== "undefined" && import.meta.env ? import.meta.env : undefined;',
    );
    return fn() as ViteEnv | undefined;
  } catch {
    return undefined;
  }
};

const getEnv = (): ViteEnv => {
  const viteEnv = resolveViteEnv();
  if (viteEnv) {
    return viteEnv;
  }

  if (typeof globalThis !== 'undefined') {
    const testEnv = (globalThis as { __TEST_ENV__?: ViteEnv }).__TEST_ENV__;
    if (testEnv) {
      return testEnv as ViteEnv;
    }
  }

  return {};
};

export const env = getEnv();
