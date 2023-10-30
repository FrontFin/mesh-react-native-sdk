import React, {useState} from 'react';
import {
  Alert,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  TouchableOpacity,
  Dimensions,
  Image,
} from 'react-native';
import {
  MeshConnect,
  AccessTokenPayload,
  LinkPayload,
  TransferFinishedPayload,
  TransferFinishedSuccessPayload,
  TransferFinishedErrorPayload,
} from '@front-finance/frontfinance-rn-sdk';
import Reports from './components/reports';

const layout_width = Dimensions.get('window').width;

export default function App() {
  const [data, setData] = useState<
    AccessTokenPayload | TransferFinishedSuccessPayload | null
  >(null);
  const [view, setView] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [linkToken, setLinkToken] = useState<string>('');
  const connectButtonTitle = 'Connect account';

  function showBrokerConnectedAlert(payload: AccessTokenPayload) {
    Alert.alert(
      `${payload.brokerName} connected!`,
      `accountId: ${payload.accountTokens[0].account.accountId}`,
      [
        {
          text: 'Ok',
          onPress: () => {
            setData(payload);
            setView(false);
            setLinkToken('');
          },
        },
      ],
    );
  }

  function showTransferFinishedAlert(payload: TransferFinishedSuccessPayload) {
    Alert.alert(
      'Transfer Finished',
      `Symbol: ${payload?.symbol}
      Amount: ${payload?.amount}`,
      [
        {
          text: 'Ok',
          onPress: () => {
            setData(payload);
            setView(false);
            setLinkToken('');
          },
        },
      ],
    );
  }

  if (view && linkToken.length) {
    console.log(linkToken, 'linkToken');

    return (
      <MeshConnect
        linkToken={linkToken}
        onBrokerConnected={(payload: LinkPayload) => {
          if (payload.accessToken) {
            showBrokerConnectedAlert(payload.accessToken);
          }
        }}
        onTransferFinished={(payload: TransferFinishedPayload) => {
          if (payload.status === 'success') {
            const successPayload = payload as TransferFinishedSuccessPayload;
            showTransferFinishedAlert(successPayload);
          } else {
            const errorPayload = payload as TransferFinishedErrorPayload;
            setError(errorPayload.errorMessage);
          }
        }}
        onClose={() => {
          setView(false);
          setLinkToken('');
        }}
        onError={(err: string) => setError(err)}
      />
    );
  }

  if (!view) {
    return (
      <SafeAreaView
        style={styles.container}
        testID={'example-app-link-container'}>
        <ScrollView>
          <View
            style={{
              height: 80,
              width: layout_width,
              alignItems: 'center',
              justifyContent: 'center',
              marginTop: 24,
            }}/>

          <View
            testID={'example-app-link-input-container'}
            style={styles.inputContainer}>
            <TextInput
              testID={'example-app-link-input'}
              value={linkToken}
              onChangeText={e => setLinkToken(e)}
              onSubmitEditing={() => setView(true)}
              style={{width: '95%', height: 40, left: 10}}
              placeholder="Link Token"
              placeholderTextColor={'#363636'}
            />
          </View>

          <TouchableOpacity
            onPress={() => setView(true)}
            style={styles.conBtn}
            testID={'example-app-connect-btn'}>
            <Text style={{textAlign: 'center', fontSize: 18, color: 'white'}}>
              {connectButtonTitle}
            </Text>
          </TouchableOpacity>

          {data && (
            <View
              style={{marginTop: 30}}
              testID={'example-app-reports-container'}>
              <Reports data={data} />
            </View>
          )}

          {error && (
            <Text testID={'example-app-error'} style={{color: 'red'}}>
              Error: {error}
            </Text>
          )}
        </ScrollView>
      </SafeAreaView>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  inputContainer: {
    width: layout_width * 0.9,
    alignSelf: 'center',
    borderWidth: 1,
    borderColor: '#363636',
    height: 45,
    borderRadius: 30,
    marginTop: 4,
  },
  conBtn: {
    backgroundColor: 'black',
    height: 50,
    width: layout_width * 0.9,
    alignSelf: 'center',
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 30,
  },
});
