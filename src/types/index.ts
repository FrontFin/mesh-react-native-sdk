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
  | PageLoaded;

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
  'walletMessageSigned'
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
  };
}

export interface CredentialsEntered extends LinkEventBase {
  type: 'credentialsEntered';
}

export interface TransferStarted extends LinkEventBase {
  type: 'transferStarted';
}

export interface TransferPreviewed extends LinkEventBase {
  type: 'transferPreviewed';
  payload: {
    amount: number;
    symbol: string;
    toAddress: string;
    networkId: string;
    previewId: string;
    networkName?: string;
    amountInFiat?: number;
    estimatedNetworkGasFee?: {
      fee?: number;
      feeCurrency?: string;
      feeInFiat?: number;
    };
  };
}

export interface TransferPreviewError extends LinkEventBase {
  type: 'transferPreviewError';
  payload: {
    errorMessage: string;
  };
}

export interface TransferExecutionError extends LinkEventBase {
  type: 'transferExecutionError';
  payload: {
    errorMessage: string;
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

export interface LinkSettings {
  accessTokens?: IntegrationAccessToken[];
  transferDestinationTokens?: IntegrationAccessToken[];
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
  type: 'walletMessageSigned'
  payload: {
    signedMessageHash: string | undefined
    message: string | undefined
    address: string
    timeStamp: number
    isVerified: boolean
  }
}