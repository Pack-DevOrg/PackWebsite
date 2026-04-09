import {
  AirportWaitTimePublicCollectionResponseSchema,
  type AirportWaitTimePublicCollectionResponse,
} from "@/schemas/airport-security";
import { appConfig } from "@/config/appConfig";
import { env } from "@/utils/env";
import { executeRecaptchaAction } from "@/utils/recaptcha";
import { z } from "zod";

const joinUrl = (base: string, path: string): string => {
  const normalizedBase = base.replace(/\/+$/, "");
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${normalizedBase}${normalizedPath}`;
};

const PublicAirportSecurityEnvelopeSchema = z.object({
  success: z.boolean(),
  data: AirportWaitTimePublicCollectionResponseSchema,
  requestId: z.string().optional(),
});
const RECAPTCHA_ACTION = "tsa_wait_times_public_lookup";
const PUBLIC_TSA_BOARD_CACHE_KEY = "tsa-public-board-cache-v1";
const PROD_PUBLIC_TSA_BOARD_URL =
  "https://tsa-board.trypackai.com/airport-wait-times/public/current.json";

function isUsablePublicBoardUrl(candidateUrl: string): boolean {
  try {
    const parsedUrl = new URL(candidateUrl);
    const hostname = parsedUrl.hostname.trim().toLowerCase();

    if (appConfig.environment === "prod" && hostname.endsWith(".cloudfront.net")) {
      return false;
    }

    return true;
  } catch {
    return false;
  }
}

function shouldUseLocalDevProxy(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  const hostname = window.location.hostname.trim().toLowerCase();
  return (
    appConfig.environment === "dev" &&
    (hostname === "localhost" || hostname === "127.0.0.1")
  );
}

function getAirportSecurityBaseUrl(): string {
  if (shouldUseLocalDevProxy()) {
    return `${window.location.origin}/dev`;
  }

  return appConfig.apiBaseUrl;
}

function buildPublicAirportSecurityPath(path: string): string {
  return joinUrl(getAirportSecurityBaseUrl(), path);
}

function getPublicBoardUrl(): string | null {
  const explicitBoardUrl =
    typeof env.VITE_PUBLIC_TSA_BOARD_URL === "string"
      ? env.VITE_PUBLIC_TSA_BOARD_URL.trim()
      : "";

  if (explicitBoardUrl.length > 0 && isUsablePublicBoardUrl(explicitBoardUrl)) {
    return explicitBoardUrl;
  }

  if (
    appConfig.environment === "prod" &&
    isUsablePublicBoardUrl(PROD_PUBLIC_TSA_BOARD_URL)
  ) {
    return PROD_PUBLIC_TSA_BOARD_URL;
  }

  return null;
}

async function fetchPublicAirportSecurityViaApi(
  useLocalDevProxy: boolean
): Promise<AirportWaitTimePublicCollectionResponse> {
  const recaptchaToken = await getRecaptchaToken(
    RECAPTCHA_ACTION,
    useLocalDevProxy
  );
  const response = await fetch(
    buildPublicAirportSecurityPath("/airport-security/public-current"),
    {
      method: "GET",
      headers: {
        Accept: "application/json",
        ...(recaptchaToken ? { "X-Recaptcha-Token": recaptchaToken } : {}),
      },
    }
  );

  if (!response.ok) {
    throw new Error("Unable to load public TSA wait times right now.");
  }

  const rawPayload = (await response.json()) as unknown;
  return PublicAirportSecurityEnvelopeSchema.parse(rawPayload).data;
}

async function getRecaptchaToken(
  action: string,
  useLocalDevProxy: boolean
): Promise<string | null> {
  const recaptchaSiteKey =
    typeof env.VITE_RECAPTCHA_SITE_KEY === "string"
      ? env.VITE_RECAPTCHA_SITE_KEY.trim()
      : "";

  if (!useLocalDevProxy && !recaptchaSiteKey) {
    throw new Error("Security verification is unavailable right now.");
  }

  if (useLocalDevProxy) {
    return null;
  }

  return await executeRecaptchaAction(action, recaptchaSiteKey);
}

function toUnknownSnapshotBoard(
  payload: AirportWaitTimePublicCollectionResponse
): AirportWaitTimePublicCollectionResponse {
  return {
    ...payload,
    generatedAt: new Date().toISOString(),
    airports: payload.airports.map((airport) => ({
      ...airport,
      snapshot: null,
    })),
  };
}

function readCachedUnknownBoard(): AirportWaitTimePublicCollectionResponse | null {
  if (typeof window === "undefined") {
    return null;
  }

  const cachedPayload = window.localStorage.getItem(PUBLIC_TSA_BOARD_CACHE_KEY);
  if (!cachedPayload) {
    return null;
  }

  try {
    const parsedPayload = AirportWaitTimePublicCollectionResponseSchema.parse(
      JSON.parse(cachedPayload) as unknown
    );
    return toUnknownSnapshotBoard(parsedPayload);
  } catch {
    return null;
  }
}

function cachePublicBoard(payload: AirportWaitTimePublicCollectionResponse): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(
      PUBLIC_TSA_BOARD_CACHE_KEY,
      JSON.stringify(payload)
    );
  } catch {
    // Ignore storage failures so board rendering can continue.
  }
}

export async function fetchPublicAirportSecuritySummary(): Promise<AirportWaitTimePublicCollectionResponse> {
  const publicBoardUrl = getPublicBoardUrl();
  const useLocalDevProxy = shouldUseLocalDevProxy();

  try {
    let payload: AirportWaitTimePublicCollectionResponse;

    if (publicBoardUrl) {
      try {
        const response = await fetch(publicBoardUrl, {
          method: "GET",
          headers: {
            Accept: "application/json",
          },
        });

        if (!response.ok) {
          throw new Error("Edge TSA board request failed.");
        }

        const rawPayload = (await response.json()) as unknown;
        payload = AirportWaitTimePublicCollectionResponseSchema.parse(rawPayload);
      } catch {
        payload = await fetchPublicAirportSecurityViaApi(useLocalDevProxy);
      }
    } else {
      payload = await fetchPublicAirportSecurityViaApi(useLocalDevProxy);
    }

    cachePublicBoard(payload);

    return payload;
  } catch (error) {
    const cachedFallback = readCachedUnknownBoard();
    if (cachedFallback) {
      return cachedFallback;
    }

    throw error;
  }
}
