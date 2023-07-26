import React, { useEffect, useState } from 'react'
import {
  SafeAreaView,
  StatusBar,
  StyleSheet,
  useColorScheme,
  View
} from 'react-native'
import { WebView, WebViewMessageEvent } from 'react-native-webview'
import { AccessTokenPayload, TransferFinishedPayload } from './Types'
import { WebViewNativeEvent } from 'react-native-webview/lib/WebViewTypes'

const FrontFinance = (props: {
  url: string
  onBrokerConnected?: (payload: AccessTokenPayload) => void
  onTransferFinished?: (payload: TransferFinishedPayload) => void
  onError?: (err: string) => void
  onClose?: () => void
}) => {
  const isDarkMode = useColorScheme?.() === 'dark'

  const backgroundStyle = {
    backgroundColor: isDarkMode ? '#000000' : '#ffffff'
  }
  const [catalogLink, setCatalogLink] = useState<string | null>(null)
  const [showWebView, setShowWebView] = useState(false)

  useEffect(() => {
    if (props.url.length) {
      setCatalogLink(props.url)
      setShowWebView(true)
    } else {
      props.onError?.('Invalid iframeUrl')
    }

    return () => {
      setCatalogLink(null)
      setShowWebView(false)
    }
  }, [props])

  const handleNavState = (event: WebViewNativeEvent) => {
    console.log('Nav', event)
  }

  const handleMessage = (event: WebViewMessageEvent) => {
    const { type, payload } = JSON.parse(event.nativeEvent.data)
    if (
      type === 'close' ||
      type === 'showClose' ||
      type === 'done' ||
      type === 'delayedAuthentication'
    ) {
      setShowWebView(false)
    }
    if (type === 'brokerageAccountAccessToken') {
      props.onBrokerConnected?.(payload)
    }
    if (type === 'transferFinished') {
      props.onTransferFinished?.(payload)
    }
  }

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <StatusBar
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
        backgroundColor={backgroundStyle.backgroundColor}
      />

      <View style={styles.container}>
        {showWebView && catalogLink && (
          <WebView
            source={{ uri: catalogLink ? catalogLink : '' }}
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
    padding: 10
  },
  webView: {
    backgroundColor: 'red',
    flex: 1,
    position: 'absolute'
  },
  noText: {
    fontSize: 20
  },
  button: {
    marginTop: 50,
    padding: 10,
    backgroundColor: 'black',
    borderRadius: 50
  },
  btnText: {
    fontSize: 15,
    color: 'white'
  }
})

export default FrontFinance
