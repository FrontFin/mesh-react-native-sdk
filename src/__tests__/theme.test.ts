import { extractThemeFromToken } from '../utils/theme';

const BASE_URL = 'https://link.meshconnect.com';

const encode64 = (s: string) => Buffer.from(s).toString('base64');

const urlWithLinkStyle = (styleObject: Record<string, unknown>) =>
  `${BASE_URL}?link_style=${encode64(JSON.stringify(styleObject))}`;

describe('extractThemeFromToken', () => {
  test('returns th from link_style when theme is dark', () => {
    expect(extractThemeFromToken(urlWithLinkStyle({ th: 'dark' }))).toBe(
      'dark'
    );
  });

  test('returns th from link_style when theme is light', () => {
    expect(extractThemeFromToken(urlWithLinkStyle({ th: 'light' }))).toBe(
      'light'
    );
  });

  test('returns th from link_style when theme is system', () => {
    expect(extractThemeFromToken(urlWithLinkStyle({ th: 'system' }))).toBe(
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
    const notJson = encode64('not json');
    expect(
      extractThemeFromToken(`${BASE_URL}?link_style=${notJson}`)
    ).toBeUndefined();
  });

  test('returns undefined when JSON has no th field', () => {
    expect(extractThemeFromToken(urlWithLinkStyle({}))).toBeUndefined();
  });

  test('returns undefined when th is present but not a valid LinkTheme', () => {
    expect(extractThemeFromToken(urlWithLinkStyle({ th: '' }))).toBeUndefined();
  });

  test('finds link_style when other query parameters are present', () => {
    const withTheme = urlWithLinkStyle({ th: 'dark' });
    const url = withTheme.replace(BASE_URL, `${BASE_URL}/path`);
    const withExtra = `${url}&foo=bar&baz=1`;
    expect(extractThemeFromToken(withExtra)).toBe('dark');
  });
});
