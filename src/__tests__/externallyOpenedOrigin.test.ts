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

  it('returns true for Binance app auth URLs', () => {
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
    // a dot-segment must NOT escape the pin (normalizes to /authorize/CoinbaseEvil)
    expect(
      isExternallyOpenedOrigin(
        'https://sandbox.meshconnect.com/authorize/Coinbase/../CoinbaseEvil'
      )
    ).toBe(false);
    // percent-encoded dot-segment (%2e%2e) must NOT escape the pin either
    expect(
      isExternallyOpenedOrigin(
        'https://sandbox.meshconnect.com/authorize/Coinbase/%2e%2e/CoinbaseEvil'
      )
    ).toBe(false);
    // percent-encoded slash (%2f) hiding a dot-segment must NOT escape the pin
    expect(
      isExternallyOpenedOrigin(
        'https://sandbox.meshconnect.com/authorize/Coinbase%2f..%2fCoinbaseEvil'
      )
    ).toBe(false);
    // malformed percent-encoding fails closed
    expect(
      isExternallyOpenedOrigin(
        'https://sandbox.meshconnect.com/authorize/Coinbase/%zz'
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
    // multi-@ authority: host is what follows the LAST @, so this is evil.com
    expect(
      isExternallyOpenedOrigin('https://app.binance.com@x@evil.com/oauth')
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
