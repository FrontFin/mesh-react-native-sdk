import { decodeLinkStyle } from './styleHelpers';
import { urlSearchParams } from './urlHelpers';
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
