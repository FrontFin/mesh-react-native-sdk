import React from 'react'
import { View, Text } from 'react-native'
import {
  AccessTokenPayload,
  TransferFinishedSuccessPayload
} from '@front-finance/frontfinance-rn-sdk'

const Reports = (props: {
  data: AccessTokenPayload | TransferFinishedSuccessPayload
}) => {
  const data = props.data as AccessTokenPayload
  if (data) {
    return (
      <View>
        <Text>
          <Text style={{ fontWeight: 'bold' }}>Broker:</Text> {data?.brokerName}
          {'\n'}
          <Text style={{ fontWeight: 'bold' }}>Token:</Text>{' '}
          {data?.accountTokens[0].accessToken}
          {'\n'}
          <Text style={{ fontWeight: 'bold' }}>Refresh Token:</Text>{' '}
          {data?.accountTokens[0].refreshToken}
          {'\n'}
          <Text style={{ fontWeight: 'bold' }}>
            Token expires in seconds:
          </Text>{' '}
          {data?.expiresInSeconds}
          {'\n'}
          <Text style={{ fontWeight: 'bold' }}>ID:</Text>{' '}
          {data?.accountTokens[0].account.accountId}
          {'\n'}
          <Text style={{ fontWeight: 'bold' }}>Name:</Text>{' '}
          {data?.accountTokens[0].account.accountName}
          {'\n'}
          <Text style={{ fontWeight: 'bold' }}>Cash:</Text> $
          {data?.accountTokens[0].account.cash}
          {'\n'}
        </Text>
      </View>
    )
  }
  const transferData = props.data as TransferFinishedSuccessPayload
  if (transferData) {
    return (
      <View>
        <Text>
          <Text style={{ fontWeight: 'bold' }}>Transaction Id:</Text>{' '}
          {transferData?.txId}
          {'\n'}
          <Text style={{ fontWeight: 'bold' }}>From Addres:</Text>{' '}
          {transferData?.fromAddress}
          {'\n'}
          <Text style={{ fontWeight: 'bold' }}>To Address:</Text>{' '}
          {transferData?.toAddress}
          {'\n'}
          <Text style={{ fontWeight: 'bold' }}>Symbol:</Text>{' '}
          {transferData.symbol}
          {'\n'}
          <Text style={{ fontWeight: 'bold' }}>Amount:</Text>{' '}
          {transferData.amount}
          {'\n'}
          <Text style={{ fontWeight: 'bold' }}>Network Id:</Text>{' '}
          {transferData.networkId}
          {'\n'}
        </Text>
      </View>
    )
  }
  return null
}

export default Reports
