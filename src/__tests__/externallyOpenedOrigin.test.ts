import { isExternallyOpenedOrigin } from '../utils';

describe('isExternallyOpenedOrigin', () => {
  it('returns true for allowlisted origins', () => {
    const urls = [
      'https://link.trustwallet.com/wc?uri=abc',
      'https://coinbase.com/oauth/authorize?client_id=test',
      'https://login.coinbase.com/signin',
      'https://api.cb-device-intelligence.com/collect',
    ];

    urls.forEach((url) => {
      expect(isExternallyOpenedOrigin(url)).toBe(true);
    });
  });

  it('returns true for Binance app auth URLs (PRG-3107)', () => {
    expect(isExternallyOpenedOrigin('https://app.binance.com')).toBe(true);
    expect(
      isExternallyOpenedOrigin(
        'https://app.binance.com/en/oauth/authorize?client_id=mesh'
      )
    ).toBe(true);
  });

  it('honors path-pinned origins on a segment boundary', () => {
    // exact and nested paths match
    expect(
      isExternallyOpenedOrigin(
        'https://sandbox.meshconnect.com/authorize/Coinbase'
      )
    ).toBe(true);
    expect(
      isExternallyOpenedOrigin(
        'https://sandbox.meshconnect.com/authorize/Coinbase/callback'
      )
    ).toBe(true);
    // a lookalike path segment must NOT match
    expect(
      isExternallyOpenedOrigin(
        'https://sandbox.meshconnect.com/authorize/CoinbaseEvil'
      )
    ).toBe(false);
  });

  it('rejects host lookalike attacks', () => {
    expect(
      isExternallyOpenedOrigin('https://app.binance.com.evil.com/oauth')
    ).toBe(false);
    expect(
      isExternallyOpenedOrigin('https://coinbase.com.evil.com/authorize')
    ).toBe(false);
    // userinfo trick: real host is evil.com, not app.binance.com
    expect(
      isExternallyOpenedOrigin('https://app.binance.com@evil.com/oauth')
    ).toBe(false);
  });

  it('rejects scheme mismatches and non-listed origins', () => {
    expect(isExternallyOpenedOrigin('http://app.binance.com')).toBe(false);
    expect(isExternallyOpenedOrigin('https://example.com')).toBe(false);
    expect(isExternallyOpenedOrigin('https://web.meshconnect.com/catalog')).toBe(
      false
    );
  });

  it('returns false for non-url and empty inputs', () => {
    expect(isExternallyOpenedOrigin('about:blank')).toBe(false);
    expect(isExternallyOpenedOrigin('not a url')).toBe(false);
    expect(isExternallyOpenedOrigin('')).toBe(false);
  });
});
