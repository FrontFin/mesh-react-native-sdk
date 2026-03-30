import { LinkTheme } from '../types';
import { decodeLinkStyle } from './styleHelpers';
import { urlSearchParams } from './urlHelpers';
import { Appearance } from 'react-native';

//  Determines the effective theme to apply based on the LinkConfiguration settings and
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

// Resolves the theme to either 'light' or 'dark', treating 'system' as a special case that
// uses the device's current color scheme.
export function resolveTheme(theme: LinkTheme | undefined): 'light' | 'dark' {
  if (theme === 'system') {
    return Appearance.getColorScheme() === 'dark' ? 'dark' : 'light';
  }
  return theme === 'dark' ? 'dark' : 'light';
}
