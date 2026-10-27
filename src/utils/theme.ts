import { decode64 } from './base64';
import { decodeLinkStyle } from './styleHelpers';
import { getFirstURLParam, urlSearchParams } from './urlHelpers';
import {
  DARK_THEME_COLOR_BOTTOM,
  DARK_THEME_COLOR_TOP,
  LIGHT_THEME_COLOR_BOTTOM,
  LIGHT_THEME_COLOR_TOP,
  MFS_DARK_THEME_COLOR,
  MFS_LIGHT_THEME_COLOR,
} from '../constant';
import { LinkTheme } from '../types';

// Type guard to check if a string is a valid LinkTheme
function isLinkTheme(theme: string | undefined): theme is LinkTheme {
  return theme === 'light' || theme === 'dark' || theme === 'system';
}

// Extracts the theme from the link token's `link_style` query parameter, if present.
export function extractThemeFromToken(
  decodedUrl: string
): LinkTheme | undefined {
  const queryParams = urlSearchParams(decodedUrl);
  const styleParam = queryParams['link_style'];
  const style = decodeLinkStyle(styleParam);
  return isLinkTheme(style?.th) ? style.th : undefined;
}

const decodeBase64Url = (value: string) => {
  const base64 = value.replace(/-/g, '+').replace(/_/g, '/');
  return decode64(base64 + '='.repeat((4 - (base64.length % 4)) % 4));
};

// The MFS `token` param, validated the way MFS Link does; undefined for legacy links.
const getMfsTokenEnvelope = (url: string) => {
  const token = getFirstURLParam(url, 'token');
  if (!token) return undefined;
  try {
    const envelope = JSON.parse(decodeBase64Url(token));
    const isEnvelope =
      envelope !== null &&
      typeof envelope === 'object' &&
      typeof envelope.v === 'number' &&
      typeof envelope.c === 'string' &&
      envelope.c.length > 0;
    return isEnvelope ? (envelope as { th?: unknown }) : undefined;
  } catch {
    return undefined;
  }
};

export const isMfsLinkUrl = (url: string) => getMfsTokenEnvelope(url) !== undefined;

/**
 * Whether Link will render dark, resolved the way the page does so the native
 * background matches it: the first `th` param wins, then legacy `link_style`,
 * then the MFS token's theme. An MFS token without a theme follows the device;
 * legacy links default to light.
 */
export const isDarkLinkTheme = (url: string, systemIsDark: boolean) => {
  const th = getFirstURLParam(url, 'th');
  if (th === 'dark' || th === 'light') return th === 'dark';

  const linkStyleTheme = extractThemeFromToken(url);
  if (linkStyleTheme === 'system') return systemIsDark;
  if (linkStyleTheme) return linkStyleTheme === 'dark';

  const envelope = getMfsTokenEnvelope(url);
  if (!envelope) return false;
  if (envelope.th === 'LINK_THEME_DARK') return true;
  if (envelope.th === 'LINK_THEME_LIGHT') return false;
  return systemIsDark;
};

// MFS Link canvas colors (--color-bg-canvas-dark/light in FrontFin/link
// packages/ui/src/styles/tailwind.css), so the native background has no seam with the page.
export const getThemeColors = (isDarkTheme: boolean, isMfs = false) => {
  if (isMfs) {
    const color = isDarkTheme ? MFS_DARK_THEME_COLOR : MFS_LIGHT_THEME_COLOR;
    return { top: color, bottom: color };
  }
  return {
    top: isDarkTheme ? DARK_THEME_COLOR_TOP : LIGHT_THEME_COLOR_TOP,
    bottom: isDarkTheme ? DARK_THEME_COLOR_BOTTOM : LIGHT_THEME_COLOR_BOTTOM,
  };
};
