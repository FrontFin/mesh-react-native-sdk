import { addURLParam } from './urlHelpers';

export interface BackupWidgetUrlParams {
  /** SDK platform identifier (e.g. `'reactNative'`). */
  platform: string;
  /** SDK version, for widget-side diagnostics. */
  sdkVersion: string;
  /**
   * Resolved colour theme. Appended as `?theme=dark|light` — the value the
   * widget reads to set its mode before first paint (in a WebView
   * prefers-color-scheme follows the device, not the host app, so the host
   * theme must be passed explicitly). Only the two lowercase literals are
   * meaningful; the widget ignores anything else and falls back to
   * prefers-color-scheme.
   */
  theme?: 'dark' | 'light';
  /** Resolved BCP-47 language tag, if the host set one. */
  language?: string;
}

/**
 * Builds the URL the backup widget WebView loads. Unlike the primary path there
 * is no link token to decode — the widget is a static SPA at `origin` and is
 * hydrated with the `MeshBackupConfig` over the message bridge after load. Only
 * non-sensitive display hints are carried on the URL; the deposit config never
 * appears in it.
 *
 * A trailing slash on `origin` is normalised away so params attach cleanly.
 */
export function buildBackupWidgetUrl(
  origin: string,
  params: BackupWidgetUrlParams
): string {
  let url = origin.replace(/\/+$/, '');
  url = addURLParam(url, 'platform', params.platform);
  url = addURLParam(url, 'sdkVersion', params.sdkVersion);
  if (params.theme) {
    url = addURLParam(url, 'theme', params.theme);
  }
  if (params.language) {
    url = addURLParam(url, 'lng', params.language);
  }
  return url;
}

/**
 * Extracts the origin (scheme + host + optional port) from a URL, discarding any
 * path/query/fragment. Used to constrain the backup WebView to the widget's own
 * origin: react-native-webview matches its navigation allow-list against the
 * origin only, so a path-bearing value would never match. Falls back to the
 * input unchanged if it doesn't look like an absolute URL.
 */
export function extractOrigin(url: string): string {
  const match = /^[a-z][a-z0-9+.-]*:\/\/[^/?#]+/i.exec(url);
  if (!match) return url;
  // Normalise so exact-equality origin checks accept equivalent forms: scheme +
  // host are case-insensitive, and the default port is equivalent to no port.
  // (There is no path/query here — the match stops at the first / ? #.)
  let origin = match[0].toLowerCase();
  if (origin.startsWith('https://')) {
    origin = origin.replace(/:443$/, '');
  } else if (origin.startsWith('http://')) {
    origin = origin.replace(/:80$/, '');
  }
  return origin;
}

// U+2028 / U+2029 are valid in JSON but are line terminators in JavaScript, so
// they must be escaped before JSON text is embedded in an injected script.
// Built via RegExp/String constructors so the raw code points never appear in
// this source file.
const LINE_SEPARATORS = new RegExp('[\\u2028\\u2029]', 'g');
const escapeLineSeparator = (ch: string): string =>
  ch === String.fromCharCode(0x2028) ? '\\u2028' : '\\u2029';

/**
 * Serialises a value into a JavaScript expression string that is safe to embed
 * inside a `WebView.injectJavaScript` payload. Double `JSON.stringify` yields a
 * fully-escaped JS string literal; the U+2028/U+2029 line separators are then
 * escaped explicitly so config values containing them cannot break out of, or
 * inject into, the script.
 */
export function toInjectableJson(value: unknown): string {
  return JSON.stringify(JSON.stringify(value)).replace(
    LINE_SEPARATORS,
    escapeLineSeparator
  );
}
