import React, { useEffect, useState, useRef } from 'react'
import {
  SafeAreaView,
  StatusBar,
  useColorScheme,
  Alert,
  View,
  StyleSheet,
  TouchableOpacity,
  Image
} from 'react-native'
import { WebView, WebViewMessageEvent } from 'react-native-webview'
import { FrontPayload, TransferFinishedPayload } from './Types'
import { WebViewNativeEvent } from 'react-native-webview/lib/WebViewTypes'

const FrontFinance = (props: {
  url: string
  onBrokerConnected?: (payload: FrontPayload) => void
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
  const [showNativeNavbar, setShowNativeNavbar] = useState(false)
  const webViewRef = useRef<WebView>(null)

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
    if (event.url.endsWith('/broker-connect/catalog')) {
      setShowNativeNavbar(false)
    }
  }

  const handleMessage = (event: WebViewMessageEvent) => {
    const { type, payload } = JSON.parse(event.nativeEvent.data)

    if (type === 'close' || type === 'done') {
      props.onClose?.()
    }

    if (type === 'showClose') {
      showCloseAlert()
    }
    if (type === 'showNativeNavbar') {
      setShowNativeNavbar(payload)
    }
    if (type === 'brokerageAccountAccessToken') {
      props.onBrokerConnected?.({ accessToken: payload })
    }

    if (type === 'delayedAuthentication') {
      props.onBrokerConnected?.({ delayedAuth: payload })
    }
    if (type === 'transferFinished') {
      props.onTransferFinished?.(payload)
    }
  }

  const showCloseAlert = () =>
    Alert.alert(
      'Are you sure you want to exit?',
      'Your progress will be lost.',
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        { text: 'Exit', onPress: () => props.onClose?.() }
      ]
    )

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <StatusBar
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
        backgroundColor={backgroundStyle.backgroundColor}
      />
      {showNativeNavbar && (
        <View style={styles.horizontalContainer}>
          <TouchableOpacity
            onPress={() => {
              webViewRef?.current?.goBack()
            }}
            style={styles.navBarBtn}
          >
            <Image source={require('../assets/back-button-icon.png')} />
          </TouchableOpacity>
          <Image
            source={require('../assets/logo.png')}
            style={{ height: 18 }}
            resizeMode="contain"
          />
          <TouchableOpacity
            onPress={() => showCloseAlert()}
            style={styles.navBarBtn}
          >
            <Image source={require('../assets/close-button-icon.png')} />
          </TouchableOpacity>
        </View>
      )}
      {showWebView && catalogLink && (
        <WebView
          ref={webViewRef}
          source={{ uri: catalogLink ? catalogLink : '' }}
          onMessage={handleMessage}
          javaScriptEnabled={true}
          onNavigationStateChange={handleNavState}
        />
      )}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  horizontalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    height: 40,
    marginLeft: 16
  },
  navBarBtn: {
    height: 40,
    width: 40
  }
})

export default FrontFinance
