import { z } from "zod";
import { appConfig } from "@/config/appConfig";
import {
  clearPendingPkce,
  getPendingPkce,
  storePendingPkce,
} from "./tokenStorage";
import type { AuthTokens, PendingPkceSession } from "./types";

const TokenResponseSchema = z.object({
  access_token: z.string(),
  id_token: z.string(),
  refresh_token: z.string().optional(),
  token_type: z.string(),
  expires_in: z.number(),
  refresh_token_expires_in: z.number().optional(),
});

const ErrorResponseSchema = z.object({
  error: z.string(),
  error_description: z.string().optional(),
});

export interface TokenSet {
  readonly accessToken: string;
  readonly idToken: string;
  readonly refreshToken: string;
  readonly tokenType: string;
  readonly expiresIn: number;
  readonly refreshTokenExpiresIn?: number | null;
  readonly issuedAt: number;
}

const textEncoder = new TextEncoder();

const randomBytes = (length: number): Uint8Array => {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return bytes;
};

const base64UrlEncode = (bytes: Uint8Array): string =>
  btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");

const generateVerifier = (): string => base64UrlEncode(randomBytes(32));

const generateState = (): string => base64UrlEncode(randomBytes(16));

const createCodeChallenge = async (verifier: string): Promise<string> => {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    textEncoder.encode(verifier)
  );
  return base64UrlEncode(new Uint8Array(digest));
};

interface LoginOptions {
  readonly redirectPath?: string;
  readonly redirectUri?: string;
  readonly useCanonicalOrigin?: boolean;
}

const resolveRuntimeRedirectUri = (override?: string): string => {
  if (override && override.trim().length > 0) {
    return override;
  }

  return appConfig.cognitoRedirectUri;
};

const createAuthorizeUrl = async (
  state: string,
  verifier: string,
  options?: LoginOptions
): Promise<string> => {
  const challenge = await createCodeChallenge(verifier);
  const redirectUri = resolveRuntimeRedirectUri(options?.redirectUri);

  const url = new URL(`${appConfig.cognitoDomain}/oauth2/authorize`);
  url.searchParams.set("client_id", appConfig.cognitoClientId);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("scope", appConfig.oauthScopes.join(" "));
  url.searchParams.set("state", state);
  url.searchParams.set("code_challenge", challenge);
  url.searchParams.set("code_challenge_method", "S256");
  url.searchParams.set("identity_provider", "Google");
  url.searchParams.set("access_type", "offline");
  url.searchParams.set("idp_access_type", "offline");

  const pending: PendingPkceSession = {
    state,
    verifier,
    createdAt: Date.now(),
    redirectPath: options?.redirectPath,
    redirectUri,
  };
  storePendingPkce(pending);

  return url.toString();
};

const resolveCanonicalLoginRedirect = (
  options?: LoginOptions
): string | null => {
  if (typeof window === "undefined") {
    return null;
  }

  if (options?.useCanonicalOrigin === false) {
    return null;
  }

  const runtimeUrl = new URL(window.location.href);
  const canonicalUrl = new URL(appConfig.appBaseUrl);
  const isRuntimeLocalhost =
    /^https?:\/\/(localhost|127\.0\.0\.1)(?::\d+)?$/i.test(runtimeUrl.origin);

  if (isRuntimeLocalhost || runtimeUrl.origin === canonicalUrl.origin) {
    return null;
  }

  const targetPath =
    options?.redirectPath && options.redirectPath.trim().length > 0
      ? options.redirectPath
      : `${runtimeUrl.pathname}${runtimeUrl.search}${runtimeUrl.hash}`;

  return `${canonicalUrl.origin}${targetPath.startsWith("/") ? targetPath : `/${targetPath}`}`;
};

const postTokenRequest = async (
  params: Record<string, string>
): Promise<TokenSet> => {
  const tokenUrl = `${appConfig.cognitoDomain}/oauth2/token`;
  const encoded = new URLSearchParams({
    client_id: appConfig.cognitoClientId,
    ...params,
  });

  const response = await fetch(tokenUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: encoded.toString(),
  });

  const rawText = await response.text();
  let payload: unknown = {};
  if (rawText) {
    try {
      payload = JSON.parse(rawText);
    } catch {
      payload = { raw: rawText };
    }
  }

  if (!response.ok) {
    const error = ErrorResponseSchema.safeParse(payload);
    const message =
      error.success && error.data.error_description
        ? error.data.error_description
        : typeof payload === "object" && payload !== null && "raw" in payload
        ? `Unable to complete Cognito token request. ${String(
            (payload as { raw: unknown }).raw
          )}`
        : "Unable to complete Cognito token request.";
    throw new Error(message);
  }

  const parsed = TokenResponseSchema.parse(payload);

  return {
    accessToken: parsed.access_token,
    idToken: parsed.id_token,
    refreshToken: parsed.refresh_token ?? params.refresh_token ?? "",
    tokenType: parsed.token_type,
    expiresIn: parsed.expires_in,
    refreshTokenExpiresIn: parsed.refresh_token_expires_in ?? null,
    issuedAt: Date.now(),
  };
};

export const initiateLogin = async (options?: LoginOptions): Promise<void> => {
  const canonicalRedirect = resolveCanonicalLoginRedirect(options);
  if (canonicalRedirect) {
    window.location.assign(canonicalRedirect);
    return;
  }

  const verifier = generateVerifier();
  const state = generateState();
  const authorizeUrl = await createAuthorizeUrl(state, verifier, options);
  window.location.assign(authorizeUrl);
};

export const completeLogin = async (
  code: string,
  state: string
): Promise<{ tokenSet: TokenSet; redirectPath?: string | null }> => {
  const pending = getPendingPkce();
  if (!pending) {
    throw new Error("No pending login found. Please start again.");
  }
  if (pending.state !== state) {
    clearPendingPkce();
    throw new Error("OAuth state mismatch. Please try again.");
  }

  const tokenSet = await postTokenRequest({
    grant_type: "authorization_code",
    code,
    redirect_uri: pending.redirectUri ?? appConfig.cognitoRedirectUri,
    code_verifier: pending.verifier,
  });

  clearPendingPkce();
  return { tokenSet, redirectPath: pending.redirectPath ?? null };
};

export const refreshTokens = async (
  refreshToken: string
): Promise<TokenSet> =>
  postTokenRequest({
    grant_type: "refresh_token",
    refresh_token: refreshToken,
  });

export const mapTokenSetToAuthTokens = (
  tokenSet: TokenSet,
  previous?: AuthTokens | null
): AuthTokens => {
  const expiresInMs = Math.max(tokenSet.expiresIn - 45, 60) * 1000;
  const refreshExpiresInMs =
    tokenSet.refreshTokenExpiresIn != null
      ? Math.max(tokenSet.refreshTokenExpiresIn - 60, 60) * 1000
      : null;

  const resolvedRefreshToken =
    tokenSet.refreshToken && tokenSet.refreshToken.length > 0
      ? tokenSet.refreshToken
      : previous?.refreshToken ?? "";

  if (!resolvedRefreshToken) {
    throw new Error("Missing refresh token in Cognito response.");
  }

  return {
    accessToken: tokenSet.accessToken,
    idToken: tokenSet.idToken,
    refreshToken: resolvedRefreshToken,
    tokenType: tokenSet.tokenType,
    issuedAt: tokenSet.issuedAt,
    accessTokenExpiresAt: tokenSet.issuedAt + expiresInMs,
    refreshTokenExpiresAt:
      refreshExpiresInMs != null
        ? tokenSet.issuedAt + refreshExpiresInMs
        : previous?.refreshTokenExpiresAt ?? null,
  };
};

const resolveLogoutRedirectUri = (): string => {
  if (typeof window !== "undefined") {
    const runtimeOrigin = window.location.origin;
    if (/^https?:\/\/(localhost|127\.0\.0\.1)(?::\d+)?$/i.test(runtimeOrigin)) {
      return runtimeOrigin;
    }
  }

  const candidate = appConfig.postLogoutRedirectUri ?? appConfig.appBaseUrl;
  const parsed = new URL(candidate);

  if (parsed.pathname === "/" && !parsed.search && !parsed.hash) {
    return parsed.origin;
  }

  const normalizedPath = parsed.pathname.replace(/\/+$/, "");
  return `${parsed.origin}${normalizedPath}${parsed.search}${parsed.hash}`;
};

export const buildLogoutUrl = (): string => {
  const url = new URL(`${appConfig.cognitoDomain}/logout`);
  url.searchParams.set("client_id", appConfig.cognitoClientId);
  url.searchParams.set("logout_uri", resolveLogoutRedirectUri());
  return url.toString();
};
