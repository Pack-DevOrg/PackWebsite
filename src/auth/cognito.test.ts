import { webcrypto } from 'node:crypto';
import { appConfig } from '@/config/appConfig';
import { TokenProvider } from '@/schemas/common';
import { initiateLogin } from './cognito';

type HostedUiIdentityProvider =
  | typeof TokenProvider.Google
  | typeof TokenProvider.Apple;

type LoginCall = Parameters<typeof initiateLogin>[0] & {
  readonly identityProvider?: HostedUiIdentityProvider;
};

const loginWith = (options?: LoginCall) =>
  initiateLogin(options as Parameters<typeof initiateLogin>[0]);

type LocationAssignImpl = {
  assign: (url: string) => void;
};

const jsdomLocationImpl = (): LocationAssignImpl => {
  const implSymbol = Object.getOwnPropertySymbols(window.location).find(
    (symbol) => String(symbol) === 'Symbol(impl)'
  );
  if (!implSymbol) {
    throw new Error('jsdom Location impl symbol missing');
  }
  return (window.location as unknown as Record<symbol, LocationAssignImpl>)[
    implSymbol
  ];
};

const assignedAuthorizeUrl = (assign: jest.Mock): URL => {
  expect(assign).toHaveBeenCalledTimes(1);
  const assigned = assign.mock.calls[0]?.[0];
  expect(typeof assigned).toBe('string');
  return new URL(assigned as string);
};

describe('initiateLogin hosted-UI identity_provider', () => {
  let assign: jest.Mock;

  beforeEach(() => {
    Object.defineProperty(globalThis, 'crypto', {
      value: webcrypto,
      configurable: true,
    });
    Object.defineProperty(globalThis, 'CryptoKey', {
      value: webcrypto.CryptoKey,
      configurable: true,
    });
    Object.defineProperty(window, 'crypto', {
      value: webcrypto,
      configurable: true,
    });
    Object.defineProperty(window, 'CryptoKey', {
      value: webcrypto.CryptoKey,
      configurable: true,
    });
    window.sessionStorage.clear();
    assign = jest.fn();
    expect(new URL(window.location.href).hostname).toMatch(
      /^(localhost|127\.0\.0\.1)$/i
    );
    // jsdom Location.assign is non-configurable; stub the impl the wrapper calls.
    jsdomLocationImpl().assign = (url: string) => {
      assign(url);
    };
  });

  it('omitted identityProvider keeps Google on the hosted-UI authorize URL', async () => {
    await loginWith();

    const url = assignedAuthorizeUrl(assign);
    expect(url.origin).toBe(new URL(appConfig.cognitoDomain).origin);
    expect(url.pathname).toBe('/oauth2/authorize');
    expect(url.searchParams.get('identity_provider')).toBe(TokenProvider.Google);
  });

  it('explicit Google sets identity_provider=Google', async () => {
    await loginWith({ identityProvider: TokenProvider.Google });

    const url = assignedAuthorizeUrl(assign);
    expect(url.origin).toBe(new URL(appConfig.cognitoDomain).origin);
    expect(url.pathname).toBe('/oauth2/authorize');
    expect(url.searchParams.get('identity_provider')).toBe(TokenProvider.Google);
  });

  it('SignInWithApple sets identity_provider=SignInWithApple', async () => {
    await loginWith({ identityProvider: TokenProvider.Apple });

    const url = assignedAuthorizeUrl(assign);
    expect(url.origin).toBe(new URL(appConfig.cognitoDomain).origin);
    expect(url.pathname).toBe('/oauth2/authorize');
    expect(url.searchParams.get('identity_provider')).toBe(
      TokenProvider.Apple
    );
  });
});
