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
 * The token URL with the params the app set (`th`, `lng`, `fiatCur`, plus `platform`) replacing any
 * already in it; the rest of the URL stays byte for byte. `system` is sent as `system`, so Link
 * decides. It does not depend on the device, so it identifies one Link page: when it is the same,
 * the WebView does not reload.
 */
export const buildPageUrl = (
  linkUrl: string,
  settings: LinkSettings | undefined
): string => {
  const language = resolveLanguage(settings?.language);
  const fiatCurrency = settings?.displayFiatCurrency?.trim();

  const params: Record<string, string> = {};
  if (settings?.theme && APP_THEMES.includes(settings.theme)) {
    params.th = settings.theme;
  }
  if (language) params.lng = language;
  if (fiatCurrency) params.fiatCur = fiatCurrency;
  params.platform = sdkSpecs.platform;

  return setURLParams(linkUrl, params);
};

/**
 * Builds the Link URL like the other mobile SDKs (see buildPageUrl). On a legacy link, when the
 * device decides, the resolved theme is also written, so Link and the bars read the device the
 * same way. Also returns the theme and color Link opens with; see resolveLinkAppearance.
 */
export const buildLinkUrl = (
  linkUrl: string,
  settings: LinkSettings | undefined,
  systemIsDark: boolean
): LinkUrl => {
  const url = buildPageUrl(linkUrl, settings);
  const { themeToWrite, ...appearance } = resolveLinkAppearance(
    url,
    systemIsDark
  );
  return {
    url: themeToWrite ? setURLParams(url, { th: themeToWrite }) : url,
    ...appearance,
  };
};
