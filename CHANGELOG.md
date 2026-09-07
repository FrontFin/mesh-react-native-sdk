# Changelog

All notable changes to the Mesh Connect React Native SDK are documented here.
Format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

## 2.4.9

### Changed

- Link host updates

## 2.4.8

### Fixed

- Android: the Link WebView now recovers instead of going blank when its render process is killed while the app is backgrounded during an external OAuth or deposit hand-off (e.g. Coinbase). It reloads automatically on return to the foreground.

## 2.4.7

### Fixed

- Wallet deep links now open on Android again. `setSupportMultipleWindows={false}` (added in 2.4.3) turned a `target="_blank"` click into a same-frame navigation, which react-native-webview gates behind `Linking.canOpenURL` — package-visibility filtered on Android 11+, so a wallet's custom scheme was dropped with only a console warning unless the integrator declared it in their manifest `<queries>`. Popups are routed to `onOpenWindow` again, where the SDK launches them itself.

### Changed

- `onOpenWindow` now opens app schemes (e.g. `dfw://`, `metamask://`) in addition to `https`. Schemes that can execute or reach local state — `javascript:`, `data:`, `file:`, `content:`, `intent:`, `android-app:`, `about:`, `blob:` — are still ignored, as is plain `http:`.
- A custom scheme reaching `onShouldStartLoadWithRequest` is now launched instead of silently blocked, so a scheme listed in `WHITELISTED_ORIGINS` (e.g. `robinhood://`) is no longer a dead end.

## 2.4.6

### Added

- `settings.language` now accepts `'system'` to follow the device's language.

## 2.4.5

### Added

- `AccountToken` now includes `tokenId`.

## 2.4.4

### Fixed

- OAuth and onramp handoffs (e.g. the Coinbase deposit flow) now open in the external browser on iOS instead of hanging on the loading screen.

## 2.4.3

### Fixed

- Binance app auth now opens in the external browser instead of hanging in the WebView.

### Changed

- Hardened external-origin matching against lookalike-host and path spoofing.

## 2.4.2

### Removed

- Removed the hardcoded Revolut origins (`https://ramp.revolut.codes`, `https://sso.revolut.codes`, `https://ramp.revolut.com`) from `WHITELISTED_ORIGINS`.

## 2.4.1

### Added

- Added typed interfaces for all event types in `LinkEventType` — `ConnectionDeclined`, `ConnectionUnavailable`, `TransferDeclined`, `TransferConfigureError`, `TransferAssetSelected`, `TransferNetworkSelected`, `DefiWalletError`, and simple events (`IntegrationMfaRequired`, `IntegrationMfaEntered`, `IntegrationOAuthStarted`, `IntegrationAccountSelectionRequired`, `TransferAmountEntered`, `TransferMfaRequired`, `TransferMfaEntered`, `TransferKycRequired`, `HomePageLoaded`).
- Added missing optional fields to existing event payloads: `requestId` on error events, `nativeLink` and `userSearched` on `IntegrationSelected`, `userId` and `clientTransactionId` on `TransferExecuted`, `verifiedAddresses` on `WalletMessageSigned`.
- Added `platform=reactNative` to the WebView URL so Link v2 correctly identifies the hosting SDK.

### Changed

- `TransferStarted` now includes a typed `payload` with `integrationName` and optional `integrationType`.

## 2.4.0

### Added

- Added `WebViewLoadFailed` event type to `LinkEventType` — emitted via `onEvent` when the WebView encounters a network error or HTTP 5xx response, giving SDK consumers visibility into load failures.

### Fixed

- Re-enabled WebView caching (`LOAD_DEFAULT`) so cached JS chunks serve as fallback when a network request drops, preventing lazy-load failures on the post-OAuth screen on flaky networks.
- Added silent one-time auto-reload on WebView network errors and HTTP 5xx responses, recovering most transient failures without user interaction.
- Added `onContentProcessDidTerminate` (iOS) and `onRenderProcessGone` (Android) handlers to auto-reload a blank WebView after process termination, gated to avoid interrupting an active OAuth flow.

## 2.3.2

### Changed

- Bumped transitive dependencies to resolve audit vulnerabilities; updated CI workflow configuration.

## 2.3.1

### Changed

- Updated dependencies and patched transitive vulnerability advisories.

## 2.3.0

### Added

- Added `theme` option (`'light'` | `'dark'` | `'system'`) to `LinkSettings` for controlling the Link UI colour scheme.
