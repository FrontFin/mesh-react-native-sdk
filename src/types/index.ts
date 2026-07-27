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
  | DefiWalletError;

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

export interface LinkConfiguration {
  linkToken: string;
  settings?: LinkSettings;
  renderViewContainer?: boolean; // this will render the container View instead of SafeAreaView
  disableDomainWhiteList?: boolean; // this will disable the domain white list check
  onIntegrationConnected?: (payload: LinkPayload) => void;
  onTransferFinished?: (payload: TransferFinishedPayload) => void;
  onEvent?: (event: LinkEventType) => void;
  onExit?: (err?: string) => void;
}

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
