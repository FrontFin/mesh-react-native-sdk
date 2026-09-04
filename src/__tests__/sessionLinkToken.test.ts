import { sessionLinkToken } from '../utils/sessionLinkToken';
import { decode64, encode64 } from '../utils/base64';
import { LINK_URLS, WHITELISTED_ORIGINS } from '../constant';

/**
 * `sessionLinkToken` is the MFS-native entry point: it wraps a bare session
 * token into the base64-of-a-URL shape `LinkConnect` already consumes, so both
 * paths share one code path from that point on.
 */
describe('sessionLinkToken', () => {
  const token = 'ory_ac_abc123.def456';
  const urlFor = (t: string) => decode64(t);

  it('defaults to nothing: the environment is required', () => {
    // @ts-expect-error environment is deliberately not optional
    expect(() => sessionLinkToken(token)).toThrow();
  });

  it('wraps the token for each environment host', () => {
    expect(urlFor(sessionLinkToken(token, 'prod'))).toBe(
      `https://link.meshpay.com/?token=${token}`
    );
    expect(urlFor(sessionLinkToken(token, 'sbx'))).toBe(
      `https://link.sbx.meshpay.com/?token=${token}`
    );
    expect(urlFor(sessionLinkToken(token, 'dev'))).toBe(
      `https://link.dev.meshpay.com/?token=${token}`
    );
  });

  it('percent-encodes reserved characters instead of truncating', () => {
    // A token carrying `&` was previously lost from that point on.
    const messy = 'abc&x=1#frag+plus%25';
    const url = urlFor(sessionLinkToken(messy, 'prod'));
    expect(url).toContain(encodeURIComponent(messy));
    expect(url).not.toContain('#frag');
  });

  it('rejects an empty token', () => {
    expect(() => sessionLinkToken('', 'prod')).toThrow(
      /requires a session token/
    );
  });

  it('rejects an unknown environment', () => {
    expect(() =>
      // @ts-expect-error exercising the runtime guard
      sessionLinkToken(token, 'staging')
    ).toThrow(/Unknown Mesh Link environment/);
  });

  it('every environment host is covered by the origin allowlist', () => {
    // RN hands WHITELISTED_ORIGINS to react-native-webview's `originWhitelist`
    // rather than matching itself, so assert the hosts fall under the pattern.
    // A typo'd host here would surface on device as a blocked navigation.
    expect(WHITELISTED_ORIGINS).toContain('*.meshpay.com');
    Object.values(LINK_URLS).forEach((url) => {
      expect(new URL(url).hostname.endsWith('.meshpay.com')).toBe(true);
    });
  });
});

describe('encode64', () => {
  it('round-trips through decode64', () => {
    const samples = [
      'https://link.meshpay.com/?token=a',
      'a',
      'ab',
      'abc',
      'abcd',
    ];
    samples.forEach((s) => expect(decode64(encode64(s))).toBe(s));
  });

  it('pads like standard base64', () => {
    expect(encode64('a')).toBe('YQ==');
    expect(encode64('ab')).toBe('YWI=');
    expect(encode64('abc')).toBe('YWJj');
  });

  it('refuses non-ASCII rather than mangling it', () => {
    expect(() => encode64('café')).toThrow(/ASCII/);
  });
});
