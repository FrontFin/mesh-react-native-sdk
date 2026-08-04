import { isAppLaunchScheme } from '../utils/appLaunchScheme';

describe('isAppLaunchScheme', () => {
  // Wallet deep links the Link WebView hands off (ONC-447). `Linking.openURL`
  // launches these via startActivity, which no manifest declaration gates.
  it.each([
    'dfw://wc?uri=wc%3Atopic%402',
    'metamask://wc?uri=wc%3Atopic%402',
    'robinhood://wc',
    'bnc://app.binance.com',
    'cryptowallet://wc',
    'trust://wc',
    'DFW://WC',
  ])('accepts the app scheme %s', (url) => {
    expect(isAppLaunchScheme(url)).toBe(true);
  });

  // http(s) is not an app launch: it loads in the WebView, or is routed by
  // isExternallyOpenedOrigin when its origin must leave it.
  it.each(['https://app.binance.com/auth', 'http://example.com', 'HTTPS://X.COM'])(
    'rejects the web URL %s',
    (url) => {
      expect(isAppLaunchScheme(url)).toBe(false);
    }
  );

  // These execute, or reach local storage / an arbitrary component, so they must
  // never be handed to the OS from web content.
  it.each([
    'javascript:alert(1)',
    'JavaScript:alert(1)',
    'data:text/html,<script>alert(1)</script>',
    'file:///etc/passwd',
    'content://com.example.provider/secrets',
    'intent://scan/#Intent;scheme=zxing;end',
    'android-app://com.example',
    'about:blank',
    'blob:https://example.com/uuid',
  ])('rejects the dangerous scheme %s', (url) => {
    expect(isAppLaunchScheme(url)).toBe(false);
  });

  it.each([undefined, null, '', '   ', 'not-a-url', '//protocol-relative', '1invalid://x'])(
    'rejects the malformed input %s',
    (url) => {
      expect(isAppLaunchScheme(url)).toBe(false);
    }
  );

  // The caller launches the URL exactly as given, so accepting a padded URL here
  // would hand the whitespace straight to openURL, which fails on it.
  it.each(['  dfw://wc', 'dfw://wc  ', ' dfw://wc ', 'dfw://wc?x=a b', 'dfw://wc\n'])(
    'rejects the URL %s, which carries raw whitespace',
    (url) => {
      expect(isAppLaunchScheme(url)).toBe(false);
    }
  );
});
