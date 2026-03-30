import { Appearance } from 'react-native';
import { getEffectiveTheme, resolveTheme } from '../utils/theme';

// Encode a plain string to standard base64 (compatible with the custom decode64 util)
const encode64 = (s: string) => Buffer.from(s).toString('base64');

const BASE_URL = 'https://link.meshconnect.com';

// Build a URL whose link_style param encodes a JSON theme object
const urlWithTheme = (th: string) =>
  `${BASE_URL}?link_style=${encode64(JSON.stringify({ th }))}`;

describe('getEffectiveTheme', () => {
  test('returns settings theme and ignores URL theme when both are present', () => {
    expect(getEffectiveTheme('light', urlWithTheme('dark'))).toBe('light');
  });

  test('returns URL link_style theme when no settings theme is provided', () => {
    expect(getEffectiveTheme(undefined, urlWithTheme('dark'))).toBe('dark');
  });

  test('returns URL link_style system theme when no settings theme is provided', () => {
    expect(getEffectiveTheme(undefined, urlWithTheme('system'))).toBe('system');
  });

  test('returns undefined when neither settings theme nor URL theme is present', () => {
    expect(getEffectiveTheme(undefined, BASE_URL)).toBeUndefined();
  });

  test('returns settings theme even when URL has no theme', () => {
    expect(getEffectiveTheme('dark', BASE_URL)).toBe('dark');
  });
});

describe('resolveTheme', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('returns "dark" when theme is "dark"', () => {
    expect(resolveTheme('dark')).toBe('dark');
  });

  test('returns "light" when theme is "light"', () => {
    expect(resolveTheme('light')).toBe('light');
  });

  test('returns "dark" when theme is "system" and device colour scheme is dark', () => {
    jest.spyOn(Appearance, 'getColorScheme').mockReturnValue('dark');
    expect(resolveTheme('system')).toBe('dark');
  });

  test('returns "light" when theme is "system" and device colour scheme is light', () => {
    jest.spyOn(Appearance, 'getColorScheme').mockReturnValue('light');
    expect(resolveTheme('system')).toBe('light');
  });

  test('returns "light" when theme is "system" and device colour scheme is null', () => {
    jest.spyOn(Appearance, 'getColorScheme').mockReturnValue(null);
    expect(resolveTheme('system')).toBe('light');
  });

  test('returns "light" as default when theme is undefined', () => {
    expect(resolveTheme(undefined)).toBe('light');
  });
});
