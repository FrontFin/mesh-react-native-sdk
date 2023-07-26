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

  if (view && catalogLink.length) {
    console.log(catalogLink, 'URL')
    return (
      <FrontFinance
        url={catalogLink}
        onBrokerConnected={(payload: AccessTokenPayload) => {
          if (isTransferLink) return
          Alert.alert(
            'Success',
            `Broker: ${payload?.brokerName}
          Token: ${payload?.accountTokens[0].accessToken}
          Refresh Token: ${payload?.accountTokens[0].refreshToken}
          Token expiry: ${payload?.expiresInSeconds}
          ID: ${payload?.accountTokens[0].account.accountId}
          Name: ${payload?.accountTokens[0].account.accountName}
          Cash: ${payload?.accountTokens[0].account.cash}`,
            [
              {
                text: 'back to app',
                onPress: () => {
                  setData(payload)
                  setView(false)
                }
              }
            ]
          )
        }}
        onTransferFinished={(payload: TransferFinishedPayload) => {
          const successPayload = payload as TransferFinishedSuccessPayload
          if (successPayload) {
            Alert.alert(
              'Transfer Success',
              `Transaction Id: ${successPayload?.txId}
              From Address: ${successPayload?.fromAddress}
              To Address: ${successPayload?.toAddress}
              Symbol: ${successPayload?.symbol}
              Amount: ${successPayload?.amount}
              Network Id: ${successPayload?.networkId}`,
              [
                {
                  text: 'back to app',
                  onPress: () => {
                    setData(successPayload)
                    setView(false)
                  }
                }
              ]
            )
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
        <StatusBar backgroundColor="red" translucent style="auto" />
        <ScrollView contentContainerStyle={{ padding: 10 }}>
          <View
            style={{
              height: 100,
              width: layout_width,
              padding: 10,
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Image source={require('./assets/logo.png')} resizeMode="contain" />
          </View>
          <Text
            style={{
              color: '#000000',
              fontSize: 16,
              fontWeight: 'bold',
              marginTop: 20
            }}
          >
            Enter Broker Connect URL:
          </Text>
          <View style={styles.inputContainer}>
            <TextInput
              value={catalogLink}
              onChangeText={e => setCatalogLink(e)}
              style={{ width: '95%', height: 40, left: 10 }}
              placeholder="Enter broker Connect Url"
              placeholderTextColor={'#363636'}
            />
          </View>
          <TouchableOpacity onPress={() => setView(true)} style={styles.conBtn}>
            <Text style={{ textAlign: 'center', fontSize: 18, color: 'red' }}>
              Connect
            </Text>
          </TouchableOpacity>
          {data && <Reports data={data} />}
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
    width: layout_width * 0.8,
    alignSelf: 'center',
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 50
  }
})
