import { z } from "zod";
import { env } from "@/utils/env";

const normalizeUrl = (value: string): string =>
  value.replace(/\/+$/, "");

const ensureProtocol = (value: string): string =>
  /^https?:\/\//i.test(value) ? value : `https://${value}`;

const stripKnownEndpointSuffix = (value: string): string => {
  const normalized = normalizeUrl(value);
  // Website envs are sometimes pointed at a concrete public endpoint such as
  // `/subscribe` during ad hoc testing. Normalize back to the API base so the
  // sibling endpoints derived below (`/verify`, `/unsubscribe`, privacy routes)
  // stay on the same stage instead of mixing environments.
  return normalized
    .replace(/\/(subscribe|verify|unsubscribe|consent-event)$/i, "")
    .replace(/\/privacy\/requests$/i, "");
};

const normalizeAbsoluteUrl = (value: string): string =>
  normalizeUrl(ensureProtocol(value));

const normalizeHostname = (value: string): string =>
  value.trim().toLowerCase().replace(/\.+$/, "");

const isLocalhostUrl = (url: string): boolean =>
  /^https?:\/\/(localhost|127\.0\.0\.1)(?::\d+)?(\/|$)/i.test(url);

export const isLocalhostHostname = (hostname: string): boolean => {
  const normalized = normalizeHostname(hostname);
  return normalized === "localhost" || normalized === "127.0.0.1";
};

export const isTryPackHostname = (hostname: string): boolean => {
  const normalized = normalizeHostname(hostname);
  return normalized === "trypackai.com" || normalized.endsWith(".trypackai.com");
};

export const shouldExposeTsaForHostname = (hostname: string): boolean =>
  isTryPackHostname(hostname) || isLocalhostHostname(hostname);

const alignLocalhostOrigin = (url: string, fallbackUrl?: string): string => {
  if (typeof window === "undefined") {
    const normalized = normalizeAbsoluteUrl(url);
    if (
      fallbackUrl &&
      isLocalhostUrl(normalized) &&
      !isLocalhostUrl(normalizeAbsoluteUrl(fallbackUrl))
    ) {
      return normalizeAbsoluteUrl(fallbackUrl);
    }
    return normalized;
  }

  const normalized = normalizeAbsoluteUrl(url);
  const fallbackNormalized = fallbackUrl
    ? normalizeAbsoluteUrl(fallbackUrl)
    : undefined;
  const isConfiguredLocalhost = isLocalhostUrl(normalized);
  const isRuntimeLocalhost = /^https?:\/\/(localhost|127\.0\.0\.1)(?::\d+)?$/i.test(window.location.origin);

  if (isConfiguredLocalhost && !isRuntimeLocalhost && fallbackNormalized) {
    return fallbackNormalized;
  }

  if (!isConfiguredLocalhost || !isRuntimeLocalhost) {
    return normalized;
  }

  const parsed = new URL(normalized);
  const pathname = parsed.pathname === "/" ? "" : parsed.pathname;
  return `${window.location.origin}${pathname}`;
};

const shouldUseLocalDevPublicProxy = (environment: AppEnvironment): boolean => {
  if (typeof window === "undefined") {
    return false;
  }

  const hostname = window.location.hostname.trim().toLowerCase();
  return (
    environment === "dev" &&
    (hostname === "localhost" || hostname === "127.0.0.1")
  );
};

const alignLocalDevPublicProxyUrl = (
  url: string,
  environment: AppEnvironment,
): string => {
  const normalized = normalizeAbsoluteUrl(url);
  if (!shouldUseLocalDevPublicProxy(environment)) {
    return normalized;
  }

  const parsed = new URL(normalized);
  const pathname = parsed.pathname === "/" ? "" : parsed.pathname;
  // Keep the real public route path and only swap the origin to the local Vite
  // host. That lets localhost exercise the deployed `dev` API shape through the
  // proxy instead of inventing separate local-only endpoint names.
  return `${window.location.origin}${pathname}${parsed.search}`;
};

const rawApiBaseUrl =
  (env.VITE_API_BASE_URL as string | undefined) ??
  (env.VITE_API_ENDPOINT as string | undefined) ??
  "https://api.trypackai.com/prod";

const normalizedApiBaseUrl = normalizeAbsoluteUrl(
  stripKnownEndpointSuffix(rawApiBaseUrl)
);

const inferredEnvironment =
  normalizedApiBaseUrl.includes("/dev") || normalizedApiBaseUrl.endsWith(".dev")
    ? "dev"
    : "prod";

const defaultAppBaseUrl =
  (env.VITE_APP_BASE_URL as string | undefined) ?? "https://www.trypackai.com";
const defaultOauthResourceServerIdentifier =
  (env.VITE_OAUTH_RESOURCE_SERVER_IDENTIFIER as string | undefined)?.trim() ||
  "api.trypackai.com";

// Public OAuth client IDs are not secrets. Keep a stable production fallback
// so deploys cannot silently ship an invalid hosted-auth configuration.
const defaultCognitoClientId = "6qjkv282db2701o9m0uroh6c9k";
const defaultGoogleGisClientId =
  "954475259916-15eeqa9prhfgllda42ofrcdv2sirav5n.apps.googleusercontent.com";

const baseScopes = [
  "openid",
  "email",
  "profile",
  "aws.cognito.signin.user.admin",
  `${defaultOauthResourceServerIdentifier}/${inferredEnvironment}/travel.plan`,
  `${defaultOauthResourceServerIdentifier}/${inferredEnvironment}/travel.search`,
  `${defaultOauthResourceServerIdentifier}/${inferredEnvironment}/travel.book`,
  `${defaultOauthResourceServerIdentifier}/${inferredEnvironment}/jobs.read`,
  `${defaultOauthResourceServerIdentifier}/${inferredEnvironment}/jobs.manage`,
  `${defaultOauthResourceServerIdentifier}/${inferredEnvironment}/user.accounts`,
  `${defaultOauthResourceServerIdentifier}/${inferredEnvironment}/user.preferences`,
  `${defaultOauthResourceServerIdentifier}/${inferredEnvironment}/user.information`,
  `${defaultOauthResourceServerIdentifier}/${inferredEnvironment}/user.trips`,
  `${defaultOauthResourceServerIdentifier}/${inferredEnvironment}/user.queries`,
  `${defaultOauthResourceServerIdentifier}/${inferredEnvironment}/user.delete`,
];

const rawScopeEnv = (env.VITE_OAUTH_SCOPES as string | undefined)?.trim();
const scopeList = Array.from(
  new Set(
    rawScopeEnv && rawScopeEnv.length > 0
      ? [...rawScopeEnv.split(/\s+/), ...baseScopes]
      : baseScopes
  )
);

const AppConfigSchema = z.object({
  apiBaseUrl: z.string().url(),
  cognitoDomain: z.string().url(),
  cognitoClientId: z.string().min(1, "Missing Cognito client id"),
  googleGisClientId: z.string().min(1).optional(),
  cognitoRedirectUri: z.string().url(),
  postLogoutRedirectUri: z.string().url(),
  appBaseUrl: z.string().url(),
  publicSiteUrl: z.string().url(),
  supportEmail: z.string().email(),
  forwardingEmail: z.string().email(),
  friendsEmail: z.string().email(),
  apiKey: z.string().optional(),
  oauthScopes: z
    .array(z.string().min(1))
    .min(1, "At least one OAuth scope is required"),
  environment: z.enum(["prod", "dev"]),
});

export type AppEnvironment = z.infer<typeof AppConfigSchema>["environment"];

const resolvedConfig = AppConfigSchema.parse({
  apiBaseUrl: normalizedApiBaseUrl,
  cognitoDomain: ensureProtocol(
    normalizeUrl(
      (env.VITE_COGNITO_DOMAIN as string | undefined) ??
        "https://auth.trypackai.com"
    )
  ),
  cognitoClientId:
    (env.VITE_COGNITO_CLIENT_ID as string | undefined) ??
    defaultCognitoClientId,
  googleGisClientId:
    (env.VITE_GOOGLE_GIS_CLIENT_ID as string | undefined)?.trim() ||
    defaultGoogleGisClientId,
  cognitoRedirectUri: ensureProtocol(
    normalizeUrl(
      (env.VITE_COGNITO_REDIRECT_URI as string | undefined) ??
        `${normalizeUrl(defaultAppBaseUrl)}/auth/callback`
    )
  ),
  postLogoutRedirectUri: ensureProtocol(
    normalizeUrl(
      (env.VITE_POST_LOGOUT_REDIRECT_URI as string | undefined) ??
        defaultAppBaseUrl
    )
  ),
  appBaseUrl: ensureProtocol(normalizeUrl(defaultAppBaseUrl)),
  publicSiteUrl: ensureProtocol(
    normalizeUrl(
      (env.VITE_WEBSITE_URL as string | undefined) ?? "https://trypackai.com"
    )
  ),
  supportEmail:
    (env.VITE_SUPPORT_EMAIL as string | undefined) ?? "support@trypackai.com",
  forwardingEmail:
    (env.VITE_FORWARDING_EMAIL as string | undefined) ?? "trips@trypackai.com",
  friendsEmail:
    (env.VITE_FRIENDS_EMAIL as string | undefined) ?? "friends@trypackai.com",
  apiKey: env.VITE_PACK_API_KEY as string | undefined,
  oauthScopes: scopeList,
  environment: inferredEnvironment,
});

export const appConfig = {
  ...resolvedConfig,
  cognitoRedirectUri: alignLocalhostOrigin(
    resolvedConfig.cognitoRedirectUri,
    `${normalizeUrl(defaultAppBaseUrl)}/auth/callback`
  ),
  postLogoutRedirectUri: alignLocalhostOrigin(
    resolvedConfig.postLogoutRedirectUri,
    normalizeUrl(defaultAppBaseUrl)
  ),
};

export const publicContactConfig = {
  websiteUrl: appConfig.publicSiteUrl,
  supportEmail: appConfig.supportEmail,
  forwardingEmail: appConfig.forwardingEmail,
  friendsEmail: appConfig.friendsEmail,
};

export const shouldExposeTsaForCurrentHost = (): boolean => {
  if (typeof window !== "undefined") {
    return shouldExposeTsaForHostname(window.location.hostname);
  }

  try {
    return shouldExposeTsaForHostname(new URL(resolvedConfig.publicSiteUrl).hostname);
  } catch {
    return false;
  }
};

const resolvedWaitlistEndpoint = (() => {
  const explicit = (env.VITE_API_ENDPOINT as string | undefined)?.trim();
  if (explicit && explicit.length > 0) {
    return normalizeAbsoluteUrl(explicit);
  }
  return `${appConfig.apiBaseUrl}/subscribe`;
})();

const resolvedVerifyEndpoint = (() => {
  const explicit = (env.VITE_VERIFY_ENDPOINT as string | undefined)?.trim();
  if (explicit && explicit.length > 0) {
    return normalizeAbsoluteUrl(explicit);
  }
  return `${appConfig.apiBaseUrl}/verify`;
})();

const resolvedUnsubscribeEndpoint = (() => {
  if (resolvedWaitlistEndpoint.endsWith("/subscribe")) {
    return resolvedWaitlistEndpoint.replace(/\/subscribe$/i, "/unsubscribe");
  }
  return `${appConfig.apiBaseUrl}/unsubscribe`;
})();

export const apiEndpoints = {
  waitlistSubscribe: alignLocalDevPublicProxyUrl(
    resolvedWaitlistEndpoint,
    appConfig.environment,
  ),
  waitlistVerify: alignLocalDevPublicProxyUrl(
    resolvedVerifyEndpoint,
    appConfig.environment,
  ),
  waitlistUnsubscribe: alignLocalDevPublicProxyUrl(
    resolvedUnsubscribeEndpoint,
    appConfig.environment,
  ),
  consentEvent: alignLocalDevPublicProxyUrl(
    `${appConfig.apiBaseUrl}/consent-event`,
    appConfig.environment,
  ),
  privacyRequests: alignLocalDevPublicProxyUrl(
    `${appConfig.apiBaseUrl}/privacy/requests`,
    appConfig.environment,
  ),
  privacyRequestsVerify: alignLocalDevPublicProxyUrl(
    `${appConfig.apiBaseUrl}/privacy/requests/verify`,
    appConfig.environment,
  ),
  sharedTravelById: (shareId: string) =>
    `${appConfig.apiBaseUrl}/api/share/${encodeURIComponent(shareId)}`,
};
