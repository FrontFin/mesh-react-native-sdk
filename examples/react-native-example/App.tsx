import React, {useState} from 'react';
import {
  Alert,
  Dimensions,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  AccessTokenPayload,
  LinkConnect,
  LinkConnectBackup,
  LinkEventType,
  LinkPayload,
  MeshBackupConfig,
  TransferFinishedPayload,
  TransferFinishedSuccessPayload,
} from '@meshconnect/react-native-link-sdk';
import Reports from './components/reports';

const layout_width = Dimensions.get('window').width;

// --- Backup / outage demo -------------------------------------------------
// The deposit-only backup flow runs when the primary Mesh API is unavailable.
// It needs no link token: it loads the standalone backup widget from its origin
// and takes a client-assembled MeshBackupConfig. This origin is the live demo
// widget (OR-449); in production it would be the shipped backup origin.
const DEMO_BACKUP_WIDGET_ORIGIN = 'https://demo-widget.cascadecode.com';

// TODO: replace networkId (a Mesh network GUID from the pairs manifest) and the
// deposit address with real values before demoing. Uses a static address so no
// JIT backend is required; to demo JIT, drop `address` and add a `jit` block.
const DEMO_BACKUP_CONFIG: MeshBackupConfig = {
  clientId: '26C2621E-2C09-4CCC-DCF7-08DE90525AA1', // CDC (Crypto.com)
  userId: 'rn-example-user',
  destinations: [
    {
      networkId: '<mesh-network-guid>',
      symbol: 'USDC',
      address: '0x0000000000000000000000000000000000000000',
    },
  ],
  preselectedSymbol: 'USDC',
};

export default function App() {
  const [data, setData] = useState<
    AccessTokenPayload | TransferFinishedSuccessPayload | null
  >(null);
  const [view, setView] = useState(false);
  const [backupView, setBackupView] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [linkToken, setLinkToken] = useState<string>('');
  const connectButtonTitle = 'Connect account';

  function showIntegrationConnectedAlert(payload: AccessTokenPayload) {
    Alert.alert(
      `${payload.brokerName} connected!`,
      `accountId: ${payload.accountTokens[0].account.accountId}`,
      [
        {
          text: 'Ok',
          onPress: () => {
            setData(payload);
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
          },
        },
      ],
    );
  }

  if (backupView) {
    return (
      <LinkConnectBackup
        widgetOrigin={DEMO_BACKUP_WIDGET_ORIGIN}
        backupConfig={DEMO_BACKUP_CONFIG}
        settings={{language: 'en', theme: 'system'}}
        onTransferFinished={(payload: TransferFinishedPayload) => {
          if (payload.status === 'success') {
            showTransferFinishedAlert(payload);
          } else {
            setError(payload.errorMessage);
          }
        }}
        onEvent={(event: LinkEventType) => {
          console.log('Backup event received:', event);
        }}
        onExit={(err?: string) => {
          console.log('Backup onExit called:', err);
          setBackupView(false);
        }}
      />
    );
  }

  if (view && linkToken?.length) {
    return (
      <LinkConnect
        linkToken={linkToken}
        settings={{
          language: 'en',
          displayFiatCurrency: 'USD',
          theme: 'system',
        }}
        onIntegrationConnected={(payload: LinkPayload) => {
          if (payload.accessToken) {
            showIntegrationConnectedAlert(payload.accessToken);
          }
        }}
        onTransferFinished={(payload: TransferFinishedPayload) => {
          if (payload.status === 'success') {
            showTransferFinishedAlert(payload);
          } else {
            setError(payload.errorMessage);
          }
        }}
        onEvent={(event: LinkEventType) => {
          console.log('Event received:', event);
        }}
        onExit={(err?: string) => {
          console.log('onExit called:', err);
          setView(false);
          setLinkToken('');
        }}
      />
    );
  }

  if (!view) {
    return (
      <SafeAreaView
        style={styles.container}
        testID={'example-app-link-container'}>
        <ScrollView>
          <View style={styles.headerDivider} />
          <View
            testID={'example-app-link-token-container'}
            style={styles.inputContainer}>
            <TextInput
              testID={'example-app-link-token-input'}
              value={linkToken}
              onChangeText={e => setLinkToken(e)}
              onSubmitEditing={() => setView(true)}
              style={styles.exampleLinkTokenInput}
              placeholder="Enter link token"
              placeholderTextColor={'#363636'}
            />
          </View>

          <TouchableOpacity
            onPress={() => setView(true)}
            style={styles.conBtn}
            testID={'example-app-connect-btn'}>
            <Text style={styles.connectButtonText}>{connectButtonTitle}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setBackupView(true)}
            style={styles.backupBtn}
            testID={'example-app-backup-btn'}>
            <Text style={styles.connectButtonText}>
              Simulate outage — Backup deposit
            </Text>
          </TouchableOpacity>

          {data && (
            <View
              style={styles.reportsContainer}
              testID={'example-app-reports-container'}>
              <Reports data={data} />
            </View>
          )}

          {error && (
            <Text testID={'example-app-error'} style={styles.textError}>
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
  headerDivider: {
    height: 80,
    width: layout_width,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
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
  exampleLinkTokenInput: {
    width: '95%',
    height: 40,
    left: 10,
    color: '#363636',
  },
  backupBtn: {
    backgroundColor: '#6b21a8',
    height: 50,
    width: layout_width * 0.9,
    alignSelf: 'center',
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
  },
  connectButtonText: {
    textAlign: 'center',
    fontSize: 18,
    color: 'white',
  },
  textError: {
    color: 'red',
  },
  reportsContainer: {
    marginTop: 30,
  },
});
