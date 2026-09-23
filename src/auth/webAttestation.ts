/**
 * Web attestation for authenticated API calls (PackServer shared-lib/device-attestation).
 *
 * The API gates web Cognito clients on a web attestation session keyed by the access token's jti.
 * The browser proves itself with a one-time reCAPTCHA v3 token in `x-pack-web-attestation`; the
 * server verifies it, burns it and mints the session, so later calls on the same access token pass
 * without the header. A refreshed access token has a new jti and needs a fresh token once.
 */
import { env } from "@/utils/env";
import { executeRecaptchaAction } from "@/utils/recaptcha";

export const WEB_ATTESTATION_HEADER = "x-pack-web-attestation";
export const WEB_ATTESTATION_ACTION = "web_attestation";

/** The API's typed refusal codes for a missing, invalid or replayed web attestation token. */
export function isWebAttestationRefusal(status: number, body: string): boolean {
  return (status === 401 || status === 403) && /"WEB_ATTESTATION_[A-Z_]+"/.test(body);
}

/**
 * Headers carrying a fresh one-time attestation token. Empty when no site key is configured or
 * reCAPTCHA cannot run; the API then answers WEB_ATTESTATION_REQUIRED and the caller surfaces it.
 */
export async function webAttestationHeaders(): Promise<Record<string, string>> {
  const siteKey = String(env.VITE_RECAPTCHA_SITE_KEY || "").trim();
  if (!siteKey) {
    return {};
  }
  try {
    const token = await executeRecaptchaAction(WEB_ATTESTATION_ACTION, siteKey);
    return token ? { [WEB_ATTESTATION_HEADER]: token } : {};
  } catch {
    return {};
  }
}
