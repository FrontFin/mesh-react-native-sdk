export const DARK_THEME_COLOR_TOP = '#1E1E24';
export const LIGHT_THEME_COLOR_TOP = '#F3F4F5';
export const DARK_THEME_COLOR_BOTTOM = '#0E0D0D';
export const LIGHT_THEME_COLOR_BOTTOM = '#FBFBFB';

/**
 * Default origin for the standalone backup deposit widget (OR-449). This is the
 * live production widget; override per-call via `LinkConnectBackup`'s
 * `widgetOrigin` prop for staging, demo, or self-host. Money path: this origin
 * serves the deposit-address UI during a `meshconnect.com` outage.
 *
 * Known tradeoff: this is a `meshconnect.com` subdomain, not the fully
 * independent DNS apex OR-447 specified (app hosting is independent Cloudflare
 * infra; the DNS zone is not). A `meshconnect.com` zone-level outage would take
 * this down too. Accepted risk, confirmed 2026-10-01.
 */
export const DEFAULT_BACKUP_WIDGET_ORIGIN = 'https://backup.meshconnect.com';

/**
 * The `type` the backup widget's message bridge requires on the config it
 * receives. The widget matches `event.data.type === 'meshBackupConfig'` and
 * drops any message without it, so the config must be delivered as
 * `{ type: BACKUP_CONFIG_MESSAGE_TYPE, payload: MeshBackupConfig }`.
 */
export const BACKUP_CONFIG_MESSAGE_TYPE = 'meshBackupConfig';

/**
 * JIT-over-bridge RPC message types (OR-452 / CDC client spec §5–§6). The widget
 * resolves an address-less destination by sending a `meshBackupJitRequest` to the
 * host, which invokes the host's `onAddressInit`/`onStatusPoll` callback and
 * replies with a `meshBackupJitResponse` correlated by `callId`. No token or
 * client endpoint ever enters the widget — only `(symbol, networkId)` and the
 * resolved address cross the bridge.
 */
export const BACKUP_JIT_REQUEST_MESSAGE_TYPE = 'meshBackupJitRequest';
export const BACKUP_JIT_RESPONSE_MESSAGE_TYPE = 'meshBackupJitResponse';

// ---------------------------------------------------------------------------
// Tier-2 super-redundancy cascade (OR-474 / design §5H)
//
// The backup flow has two tiers behind a single init (`backupConfig`):
//   Tier 1 — the widget loads from the independent backup ORIGIN (OR-451).
//   Tier 2 — if that origin is unreachable, the SDK falls back to the widget
//            assets + catalog snapshot BUNDLED in this package — zero
//            Mesh-owned network dependency. The client's JIT callbacks run in
//            the host app and are identical in both tiers.
// The cascade is monotonic and single-shot: Tier 1 is attempted once per
// session; on a trigger the SDK falls to Tier 2 and stays there.
// ---------------------------------------------------------------------------

/**
 * How long to wait for the Tier-1 widget's ready handshake (its `loaded`
 * message) after the WebView starts loading the backup origin, before treating
 * the origin as unreachable and cascading to the bundled Tier-2 assets.
 *
 * Default 5000 ms: the widget shell is ~24 KB gzip on a CDN, so a healthy load
 * completes in well under 2 s — 5 s absorbs a slow mobile network with margin
 * while keeping the degraded-path UX acceptable (the user is already in an
 * outage flow). Per-SDK tunable constant (design §5H).
 *
 * On RN the native `onError`/`onHttpError` load-failure signals are also
 * reliable, so a hard load error cascades immediately without waiting this out;
 * the timeout additionally catches a served-but-broken origin, a hung asset, or
 * a captive-portal interception that never completes the handshake.
 */
export const TIER1_READY_TIMEOUT_MS = 5000;

/**
 * Fail-closed safety net for Tier 2: the bundled assets are local, so they
 * should always complete the ready handshake near-instantly. If they somehow do
 * not within this window, the flow exits with an error rather than sitting on a
 * blank screen (design §5A/§5H fail-closed rule — never a blank QR). Deliberately
 * generous because a Tier-2 timeout should be effectively unreachable.
 */
export const TIER2_READY_TIMEOUT_MS = 8000;

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
