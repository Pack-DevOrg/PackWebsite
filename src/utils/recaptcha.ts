/**
 * Lightweight helpers for loading and executing Google reCAPTCHA v3.
 * Centralizing this logic avoids duplicate script injection across forms.
 */

import { env } from "./env";

let recaptchaLoadPromise: Promise<void> | null = null;

const isLocalhostHostname = (hostname: string): boolean =>
  hostname === 'localhost' || hostname === '127.0.0.1';

function shouldUseLocalDevRecaptchaBypass(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  if (!env.DEV) {
    return false;
  }

  return isLocalhostHostname(window.location.hostname.trim().toLowerCase());
}

/**
 * Loads the reCAPTCHA script once per session.
 * Subsequent calls return the same promise to prevent duplicate script tags.
 */
export function loadRecaptchaScript(siteKey: string): Promise<void> {
  if (shouldUseLocalDevRecaptchaBypass()) {
    return Promise.resolve();
  }

  if (typeof window === 'undefined') {
    return Promise.resolve();
  }

  if (window.grecaptcha) {
    return Promise.resolve();
  }

  if (recaptchaLoadPromise) {
    return recaptchaLoadPromise;
  }

  recaptchaLoadPromise = new Promise<void>((resolve, reject) => {
    const script = document.createElement('script');
    script.src = `https://www.google.com/recaptcha/api.js?render=${siteKey}`;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load reCAPTCHA'));
    document.head.appendChild(script);
  });

  return recaptchaLoadPromise;
}

/**
 * Executes a reCAPTCHA action and returns the token.
 */
export async function executeRecaptchaAction(action: string, siteKey: string): Promise<string> {
  if (shouldUseLocalDevRecaptchaBypass()) {
    return `local-dev-bypass-token:${action}`;
  }

  if (typeof window === 'undefined') {
    throw new Error('reCAPTCHA is not available in this environment');
  }

  await loadRecaptchaScript(siteKey);

  if (!window.grecaptcha) {
    throw new Error('reCAPTCHA did not initialise correctly');
  }

  await new Promise<void>((resolve) => window.grecaptcha!.ready(resolve));
  return window.grecaptcha!.execute(siteKey, { action });
}
