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
import { WebViewNativeEvent } from 'react-native-webview/lib/WebViewTypes'
import { FrontPayload, TransferFinishedPayload } from "./types";

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

  const goBack = () => webViewRef?.current?.goBack()

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
    <SafeAreaView style={{ flex: 1 }} data-testid={'front-finance-component'}>
      <StatusBar
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
        backgroundColor={backgroundStyle.backgroundColor}
      />
      {showNativeNavbar && (
        <View data-testid={'native-navbar'} style={styles.navBarContainer}>
          <TouchableOpacity onPress={goBack} style={styles.navBarImgContainer}>
            <Image
              source={require('../assets/ic_back.png')}
              style={styles.navBarImgButton}
            />
          </TouchableOpacity>

          <Image
            source={require('../assets/front_logo.png')}
            style={styles.navBarLogo}
          />

          <TouchableOpacity
            onPress={showCloseAlert}
            style={styles.navBarImgContainer}
            data-testid={'close-button'}
          >
            <Image
              source={require('../assets/ic_close.png')}
              style={styles.navBarImgButton}
            />
          </TouchableOpacity>
        </View>
      )}
      {showWebView && catalogLink && (
        <WebView
          data-testid={'webview'}
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
  navBarContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: 64,
    paddingTop: 12,
    paddingStart: 6,
    paddingEnd: 8
  },
  navBarImgContainer: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center'
  },
  navBarImgButton: {
    width: 24,
    height: 24,
    resizeMode: 'contain'
  },
  navBarLogo: {
    height: 18,
    resizeMode: 'contain'
  }
})

export default FrontFinance
