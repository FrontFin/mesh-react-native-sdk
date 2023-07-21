import React from 'react'
import { AccessTokenPayload } from '@front-finance/frontfinance-rn-sdk'

export interface FrontFinanceProps {
  url: string
  onReceive?: (payload: AccessTokenPayload) => void
  onError?: (error: string) => void
}

declare const FrontFinance: React.FC<FrontFinanceProps>
export { FrontFinance }
