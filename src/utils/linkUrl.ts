import { resolveLanguage } from './language';
import { sdkSpecs } from './sdkConfig';
import { resolveLinkAppearance } from './theme';
import { setURLParams } from './urlHelpers';
import { LinkSettings } from '../types';

/** The URL to open, whether it opens dark, and the color around it. */
export type LinkUrl = {
  url: string;
  isDarkTheme: boolean;
  backgroundColor: string;
};

const APP_THEMES = ['light', 'dark', 'system'];

/**
 * Builds the Link URL in one pass, the same way as the other mobile SDKs: the params the app set
 * (`th`, `lng`, `fiatCur`, plus `platform`) replace any already in the token URL, and the rest
 * of the URL stays byte for byte. `th` is written when the app sets a theme (`system` is sent as
 * `system`, so Link decides), and, on a legacy link, when the device decides: then the resolved
 * theme is written, so Link and the bars read the device the same way. Also returns the theme and
 * color Link opens with; see resolveLinkAppearance.
 */
export const buildLinkUrl = (
  linkUrl: string,
  settings: LinkSettings | undefined,
  systemIsDark: boolean
): LinkUrl => {
  const language = resolveLanguage(settings?.language);
  const fiatCurrency = settings?.displayFiatCurrency?.trim();

  const params: Record<string, string> = {};
  if (settings?.theme && APP_THEMES.includes(settings.theme)) {
    params.th = settings.theme;
  }
  if (language) params.lng = language;
  if (fiatCurrency) params.fiatCur = fiatCurrency;
  params.platform = sdkSpecs.platform;

  const url = setURLParams(linkUrl, params);
  const { themeToWrite, ...appearance } = resolveLinkAppearance(url, systemIsDark);
  return {
    url: themeToWrite ? setURLParams(url, { th: themeToWrite }) : url,
    ...appearance,
  };
};
