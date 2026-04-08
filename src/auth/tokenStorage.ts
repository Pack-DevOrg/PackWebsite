import type { AuthSession, AuthTokens, PendingPkceSession } from "./types";
import { createEncryptedStorage } from "@/utils/encryptedBrowserStorage";
import { deleteCookie, getCookie, setCookie } from "@/utils/cookies";

const SESSION_STORAGE_KEY = "pack.auth.session.v1";
const LEGACY_LOCAL_STORAGE_KEY = "pack.auth.session.v1";
const PKCE_STORAGE_KEY = "pack.auth.pkce.v1";
const PKCE_COOKIE_KEY = "pack.auth.pkce.shared.v1";
const LOGOUT_INTENT_KEY = "pack.auth.logout.intent.v1";
const AUTH_RETRY_BLOCK_KEY = "pack.auth.retry.block.v1";
const AUTH_HINT_COOKIE_KEY = "pack.auth.hint.v1";
const PKCE_MAX_AGE_MS = 10 * 60 * 1000;

const isBrowser = typeof window !== "undefined";
const encryptedSessionStore = createEncryptedStorage({
  namespace: SESSION_STORAGE_KEY,
  area: "session",
});

const withStorage = <T>(fn: () => T): T | null => {
  if (!isBrowser) {
    return null;
  }
  try {
    return fn();
  } catch {
    return null;
  }
};

const parseSession = (raw: string | null): AuthSession | null => {
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as AuthSession & { tokens: AuthTokens };
    if (!parsed?.tokens?.accessToken || !parsed?.tokens?.refreshToken) {
      return null;
    }
    return { tokens: parsed.tokens };
  } catch {
    return null;
  }
};

const getCrossSubdomainCookieDomain = (): string | undefined => {
  if (!isBrowser) {
    return undefined;
  }

  const hostname = window.location.hostname.toLowerCase();
  if (hostname === "trypackai.com" || hostname.endsWith(".trypackai.com")) {
    return ".trypackai.com";
  }
  return undefined;
};

const parsePendingPkce = (raw: string | null): PendingPkceSession | null => {
  if (!raw) {
    return null;
  }

  try {
    const pending = JSON.parse(raw) as PendingPkceSession;
    if (!pending?.state || !pending?.verifier) {
      return null;
    }

    if (Date.now() - pending.createdAt > PKCE_MAX_AGE_MS) {
      return null;
    }

    return pending;
  } catch {
    return null;
  }
};

const setAuthSessionHint = (): void => {
  setCookie(AUTH_HINT_COOKIE_KEY, "1", {
    sameSite: "Strict",
  });
};

const clearAuthSessionHint = (): void => {
  deleteCookie(AUTH_HINT_COOKIE_KEY);
};

export const hasAuthSessionHint = (): boolean =>
  Boolean(getCookie(AUTH_HINT_COOKIE_KEY));

export const loadSession = async (): Promise<AuthSession | null> => {
  if (!isBrowser) {
    return null;
  }

  const encryptedSession = parseSession(await encryptedSessionStore.getItem());
  if (encryptedSession) {
    setAuthSessionHint();
    return encryptedSession;
  }

  const legacySession = withStorage(() =>
    parseSession(window.sessionStorage.getItem(SESSION_STORAGE_KEY))
  );
  if (legacySession) {
    await persistSession(legacySession);
    return legacySession;
  }

  const legacyLocalSession = withStorage(() =>
    parseSession(window.localStorage.getItem(LEGACY_LOCAL_STORAGE_KEY))
  );
  if (!legacyLocalSession) {
    withStorage(() => window.localStorage.removeItem(LEGACY_LOCAL_STORAGE_KEY));
    return null;
  }

  await persistSession(legacyLocalSession);
  withStorage(() => window.localStorage.removeItem(LEGACY_LOCAL_STORAGE_KEY));
  return legacyLocalSession;
};

export const persistSession = async (session: AuthSession): Promise<void> => {
  if (!isBrowser) {
    return;
  }

  const payload = JSON.stringify({
    ...session,
    storedAt: Date.now(),
  });

  try {
    window.sessionStorage.setItem(SESSION_STORAGE_KEY, payload);
  } catch {
    // Ignore legacy session storage write failures.
  }

  try {
    window.localStorage.removeItem(LEGACY_LOCAL_STORAGE_KEY);
  } catch {
    // Ignore local storage clear failures.
  }

  setAuthSessionHint();

  try {
    await encryptedSessionStore.setItem(payload);
  } catch {
    // Ignore encrypted storage failures after same-origin session state is already persisted.
  }
};

export const clearSession = (): void => {
  if (!isBrowser) {
    return;
  }

  void encryptedSessionStore.removeItem();
  clearAuthSessionHint();

  try {
    window.sessionStorage.removeItem(SESSION_STORAGE_KEY);
    window.localStorage.removeItem(LEGACY_LOCAL_STORAGE_KEY);
  } catch {
    // Ignore storage clear failures.
  }
};

export const setLogoutIntent = (): void => {
  if (!isBrowser) {
    return;
  }
  try {
    window.sessionStorage.setItem(LOGOUT_INTENT_KEY, "1");
  } catch {
    // Ignore storage write failures.
  }
};

export const clearLogoutIntent = (): void => {
  if (!isBrowser) {
    return;
  }
  try {
    window.sessionStorage.removeItem(LOGOUT_INTENT_KEY);
  } catch {
    // Ignore storage clear failures.
  }
};

export const hasLogoutIntent = (): boolean => {
  if (!isBrowser) {
    return false;
  }
  try {
    return window.sessionStorage.getItem(LOGOUT_INTENT_KEY) === "1";
  } catch {
    return false;
  }
};

export const storePendingPkce = (pending: PendingPkceSession): void => {
  if (!isBrowser) {
    return;
  }
  const payload = JSON.stringify(pending);
  try {
    window.sessionStorage.setItem(PKCE_STORAGE_KEY, payload);
  } catch {
    // Ignore session storage write failures.
  }
  try {
    window.localStorage.setItem(PKCE_STORAGE_KEY, payload);
  } catch {
    // Ignore local storage write failures.
  }
  setCookie(PKCE_COOKIE_KEY, payload, {
    domain: getCrossSubdomainCookieDomain(),
    maxAgeSeconds: Math.floor(PKCE_MAX_AGE_MS / 1000),
    sameSite: "Lax",
  });
};

export const getPendingPkce = (): PendingPkceSession | null => {
  if (!isBrowser) {
    return null;
  }

  const raw =
    window.sessionStorage.getItem(PKCE_STORAGE_KEY) ??
    window.localStorage.getItem(PKCE_STORAGE_KEY) ??
    getCookie(PKCE_COOKIE_KEY);
  const pending = parsePendingPkce(raw);

  if (!pending) {
    clearPendingPkce();
    return null;
  }

  try {
    try {
      window.sessionStorage.setItem(PKCE_STORAGE_KEY, JSON.stringify(pending));
    } catch {
      // Ignore session storage write failures.
    }

    try {
      window.localStorage.setItem(PKCE_STORAGE_KEY, JSON.stringify(pending));
    } catch {
      // Ignore local storage write failures.
    }

    return pending;
  } catch {
    return pending;
  }
};

export const clearPendingPkce = (): void => {
  if (!isBrowser) {
    return;
  }
  window.sessionStorage.removeItem(PKCE_STORAGE_KEY);
  window.localStorage.removeItem(PKCE_STORAGE_KEY);
  deleteCookie(PKCE_COOKIE_KEY, {
    domain: getCrossSubdomainCookieDomain(),
    sameSite: "Lax",
  });
};

export const setAuthRetryBlocked = (durationMs = 2 * 60 * 1000): void => {
  if (!isBrowser) {
    return;
  }
  try {
    const expiresAt = Date.now() + Math.max(30_000, durationMs);
    window.sessionStorage.setItem(
      AUTH_RETRY_BLOCK_KEY,
      JSON.stringify({ expiresAt })
    );
  } catch {
    // Ignore storage write failures.
  }
};

export const clearAuthRetryBlocked = (): void => {
  if (!isBrowser) {
    return;
  }
  try {
    window.sessionStorage.removeItem(AUTH_RETRY_BLOCK_KEY);
  } catch {
    // Ignore storage clear failures.
  }
};

export const isAuthRetryBlocked = (): boolean => {
  if (!isBrowser) {
    return false;
  }
  try {
    const raw = window.sessionStorage.getItem(AUTH_RETRY_BLOCK_KEY);
    if (!raw) {
      return false;
    }
    const parsed = JSON.parse(raw) as { expiresAt?: number };
    if (!parsed?.expiresAt || parsed.expiresAt <= Date.now()) {
      window.sessionStorage.removeItem(AUTH_RETRY_BLOCK_KEY);
      return false;
    }
    return true;
  } catch {
    return false;
  }
};
