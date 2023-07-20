// @ts-nocheck
import React, { useEffect, useState } from 'react'
import {
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  useColorScheme,
  View,
  TouchableOpacity,
} from 'react-native'
import { WebView } from 'react-native-webview'

const FrontFinance = (props) => {
  const isDarkMode = useColorScheme?.() === 'dark'

  const backgroundStyle = {
    backgroundColor: isDarkMode ? '#000000' : '#ffffff',
  }
  const [iframeLink, setIframeLink] = useState(null)
  const [payload, setPayload] = useState(null)
  const [showWebView, setShowWebView] = useState(false)
  const isTransferLink = iframeLink?.includes('transfer_token')

  useEffect(() => {
    if (props.url.length) {
      setIframeLink(props.url)
      setShowWebView(true)
    } else {
      props.onError('Invalid iframeUrl')
    }

    return () => {
      setIframeLink(null)
      setShowWebView(null)
    }
  }, [props])

  const handleNavState = (event) => {
    //console.log('Nav', event)
  }

  const handleMessage = (event) => {
    const { type, payload } = JSON.parse(event.nativeEvent.data)
    console.log('MSG', type, payload)
    if (
      type === 'close' ||
      type === 'showClose' ||
      type === 'done' ||
      type === 'delayedAuthentication'
    ) {
      setShowWebView(false)
    }
    if (
      (type === 'brokerageAccountAccessToken' && !isTransferLink) ||
      type === 'transferFinished'
    ) {
      setPayload(payload)
      props.onReceive(payload)
    }
  }

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <StatusBar
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
        backgroundColor={backgroundStyle.backgroundColor}
      />

      <View style={styles.container}>
        {!showWebView && (
          <>
            {payload ? (
              <View>
                <Text>
                  <Text style={{ fontWeight: 'bold' }}>Broker:</Text>{' '}
                  {payload?.brokerName}
                  {'\n'}
                  <Text style={{ fontWeight: 'bold' }}>Token:</Text>{' '}
                  {payload?.accountTokens[0].accessToken}
                  {'\n'}
                  <Text style={{ fontWeight: 'bold' }}>
                    Refresh Token:
                  </Text>{' '}
                  {payload?.accountTokens[0].refreshToken}
                  {'\n'}
                  <Text style={{ fontWeight: 'bold' }}>
                    Token expires in seconds:
                  </Text>{' '}
                  {payload?.expiresInSeconds}
                  {'\n'}
                  <Text style={{ fontWeight: 'bold' }}>ID:</Text>{' '}
                  {payload?.accountTokens[0].account.accountId}
                  {'\n'}
                  <Text style={{ fontWeight: 'bold' }}>Name:</Text>{' '}
                  {payload?.accountTokens[0].account.accountName}
                  {'\n'}
                  <Text style={{ fontWeight: 'bold' }}>Cash:</Text> $
                  {payload?.accountTokens[0].account.cash}
                  {'\n'}
                </Text>
              </View>
            ) : (
              <View style={styles.container}>
                <Text style={styles.noText}>
                  No accounts connected recently! Please press the button below
                  to use Front and authenticate
                </Text>
                <TouchableOpacity
                  onPress={() => setShowWebView(true)}
                  style={styles.button}
                >
                  <Text
                    style={{
                      textAlign: 'center',
                      fontSize: 18,
                      color: 'white',
                    }}
                  >
                    Continue
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </>
        )}
        {showWebView && iframeLink && (
          <WebView
            source={{ uri: iframeLink ? iframeLink : '' }}
            onMessage={handleMessage}
            javaScriptEnabled={true}
            onNavigationStateChange={handleNavState}
          />
        )}
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
  },
  webView: {
    backgroundColor: 'red',
    flex: 1,
    position: 'absolute',
  },
  noText: {
    fontSize: 20,
  },
  button: {
    marginTop: 50,
    padding: 10,
    backgroundColor: 'black',
    borderRadius: 50,
  },
  btnText: {
    fontSize: 15,
    color: 'white',
  },
})

export default FrontFinance
