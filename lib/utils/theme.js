import { decodeLinkStyle } from './styleHelpers';
import { urlSearchParams } from './urlHelpers';
// Type guard to check if a string is a valid LinkTheme
function isLinkTheme(theme) {
    return theme === 'light' || theme === 'dark' || theme === 'system';
}
// Extracts the theme from the link token's `link_style` query parameter, if present.
export function extractThemeFromToken(decodedUrl) {
    const queryParams = urlSearchParams(decodedUrl);
    const styleParam = queryParams['link_style'];
    const style = decodeLinkStyle(styleParam);
    return isLinkTheme(style === null || style === void 0 ? void 0 : style.th) ? style.th : undefined;
}
