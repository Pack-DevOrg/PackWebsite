import { appConfig } from "@/config/appConfig";
import { executeRecaptchaAction } from "@/utils/recaptcha";

export const WEB_ATTESTATION_HEADER = "x-pack-web-attestation";
export const WEB_ATTESTATION_PLATFORM_HEADER = "x-pack-platform";
export const WEB_ATTESTATION_SOURCE_HEADER = "x-pack-source";
export const WEB_DEVICE_ATTESTATION_PATH = "/user/device-attestation/web";

const TURNSTILE_SCRIPT_SRC =
  "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

let turnstileLoadPromise: Promise<void> | null = null;

declare global {
  interface Window {
    turnstile?: {
      render: (
        container: string | HTMLElement,
        parameters: {
          sitekey: string;
          size?: "normal" | "compact" | "invisible";
          callback?: (token: string) => void;
          "error-callback"?: () => void;
        },
      ) => string;
      execute: (widgetId: string) => void;
      remove: (widgetId: string) => void;
    };
  }
}

function loadTurnstileScript(): Promise<void> {
  if (typeof window === "undefined") {
    return Promise.resolve();
  }
  if (window.turnstile) {
    return Promise.resolve();
  }
  if (turnstileLoadPromise) {
    return turnstileLoadPromise;
  }
  turnstileLoadPromise = new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = TURNSTILE_SCRIPT_SRC;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load Turnstile"));
    document.head.appendChild(script);
  });
  return turnstileLoadPromise;
}

async function executeTurnstile(siteKey: string): Promise<string> {
  if (typeof window === "undefined") {
    throw new Error("Turnstile is not available in this environment");
  }
  await loadTurnstileScript();
  if (!window.turnstile) {
    throw new Error("Turnstile did not initialise correctly");
  }
  const host = document.createElement("div");
  host.style.display = "none";
  document.body.appendChild(host);
  let widgetId: string | undefined;
  try {
    return await new Promise<string>((resolve, reject) => {
      widgetId = window.turnstile!.render(host, {
        sitekey: siteKey,
        size: "invisible",
        callback: (token) => resolve(token),
        "error-callback": () => reject(new Error("Turnstile failed")),
      });
      window.turnstile!.execute(widgetId);
    });
  } finally {
    if (widgetId) {
      window.turnstile?.remove(widgetId);
    }
    host.remove();
  }
}

export async function getDeviceAttestationToken(): Promise<string> {
  const turnstileSiteKey = appConfig.turnstileSiteKey;
  if (turnstileSiteKey) {
    return executeTurnstile(turnstileSiteKey);
  }
  const recaptchaSiteKey = appConfig.recaptchaSiteKey;
  if (recaptchaSiteKey) {
    return executeRecaptchaAction("web_attestation", recaptchaSiteKey);
  }
  throw new Error("Web attestation site key is not configured");
}

export function webAttestationRequestHeaders(
  token?: string,
): Record<string, string> {
  return {
    [WEB_ATTESTATION_PLATFORM_HEADER]: "web",
    [WEB_ATTESTATION_SOURCE_HEADER]: "website",
    ...(token ? { [WEB_ATTESTATION_HEADER]: token } : {}),
  };
}

export async function ensureWebDeviceAttestationSession(
  accessToken: string,
  tokenType: string,
): Promise<void> {
  const attestationToken = await getDeviceAttestationToken();
  const response = await fetch(
    `${appConfig.apiBaseUrl}${WEB_DEVICE_ATTESTATION_PATH}`,
    {
      method: "POST",
      headers: {
        Accept: "application/json",
        Authorization: `${tokenType || "Bearer"} ${accessToken}`,
        ...webAttestationRequestHeaders(attestationToken),
      },
    },
  );
  if (!response.ok) {
    const details = await response.text().catch(() => "");
    throw new Error(
      details.trim() || "Web attestation could not be completed.",
    );
  }
}
