import { decodeJsonParam } from './styleHelpers';
import { getFirstURLParam } from './urlHelpers';
import { LEGACY_LINK_COLORS, LINK_COLORS } from '../constant';

type Theme = 'light' | 'dark';

// What link-v2 shows when nothing sets a theme.
const DEFAULT_THEME: Theme = 'dark';

// Same shape Link accepts for a page color: #RGB, #RGBA, #RRGGBB or #RRGGBBAA.
const HEX_COLOR = /^#(?:[0-9a-fA-F]{3,4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/;

/** The theme a session token names; undefined for "match the device" or anything unknown. */
const toSessionTheme = (value: unknown): Theme | undefined =>
  value === 'LINK_THEME_DARK'
    ? 'dark'
    : value === 'LINK_THEME_LIGHT'
      ? 'light'
      : undefined;

type PageStyle = { th?: unknown; bgl?: unknown; bgd?: unknown };

/**
 * The session token's content (`token` param), checked the way Link checks it. Undefined for a
 * legacy link, which has no such token. The token is not signed, so nothing in it is trusted.
 */
const readSessionToken = (url: string): PageStyle | undefined => {
  const token = decodeJsonParam(getFirstURLParam(url, 'token'));
  return typeof token?.v === 'number' &&
    typeof token.c === 'string' &&
    token.c.length > 0
    ? token
    : undefined;
};

/** `light` and `dark` as they are, undefined for anything else (`system` included). */
const toFixedTheme = (value: unknown): Theme | undefined =>
  value === 'light' || value === 'dark' ? value : undefined;

/** Marks a choice that is left to the device. */
const DEVICE = 'device';

/** `#RRGGBB` from a valid hex color, alpha dropped; undefined for anything else. */
const toOpaqueHex = (value: unknown): string | undefined => {
  if (typeof value !== 'string' || !HEX_COLOR.test(value)) return undefined;
  const digits = value.slice(1);
  const full =
    digits.length <= 4
      ? digits
          .split('')
          .map((digit) => digit + digit)
          .join('')
      : digits;
  return `#${full.slice(0, 6)}`;
};

type ColorPair = { readonly dark: string; readonly light: string };

/** The color around Link when the token has no valid page color for the theme. */
export const getThemeColor = (
  isDarkTheme: boolean,
  colors: ColorPair = LINK_COLORS
) => (isDarkTheme ? colors.dark : colors.light);

/**
 * The theme Link opens in and the color around it, read from the URL the way the page reads it,
 * so the status bar, nav bar and background match with no visible seam.
 *
 * Theme, first one set wins:
 * 1. `th=light` or `th=dark` in the URL (the app's choice, or the one the token came with)
 * 2. the theme in the session token, for a link that has one
 * 3. `th=system` in the URL means the device on any link
 * 4. `link_style.th` (legacy links only), `system` meaning the device
 * 5. the device for a link with a session token, otherwise the default (dark, like link-v2)
 *
 * Color: the page's own `bgd` (dark) or `bgl` (light) from the session token or `link_style`,
 * otherwise the fallback pair of that Link version (a link with a session token, or a legacy link).
 *
 * `themeToWrite` is set for a legacy link whose theme comes from the device. The WebView can read
 * the device differently from the app (a host app with a dark-only Android theme), so the caller
 * writes this resolved theme into the URL and Link follows the same reading as the bars.
 */
export const resolveLinkAppearance = (
  url: string,
  systemIsDark: boolean
): { isDarkTheme: boolean; backgroundColor: string; themeToWrite?: Theme } => {
  const sessionToken = readSessionToken(url);
  const linkStyle = sessionToken
    ? undefined
    : (decodeJsonParam(getFirstURLParam(url, 'link_style')) as
        | PageStyle
        | undefined);
  const urlTheme = getFirstURLParam(url, 'th');

  const choice: Theme | typeof DEVICE =
    toFixedTheme(urlTheme) ??
    toSessionTheme(sessionToken?.th) ??
    (urlTheme === 'system' ? DEVICE : undefined) ??
    toFixedTheme(linkStyle?.th) ??
    (linkStyle?.th === 'system' ? DEVICE : undefined) ??
    (sessionToken ? DEVICE : DEFAULT_THEME);
  const deviceTheme: Theme = systemIsDark ? 'dark' : 'light';
  const theme = choice === DEVICE ? deviceTheme : choice;
  const isDarkTheme = theme === 'dark';

  const pageStyle = sessionToken ?? linkStyle;
  const colors = sessionToken ? LINK_COLORS : LEGACY_LINK_COLORS;
  return {
    isDarkTheme,
    backgroundColor:
      toOpaqueHex(isDarkTheme ? pageStyle?.bgd : pageStyle?.bgl) ??
      getThemeColor(isDarkTheme, colors),
    ...(choice === DEVICE && !sessionToken ? { themeToWrite: theme } : {}),
  };
};
