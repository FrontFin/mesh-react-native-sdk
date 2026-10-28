import { extractThemeFromToken, getThemeColors, isDarkLinkTheme, isMfsLinkUrl } from '../utils/theme';

const BASE_URL = 'https://link.meshconnect.com';

// base64('{"th":"dark"}')
const LINK_STYLE_DARK = 'eyJ0aCI6ImRhcmsifQ==';
// base64('{"th":"light"}')
const LINK_STYLE_LIGHT = 'eyJ0aCI6ImxpZ2h0In0=';
// base64('{"th":"system"}')
const LINK_STYLE_SYSTEM = 'eyJ0aCI6InN5c3RlbSJ9';
// base64('{}')
const LINK_STYLE_EMPTY_OBJECT = 'e30=';
// base64('{"th":""}')
const LINK_STYLE_TH_EMPTY = 'eyJ0aCI6IiJ9';
// base64('not json')
const LINK_STYLE_NOT_JSON = 'bm90IGpzb24=';

const urlWithLinkStyle = (linkStyleBase64: string) =>
  `${BASE_URL}?link_style=${linkStyleBase64}`;

describe('extractThemeFromToken', () => {
  test('returns th from link_style when theme is dark', () => {
    expect(extractThemeFromToken(urlWithLinkStyle(LINK_STYLE_DARK))).toBe(
      'dark'
    );
  });

  test('returns th from link_style when theme is light', () => {
    expect(extractThemeFromToken(urlWithLinkStyle(LINK_STYLE_LIGHT))).toBe(
      'light'
    );
  });

  test('returns th from link_style when theme is system', () => {
    expect(extractThemeFromToken(urlWithLinkStyle(LINK_STYLE_SYSTEM))).toBe(
      'system'
    );
  });

  test('returns undefined when URL has no link_style', () => {
    expect(extractThemeFromToken(BASE_URL)).toBeUndefined();
  });

  test('returns undefined when link_style is empty', () => {
    expect(extractThemeFromToken(`${BASE_URL}?link_style=`)).toBeUndefined();
  });

  test('returns undefined when link_style is not valid base64', () => {
    expect(
      extractThemeFromToken(`${BASE_URL}?link_style=%%%`)
    ).toBeUndefined();
  });

  test('returns undefined when decoded payload is not valid JSON', () => {
    expect(
      extractThemeFromToken(urlWithLinkStyle(LINK_STYLE_NOT_JSON))
    ).toBeUndefined();
  });

  test('returns undefined when JSON has no th field', () => {
    expect(
      extractThemeFromToken(urlWithLinkStyle(LINK_STYLE_EMPTY_OBJECT))
    ).toBeUndefined();
  });

  test('returns undefined when th is present but not a valid LinkTheme', () => {
    expect(
      extractThemeFromToken(urlWithLinkStyle(LINK_STYLE_TH_EMPTY))
    ).toBeUndefined();
  });

  test('finds link_style when other query parameters are present', () => {
    const withTheme = urlWithLinkStyle(LINK_STYLE_DARK);
    const url = withTheme.replace(BASE_URL, `${BASE_URL}/path`);
    const withExtra = `${url}&foo=bar&baz=1`;
    expect(extractThemeFromToken(withExtra)).toBe('dark');
  });
});

const base64Url = (json: string) =>
  Buffer.from(json).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const mfsLink = (th?: string, extra = '') =>
  `https://link.meshpay.com/?token=${base64Url(JSON.stringify({ v: 1, c: 'client', ...(th ? { th } : {}) }))}${extra}`;

describe('isDarkLinkTheme', () => {
  test('first th param wins', () => {
    expect(isDarkLinkTheme(mfsLink('LINK_THEME_LIGHT', '&th=dark&th=light'), false)).toBe(true);
    expect(isDarkLinkTheme(`${BASE_URL}?th=light&th=dark`, true)).toBe(false);
  });

  test('an invalid th is ignored', () => {
    expect(isDarkLinkTheme(mfsLink('LINK_THEME_DARK', '&th=system'), false)).toBe(true);
  });

  test('legacy link_style theme', () => {
    expect(isDarkLinkTheme(urlWithLinkStyle(LINK_STYLE_DARK), false)).toBe(true);
    expect(isDarkLinkTheme(urlWithLinkStyle(LINK_STYLE_LIGHT), true)).toBe(false);
    expect(isDarkLinkTheme(urlWithLinkStyle(LINK_STYLE_SYSTEM), true)).toBe(true);
    expect(isDarkLinkTheme(urlWithLinkStyle(LINK_STYLE_SYSTEM), false)).toBe(false);
  });

  test('MFS token theme, and the device when it has none', () => {
    expect(isDarkLinkTheme(mfsLink('LINK_THEME_DARK'), false)).toBe(true);
    expect(isDarkLinkTheme(mfsLink('LINK_THEME_LIGHT'), true)).toBe(false);
    expect(isDarkLinkTheme(mfsLink(), true)).toBe(true);
    expect(isDarkLinkTheme(mfsLink(), false)).toBe(false);
    expect(isDarkLinkTheme(mfsLink('LINK_THEME_UNSPECIFIED'), true)).toBe(true);
  });

  test('legacy link without a theme stays light', () => {
    expect(isDarkLinkTheme(BASE_URL, true)).toBe(false);
    expect(isDarkLinkTheme(`${BASE_URL}?token=${base64Url('{"a":1}')}`, true)).toBe(false);
    expect(isDarkLinkTheme(`${BASE_URL}?token=not-base64`, true)).toBe(false);
    expect(isDarkLinkTheme(`https://link.meshpay.com/?token=${base64Url('{"v":1,"c":""}')}`, true)).toBe(false);
  });
});

describe('isMfsLinkUrl and getThemeColors', () => {
  test('detects MFS links by their token', () => {
    expect(isMfsLinkUrl(mfsLink(undefined, '&th=dark'))).toBe(true);
    expect(isMfsLinkUrl(`${BASE_URL}?th=dark`)).toBe(false);
  });

  test('MFS links use the MFS page colors, legacy keeps its own', () => {
    expect(getThemeColors(true, true)).toEqual({ top: '#1C1C1C', bottom: '#1C1C1C' });
    expect(getThemeColors(false, true)).toEqual({ top: '#F9F9F9', bottom: '#F9F9F9' });
    expect(getThemeColors(true)).toEqual({ top: '#1E1E24', bottom: '#0E0D0D' });
  });
});
