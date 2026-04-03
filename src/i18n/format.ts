import {
  DEFAULT_LOCALE,
  getLanguageTagForLocale,
  normalizeLocale,
  type SupportedLocale,
} from './config';

export function getActiveLocale(): SupportedLocale {
  if (typeof document === 'undefined') {
    return DEFAULT_LOCALE;
  }

  const lang = document.documentElement.lang;
  if (lang.startsWith('es')) {
    return 'es';
  }
  return normalizeLocale(lang.slice(0, 2));
}

export function formatLocalizedDate(
  value: Date,
  options: Intl.DateTimeFormatOptions,
  locale: SupportedLocale = getActiveLocale(),
): string {
  return new Intl.DateTimeFormat(getLanguageTagForLocale(locale), options).format(
    value,
  );
}
