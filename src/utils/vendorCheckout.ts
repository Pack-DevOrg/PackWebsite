/**
 * Prefill a vendor checkout URL from known trip fields.
 *
 * Query keys are allowlisted (trip schema names). Payment-shaped keys never
 * leave this module. The output host is the vendor base host; https only.
 */

export const PREFILL_ALLOWLIST: readonly string[] = [
  'checkInDate',
  'checkOutDate',
  'origin',
  'destination',
  'guests',
  'rooms',
  'confirmationCode',
  'travelerName',
];

const ALLOWLIST_SET = new Set<string>(PREFILL_ALLOWLIST);

const PAYMENT_EXACT = new Set(['cvv', 'cvc', 'pan', 'expiry']);

const isPaymentShapedKey = (key: string): boolean => {
  const lower = key.toLowerCase();
  return lower.startsWith('card') || lower.startsWith('cc') || PAYMENT_EXACT.has(lower);
};

const isPrefillKey = (key: string): boolean =>
  ALLOWLIST_SET.has(key) && !isPaymentShapedKey(key);

const parseHttpsUrl = (value: string): URL | null => {
  try {
    const parsed = new URL(value);
    if (parsed.protocol !== 'https:') {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
};

const queryKeysArePrefillOnly = (parsed: URL): boolean => {
  for (const key of parsed.searchParams.keys()) {
    if (!isPrefillKey(key)) {
      return false;
    }
  }
  return true;
};

export const buildVendorCheckoutUrl = (
  vendorBaseUrl: string,
  known: Record<string, string>
): string | null => {
  const parsed = parseHttpsUrl(vendorBaseUrl);
  if (parsed === null) {
    return null;
  }

  const vendorHost = parsed.host;
  const out = new URL(parsed.href);
  out.search = '';

  for (const key of PREFILL_ALLOWLIST) {
    if (!Object.prototype.hasOwnProperty.call(known, key)) {
      continue;
    }
    if (!isPrefillKey(key)) {
      continue;
    }
    out.searchParams.set(key, known[key]);
  }

  if (out.host !== vendorHost) {
    return null;
  }

  return out.href;
};

export const openVendorCheckout = (url: string): void => {
  const parsed = parseHttpsUrl(url);
  if (parsed === null) {
    return;
  }
  if (!queryKeysArePrefillOnly(parsed)) {
    return;
  }
  if (typeof window === 'undefined' || typeof window.open !== 'function') {
    return;
  }
  window.open(url, '_blank', 'noopener,noreferrer');
};
