/* istanbul ignore file */
export type BrokerType =
  | 'robinhood'
  | 'eTrade'
  | 'alpaca'
  | 'tdAmeritrade'
  | 'weBull'
  | 'stash'
  | 'interactiveBrokers'
  | 'public'
  | 'coinbase'
  | 'kraken'
  | 'coinbasePro'
  | 'cryptoCom'
  | 'openSea'
  | 'binanceUs'
  | 'gemini'
  | 'cryptocurrencyAddress'
  | 'cryptocurrencyWallet'
  | 'okCoin'
  | 'bittrex'
  | 'kuCoin'
  | 'etoro'
  | 'cexIo'
  | 'binanceInternational'
  | 'bitstamp'
  | 'gateIo'
  | 'celsius'
  | 'acorns'
  | 'okx'
  | 'bitFlyer'
  | 'coinlist'
  | 'huobi'
  | 'bitfinex'
  | 'deFiWallet'
  | 'krakenDirect'
  | 'vanguard'
  | 'binanceInternationalDirect'
  | 'bitfinexDirect'
  | 'bybit';

export interface Account {
  accountId: string;
  accountName: string;
  fund?: number;
  cash?: number;
  isReconnected?: boolean;
}

export interface AccountToken {
  account: Account;
  accessToken: string;
  refreshToken?: string;
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
  brokerType: BrokerType;
  brokerName: string;
}

export interface DelayedAuthPayload {
  refreshTokenExpiresInSeconds?: number;
  brokerType: BrokerType;
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
export type TransferFinishedPayload =
  | TransferFinishedSuccessPayload
  | TransferFinishedErrorPayload;
