import { decodeLinkStyle } from './styleHelpers';
import { urlSearchParams } from './urlHelpers';
import { Appearance } from 'react-native';

// Determines the effective theme to apply based on the LinkConfiguration settings and
// the link token.
export function getEffectiveTheme(
  settingsTheme: string | undefined,
  decodedUrl: string
): string | undefined {
  return settingsTheme ?? extractThemeFromToken(decodedUrl);
}

// Extracts the theme from the link token's `link_style` query parameter, if present.
function extractThemeFromToken(decodedUrl: string): string | undefined {
  const queryParams = urlSearchParams(decodedUrl);
  const styleParam = queryParams['link_style'];
  const style = decodeLinkStyle(styleParam);
  return style?.th;
}

// This function resolves the theme to apply based on the provided theme value.
// If the theme is set to 'system', it returns the current color scheme of the device.
// Otherwise, it returns the provided theme ('light' or 'dark').
export function resolveTheme(
  theme: string | undefined
): string | undefined | null {
  return theme === 'system' ? Appearance.getColorScheme() : theme;
}
