import React, {createContext, useContext, useMemo} from 'react';
import {Helmet} from 'react-helmet-async';
import {useLocation} from 'react-router-dom';
import {
  getLanguageTagForLocale,
  getLocaleFromPath,
  localizePath,
  type SupportedLocale,
} from './config';
import {WEBSITE_MESSAGES} from './messages';

interface TranslateValues {
  [key: string]: string | number;
}

interface I18nContextValue {
  readonly locale: SupportedLocale;
  readonly languageTag: string;
  readonly t: (key: string, values?: TranslateValues) => string;
  readonly pathFor: (pathname: string) => string;
  readonly pathForLocale: (pathname: string, locale: SupportedLocale) => string;
}

const I18nContext = createContext<I18nContextValue | null>(null);

function interpolateMessage(template: string, values?: TranslateValues): string {
  if (!values) {
    return template;
  }

  return Object.entries(values).reduce(
    (result, [key, value]) => result.replaceAll(`{${key}}`, String(value)),
    template,
  );
}

export const I18nProvider: React.FC<{readonly children: React.ReactNode}> = ({
  children,
}) => {
  const location = useLocation();
  const locale = getLocaleFromPath(location.pathname);
  const languageTag = getLanguageTagForLocale(locale);

  const contextValue = useMemo<I18nContextValue>(() => {
    const localeMessages = WEBSITE_MESSAGES[locale];
    const defaultMessages = WEBSITE_MESSAGES.en;

    return {
      locale,
      languageTag,
      t: (key, values) =>
        interpolateMessage(
          localeMessages[key] ?? defaultMessages[key] ?? key,
          values,
        ),
      pathFor: (pathname) => localizePath(pathname, locale),
      pathForLocale: (pathname, targetLocale) =>
        localizePath(pathname, targetLocale),
    };
  }, [languageTag, locale]);

  return (
    <I18nContext.Provider value={contextValue}>
      <Helmet htmlAttributes={{lang: languageTag}} />
      {children}
    </I18nContext.Provider>
  );
};

export function useI18n(): I18nContextValue {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return context;
}
