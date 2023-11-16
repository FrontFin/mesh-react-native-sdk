/* istanbul ignore file */
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
  accountId: string
  accountName: string
  accessToken: string
  brokerType: string
  brokerName: string
}

export interface LinkOptions {
  linkToken: string;
  accessTokens?: IntegrationAccessToken[]
  transferDestinationTokens?: IntegrationAccessToken[]
  onIntegrationConnected?: (payload: LinkPayload) => void;
  onTransferFinished?: (payload: TransferFinishedPayload) => void;
  onEvent?: (event: string, payload: LinkPayload) => void;
  onExit?: (err?: string) => void;
}

export type TransferFinishedPayload = TransferFinishedSuccessPayload | TransferFinishedErrorPayload;
