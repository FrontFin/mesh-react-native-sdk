import React from 'react'
import {
  FrontPayload,
  TransferFinishedPayload
} from '@front-finance/frontfinance-rn-sdk'

export interface FrontFinanceProps {
  url: string
  onBrokerConnected?: (payload: FrontPayload) => void
  onTransferFinished?: (payload: TransferFinishedPayload) => void
  onError?: (err: string) => void
  onClose?: () => void
}

declare const FrontFinance: React.FC<FrontFinanceProps>
export { FrontFinance }
