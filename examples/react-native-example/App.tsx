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
  FrontFinance,
  AccessTokenPayload,
  FrontPayload,
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
  const [catalogLink, setCatalogLink] = useState<string>('');
  const [linkToken, setLinkToken] = useState<string>('');
  const isTransferLink = catalogLink?.includes('transfer_token');
  const connectButtonTitle = isTransferLink
    ? 'Connect origin account'
    : 'Connect account';

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
            setCatalogLink('');
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
            setCatalogLink('');
          },
        },
      ],
    );
  }

  if (view && (catalogLink.length || linkToken.length)) {
    console.log(catalogLink, 'URL');
    console.log(linkToken, 'linkToken');

    return (
      <FrontFinance
        url={catalogLink}
        linkToken={linkToken}
        onBrokerConnected={(payload: FrontPayload) => {
          if (isTransferLink) {
            return;
          }
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
          setCatalogLink('');
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
            }}>
            <Image
              source={require('./assets/logo.png')}
              style={{height: 30, width: 120}}
              resizeMode="contain"
              testID={'example-app-logo'}
            />
          </View>

          <View
            testID={'example-app-link-token-container'}
            style={styles.inputContainer}>
            <TextInput
              testID={'example-app-link-token-input'}
              value={linkToken}
              onChangeText={e => setLinkToken(e)}
              onSubmitEditing={() => setView(true)}
              style={{width: '95%', height: 40, left: 10}}
              placeholder="Enter link token"
              placeholderTextColor={'#363636'}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text>OR</Text>
          </View>

          <View
            testID={'example-app-link-input-container'}
            style={styles.inputContainer}>
            <TextInput
              testID={'example-app-link-input'}
              value={catalogLink}
              onChangeText={e => setCatalogLink(e)}
              onSubmitEditing={() => setView(true)}
              style={{width: '95%', height: 40, left: 10}}
              placeholder="Catalog Link"
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
