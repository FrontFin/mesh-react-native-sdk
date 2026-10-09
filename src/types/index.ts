/* istanbul ignore file */
export type LinkEventType =
  | IntegrationConnected
  | IntegrationConnectionError
  | TransferCompleted
  | IntegrationSelected
  | CredentialsEntered
  | TransferStarted
  | TransferPreviewed
  | TransferPreviewError
  | TransferExecutionError
  | TransferInitiated
  | TransferExecuted
  | TransferNoEligibleAssets
  | WalletMessageSigned
  | PageLoaded
  | VerifyDonePage
  | VerifyWalletRejected
  | LegalTermsViewed
  | SeeWhatHappenedClicked
  | FundingOptionsUpdated
  | FundingOptionsViewed
  | GasIncreaseWarning
  | ExecuteFundingStep
  | LinkTransferQrGenerated
  | HomePageMethodSelected
  | WebViewLoadFailed
  | IntegrationMfaRequired
  | IntegrationMfaEntered
  | IntegrationOAuthStarted
  | IntegrationAccountSelectionRequired
  | TransferAmountEntered
  | TransferMfaRequired
  | TransferMfaEntered
  | TransferKycRequired
  | HomePageLoaded
  | ConnectionDeclined
  | ConnectionUnavailable
  | TransferDeclined
  | TransferConfigureError
  | TransferAssetSelected
  | TransferNetworkSelected
  | DefiWalletError
  | BackupTierChanged
  | WithdrawalRequested;

const LINK_EVENT_TYPE_KEYS = [
  'integrationConnected',
  'integrationConnectionError',
  'transferCompleted',
  'integrationSelected',
  'credentialsEntered',
  'transferStarted',
  'transferPreviewed',
  'transferPreviewError',
  'transferExecutionError',
  'transferExecuted',
  'transferInitiated',
  'transferNoEligibleAssets',
  'pageLoaded',
  'walletMessageSigned',
  'verifyDonePage',
  'verifyWalletRejected',
  'integrationMfaRequired',
  'integrationMfaEntered',
  'integrationOAuthStarted',
  'integrationAccountSelectionRequired',
  'transferAssetSelected',
  'transferNetworkSelected',
  'transferAmountEntered',
  'transferMfaRequired',
  'transferMfaEntered',
  'transferKycRequired',
  'connectionDeclined',
  'transferConfigureError',
  'connectionUnavailable',
  'transferDeclined',
  'legalTermsViewed',
  'seeWhatHappenedClicked',
  'executeFundingStep',
  'fundingOptionsUpdated',
  'fundingOptionsViewed',
  'gasIncreaseWarning',
  'linkTransferQRGenerated',
  'methodSelected',
  'homePageLoaded',
  'defiWalletError',
  'backupTierChanged',
  'withdrawalRequested',
] as const;

export const mappedLinkEvents: Record<string, string> = {
  brokerageAccountAccessToken: 'integrationConnected',
  delayedAuthentication: 'integrationConnected',
  transferFinished: 'transferCompleted',
  loaded: 'pageLoaded',
};

export type LinkEventTypeKeys = (typeof LINK_EVENT_TYPE_KEYS)[number];

export function isLinkEventTypeKey(key: string): key is LinkEventTypeKeys {
  return LINK_EVENT_TYPE_KEYS.includes(key as LinkEventTypeKeys);
}

interface LinkEventBase {
  type: LinkEventTypeKeys;
}

export interface PageLoaded {
  type: 'pageLoaded';
}

export interface IntegrationConnected extends LinkEventBase {
  type: 'integrationConnected';
  payload: LinkPayload;
}

export interface IntegrationConnectionError extends LinkEventBase {
  type: 'integrationConnectionError';
  payload: {
    errorMessage: string;
    requestId?: string;
  };
}

export interface TransferCompleted extends LinkEventBase {
  type: 'transferCompleted';
  payload: TransferFinishedPayload;
}

export interface IntegrationSelected extends LinkEventBase {
  type: 'integrationSelected';
  payload: {
    integrationType: string;
    integrationName: string;
    nativeLink?: string;
    userSearched?: boolean;
  };
}

export interface CredentialsEntered extends LinkEventBase {
  type: 'credentialsEntered';
}

export interface TransferStarted extends LinkEventBase {
  type: 'transferStarted';
  payload: {
    integrationType?: string;
    integrationName: string;
  };
}

export interface TransferFee {
  fee?: number;
  feeCurrency?: string;
  feeInFiat?: number;
}

export interface CryptocurrencyFundingOption {
  cryptocurrencyFundingOptionType?: string;
  name?: string;
  paymentMethodType?: string;
  usedAmountInCryptocurrency?: number;
  usedAmountInFiat?: number;
  cryptocurrencySymbol?: string;
  fee?: {
    amountInFiat?: number;
    fiatSymbol?: string;
    amountInCryptocurrency?: number;
    cryptocurrencySymbol?: string;
    isInclusive?: boolean;
    usedCurrencyType?: string;
  };
}

export interface TransferPreviewed extends LinkEventBase {
  type: 'transferPreviewed';
  payload: {
    amount?: number;
    symbol?: string;
    toAddress?: string;
    networkId?: string;
    previewId?: string;
    networkName?: string;
    amountInFiat?: number;
    fiatCurrency?: string;
    integrationName?: string;
    integrationType?: string;
    estimatedNetworkGasFee?: TransferFee;
    institutionTransferFee?: TransferFee;
    customClientFee?: TransferFee;
    cryptocurrencyFundingOptions?: CryptocurrencyFundingOption[];
    userId?: string;
    clientTransactionId?: string;
  };
}

export interface TransferPreviewError extends LinkEventBase {
  type: 'transferPreviewError';
  payload: {
    errorMessage: string;
    requestId?: string;
  };
}

export interface TransferExecutionError extends LinkEventBase {
  type: 'transferExecutionError';
  payload: {
    errorMessage: string;
    requestId?: string;
  };
}

export interface TransferInitiated extends LinkEventBase {
  type: 'transferInitiated';
  payload: {
    integrationType?: string;
    integrationName: string;
    status: 'pending';
  };
}

export interface TransferExecuted extends LinkEventBase {
  type: 'transferExecuted';
  payload: {
    status: 'success' | 'pending';
    txId: string;
    fromAddress: string;
    toAddress: string;
    symbol: string;
    amount: number;
    networkId: string;
    userId?: string;
    clientTransactionId?: string;
  };
}

export interface TransferNoEligibleAssets extends LinkEventBase {
  type: 'transferNoEligibleAssets';
  payload: {
    integrationType?: string;
    integrationName: string;
    noAssetsType?: string;
    arrayOfTokensHeld: {
      symbol: string;
      amount: number;
      amountInFiat?: number;
      ineligibilityReason?: string;
    }[];
  };
}

export interface AccountToken {
  account: Account;
  accessToken: string;
  refreshToken?: string;
  /**
   * Reconnection token for the account. Delivered at runtime but was
   * previously missing from the type. Consumers store it to reactivate the
   * connected account.
   */
  tokenId?: string;
}

export interface Account {
  accountId: string;
  accountName: string;
  fund?: number;
  cash?: number;
  isReconnected?: boolean;
}

export interface BrandInfo {
  brokerLogo: string;
  brokerPrimaryColor?: string;
  logoLightUrl?: string;
  logoDarkUrl?: string;
  iconLightUrl?: string;
  iconDarkUrl?: string;
}

export interface LinkPayload {
  accessToken?: AccessTokenPayload;
  delayedAuth?: DelayedAuthPayload;
}

export interface AccessTokenPayload {
  accountTokens: AccountToken[];
  brokerBrandInfo: BrandInfo;
  expiresInSeconds?: number;
  refreshTokenExpiresInSeconds?: number;
  brokerType: string;
  brokerName: string;
}

export interface DelayedAuthPayload {
  refreshTokenExpiresInSeconds?: number;
  brokerType: string;
  refreshToken: string;
  brokerName: string;
  brokerBrandInfo: BrandInfo;
}

export interface TransferFinishedSuccessPayload {
  status: 'success';
  txId: string;
  fromAddress: string;
  toAddress: string;
  symbol: string;
  amount: number;
  networkId: string;
  amountInFiat?: number;
  totalAmountInFiat?: number;
  networkName?: string;
  txHash?: string;
  transferId?: string;
  refundAddress?: string;
}

export interface TransferFinishedErrorPayload {
  status: 'error';
  errorMessage: string;
}

export interface IntegrationAccessToken {
  accountId: string;
  accountName: string;
  accessToken: string;
  brokerType: string;
  brokerName: string;
}

export type LinkTheme = 'light' | 'dark' | 'system';

export interface LinkSettings {
  accessTokens?: IntegrationAccessToken[];
  /**
   * Language for the Link UI as a BCP-47 tag (e.g. `'en'`, `'en-US'`).
   * Use `'system'` to follow the device's current language.
   */
  language?: string;
  displayFiatCurrency?: string;
  /**
   * Colour theme applied to the Link UI.
   * Use `'system'` to automatically follow the device's current colour scheme.
   */
  theme?: LinkTheme;
}

/**
 * Handlers common to both the normal and backup entry paths. Only genuinely
 * shared fields live here — display options that apply to just one path
 * (`settings`/`disableDomainWhiteList` on the token path) are declared on that
 * variant so they do not type-check in the other mode, where they are ignored.
 */
export interface LinkConnectCommon {
  renderViewContainer?: boolean; // this will render the container View instead of SafeAreaView
  onIntegrationConnected?: (payload: LinkPayload) => void;
  onTransferFinished?: (payload: TransferFinishedPayload) => void;
  onEvent?: (event: LinkEventType) => void;
  onExit?: (err?: string) => void;
}

/** Normal path: a Mesh link token, and none of the backup-only fields. */
export interface LinkConnectTokenConfiguration extends LinkConnectCommon {
  /** The Mesh link token (normal path). */
  linkToken: string;
  /** Full Link UI settings (accessTokens, displayFiatCurrency, theme, language). */
  settings?: LinkSettings;
  disableDomainWhiteList?: boolean; // this will disable the domain white list check
  backupConfig?: never;
  widgetOrigin?: never;
  hideCloseButton?: never;
  onAddressInit?: never;
  onStatusPoll?: never;
}

/** Outage path: a {@link MeshBackupConfig} in place of a link token. */
export interface LinkConnectBackupModeConfiguration extends LinkConnectCommon {
  /**
   * Backup deposit config, assembled server-side. When set, `LinkConnect` renders
   * the deposit-only backup flow (the Level 1 / Level 2 cascade is automatic);
   * `onAddressInit`/`onStatusPoll` resolve any address-less destinations.
   */
  backupConfig: MeshBackupConfig;
  /**
   * Only `theme` and `language` apply to the backup flow (same narrowed type as
   * {@link LinkConnectBackupConfiguration.settings}); `accessTokens` /
   * `displayFiatCurrency` are primary-path-only and have no effect here.
   */
  settings?: Pick<LinkSettings, 'theme' | 'language'>;
  /** The backup delegate has no allow-list opt-out, so this is token-path-only. */
  disableDomainWhiteList?: never;
  linkToken?: never;
  /**
   * Origin serving the standalone backup widget. Defaults to
   * `DEFAULT_BACKUP_WIDGET_ORIGIN`. Override for staging or self-hosting.
   */
  widgetOrigin?: string;
  /** Hide the native close (✕) button overlaid on the flow. */
  hideCloseButton?: boolean;
  /**
   * JIT kick-off (CDC client spec §6.1). Required only if any backup destination
   * omits `address`. See {@link LinkConnectBackupConfiguration.onAddressInit}.
   */
  onAddressInit?: (symbol: string, networkId: string) => void | Promise<unknown>;
  /**
   * JIT status poll (CDC client spec §6.2). Required only if any backup
   * destination omits `address`. See {@link LinkConnectBackupConfiguration.onStatusPoll}.
   */
  onStatusPoll?: (
    symbol: string,
    networkId: string
  ) => Promise<MeshBackupJitStatusResult>;
}

/**
 * Props for {@link LinkConnect}. Exactly one entry-point credential is required:
 * a `linkToken` (normal path) **or** a `backupConfig` (outage path — CDC client
 * spec §3.1) — the two are mutually exclusive, enforced at the type level.
 */
export type LinkConfiguration =
  | LinkConnectTokenConfiguration
  | LinkConnectBackupModeConfiguration;

export type TransferFinishedPayload =
  | TransferFinishedSuccessPayload
  | TransferFinishedErrorPayload;

export interface WalletMessageSigned extends LinkEventBase {
  type: 'walletMessageSigned';
  payload: {
    signedMessageHash: string | undefined;
    message: string | undefined;
    address: string;
    timeStamp: number;
    isVerified: boolean;
    verifiedAddresses?: string[];
  };
}

export interface VerifyDonePage extends LinkEventBase {
  type: 'verifyDonePage';
}

export interface VerifyWalletRejected extends LinkEventBase {
  type: 'verifyWalletRejected';
}

export interface LegalTermsViewed {
  type: 'legalTermsViewed';
}

export interface SeeWhatHappenedClicked {
  type: 'seeWhatHappenedClicked';
}

export interface FundingOptionsUpdated {
  type: 'fundingOptionsUpdated';
}

export interface FundingOptionsViewed {
  type: 'fundingOptionsViewed';
}

export interface GasIncreaseWarning {
  type: 'gasIncreaseWarning';
}

export interface ExecuteFundingStep {
  type: 'executeFundingStep';
  payload: {
    cryptocurrencyFundingOptionType: string;
    status: string;
    errorMessage?: string;
  };
}

export interface LinkTransferQrGenerated {
  type: 'linkTransferQRGenerated';
  payload: {
    token?: string;
    network?: string;
    toAddress?: string;
    qrUrl?: string;
  };
}

export interface HomePageMethodSelected {
  type: 'methodSelected';
  payload: {
    method: 'embedded' | 'manual' | 'buy';
  };
}

export interface WebViewLoadFailed {
  type: 'webViewLoadFailed';
  payload: {
    url: string;
    errorCode?: number;
    errorDescription?: string;
  };
}

export interface IntegrationMfaRequired extends LinkEventBase {
  type: 'integrationMfaRequired';
}

export interface IntegrationMfaEntered extends LinkEventBase {
  type: 'integrationMfaEntered';
}

export interface IntegrationOAuthStarted extends LinkEventBase {
  type: 'integrationOAuthStarted';
}

export interface IntegrationAccountSelectionRequired extends LinkEventBase {
  type: 'integrationAccountSelectionRequired';
}

export interface TransferAmountEntered extends LinkEventBase {
  type: 'transferAmountEntered';
}

export interface TransferMfaRequired extends LinkEventBase {
  type: 'transferMfaRequired';
}

export interface TransferMfaEntered extends LinkEventBase {
  type: 'transferMfaEntered';
}

export interface TransferKycRequired extends LinkEventBase {
  type: 'transferKycRequired';
}

export interface HomePageLoaded extends LinkEventBase {
  type: 'homePageLoaded';
}

export interface ConnectionDeclined extends LinkEventBase {
  type: 'connectionDeclined';
  payload: {
    integrationType?: string;
    integrationName: string;
    reason: string;
    networkId?: string;
    toAddress?: string;
    errorMessage?: string;
  };
}

export interface ConnectionUnavailable extends LinkEventBase {
  type: 'connectionUnavailable';
  payload: {
    integrationType?: string;
    integrationName: string;
    reason: string;
  };
}

export interface TransferDeclined extends LinkEventBase {
  type: 'transferDeclined';
  payload: {
    integrationType?: string;
    integrationName: string;
    toAddress?: string;
    token?: string;
    network?: string;
    amount?: number;
    status: string;
  };
}

export interface TransferConfigureError extends LinkEventBase {
  type: 'transferConfigureError';
  payload: {
    errorMessage: string;
    requestId?: string;
  };
}

export interface TransferAssetSelected extends LinkEventBase {
  type: 'transferAssetSelected';
  payload: {
    symbol: string;
  };
}

export interface TransferNetworkSelected extends LinkEventBase {
  type: 'transferNetworkSelected';
  payload: {
    id: string;
    name: string;
  };
}

/**
 * Emitted once when the backup flow cascades from Tier 1 (widget loaded from
 * the independent backup origin) to Tier 2 (widget + catalog served from the
 * SDK bundle, no Mesh-owned network dependency) — see design §5H. The cascade
 * is single-shot per session, so this fires at most once. It lets the host
 * measure how often Tier 2 actually engages so `TIER1_READY_TIMEOUT_MS` can be
 * tuned from real data (design §13, over-eager-fallback risk).
 */
export interface BackupTierChanged extends LinkEventBase {
  type: 'backupTierChanged';
  payload: {
    from: 'tier1';
    to: 'tier2';
    /**
     * Why Tier 1 was abandoned: `loadError` = a hard WebView load/HTTP failure
     * on the backup-origin document; `readyTimeout` = the widget did not
     * complete its ready handshake within `TIER1_READY_TIMEOUT_MS`.
     */
    reason: 'loadError' | 'readyTimeout';
  };
}

export interface DefiWalletError extends LinkEventBase {
  type: 'defiWalletError';
  payload: {
    integrationName: string;
    errorType: 'timeout' | 'verifyMismatch';
    details: {
      requestedAddress?: string;
      connectedAddress?: string;
      requestedNetwork?: string;
      connectedNetwork?: string;
      connectUri?: string;
    };
    timeStamp: number;
  };
}

export interface WithdrawalRequested extends LinkEventBase {
  type: 'withdrawalRequested';
  payload: {
    transferId: string;
    // 'pending' or 'success' today; treat any other value as pending.
    status: string;
  };
}

// ---------------------------------------------------------------------------
// Backup / redundancy flow (OR-451, canonical shape OR-446)
//
// A deposit-only funnel served from Mesh's independent backup infrastructure,
// used when the primary Mesh API is unavailable. It takes its configuration
// directly from the client (assembled server-side) and never calls the core
// Mesh API. See the CDC backup integration spec for the client-facing contract.
// ---------------------------------------------------------------------------

/**
 * A single deposit destination offered in the backup flow.
 *
 * `address` is optional **only** when the host supplies the JIT callbacks
 * ({@link LinkConnectBackupConfiguration.onAddressInit} /
 * {@link LinkConnectBackupConfiguration.onStatusPoll}) — an address-less
 * destination is resolved through those callbacks at selection time. A
 * destination with neither `address` nor the callbacks cannot be resolved.
 */
export interface MeshBackupDestination {
  /**
   * Mesh network id (GUID). Must reference a token/network pair present in the
   * backup pairs manifest.
   */
  networkId: string;
  /** Token symbol, e.g. `'USDC'`. */
  symbol: string;
  /** Static deposit address. Omit to resolve this destination via the JIT callbacks. */
  address?: string;
  /**
   * Memo/tag for memo/tag chains (XRP, XLM, TON/TVM, Injective, muxed Stellar).
   * `null`/omitted for chains that do not use one.
   */
  addressTag?: string | null;
}

/**
 * Result the host's {@link LinkConnectBackupConfiguration.onStatusPoll} callback
 * resolves to (CDC client spec §6.2). A discriminated union on `status` so a
 * `ready` result must carry an `address` at the type level (the bridge contract
 * requires it and the widget rejects a `ready` without one):
 * - `pending` ⇒ the widget polls again;
 * - `ready` ⇒ done — `address` required (+ `addressTag` for memo/tag chains:
 *   XRP, XLM, TON/TVM, Injective, muxed Stellar);
 * - `failed` ⇒ terminal error.
 */
export type MeshBackupJitStatusResult =
  | { status: 'ready'; address: string; addressTag?: string }
  | { status: 'pending' }
  | { status: 'failed' };

/**
 * Configuration handed to the backup deposit widget. Assemble this server-side
 * (destinations should not be built in untrusted client code) and pass it to
 * {@link LinkConnectBackup} via the `backupConfig` prop; it is delivered to the
 * widget over the SDK message bridge. Canonical shape: OR-446 / CDC client spec §3.
 *
 * There is no JIT endpoint/token block: address-less destinations are resolved
 * entirely through the {@link LinkConnectBackupConfiguration.onAddressInit} /
 * {@link LinkConnectBackupConfiguration.onStatusPoll} callbacks, which run in the
 * host app against the client's own backend (no credential ever enters the widget).
 */
export interface MeshBackupConfig {
  /** The client's Mesh client id. */
  clientId: string;
  /**
   * The client's end-user identifier. Used for analytics — it is **not** an
   * authentication credential.
   */
  userId: string;
  /** Deposit destinations to offer. At least one is required. */
  destinations: MeshBackupDestination[];
  /**
   * Preselect a token symbol, skipping the token-select screen. Must match one
   * of the destination symbols; an unknown symbol falls back to token select.
   */
  preselectedSymbol?: string;
}

/**
 * Props for {@link LinkConnectBackup}, the deposit-only backup component. The
 * host event contract (`onIntegrationConnected` / `onTransferFinished` /
 * `onEvent` / `onExit`) matches {@link LinkConfiguration} so the same handlers
 * can be reused on both the primary and backup paths.
 */
export interface LinkConnectBackupConfiguration {
  /** Backup deposit configuration, assembled server-side. */
  backupConfig: MeshBackupConfig;
  /**
   * Origin serving the standalone backup widget. Defaults to
   * `DEFAULT_BACKUP_WIDGET_ORIGIN`. Override for staging or self-hosting.
   */
  widgetOrigin?: string;
  /** Only `theme` and `language` apply to the backup flow. */
  settings?: Pick<LinkSettings, 'theme' | 'language'>;
  /** Render a plain `View` container instead of `SafeAreaView`. */
  renderViewContainer?: boolean;
  /**
   * Hide the native close (✕) button. By default `LinkConnectBackup` overlays a
   * native close control (the backup widget's deposit-only funnel has no exit
   * affordance on its root screen), wired to `onExit` so the host can always
   * dismiss the flow. Set `true` to suppress it, e.g. when the host provides its
   * own chrome.
   */
  hideCloseButton?: boolean;
  /**
   * JIT kick-off callback (CDC client spec §6.1). Required only if any destination
   * omits `address`. Called **once** in the host app when the user confirms a
   * `(symbol, networkId)` — kick off address generation against your own backend
   * with your own session. The return value is **ignored** (return a promise if
   * async); a **thrown/rejected** result is treated as a generation failure.
   */
  onAddressInit?: (symbol: string, networkId: string) => void | Promise<unknown>;
  /**
   * JIT status poll (CDC client spec §6.2). Required only if any destination omits
   * `address`. Polled ~every 2–3s (~3-min deadline) with the same
   * `(symbol, networkId)` until it resolves `ready` or `failed`. Return the same
   * address for a given `(symbol, networkId)` every time (idempotent) — a repeat
   * poll must never yield a new address. A thrown/rejected promise, or
   * `status: 'failed'`, ends the attempt with an error.
   */
  onStatusPoll?: (
    symbol: string,
    networkId: string
  ) => Promise<MeshBackupJitStatusResult>;
  onIntegrationConnected?: (payload: LinkPayload) => void;
  onTransferFinished?: (payload: TransferFinishedPayload) => void;
  onEvent?: (event: LinkEventType) => void;
  onExit?: (err?: string) => void;
}
