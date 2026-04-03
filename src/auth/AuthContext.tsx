import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from "react";
import { jwtDecode, JwtPayload } from "jwt-decode";
import {
  buildLogoutUrl,
  completeLogin,
  initiateLogin,
  mapTokenSetToAuthTokens,
  refreshTokens,
} from "./cognito";
import {
  clearAuthRetryBlocked,
  clearLogoutIntent,
  clearPendingPkce,
  clearSession,
  hasLogoutIntent,
  loadSession,
  persistSession,
  setAuthRetryBlocked,
  setLogoutIntent,
} from "./tokenStorage";
import type { AuthenticatedUser, AuthLoginCompletion, AuthTokens } from "./types";
import { useMountEffect } from "@/hooks/useMountEffect";

type AuthStatus = "loading" | "authenticated" | "unauthenticated";

interface AuthContextValue {
  readonly status: AuthStatus;
  readonly user: AuthenticatedUser | null;
  readonly login: (options?: {
    redirectPath?: string;
    redirectUri?: string;
    useCanonicalOrigin?: boolean;
  }) => Promise<void>;
  readonly completeLogin: (
    code: string,
    state: string
  ) => Promise<AuthLoginCompletion>;
  readonly logout: (options?: { redirect?: boolean }) => Promise<void>;
  readonly getAccessToken: (options?: {
    forceRefresh?: boolean;
  }) => Promise<string | null>;
  readonly tokens: AuthTokens | null;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

interface IdTokenClaims extends JwtPayload {
  readonly email?: string;
  readonly given_name?: string;
  readonly family_name?: string;
  readonly name?: string;
  readonly picture?: string;
  readonly updated_at?: string;
}

const decodeUser = (idToken: string): AuthenticatedUser | null => {
  try {
    const claims = jwtDecode<IdTokenClaims>(idToken);
    if (!claims?.sub) {
      return null;
    }
    return {
      sub: claims.sub,
      email: claims.email ?? undefined,
      name: claims.name ?? undefined,
      givenName: claims.given_name ?? undefined,
      familyName: claims.family_name ?? undefined,
      picture: claims.picture ?? undefined,
      updatedAt: claims.updated_at ?? undefined,
    };
  } catch {
    return null;
  }
};

const ACCESS_TOKEN_REFRESH_BUFFER_MS = 60 * 1000;

const AuthTokenRefreshCoordinator: React.FC<{
  readonly tokens: AuthTokens | null;
  readonly refreshNow: () => Promise<AuthTokens>;
}> = ({ tokens, refreshNow }) => {
  const refreshNowRef = useRef(refreshNow);
  refreshNowRef.current = refreshNow;

  useMountEffect(() => {
    if (!tokens) {
      return;
    }

    const now = Date.now();
    const refreshIn =
      tokens.accessTokenExpiresAt - ACCESS_TOKEN_REFRESH_BUFFER_MS - now;

    if (refreshIn <= 0) {
      void refreshNowRef.current().catch(() => {
        /* handled in refreshNow */
      });
      return;
    }

    const timeout = window.setTimeout(() => {
      void refreshNowRef.current().catch(() => {
        /* handled in refreshNow */
      });
    }, refreshIn);

    return () => {
      window.clearTimeout(timeout);
    };
  });

  return null;
};

export const AuthProvider: React.FC<{ readonly children: React.ReactNode }> = ({
  children,
}) => {
  const [status, setStatus] = useState<AuthStatus>("loading");
  const [tokens, setTokens] = useState<AuthTokens | null>(null);
  const [user, setUser] = useState<AuthenticatedUser | null>(null);
  const refreshPromise = useRef<Promise<AuthTokens> | null>(null);

  const applyTokens = useCallback(
    (nextTokens: AuthTokens, explicitUser?: AuthenticatedUser | null) => {
      setTokens(nextTokens);
      void persistSession({ tokens: nextTokens });

      const mappedUser = explicitUser ?? decodeUser(nextTokens.idToken);
      if (mappedUser) {
        setUser(mappedUser);
      }

      setStatus("authenticated");
    },
    []
  );

  const clearAuth = useCallback(() => {
    clearSession();
    setTokens(null);
    setUser(null);
    setStatus("unauthenticated");
  }, []);

  const refreshNow = useCallback(async (): Promise<AuthTokens> => {
    if (refreshPromise.current) {
      return refreshPromise.current;
    }

    if (!tokens?.refreshToken) {
      clearAuth();
      throw new Error("Missing refresh token");
    }

    refreshPromise.current = refreshTokens(tokens.refreshToken)
      .then((tokenSet) => {
        const nextTokens = mapTokenSetToAuthTokens(tokenSet, tokens);
        const nextUser = decodeUser(nextTokens.idToken);
        applyTokens(nextTokens, nextUser ?? user);
        return nextTokens;
      })
      .catch((error) => {
        setAuthRetryBlocked(2 * 60 * 1000);
        clearAuth();
        throw error;
      })
      .finally(() => {
        refreshPromise.current = null;
      });

    return refreshPromise.current;
  }, [applyTokens, clearAuth, tokens, user]);

  const getAccessToken = useCallback(
    async (options?: { forceRefresh?: boolean }) => {
      if (!tokens) {
        return null;
      }

      if (options?.forceRefresh) {
        const updated = await refreshNow();
        return updated.accessToken;
      }

      const now = Date.now();
      if (tokens.accessTokenExpiresAt - ACCESS_TOKEN_REFRESH_BUFFER_MS <= now) {
        const updated = await refreshNow();
        return updated.accessToken;
      }

      return tokens.accessToken;
    },
    [refreshNow, tokens]
  );

  const login = useCallback(
    async (options?: {
      redirectPath?: string;
      redirectUri?: string;
      useCanonicalOrigin?: boolean;
    }) => {
      clearLogoutIntent();
      clearAuthRetryBlocked();
      await initiateLogin(options);
    },
    []
  );

  const handleCompleteLogin = useCallback(
    async (code: string, state: string): Promise<AuthLoginCompletion> => {
      if (hasLogoutIntent()) {
        clearPendingPkce();
        clearLogoutIntent();
        clearAuth();
        return {
          redirectPath: "/",
          accessToken: "",
          idToken: "",
          tokenType: "Bearer",
        };
      }
      setStatus("loading");
      try {
        const { tokenSet, redirectPath } = await completeLogin(code, state);
        const nextTokens = mapTokenSetToAuthTokens(tokenSet, null);
        const nextUser = decodeUser(nextTokens.idToken);
        clearLogoutIntent();
        applyTokens(nextTokens, nextUser);
        return {
          redirectPath: redirectPath ?? null,
          accessToken: nextTokens.accessToken,
          idToken: nextTokens.idToken,
          tokenType: nextTokens.tokenType,
        };
      } catch (error) {
        setAuthRetryBlocked(5 * 60 * 1000);
        clearPendingPkce();
        throw error;
      }
    },
    [applyTokens, clearAuth]
  );

  const logout = useCallback(
    async (options?: { redirect?: boolean }) => {
      if (options?.redirect === false) {
        clearLogoutIntent();
        clearAuth();
        return;
      }

      // Avoid a race on protected routes (/app): if we set unauthenticated state
      // before navigation, ProtectedRoute can immediately trigger login again.
      // Clear storage and leave the app via Cognito logout first.
      clearSession();
      clearPendingPkce();
      setLogoutIntent();
      setTokens(null);
      setUser(null);
      setStatus("loading");

      const logoutUrl = buildLogoutUrl();
      window.location.assign(logoutUrl);
    },
    [clearAuth]
  );

  useMountEffect(() => {
    let cancelled = false;

    void (async () => {
      const stored = await loadSession();
      if (cancelled) {
        return;
      }

      if (!stored?.tokens) {
        clearSession();
        setStatus("unauthenticated");
        return;
      }

      const storedTokens = stored.tokens;
      const storedUser = decodeUser(storedTokens.idToken);

      setTokens(storedTokens);
      void persistSession({ tokens: storedTokens });
      if (storedUser) {
        setUser(storedUser);
      }
      setStatus("authenticated");

      if (
        storedTokens.accessTokenExpiresAt - ACCESS_TOKEN_REFRESH_BUFFER_MS <=
        Date.now()
      ) {
        setTimeout(() => {
          void refreshNow().catch(() => {
            /* handled in refreshNow */
          });
        }, 0);
      }
    })();

    return () => {
      cancelled = true;
    };
  }); // Only run once on mount

  const value = useMemo<AuthContextValue>(
    () => ({
      status,
      user,
      login,
      completeLogin: handleCompleteLogin,
      logout,
      getAccessToken,
      tokens,
    }),
    [status, user, login, handleCompleteLogin, logout, getAccessToken, tokens]
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
      <AuthTokenRefreshCoordinator
        key={tokens?.accessTokenExpiresAt ?? "no-tokens"}
        tokens={tokens}
        refreshNow={refreshNow}
      />
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextValue => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
};
