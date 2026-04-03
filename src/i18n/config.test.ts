import {
  getLocaleFromPath,
  localizePath,
  stripLocaleFromPath,
} from './config';

describe('i18n path helpers', () => {
  test('keeps default locale paths unprefixed', () => {
    expect(localizePath('/privacy', 'en')).toBe('/privacy');
  });

  test('keeps unsupported locale paths collapsed to english', () => {
    expect(localizePath('/privacy', 'es')).toBe('/privacy');
  });

  test('resolves hidden spanish paths to english locale', () => {
    expect(getLocaleFromPath('/es/privacy')).toBe('en');
  });

  test('strips hidden locale prefix as part of english fallback', () => {
    expect(stripLocaleFromPath('/es/privacy')).toBe('/privacy');
    expect(stripLocaleFromPath('/privacy')).toBe('/privacy');
    expect(stripLocaleFromPath('/foo/privacy')).toBe('/foo/privacy');
  });
});
