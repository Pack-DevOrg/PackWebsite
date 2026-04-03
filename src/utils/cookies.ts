interface CookieOptions {
  readonly domain?: string;
  readonly maxAgeSeconds?: number;
  readonly sameSite?: 'Lax' | 'Strict' | 'None';
  readonly secure?: boolean;
}

type TrackingCookieCategory = 'analytics' | 'marketing';

const TRACKING_COOKIE_EXACT_NAMES: Record<TrackingCookieCategory, readonly string[]> = {
  analytics: ['_ga', '_gid', '_gat'],
  marketing: ['_fbp', '_fbc', '_ttp', '_tt_enable_cookie'],
};

const TRACKING_COOKIE_PREFIXES: Record<TrackingCookieCategory, readonly string[]> = {
  analytics: ['_ga_', '_gcl_'],
  marketing: [],
};

const shouldUseSecureCookies = (): boolean => {
  if (typeof window === 'undefined') {
    return false;
  }

  return window.location.protocol === 'https:';
};

const createCookieString = (
  name: string,
  value: string,
  options: CookieOptions = {},
): string => {
  const encodedValue = encodeURIComponent(value);
  const segments = [`${name}=${encodedValue}`, 'path=/'];

  if (options.domain) {
    segments.push(`domain=${options.domain}`);
  }

  if (typeof options.maxAgeSeconds === 'number') {
    segments.push(`max-age=${options.maxAgeSeconds}`);
  }

  segments.push(`SameSite=${options.sameSite ?? 'Lax'}`);

  if (options.secure ?? shouldUseSecureCookies()) {
    segments.push('Secure');
  }

  return segments.join('; ');
};

export const setCookie = (
  name: string,
  value: string,
  maxAgeSecondsOrOptions?: number | CookieOptions,
): void => {
  if (typeof document === 'undefined') {
    return;
  }

  const options =
    typeof maxAgeSecondsOrOptions === 'number'
      ? { maxAgeSeconds: maxAgeSecondsOrOptions }
      : maxAgeSecondsOrOptions ?? {};

  document.cookie = createCookieString(name, value, options);
};

export const getCookie = (name: string): string | null => {
  if (typeof document === 'undefined') {
    return null;
  }

  const cookies = document.cookie ? document.cookie.split('; ') : [];
  for (const cookie of cookies) {
    const [cookieName, ...rest] = cookie.split('=');
    if (cookieName === name) {
      return decodeURIComponent(rest.join('='));
    }
  }
  return null;
};

export const deleteCookie = (
  name: string,
  options?: Pick<CookieOptions, 'domain' | 'sameSite' | 'secure'>,
): void => {
  if (typeof document === 'undefined') {
    return;
  }

  document.cookie = createCookieString(name, '', {
    ...options,
    maxAgeSeconds: 0,
  });
};

const getCandidateDomains = (): Array<string | undefined> => {
  if (typeof window === 'undefined') {
    return [undefined];
  }

  const hostname = window.location.hostname;
  const segments = hostname.split('.').filter(Boolean);
  const domains = new Set<string | undefined>([undefined, hostname, `.${hostname}`]);

  for (let index = 1; index < segments.length - 1; index += 1) {
    const domain = segments.slice(index).join('.');
    domains.add(domain);
    domains.add(`.${domain}`);
  }

  return Array.from(domains);
};

const deleteCookieAcrossKnownScopes = (name: string): void => {
  const domains = getCandidateDomains();
  const sameSiteValues: Array<CookieOptions['sameSite']> = ['Lax', 'Strict', 'None'];
  const secureValues = [false, true];

  for (const domain of domains) {
    for (const sameSite of sameSiteValues) {
      for (const secure of secureValues) {
        deleteCookie(name, {domain, sameSite, secure});
      }
    }
  }
};

const getDocumentCookieNames = (): string[] => {
  if (typeof document === 'undefined' || !document.cookie) {
    return [];
  }

  return document.cookie
    .split('; ')
    .map((cookie) => cookie.split('=')[0])
    .filter(Boolean);
};

export const clearTrackingCookies = ({
  analytics,
  marketing,
}: {
  readonly analytics?: boolean;
  readonly marketing?: boolean;
}): void => {
  const requestedCategories = [
    analytics ? 'analytics' : null,
    marketing ? 'marketing' : null,
  ].filter(Boolean) as TrackingCookieCategory[];

  if (requestedCategories.length === 0) {
    return;
  }

  const cookieNames = new Set<string>();
  const documentCookieNames = getDocumentCookieNames();

  for (const category of requestedCategories) {
    for (const cookieName of TRACKING_COOKIE_EXACT_NAMES[category]) {
      cookieNames.add(cookieName);
    }

    for (const documentCookieName of documentCookieNames) {
      if (
        TRACKING_COOKIE_PREFIXES[category].some((prefix) =>
          documentCookieName.startsWith(prefix),
        )
      ) {
        cookieNames.add(documentCookieName);
      }
    }
  }

  for (const cookieName of cookieNames) {
    deleteCookieAcrossKnownScopes(cookieName);
  }
};
