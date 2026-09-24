import { buildBackupWidgetUrl, extractOrigin, toInjectableJson } from '../utils';

describe('buildBackupWidgetUrl', () => {
  const base = { platform: 'reactNative', sdkVersion: '2.4.8' };

  test('appends platform and sdkVersion to a bare origin', () => {
    expect(buildBackupWidgetUrl('https://widget.example', base)).toBe(
      'https://widget.example?platform=reactNative&sdkVersion=2.4.8'
    );
  });

  test('normalises a trailing slash before appending params', () => {
    expect(buildBackupWidgetUrl('https://widget.example/', base)).toBe(
      'https://widget.example?platform=reactNative&sdkVersion=2.4.8'
    );
  });

  test('includes theme and language when provided', () => {
    const url = buildBackupWidgetUrl('https://widget.example', {
      ...base,
      theme: 'dark',
      language: 'en-US',
    });
    expect(url).toContain('th=dark');
    expect(url).toContain('lng=en-US');
  });

  test('omits theme and language when absent', () => {
    const url = buildBackupWidgetUrl('https://widget.example', base);
    expect(url).not.toContain('th=');
    expect(url).not.toContain('lng=');
  });

  test('never carries deposit config in the URL', () => {
    // Only display hints belong on the URL — the config goes over the bridge.
    const url = buildBackupWidgetUrl('https://widget.example', base);
    expect(url).not.toMatch(/address|token|clientId|userId|jit/i);
  });
});

describe('extractOrigin', () => {
  test.each([
    ['https://host.example/widget/page?x=1#y', 'https://host.example'],
    ['https://host.example:8443/p', 'https://host.example:8443'],
    ['https://host.example', 'https://host.example'],
    ['https://host.example/', 'https://host.example'],
  ])('reduces %s to its origin %s', (url, origin) => {
    expect(extractOrigin(url)).toBe(origin);
  });

  test('returns a non-absolute input unchanged', () => {
    expect(extractOrigin('not-a-url')).toBe('not-a-url');
  });
});

describe('toInjectableJson', () => {
  test('round-trips through the injected JSON.parse form', () => {
    const config = {
      clientId: 'abc',
      userId: 'user-1',
      destinations: [{ networkId: 'net', symbol: 'USDC' }],
    };
    // The component injects `JSON.parse(<literal>)`; simulate that here.
    const literal = toInjectableJson(config);
    expect(JSON.parse(JSON.parse(literal))).toEqual(config);
  });

  test('escapes U+2028 / U+2029 so they cannot break the injected script', () => {
    const literal = toInjectableJson({ note: 'a b c' });
    expect(literal).toContain('\\u2028');
    expect(literal).toContain('\\u2029');
    expect(literal).not.toContain(' ');
    expect(literal).not.toContain(' ');
  });

  test('escapes quotes and backslashes in values', () => {
    const literal = toInjectableJson({ address: '0x"abc\\def' });
    // Must remain a single valid JS string literal that parses back cleanly.
    expect(JSON.parse(JSON.parse(literal))).toEqual({ address: '0x"abc\\def' });
  });
});
