declare module 'jest-axe' {
  export type AxeResults = unknown;

  export function axe(
    html: Element | Document | string,
    options?: Record<string, unknown>,
  ): Promise<AxeResults>;

  export const toHaveNoViolations: (results: AxeResults) => {
    pass: boolean;
    message: () => string;
  };
}

declare global {
  namespace jest {
    interface Matchers<R> {
      toHaveNoViolations(): R;
    }
  }
}

export {};

