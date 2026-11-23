import { webcrypto } from 'node:crypto';
import React from 'react';
import { act, render, waitFor } from '@testing-library/react';
import {
  consumeOnboardConnectionsReturn,
  markOnboardConnectionsReturn,
  pendingMatchesCallback,
  readConnectedMailboxSnapshot,
  startGoogleAccountConnect,
  writeConnectedMailboxSnapshot,
} from './accountConnect';
import { AuthProvider, useAuth } from './AuthContext';
import * as cognito from './cognito';
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

function makeIdToken(claims: Record<string, unknown>): string {
  const encode = (obj: unknown) =>
    Buffer.from(JSON.stringify(obj))
      .toString('base64')
      .replaceAll('+', '-')
      .replaceAll('/', '_')
      .replaceAll('=', '');
  return `${encode({ alg: 'none', typ: 'JWT' })}.${encode(claims)}.sig`;
}

const SESSION_STORAGE_KEY = 'pack.auth.session.v1';
const PKCE_STORAGE_KEY = 'pack.auth.pkce.v1';

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

  it('stores pending pkce in sessionStorage and the shared cookie only', () => {
    const pending = {
      state: 'oauth-state',
      verifier: 'pkce-verifier',
      createdAt: Date.now(),
      redirectPath: '/app',
      redirectUri: 'https://trypackai.com/auth/callback',
    };

    storePendingPkce(pending);

    expect(window.sessionStorage.getItem(PKCE_STORAGE_KEY)).toBeTruthy();
    expect(window.localStorage.getItem(PKCE_STORAGE_KEY)).toBeNull();
    expect(document.cookie).toContain('pack.auth.pkce.shared.v1=');
  });

  it('loads pending pkce from localStorage fallback and restores sessionStorage copy', () => {
    const pending = {
      state: 'oauth-state',
      verifier: 'pkce-verifier',
      createdAt: Date.now(),
      redirectPath: '/app',
      redirectUri: 'https://trypackai.com/auth/callback',
    };

    window.localStorage.setItem(PKCE_STORAGE_KEY, JSON.stringify(pending));

    expect(getPendingPkce()).toEqual(pending);
    expect(window.sessionStorage.getItem(PKCE_STORAGE_KEY)).toBeTruthy();
    expect(window.localStorage.getItem(PKCE_STORAGE_KEY)).toBeNull();
  });

  it('loads pending pkce from the shared cookie fallback', () => {
    const pending = {
      state: 'oauth-state',
      verifier: 'pkce-verifier',
      createdAt: Date.now(),
      redirectPath: 'https://trypackai.com/tsa?forceModal=1',
      redirectUri: 'https://trypackai.com/auth/callback',
    };

    document.cookie = `pack.auth.pkce.shared.v1=${encodeURIComponent(JSON.stringify(pending))}; path=/`;

    expect(getPendingPkce()).toEqual(pending);
    expect(window.sessionStorage.getItem(PKCE_STORAGE_KEY)).toBeTruthy();
    expect(window.localStorage.getItem(PKCE_STORAGE_KEY)).toBeNull();
  });

  it('clears pending pkce from both storage areas', () => {
    const pending = {
      state: 'oauth-state',
      verifier: 'pkce-verifier',
      createdAt: Date.now(),
      redirectPath: '/app',
      redirectUri: 'https://trypackai.com/auth/callback',
    };

    window.sessionStorage.setItem(PKCE_STORAGE_KEY, JSON.stringify(pending));
    window.localStorage.setItem(PKCE_STORAGE_KEY, JSON.stringify(pending));

    clearPendingPkce();

    expect(window.sessionStorage.getItem(PKCE_STORAGE_KEY)).toBeNull();
    expect(window.localStorage.getItem(PKCE_STORAGE_KEY)).toBeNull();
    expect(document.cookie).not.toContain('pack.auth.pkce.shared.v1=');
  });

  it('clears accountConnect pending state, connected mailbox snapshots, and return flags on clearSession', () => {
    const authUrl = new URL(startGoogleAccountConnect('user-a'));
    const state = authUrl.searchParams.get('state')!;
    writeConnectedMailboxSnapshot('user-a', {
      googleEmail: 'alice@gmail.com',
      microsoftEmail: null,
    });
    markOnboardConnectionsReturn('user-a');

    clearSession();

    expect(pendingMatchesCallback('google', state, 'user-a')).toBeNull();
    expect(readConnectedMailboxSnapshot('user-a')).toEqual({
      googleEmail: null,
      microsoftEmail: null,
    });
    expect(consumeOnboardConnectionsReturn('user-a')).toBe(false);
  });

  it('AuthProvider preserves mailbox snapshot on same-user token refresh and fresh post-logout sign-in, while clearing on user switch from both hydrated and login-applied sessions', async () => {
    const userAToken = makeIdToken({ sub: 'user-a', email: 'alice@trypackai.com' });
    const userBToken = makeIdToken({ sub: 'user-b', email: 'bob@trypackai.com' });
    const userCToken = makeIdToken({ sub: 'user-c', email: 'carol@trypackai.com' });
    const noSubToken = makeIdToken({ email: 'nosub@trypackai.com' });

    // Case 1: Hydrated session on mount (no refreshNow) -> direct completeLogin switch to user-b clears user-a state
    await persistSession({
      tokens: {
        accessToken: 'access-a',
        idToken: userAToken,
        refreshToken: 'refresh-a',
        tokenType: 'Bearer',
        issuedAt: Date.now(),
        accessTokenExpiresAt: Date.now() + 3_600_000,
        refreshTokenExpiresAt: Date.now() + 86_400_000,
      },
    });

    const refreshSpy = jest
      .spyOn(cognito, 'refreshTokens')
      .mockResolvedValue({
        accessToken: 'access-b-refreshed',
        idToken: userBToken,
        refreshToken: 'refresh-b',
        tokenType: 'Bearer',
        expiresIn: 3600,
        issuedAt: Date.now(),
      });
    const completeLoginSpy = jest
      .spyOn(cognito, 'completeLogin')
      .mockResolvedValue({
        tokenSet: {
          accessToken: 'access-b',
          idToken: userBToken,
          refreshToken: 'refresh-b',
          tokenType: 'Bearer',
          expiresIn: 3600,
          issuedAt: Date.now(),
        },
        redirectPath: '/onboard',
      });

    let latestAuth!: ReturnType<typeof useAuth>;
    function Probe() {
      latestAuth = useAuth();
      return null;
    }

    try {
      const view = render(
        React.createElement(AuthProvider, null, React.createElement(Probe)),
      );

      await waitFor(() => {
        expect(latestAuth.status).toBe('authenticated');
        expect(latestAuth.user?.sub).toBe('user-a');
      });

      const aliceState = new URL(
        startGoogleAccountConnect('user-a'),
      ).searchParams.get('state')!;
      writeConnectedMailboxSnapshot('user-a', {
        googleEmail: 'alice@gmail.com',
        microsoftEmail: null,
      });

      // Immediate completeLogin switch from hydrated user-a to user-b clears user-a's state
      await act(async () => {
        await latestAuth.completeLogin('code-b', 'state-b');
      });
      expect(latestAuth.user?.sub).toBe('user-b');
      expect(readConnectedMailboxSnapshot('user-a')).toEqual({
        googleEmail: null,
        microsoftEmail: null,
      });
      expect(pendingMatchesCallback('google', aliceState, 'user-a')).toBeNull();

      // Same-user token refresh for user-b preserves user-b's state
      writeConnectedMailboxSnapshot('user-b', {
        googleEmail: null,
        microsoftEmail: 'bob@outlook.com',
      });
      await act(async () => {
        await latestAuth.getAccessToken({ forceRefresh: true });
      });
      expect(readConnectedMailboxSnapshot('user-b')).toEqual({
        googleEmail: null,
        microsoftEmail: 'bob@outlook.com',
      });

      // Case 2: Login-applied user-b -> direct completeLogin switch to user-c clears user-b's state
      completeLoginSpy.mockResolvedValueOnce({
        tokenSet: {
          accessToken: 'access-c',
          idToken: userCToken,
          refreshToken: 'refresh-c',
          tokenType: 'Bearer',
          expiresIn: 3600,
          issuedAt: Date.now(),
        },
        redirectPath: '/onboard',
      });
      await act(async () => {
        await latestAuth.completeLogin('code-c', 'state-c');
      });
      expect(latestAuth.user?.sub).toBe('user-c');
      expect(readConnectedMailboxSnapshot('user-b')).toEqual({
        googleEmail: null,
        microsoftEmail: null,
      });

      // Case 3: Logout resets activeUserSubRef to null, so a fresh sign-in afterwards does not treat null -> user-a as a cross-user wipe
      await act(async () => {
        await latestAuth.logout({ redirect: false });
      });
      expect(latestAuth.status).toBe('unauthenticated');
      expect(latestAuth.user).toBeNull();

      writeConnectedMailboxSnapshot('user-a', {
        googleEmail: 'pre-seeded-alice@gmail.com',
        microsoftEmail: null,
      });
      completeLoginSpy.mockResolvedValueOnce({
        tokenSet: {
          accessToken: 'access-a-2',
          idToken: userAToken,
          refreshToken: 'refresh-a-2',
          tokenType: 'Bearer',
          expiresIn: 3600,
          issuedAt: Date.now(),
        },
        redirectPath: '/onboard',
      });
      await act(async () => {
        await latestAuth.completeLogin('code-a', 'state-a');
      });
      expect(latestAuth.user?.sub).toBe('user-a');
      expect(readConnectedMailboxSnapshot('user-a')).toEqual({
        googleEmail: 'pre-seeded-alice@gmail.com',
        microsoftEmail: null,
      });

      // Case 4: Switching from user-a to a token lacking sub sets user to null and clears user-a's state
      completeLoginSpy.mockResolvedValueOnce({
        tokenSet: {
          accessToken: 'access-nosub',
          idToken: noSubToken,
          refreshToken: 'refresh-nosub',
          tokenType: 'Bearer',
          expiresIn: 3600,
          issuedAt: Date.now(),
        },
        redirectPath: '/',
      });
      await act(async () => {
        await latestAuth.completeLogin('code-nosub', 'state-nosub');
      });
      expect(latestAuth.user).toBeNull();
      expect(readConnectedMailboxSnapshot('user-a')).toEqual({
        googleEmail: null,
        microsoftEmail: null,
      });

      view.unmount();

      // Case 5: Hydrating a stored session whose idToken lacks sub sets activeUserSubRef to null cleanly
      await persistSession({
        tokens: {
          accessToken: 'access-nosub-stored',
          idToken: noSubToken,
          refreshToken: 'refresh-nosub-stored',
          tokenType: 'Bearer',
          issuedAt: Date.now(),
          accessTokenExpiresAt: Date.now() + 3_600_000,
          refreshTokenExpiresAt: Date.now() + 86_400_000,
        },
      });
      render(React.createElement(AuthProvider, null, React.createElement(Probe)));
      await waitFor(() => {
        expect(latestAuth.status).toBe('authenticated');
        expect(latestAuth.user).toBeNull();
      });
    } finally {
      refreshSpy.mockRestore();
      completeLoginSpy.mockRestore();
    }
  });
});
