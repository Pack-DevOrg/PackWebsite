import { appConfig } from "@/config/appConfig";

export interface ApiRequestOptions<Body = unknown> {
  readonly path: string;
  readonly method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  readonly body?: Body;
  readonly headers?: Record<string, string>;
  readonly signal?: AbortSignal;
  readonly credentials?: RequestCredentials;
}

export class ApiRequestError extends Error {
  public readonly status: number;
  public readonly details?: unknown;

  constructor(status: number, message: string, details?: unknown) {
    super(message);
    this.name = "ApiRequestError";
    this.status = status;
    this.details = details;
  }
}

const joinUrl = (base: string, path: string): string => {
  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }
  const normalizedBase = base.replace(/\/+$/, "");
  const normalizedPath = path.startsWith("/")
    ? path
    : `/${path}`;
  return `${normalizedBase}${normalizedPath}`;
};

const shouldUseLocalDevProxy = (): boolean => {
  if (typeof window === "undefined") {
    return false;
  }

  const hostname = window.location.hostname.trim().toLowerCase();
  return (
    appConfig.environment === "dev" &&
    (hostname === "localhost" || hostname === "127.0.0.1")
  );
};

const getApiBaseUrl = (): string => {
  if (shouldUseLocalDevProxy()) {
    return `${window.location.origin}/dev`;
  }

  return appConfig.apiBaseUrl;
};

type AccessTokenResolver = (
  options?: { forceRefresh?: boolean }
) => Promise<string | null>;

type TokenTypeResolver = () => string;

export interface ApiClient {
  request<Response, Body = unknown>(
    options: ApiRequestOptions<Body>
  ): Promise<Response>;
}

const parseApiResponse = async (response: Response): Promise<unknown> => {
  let parsed: unknown = null;
  const text = await response.text();
  if (text) {
    try {
      parsed = JSON.parse(text);
    } catch (error) {
      throw new ApiRequestError(
        response.status,
        "Failed to parse server response.",
        error
      );
    }
  }

  if (!response.ok) {
    const apiMessage = (parsed as { error?: { message?: string } })?.error?.message;
    const normalizedMessage =
      (typeof apiMessage === "string" && apiMessage.trim().length > 0
        ? apiMessage.trim()
        : undefined) ||
      (typeof response.statusText === "string" && response.statusText.trim().length > 0
        ? response.statusText.trim()
        : undefined) ||
      (response.status === 401
        ? "Authentication failed. Please sign in again."
        : "Request failed.");

    throw new ApiRequestError(response.status, normalizedMessage, parsed);
  }

  return parsed;
};

export const requestPublicApi = async <Response, Body = unknown>(
  options: ApiRequestOptions<Body>
): Promise<Response> => {
  const url = joinUrl(getApiBaseUrl(), options.path);
  const headers: Record<string, string> = {
    Accept: "application/json",
    ...(options.headers ?? {}),
  };

  if (options.body !== undefined && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }

  if (appConfig.apiKey && !headers["X-API-Key"]) {
    headers["X-API-Key"] = appConfig.apiKey;
  }

  const response = await fetch(url, {
    method: options.method ?? (options.body === undefined ? "GET" : "POST"),
    headers,
    body:
      options.body !== undefined
        ? JSON.stringify(options.body)
        : undefined,
    signal: options.signal,
    credentials: options.credentials,
  });

  return (await parseApiResponse(response)) as Response;
};

export type PhoneVerificationMint = {
  readonly code: string;
  readonly smsHref: string;
  readonly expiresAt: number;
};

const PHONE_VERIFICATION_START_PATH =
  "/user/information/phone-verification/start";

export const mintPhoneVerificationStart = async (
  client?: ApiClient,
): Promise<PhoneVerificationMint> => {
  const body = { platform: "web" as const };
  const payload = client
    ? await client.request<unknown, typeof body>({
        path: PHONE_VERIFICATION_START_PATH,
        method: "POST",
        body,
      })
    : await requestPublicApi<unknown, typeof body>({
        path: PHONE_VERIFICATION_START_PATH,
        method: "POST",
        body,
        credentials: "include",
      });

  const record =
    payload !== null && typeof payload === "object"
      ? (payload as Record<string, unknown>)
      : {};
  const nested =
    record.data !== null && typeof record.data === "object"
      ? (record.data as Record<string, unknown>)
      : record;
  const code = nested.code;
  const smsHref = nested.smsHref;
  const expiresAt = nested.expiresAt;
  if (
    typeof code !== "string" ||
    typeof smsHref !== "string" ||
    typeof expiresAt !== "number"
  ) {
    throw new ApiRequestError(
      500,
      "Unexpected phone verification mint response.",
    );
  }
  return { code, smsHref, expiresAt };
};

export const createApiClient = (
  resolveAccessToken: AccessTokenResolver,
  resolveTokenType: TokenTypeResolver
): ApiClient => {
  const performRequest = async <Response, Body>(
    options: ApiRequestOptions<Body>,
    hasRetried = false
  ): Promise<Response> => {
    const token = await resolveAccessToken({
      forceRefresh: false,
    });

    if (!token) {
      throw new ApiRequestError(401, "Authentication required.");
    }

    const tokenType = resolveTokenType() || "Bearer";
    const url = joinUrl(getApiBaseUrl(), options.path);
    const headers: Record<string, string> = {
      Accept: "application/json",
      ...(options.headers ?? {}),
      Authorization: `${tokenType} ${token}`,
    };

    if (options.body !== undefined && !headers["Content-Type"]) {
      headers["Content-Type"] = "application/json";
    }

    if (appConfig.apiKey && !headers["X-API-Key"]) {
      headers["X-API-Key"] = appConfig.apiKey;
    }

    const response = await fetch(url, {
      method: options.method ?? (options.body === undefined ? "GET" : "POST"),
      headers,
      body:
        options.body !== undefined
          ? JSON.stringify(options.body)
          : undefined,
      signal: options.signal,
    });

    if (response.status === 401 && !hasRetried) {
      const refreshed = await resolveAccessToken({ forceRefresh: true });
      if (!refreshed) {
        throw new ApiRequestError(401, "Authentication required.");
      }
      return performRequest<Response, Body>(options, true);
    }

    return (await parseApiResponse(response)) as Response;
  };

  return {
    request: performRequest,
  };
};
