import { NativeModules, Platform } from 'react-native';
import { buildLinkUrl } from '../utils/linkUrl';
import type { LinkSettings } from '../types';

const base64Url = (json: string) =>
  Buffer.from(json).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const LEGACY_URL = 'https://link.meshconnect.com/?link_style=eyJ0aCI6ImxpZ2h0In0%3D&x=%7B%7D';
const sessionBase = (envelope: object) =>
  `https://link.meshpay.com/?token=${base64Url(JSON.stringify(envelope))}&flow=%7B%22flow%22%3A%22login%22%7D`;
const MFS_URL = sessionBase({ v: 1, c: 'client', th: 'LINK_THEME_LIGHT' });

describe('buildLinkUrl', () => {
  test('replaces th, lng, fiatCur and platform already in the token, keeps the rest as is', () => {
    const url = `${MFS_URL}&th=dark&lng=fr&fiatCur=EUR&platform=web#f`;
    const built = buildLinkUrl(
      url,
      { theme: 'light', language: 'de', displayFiatCurrency: 'USD' },
      false
    );

    expect(built.url).toBe(`${MFS_URL}&th=light&lng=de&fiatCur=USD&platform=reactNative#f`);
    expect(built.isDarkTheme).toBe(false);
  });

  test('a token with th twice ends up with one th', () => {
    const { url } = buildLinkUrl(`${MFS_URL}&th=dark&th=dark`, { theme: 'light' }, false);
    expect(url.match(/[?&]th=/g)).toHaveLength(1);
    expect(url).toContain('&th=light');
  });

  test("without an app theme the token's th stays and decides the native theme", () => {
    expect(buildLinkUrl(`${MFS_URL}&th=dark`, undefined, false)).toEqual({
      url: `${MFS_URL}&th=dark&platform=reactNative`,
      isDarkTheme: true,
      backgroundColor: '#151515',
    });
    expect(buildLinkUrl(LEGACY_URL, {}, true)).toEqual({
      url: `${LEGACY_URL}&platform=reactNative`,
      isDarkTheme: false,
      backgroundColor: '#F9F9F9',
    });
  });

  test('system is sent as system, and the native theme follows the token, then the device', () => {
    for (const systemIsDark of [true, false]) {
      const { url, isDarkTheme } = buildLinkUrl(MFS_URL, { theme: 'system' }, systemIsDark);
      expect(url).toContain('&th=system&');
      // the token says light, so the device does not matter
      expect(isDarkTheme).toBe(false);

      const noTokenTheme = sessionBase({ v: 1, c: 'client' });
      expect(buildLinkUrl(noTokenTheme, { theme: 'system' }, systemIsDark).isDarkTheme).toBe(
        systemIsDark
      );
      expect(buildLinkUrl(LEGACY_URL, { theme: 'system' }, systemIsDark).isDarkTheme).toBe(
        systemIsDark
      );
    }
  });

  test('system replaces the th=dark the backend adds on silent migration', () => {
    const { url } = buildLinkUrl(`${MFS_URL}&th=dark`, { theme: 'system' }, true);
    expect(url).toBe(`${MFS_URL}&th=system&platform=reactNative`);
  });

  test('a theme the SDK does not know is not sent', () => {
    const { url } = buildLinkUrl(MFS_URL, { theme: 'blue' as LinkSettings['theme'] }, false);
    expect(url).toBe(`${MFS_URL}&platform=reactNative`);
  });

  test("returns the page's own color from the token", () => {
    const url = sessionBase({ v: 1, c: 'client', bgl: '#112233', bgd: '#445566' });
    expect(buildLinkUrl(url, { theme: 'dark' }, false).backgroundColor).toBe('#445566');
    expect(buildLinkUrl(url, { theme: 'light' }, true).backgroundColor).toBe('#112233');
  });

  test('system language is sent as the full device tag', () => {
    const originalOS = Platform.OS;
    (Platform as { OS: string }).OS = 'android';
    (NativeModules as Record<string, unknown>).I18nManager = { localeIdentifier: 'en_US' };

    expect(buildLinkUrl(MFS_URL, { language: 'system' }, false).url).toContain('&lng=en-US&');

    (Platform as { OS: string }).OS = originalOS;
    delete (NativeModules as Record<string, unknown>).I18nManager;
  });

  test('blank language and currency are not sent', () => {
    const { url } = buildLinkUrl(MFS_URL, { language: ' ', displayFiatCurrency: ' ' }, false);
    expect(url).toBe(`${MFS_URL}&platform=reactNative`);
  });

  test('values are trimmed and encoded', () => {
    const { url } = buildLinkUrl(MFS_URL, { language: ' pt-BR ', displayFiatCurrency: ' EUR ' }, false);
    expect(url).toContain('&lng=pt-BR&fiatCur=EUR&');
  });
});
