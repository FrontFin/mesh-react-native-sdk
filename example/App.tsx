import { StatusBar } from 'expo-status-bar'
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
  Image
} from 'react-native'
import {
  FrontFinance,
  AccessTokenPayload,
  FrontPayload,
  TransferFinishedPayload,
  TransferFinishedSuccessPayload,
  TransferFinishedErrorPayload
} from '@front-finance/frontfinance-rn-sdk'
import { useState } from 'react'
import Reports from './components/reports'

const layout_width = Dimensions.get('window').width

export default function App() {
  const [data, setData] = useState<
    AccessTokenPayload | TransferFinishedSuccessPayload | null
  >(null)
  const [view, setView] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [catalogLink, setCatalogLink] = useState<string>('')
  const isTransferLink = catalogLink?.includes('transfer_token')

  function showBrokerConnectedAlert(payload: AccessTokenPayload) {
    Alert.alert(
      `${payload.brokerName} connected!`,
      `accountId: ${payload.accountTokens[0].account.accountId}`,
      [
        {
          text: 'Ok',
          onPress: () => {
            setData(payload)
            setView(false)
          }
        }
      ]
    )
  }

  function showTransferFinishedAlert(payload: TransferFinishedSuccessPayload) {
    Alert.alert(
      'Transfer Finished',
      `From Address: ${payload?.fromAddress}
      To Address: ${payload?.toAddress}
      Symbol: ${payload?.symbol}
      Amount: ${payload?.amount}`,
      [
        {
          text: 'Ok',
          onPress: () => {
            setData(payload)
            setView(false)
          }
        }
      ]
    )
  }

  if (view && catalogLink.length) {
    console.log(catalogLink, 'URL')
    return (
      <FrontFinance
        url={catalogLink}
        onBrokerConnected={(payload: FrontPayload) => {
          if (isTransferLink) return
          if (payload.accessToken) {
            showBrokerConnectedAlert(payload.accessToken)
          }
        }}
        onTransferFinished={(payload: TransferFinishedPayload) => {
          const successPayload = payload as TransferFinishedSuccessPayload
          if (successPayload) {
            showTransferFinishedAlert(successPayload)
          }
          const errorPayload = payload as TransferFinishedErrorPayload
          if (errorPayload) {
            setError(errorPayload.errorMessage)
          }
        }}
        onClose={() => setView(false)}
        onError={(err: string) => setError(err)}
      />
    )
  }

  if (!view) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar backgroundColor="#cecece83" translucent style="auto" />
        <ScrollView contentContainerStyle={{ padding: 10 }}>
          <View
            style={{
              marginTop: 20,
              height: 80,
              width: layout_width,
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Image source={require('./assets/logo.png')} resizeMode="contain" />
          </View>

          <View style={styles.inputContainer}>
            <TextInput
              value={catalogLink}
              onChangeText={e => setCatalogLink(e)}
              style={{ width: '95%', height: 40, left: 10 }}
              placeholder="Catalog Link"
              placeholderTextColor={'#363636'}
            />
          </View>

          <TouchableOpacity onPress={() => setView(true)} style={styles.conBtn}>
            <Text style={{ textAlign: 'center', fontSize: 18, color: 'white' }}>
              Connect
            </Text>
          </TouchableOpacity>

          <View style={{ marginTop: 30 }}>
            {data && <Reports data={data} />}
          </View>

          {error && <Text style={{ color: 'red' }}>Error: {error}</Text>}
        </ScrollView>
      </SafeAreaView>
    )
  }

  return null
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1
  },
  inputContainer: {
    width: layout_width * 0.9,
    alignSelf: 'center',
    borderWidth: 1,
    borderColor: '#363636',
    height: 45,
    borderRadius: 30,
    marginTop: 20
  },
  conBtn: {
    backgroundColor: 'black',
    height: 50,
    width: layout_width * 0.9,
    alignSelf: 'center',
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 30
  }
})
