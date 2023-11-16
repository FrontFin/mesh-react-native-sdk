/* istanbul ignore file */
export interface AccountToken {
  account: BrokerAccount;
  accessToken: string;
  refreshToken?: string;
}

export interface BrokerAccount {
  accountId: string;
  accountName: string;
  fund?: number;
  cash?: number;
  isReconnected?: boolean;
}

export interface BrokerBrandInfo {
  brokerLogo: string;
  brokerPrimaryColor?: string;
}

export interface LinkPayload {
  accessToken?: AccessTokenPayload;
  delayedAuth?: DelayedAuthPayload;
}

export interface AccessTokenPayload {
  accountTokens: AccountToken[];
  brokerBrandInfo: BrokerBrandInfo;
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
  brokerBrandInfo: BrokerBrandInfo;
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

export interface LinkOptions {
  linkToken?: string;
  onIntegrationConnected?: (payload: LinkPayload) => void;
  onTransferFinished?: (payload: TransferFinishedPayload) => void;
  onEvent?: (event: string, payload: LinkPayload) => void;
  onExit?: (err?: string) => void;
}

export type TransferFinishedPayload = TransferFinishedSuccessPayload | TransferFinishedErrorPayload;
