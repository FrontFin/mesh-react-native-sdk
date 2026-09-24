export const DARK_THEME_COLOR_TOP = '#1E1E24';
export const LIGHT_THEME_COLOR_TOP = '#F3F4F5';
export const DARK_THEME_COLOR_BOTTOM = '#0E0D0D';
export const LIGHT_THEME_COLOR_BOTTOM = '#FBFBFB';

/**
 * Default origin for the standalone backup deposit widget (OR-449), served from
 * Mesh's independent backup infrastructure. It is deliberately **not** a
 * `meshconnect.com` origin: the backup flow must share no failure domain with
 * the primary Mesh API, so if `meshconnect.com` is down the widget still loads.
 * This is the single value swapped at origin-migration time; override per-call
 * via `LinkConnectBackup`'s `widgetOrigin` prop for staging, demo, or self-host.
 *
 * ⚠️ PLACEHOLDER — must be replaced with the production, Mesh-owned backup origin
 * before this ships to clients. It deliberately uses the reserved `.invalid` TLD
 * (RFC 6761) so it can never resolve to a real — possibly attacker-controlled —
 * host if it reaches a release un-reconciled. Money path: this origin serves the
 * deposit-address UI during an outage. (As of 2026-09-23 the deployed widget is
 * a demo at `https://demo-widget.cascadecode.com` — pass it via `widgetOrigin`.)
 */
export const DEFAULT_BACKUP_WIDGET_ORIGIN = 'https://backup-widget.invalid';

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
