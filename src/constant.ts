export const DARK_THEME_COLOR_TOP = '#1E1E24';
export const LIGHT_THEME_COLOR_TOP = '#F3F4F5';
export const DARK_THEME_COLOR_BOTTOM = '#0E0D0D';
export const LIGHT_THEME_COLOR_BOTTOM = '#FBFBFB';

export const WHITELISTED_ORIGINS = [
  '*.meshconnect.com',
  '*.getfront.com',
  '*.walletconnect.com',
  '*.walletconnect.org',
  '*.walletlink.org',
  '*.okx.com',
  '*.gemini.com',
  '*.hcaptcha.com',
  '*.robinhood.com',
  '*.google.com',
  'https://meshconnect.com',
  'https://getfront.com',
  'https://walletconnect.com',
  'https://walletconnect.org',
  'https://walletlink.org',
  'https://okx.com',
  'https://gemini.com',
  'https://hcaptcha.com',
  'https://robinhood.com',
  'https://google.com',
  'https://front-web-platform-dev',
  'https://front-b2b-api-test.azurewebsites.net',
  'https://web.getfront.com',
  'https://web.meshconnect.com',
  'https://applink.robinhood.com',
  'https://m.stripe.network',
  'https://js.stripe.com',
  'https://app.usercentrics.eu',
  'robinhood://',
];

export const EXTERNALLY_OPENED_ORIGINS = [
  'https://link.trustwallet.com',
  'https://coinbase.com',
  'https://login.coinbase.com',
  'https://api.cb-device-intelligence.com',
  'https://sandbox.meshconnect.com/authorize/Coinbase',
  'https://app.binance.com', // Binance auth hands off to the Binance mobile app; must open externally, not in the WebView
  'bnc://app.binance.com', // Binance app deep link (Android QR-scan handoff uses the bnc:// scheme)
];
