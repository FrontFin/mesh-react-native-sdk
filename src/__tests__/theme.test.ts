import { LEGACY_LINK_COLORS, LINK_COLORS } from '../constant';
import { getThemeColor, isDarkColor, resolveLinkAppearance } from '../utils/theme';

const base64Url = (json: string) =>
  Buffer.from(json)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

// A link with a session token, the way the latest Link gets it.
const sessionUrl = (envelope: object, extra = '') =>
  `https://link.meshpay.com/?token=${base64Url(JSON.stringify(envelope))}&flow=%7B%7D${extra}`;

// A legacy link, with the client's style in link_style (standard base64, URL encoded).
const linkStyleParam = (style: object) =>
  encodeURIComponent(Buffer.from(JSON.stringify(style)).toString('base64'));
const legacyUrl = (style?: object, extra = '') =>
  `https://link.meshconnect.com/?auth_code=x${style ? `&link_style=${linkStyleParam(style)}` : ''}${extra}`;

const isDark = (url: string, systemIsDark: boolean) =>
  resolveLinkAppearance(url, systemIsDark).isDarkTheme;

describe('resolveLinkAppearance: theme of a link with a session token', () => {
  const client = { v: 1, c: 'client' };

  test('th=light or th=dark in the URL wins over the token theme', () => {
    const dark = { ...client, th: 'LINK_THEME_DARK' };
    expect(isDark(sessionUrl(dark, '&th=light'), true)).toBe(false);
    expect(isDark(sessionUrl({ ...client, th: 'LINK_THEME_LIGHT' }, '&th=dark'), false)).toBe(true);
  });

  test('then the theme in the token', () => {
    expect(isDark(sessionUrl({ ...client, th: 'LINK_THEME_DARK' }), false)).toBe(true);
    expect(isDark(sessionUrl({ ...client, th: 'LINK_THEME_LIGHT' }), true)).toBe(false);
  });

  test('th=system leaves the decision to the token, so the token theme still wins', () => {
    expect(isDark(sessionUrl({ ...client, th: 'LINK_THEME_LIGHT' }, '&th=system'), true)).toBe(false);
    expect(isDark(sessionUrl({ ...client, th: 'LINK_THEME_DARK' }, '&th=system'), false)).toBe(true);
  });

  test('then the device, whether th is system, missing or garbage', () => {
    for (const extra of ['', '&th=system', '&th=blue', '&th=']) {
      expect(isDark(sessionUrl(client, extra), true)).toBe(true);
      expect(isDark(sessionUrl(client, extra), false)).toBe(false);
    }
  });

  test('a token theme that is unspecified or unknown follows the device', () => {
    for (const th of ['LINK_THEME_UNSPECIFIED', 'constructor', 7, null]) {
      expect(isDark(sessionUrl({ ...client, th }), true)).toBe(true);
      expect(isDark(sessionUrl({ ...client, th }), false)).toBe(false);
    }
  });

  test('link_style is not read', () => {
    const url = sessionUrl(client, `&link_style=${linkStyleParam({ th: 'dark' })}`);
    expect(isDark(url, false)).toBe(false);
  });

  test('a token that is not a session token is a legacy link, so its theme is ignored', () => {
    const notSession = [
      { c: 'client', th: 'LINK_THEME_DARK' },
      { v: '1', c: 'client', th: 'LINK_THEME_DARK' },
      { v: 1, c: '', th: 'LINK_THEME_DARK' },
      { v: 1, th: 'LINK_THEME_DARK' },
    ];
    for (const envelope of notSession) {
      expect(isDark(sessionUrl(envelope), false)).toBe(true);
    }
    expect(isDark('https://link.meshpay.com/?token=not-json', false)).toBe(true);
  });
});

describe('resolveLinkAppearance: theme of a legacy link', () => {
  test('th=light or th=dark in the URL wins over link_style', () => {
    expect(isDark(legacyUrl({ th: 'dark' }, '&th=light'), true)).toBe(false);
    expect(isDark(legacyUrl({ th: 'light' }, '&th=dark'), false)).toBe(true);
  });

  test('th=system means the device, even when link_style has a theme', () => {
    expect(isDark(legacyUrl({ th: 'dark' }, '&th=system'), false)).toBe(false);
    expect(isDark(legacyUrl({ th: 'light' }, '&th=system'), true)).toBe(true);
  });

  test('then link_style.th, with system read from the device', () => {
    expect(isDark(legacyUrl({ th: 'light' }), true)).toBe(false);
    expect(isDark(legacyUrl({ th: 'dark' }), false)).toBe(true);
    expect(isDark(legacyUrl({ th: 'light' }, '&th=blue'), true)).toBe(false);
    expect(isDark(legacyUrl({ th: 'system' }), false)).toBe(false);
    expect(isDark(legacyUrl({ th: 'system' }), true)).toBe(true);
  });

  test('link_style survives a stripped padding and a + read as a space', () => {
    // base64 of '{"th":"light","x":"?>"}' has a '+'
    const withPlus = 'eyJ0aCI6ImxpZ2h0IiwieCI6Ij8+In0=';
    const url = (value: string) => `https://link.meshconnect.com/?link_style=${value}`;
    expect(isDark(url(withPlus.replace(/=+$/, '')), true)).toBe(false);
    expect(isDark(url(withPlus.replace('+', ' ')), true)).toBe(false);
  });

  test('then the default (dark), even on a light device', () => {
    expect(isDark(legacyUrl(), false)).toBe(true);
    expect(isDark('https://link.meshconnect.com/', false)).toBe(true);
    for (const value of ['', '%%%', 'bm90IGpzb24=', 'e30=', 'eyJ0aCI6IiJ9']) {
      expect(isDark(`https://link.meshconnect.com/?link_style=${value}`, false)).toBe(true);
    }
  });
});

describe('resolveLinkAppearance: background color', () => {
  const background = (url: string, systemIsDark: boolean) =>
    resolveLinkAppearance(url, systemIsDark).backgroundColor;

  test("uses the page's bgd on a dark theme and bgl on a light theme, from the token", () => {
    const envelope = { v: 1, c: 'client', bgl: '#112233', bgd: '#445566' };
    expect(background(sessionUrl(envelope, '&th=dark'), false)).toBe('#445566');
    expect(background(sessionUrl(envelope, '&th=light'), true)).toBe('#112233');
  });

  test('and from link_style on a legacy link', () => {
    const style = { bgl: '#112233', bgd: '#445566' };
    expect(background(legacyUrl(style, '&th=dark'), false)).toBe('#445566');
    expect(background(legacyUrl(style, '&th=light'), true)).toBe('#112233');
  });

  test('a short hex is expanded and the alpha is dropped', () => {
    const color = (bgd: string) =>
      background(sessionUrl({ v: 1, c: 'client', bgd }, '&th=dark'), false);
    expect(color('#abc')).toBe('#aabbcc');
    expect(color('#abcd')).toBe('#aabbcc');
    expect(color('#11223344')).toBe('#112233');
    expect(color('#ABCDEF')).toBe('#ABCDEF');
  });

  test('a missing or invalid color falls back, for each theme on its own', () => {
    for (const bad of ['red', 'rgb(1,2,3)', '#12', '#12345', '#ggg', '', 123, null]) {
      const envelope = { v: 1, c: 'client', bgd: bad };
      expect(background(sessionUrl(envelope, '&th=dark'), false)).toBe('#1C1C1C');
    }
    // only the other theme has a color
    const onlyLight = { v: 1, c: 'client', bgl: '#123456' };
    expect(background(sessionUrl(onlyLight, '&th=dark'), false)).toBe('#1C1C1C');
    expect(background(sessionUrl(onlyLight, '&th=light'), true)).toBe('#123456');
    // a legacy link has its own pair
    expect(background(legacyUrl(), false)).toBe('#0E0D0D');
    expect(background(legacyUrl({ th: 'light' }), true)).toBe('#FBFBFB');
  });
});

describe('getThemeColor', () => {
  test('the fallback color per theme', () => {
    expect(getThemeColor(true)).toBe('#1C1C1C');
    expect(getThemeColor(false)).toBe('#F9F9F9');
    expect(getThemeColor(true, LEGACY_LINK_COLORS)).toBe('#0E0D0D');
    expect(getThemeColor(false, LEGACY_LINK_COLORS)).toBe('#FBFBFB');
  });
});

describe('isDarkColor', () => {
  test('tells dark from light, including the fallback colors', () => {
    expect(isDarkColor('#000000')).toBe(true);
    expect(isDarkColor('#445566')).toBe(true);
    expect(isDarkColor('#FFFFFF')).toBe(false);
    expect(isDarkColor('#DDEEFF')).toBe(false);
    // Saturated colors that look bright: pick the side with the better contrast
    expect(isDarkColor('#00CC00')).toBe(false);
    expect(isDarkColor('#808080')).toBe(false);
    expect(isDarkColor('#0000FF')).toBe(true);
    expect(isDarkColor('#CC0000')).toBe(true);
    for (const colors of [LINK_COLORS, LEGACY_LINK_COLORS]) {
      expect(isDarkColor(colors.dark)).toBe(true);
      expect(isDarkColor(colors.light)).toBe(false);
    }
  });
});
