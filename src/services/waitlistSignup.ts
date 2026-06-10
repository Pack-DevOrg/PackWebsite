import { apiEndpoints } from "../config/appConfig";
import { env } from "../utils/env";

export interface WaitlistSignupResult {
  readonly success: boolean;
  readonly message: string;
}

/**
 * Minimal waitlist signup used by secondary capture surfaces (e.g. the
 * exit-intent modal). The primary WaitlistForm keeps its richer flow with
 * marketing attribution; this helper covers email + reCAPTCHA + source only.
 */
export async function submitWaitlistSignup(params: {
  readonly email: string;
  readonly source?: string;
  readonly marketingEmailConsent?: boolean;
}): Promise<WaitlistSignupResult> {
  const siteKey = (env.VITE_RECAPTCHA_SITE_KEY as string) || "";
  let recaptchaToken: string | null = null;

  if (siteKey) {
    try {
      const { loadRecaptchaScript, executeRecaptchaAction } = await import(
        "../utils/recaptcha"
      );
      await loadRecaptchaScript(siteKey);
      recaptchaToken = await executeRecaptchaAction("submit_waitlist", siteKey);
    } catch (error) {
      if (env.DEV) {
        console.error("reCAPTCHA failed for waitlist signup", error);
      }
      return {
        success: false,
        message: "Security verification failed. Please try again.",
      };
    }
  }

  const requestData = {
    email: params.email,
    timestamp: new Date().toISOString(),
    source:
      params.source ??
      (typeof window !== "undefined" ? window.location.hostname : "unknown"),
    ...(recaptchaToken ? { recaptchaToken } : {}),
    marketingConsent: false,
    marketingEmailConsent: params.marketingEmailConsent ?? false,
    ageConfirmed: true,
  };

  let response: Response;
  let data: { success?: boolean; message?: string };
  try {
    response = await fetch(apiEndpoints.waitlistSubscribe, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestData),
    });
    data = await response.json();
  } catch (error) {
    if (env.DEV) {
      console.error("Waitlist signup request failed", error);
    }
    return {
      success: false,
      message: "Could not reach the server. Please try again.",
    };
  }

  if (!response.ok) {
    return {
      success: false,
      message: data.message || "Failed to join the waitlist. Please try again.",
    };
  }

  return { success: true, message: data.message || "You're on the list." };
}
