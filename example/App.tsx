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
  FrontPayload
} from '@front-finance/frontfinance-rn-sdk'
import { useState } from 'react'
import Reports from './components/reports'

const layout_width = Dimensions.get('window').width

export default function App() {
  const [data, setData] = useState<AccessTokenPayload | null>(null)
  const [view, setView] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [iframeLink, setIframeLink] = useState<string>('')

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

  if (view && iframeLink.length) {
    console.log(iframeLink, 'URL')
    return (
      <FrontFinance
        url={iframeLink}
        onBrokerConnected={(payload: FrontPayload) => {
          if (payload.accessToken) {
            showBrokerConnectedAlert(payload.accessToken)
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
              value={iframeLink}
              onChangeText={e => setIframeLink(e)}
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
