import { webcrypto } from 'node:crypto';
import {
  clearPendingPkce,
  clearSession,
  getPendingPkce,
  hasAuthSessionHint,
  loadSession,
  persistSession,
  storePendingPkce,
} from './tokenStorage';
import type { AuthSession } from './types';

const SESSION_STORAGE_KEY = 'doneai.auth.session.v1';
const PKCE_STORAGE_KEY = 'doneai.auth.pkce.v1';

const buildSession = (): AuthSession => ({
  tokens: {
    accessToken: 'access-token',
    idToken: 'id-token',
    refreshToken: 'refresh-token',
    tokenType: 'Bearer',
    issuedAt: Date.now(),
    accessTokenExpiresAt: Date.now() + 3_600_000,
    refreshTokenExpiresAt: Date.now() + 86_400_000,
  },
});

describe('tokenStorage', () => {
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
    window.localStorage.clear();
  });

  it('persists auth session in sessionStorage and not localStorage', async () => {
    const session = buildSession();
    await persistSession(session);

    const sessionRaw = window.sessionStorage.getItem(SESSION_STORAGE_KEY);
    const localRaw = window.localStorage.getItem(SESSION_STORAGE_KEY);

    expect(sessionRaw).toBeTruthy();
    expect(localRaw).toBeNull();
    expect(hasAuthSessionHint()).toBe(true);
  });

  it('loads auth session from encrypted sessionStorage', async () => {
    const session = buildSession();
    await persistSession(session);

    await expect(loadSession()).resolves.toEqual(session);
  });

  it('migrates legacy localStorage session into sessionStorage', async () => {
    const session = buildSession();
    window.localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));

    const loaded = await loadSession();

    expect(loaded).toEqual(session);
    expect(window.sessionStorage.getItem(SESSION_STORAGE_KEY)).toBeTruthy();
    expect(window.localStorage.getItem(SESSION_STORAGE_KEY)).toBeNull();
  });

  it('clears session from both sessionStorage and localStorage', () => {
    const session = buildSession();
    window.sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
    window.localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));

    clearSession();

    expect(window.sessionStorage.getItem(SESSION_STORAGE_KEY)).toBeNull();
    expect(window.localStorage.getItem(SESSION_STORAGE_KEY)).toBeNull();
    expect(hasAuthSessionHint()).toBe(false);
  });

  it('stores pending pkce in both sessionStorage and localStorage', () => {
    const pending = {
      state: 'oauth-state',
      verifier: 'pkce-verifier',
      createdAt: Date.now(),
      redirectPath: '/app',
      redirectUri: 'https://itsdoneai.com/auth/callback',
    };

    storePendingPkce(pending);

    expect(window.sessionStorage.getItem(PKCE_STORAGE_KEY)).toBeTruthy();
    expect(window.localStorage.getItem(PKCE_STORAGE_KEY)).toBeTruthy();
    expect(document.cookie).toContain('doneai.auth.pkce.shared.v1=');
  });

  it('loads pending pkce from localStorage fallback and restores sessionStorage copy', () => {
    const pending = {
      state: 'oauth-state',
      verifier: 'pkce-verifier',
      createdAt: Date.now(),
      redirectPath: '/app',
      redirectUri: 'https://itsdoneai.com/auth/callback',
    };

    window.localStorage.setItem(PKCE_STORAGE_KEY, JSON.stringify(pending));

    expect(getPendingPkce()).toEqual(pending);
    expect(window.sessionStorage.getItem(PKCE_STORAGE_KEY)).toBeTruthy();
  });

  it('loads pending pkce from the shared cookie fallback', () => {
    const pending = {
      state: 'oauth-state',
      verifier: 'pkce-verifier',
      createdAt: Date.now(),
      redirectPath: 'https://itsdoneai.com/tsa?forceModal=1',
      redirectUri: 'https://itsdoneai.com/auth/callback',
    };

    document.cookie = `doneai.auth.pkce.shared.v1=${encodeURIComponent(JSON.stringify(pending))}; path=/`;

    expect(getPendingPkce()).toEqual(pending);
    expect(window.sessionStorage.getItem(PKCE_STORAGE_KEY)).toBeTruthy();
    expect(window.localStorage.getItem(PKCE_STORAGE_KEY)).toBeTruthy();
  });

  it('clears pending pkce from both storage areas', () => {
    const pending = {
      state: 'oauth-state',
      verifier: 'pkce-verifier',
      createdAt: Date.now(),
      redirectPath: '/app',
      redirectUri: 'https://itsdoneai.com/auth/callback',
    };

    window.sessionStorage.setItem(PKCE_STORAGE_KEY, JSON.stringify(pending));
    window.localStorage.setItem(PKCE_STORAGE_KEY, JSON.stringify(pending));

    clearPendingPkce();

    expect(window.sessionStorage.getItem(PKCE_STORAGE_KEY)).toBeNull();
    expect(window.localStorage.getItem(PKCE_STORAGE_KEY)).toBeNull();
    expect(document.cookie).not.toContain('doneai.auth.pkce.shared.v1=');
  });
});
