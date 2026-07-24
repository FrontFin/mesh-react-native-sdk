import { NativeModules, Platform } from 'react-native';
import { getSystemLanguage, resolveLanguage } from '../utils/language';

describe('getSystemLanguage', () => {
  const originalOS = Platform.OS;

  afterEach(() => {
    jest.restoreAllMocks();
    (Platform as { OS: string }).OS = originalOS;
    delete (NativeModules as Record<string, unknown>).SettingsManager;
    delete (NativeModules as Record<string, unknown>).I18nManager;
  });

  test('returns the iOS preferred language from AppleLanguages', () => {
    (Platform as { OS: string }).OS = 'ios';
    (NativeModules as Record<string, unknown>).SettingsManager = {
      settings: { AppleLanguages: ['fr-FR'], AppleLocale: 'en_US' },
    };

    expect(getSystemLanguage()).toBe('fr-FR');
  });

  test('falls back to the iOS AppleLocale (underscores normalised) when no AppleLanguages', () => {
    (Platform as { OS: string }).OS = 'ios';
    (NativeModules as Record<string, unknown>).SettingsManager = {
      settings: { AppleLocale: 'de_DE' },
    };

    expect(getSystemLanguage()).toBe('de-DE');
  });

  test('returns the Android locale (underscores normalised)', () => {
    (Platform as { OS: string }).OS = 'android';
    (NativeModules as Record<string, unknown>).I18nManager = {
      localeIdentifier: 'es_ES',
    };

    expect(getSystemLanguage()).toBe('es-ES');
  });

  test('strips Unicode extension subtags from the locale', () => {
    (Platform as { OS: string }).OS = 'android';
    (NativeModules as Record<string, unknown>).I18nManager = {
      localeIdentifier: 'th_TH-u-ca-buddhist',
    };

    expect(getSystemLanguage()).toBe('th-TH');
  });

  test('falls back to Intl when native modules report nothing', () => {
    (Platform as { OS: string }).OS = 'android';
    (NativeModules as Record<string, unknown>).I18nManager = {};
    jest.spyOn(Intl, 'DateTimeFormat').mockReturnValue({
      resolvedOptions: () => ({ locale: 'ja-JP' }),
    } as unknown as Intl.DateTimeFormat);

    expect(getSystemLanguage()).toBe('ja-JP');
  });

  test('returns undefined when neither native modules nor Intl resolve a locale', () => {
    (Platform as { OS: string }).OS = 'android';
    (NativeModules as Record<string, unknown>).I18nManager = {};
    jest.spyOn(Intl, 'DateTimeFormat').mockImplementation(() => {
      throw new Error('Intl unavailable');
    });

    expect(getSystemLanguage()).toBeUndefined();
  });
});

describe('resolveLanguage', () => {
  const originalOS = Platform.OS;

  afterEach(() => {
    jest.restoreAllMocks();
    (Platform as { OS: string }).OS = originalOS;
    delete (NativeModules as Record<string, unknown>).SettingsManager;
    delete (NativeModules as Record<string, unknown>).I18nManager;
  });

  test('passes a concrete tag through unchanged', () => {
    expect(resolveLanguage('en-US')).toBe('en-US');
  });

  test('returns undefined when no language is set', () => {
    expect(resolveLanguage(undefined)).toBeUndefined();
  });

  test('expands "system" to the device locale', () => {
    (Platform as { OS: string }).OS = 'android';
    (NativeModules as Record<string, unknown>).I18nManager = {
      localeIdentifier: 'fr_FR',
    };

    expect(resolveLanguage('system')).toBe('fr-FR');
  });

  test('falls back to "en" when "system" cannot be resolved', () => {
    (Platform as { OS: string }).OS = 'android';
    (NativeModules as Record<string, unknown>).I18nManager = {};
    jest.spyOn(Intl, 'DateTimeFormat').mockImplementation(() => {
      throw new Error('Intl unavailable');
    });

    expect(resolveLanguage('system')).toBe('en');
  });
});
