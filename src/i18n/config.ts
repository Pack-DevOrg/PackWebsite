export const SUPPORTED_LOCALES = ['en'] as const;
const HIDDEN_LOCALE_PREFIXES = ['es'] as const;

export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];

export const DEFAULT_LOCALE: SupportedLocale = 'en';

const LOCALE_TO_LANGUAGE_TAG: Record<SupportedLocale, string> = {
  en: 'en-US',
  es: 'es-ES',
};

export function isSupportedLocale(value: string | undefined | null): value is SupportedLocale {
  return SUPPORTED_LOCALES.includes(value as SupportedLocale);
}

function isHiddenLocalePrefix(value: string | undefined | null): boolean {
  return HIDDEN_LOCALE_PREFIXES.includes(
    value as (typeof HIDDEN_LOCALE_PREFIXES)[number],
  );
}

export function normalizeLocale(value: string | undefined | null): SupportedLocale {
  return isSupportedLocale(value) ? value : DEFAULT_LOCALE;
}

export function getLanguageTagForLocale(locale: string | undefined | null): string {
  return LOCALE_TO_LANGUAGE_TAG[normalizeLocale(locale)];
}

export function getLocaleFromPath(pathname: string): SupportedLocale {
  const segments = pathname.split('/').filter(Boolean);
  return normalizeLocale(segments[0]);
}

export function stripLocaleFromPath(pathname: string): string {
  const segments = pathname.split('/').filter(Boolean);
  if (
    segments.length === 0 ||
    (!isSupportedLocale(segments[0]) && !isHiddenLocalePrefix(segments[0]))
  ) {
    return pathname || '/';
  }

  const remainingSegments = segments.slice(1);
  return remainingSegments.length > 0 ? `/${remainingSegments.join('/')}` : '/';
}

export function localizePath(
  pathname: string,
  locale: string | undefined | null,
): string {
  const normalizedLocale = normalizeLocale(locale);
  const strippedPath = stripLocaleFromPath(pathname);
  const normalizedPath =
    strippedPath === ''
      ? '/'
      : strippedPath.startsWith('/')
      ? strippedPath
      : `/${strippedPath}`;

  if (normalizedLocale === DEFAULT_LOCALE) {
    return normalizedPath;
  }

  return normalizedPath;
}

export function getLocaleLabel(_locale: SupportedLocale): string {
  return 'English';
}
