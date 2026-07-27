import { NativeModules, Platform } from 'react-native';

/**
 * Normalises a raw platform locale into a plain BCP-47 tag:
 *  - native identifiers use underscores (`en_US`), converted to hyphens;
 *  - Unicode extension subtags (e.g. `-u-ca-buddhist`) are stripped, since
 *    the hosted Link UI expects the same shape the web SDK sends via
 *    `navigator.language`, which never carries them.
 */
function normalizeLocale(tag: string): string {
  return tag.replace(/_/g, '-').replace(/-u-.*$/i, '');
}

/**
 * Resolves the device's current language as a BCP-47 tag (e.g. `en-US`).
 * This is the React Native equivalent of the web SDK's `navigator.language`,
 * used to expand `settings.language: 'system'` into a concrete tag before it
 * is sent to the hosted Link UI (the UI expects a real tag, not `'system'`).
 *
 * The native settings modules are read first because they reflect the real
 * device language on every JS engine. `Intl` is only a fallback: on Hermes
 * builds without full ICU (and on JSC) it can report a fixed `en-US` rather
 * than the device locale, so trusting it first would silently force English
 * for non-English users.
 *
 * Returns `undefined` when no locale can be determined so callers can apply
 * their own fallback.
 */
export function getSystemLanguage(): string | undefined {
  const { SettingsManager, I18nManager } = NativeModules;
  const nativeLocale =
    Platform.OS === 'ios'
      ? SettingsManager?.settings?.AppleLanguages?.[0] ||
        SettingsManager?.settings?.AppleLocale
      : I18nManager?.localeIdentifier;

  if (nativeLocale) {
    return normalizeLocale(nativeLocale);
  }

  try {
    const intlLocale = Intl.DateTimeFormat().resolvedOptions().locale;
    if (intlLocale) {
      return normalizeLocale(intlLocale);
    }
  } catch {
    // Intl is not available on this engine; nothing more to try.
  }

  return undefined;
}

/**
 * Resolves a `settings.language` value into the concrete tag to send as `lng`.
 * `'system'` expands to the device locale (falling back to `'en'` when it
 * cannot be determined); any other value is passed through unchanged, and
 * `undefined` stays `undefined` so no `lng` param is added.
 */
export function resolveLanguage(
  language: string | undefined
): string | undefined {
  if (language === 'system') {
    return getSystemLanguage() || 'en';
  }
  return language;
}
