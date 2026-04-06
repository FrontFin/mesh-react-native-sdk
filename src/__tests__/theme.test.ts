import { extractThemeFromToken } from '../utils/theme';

const BASE_URL = 'https://link.meshconnect.com';

/** base64(JSON.stringify(...)) — values for the `link_style` query param */
const LINK_STYLE_DARK = 'eyJ0aCI6ImRhcmsifQ==';
const LINK_STYLE_LIGHT = 'eyJ0aCI6ImxpZ2h0In0=';
const LINK_STYLE_SYSTEM = 'eyJ0aCI6InN5c3RlbSJ9';
const LINK_STYLE_EMPTY_OBJECT = 'e30=';
const LINK_STYLE_TH_EMPTY = 'eyJ0aCI6IiJ9';
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
