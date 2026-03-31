import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {
  AccessTokenPayload,
  TransferFinishedSuccessPayload,
} from '@meshconnect/react-native-link-sdk';

const Reports = (props: {
  data: AccessTokenPayload | TransferFinishedSuccessPayload;
}) => {
  const data = props.data as AccessTokenPayload;
  if (data.accountTokens !== undefined) {
    return (
      <View style={styles.container}>
        <Text>
          <Text style={styles.textBold}>Broker:</Text> {data?.brokerName}
          {'\n'}
          <Text style={styles.textBold}>Token:</Text>{' '}
          {data?.accountTokens[0].accessToken}
          {'\n'}
          <Text style={styles.textBold}>Refresh Token:</Text>{' '}
          {data?.accountTokens[0].refreshToken}
          {'\n'}
          <Text style={styles.textBold}>Token expires in seconds:</Text>{' '}
          {data?.expiresInSeconds}
          {'\n'}
          <Text style={styles.textBold}>ID:</Text>{' '}
          {data?.accountTokens[0].account.accountId}
          {'\n'}
          <Text style={styles.textBold}>Name:</Text>{' '}
          {data?.accountTokens[0].account.accountName}
          {'\n'}
          <Text style={styles.textBold}>Cash:</Text> $
          {data?.accountTokens[0].account.cash}
          {'\n'}
        </Text>
      </View>
    );
  }

  const transferData = props.data as TransferFinishedSuccessPayload;

  if (transferData.txId !== undefined) {
    return (
      <View style={styles.container}>
        <Text>
          <Text style={styles.textBold}>Transaction Id:</Text>{' '}
          {transferData?.txId}
          {'\n'}
          <Text style={styles.textBold}>From Address:</Text>{' '}
          {transferData?.fromAddress || ''}
          {'\n'}
          <Text style={styles.textBold}>To Address:</Text>{' '}
          {transferData?.toAddress || ''}
          {'\n'}
          <Text style={styles.textBold}>Symbol:</Text> {transferData.symbol}
          {'\n'}
          <Text style={styles.textBold}>Amount:</Text> {transferData.amount}
          {'\n'}
          <Text style={styles.textBold}>Network Id:</Text>{' '}
          {transferData.networkId}
          {'\n'}
        </Text>
      </View>
    );
  }
  return null;
};

const styles = StyleSheet.create({
  container: {
    padding: 10,
  },
  textBold: {
    fontWeight: 'bold',
  },
});

export default Reports;
