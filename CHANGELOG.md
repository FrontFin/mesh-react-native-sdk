# Changelog

All notable changes to the Mesh Connect React Native SDK are documented here.
Format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

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
