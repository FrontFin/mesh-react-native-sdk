import React, { useEffect, useState, useRef } from 'react'
import {
  SafeAreaView,
  StatusBar,
  useColorScheme,
  Alert,
  View,
  Text,
  StyleSheet,
  TouchableOpacity
} from 'react-native'
import { WebView, WebViewMessageEvent } from 'react-native-webview'
import { AccessTokenPayload } from './Types'
import { WebViewNativeEvent } from 'react-native-webview/lib/WebViewTypes'

const FrontFinance = (props: {
  url: string
  onReceive?: (payload: AccessTokenPayload) => void
  onError?: (err: string) => void
  onClose?: () => void
}) => {
  const isDarkMode = useColorScheme?.() === 'dark'

  const backgroundStyle = {
    backgroundColor: isDarkMode ? '#000000' : '#ffffff'
  }
  const [iframeLink, setIframeLink] = useState<string | null>(null)
  const [showWebView, setShowWebView] = useState(false)
  const [showNativeNavbar, setShowNativeNavbar] = useState(false)
  const webViewRef = useRef<WebView>(null)
  const goback = () => {
    webViewRef?.current?.goBack()
  }
  useEffect(() => {
    if (props.url.length) {
      setIframeLink(props.url)
      setShowWebView(true)
    } else {
      props.onError?.('Invalid iframeUrl')
    }

    return () => {
      setIframeLink(null)
      setShowWebView(false)
    }
  }, [props])

  const handleNavState = (event: WebViewNativeEvent) => {
    console.log('Nav', event)
  }

  const handleMessage = (event: WebViewMessageEvent) => {
    const { type, payload } = JSON.parse(event.nativeEvent.data)
    console.log('Msg', type, payload)
    if (
      type === 'close' ||
      type === 'done' ||
      type === 'delayedAuthentication'
    ) {
      props.onClose?.()
    }
    if (type === 'showClose') {
      showCloseAlert()
    }
    if (type === 'showNativeNavbar') {
      setShowNativeNavbar(payload)
    }
    if (type === 'brokerageAccountAccessToken') {
      props.onReceive?.(payload)
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
          <TouchableOpacity onPress={() => goback()} style={styles.conBtn}>
            <Text style={{ textAlign: 'center', fontSize: 18, color: 'red' }}>
              back
            </Text>
          </TouchableOpacity>
        </View>
      )}
      {showWebView && iframeLink && (
        <WebView
          ref={webViewRef}
          source={{ uri: iframeLink ? iframeLink : '' }}
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
    justifyContent: 'center',
    height: 40
  },
  conBtn: {
    backgroundColor: 'black',
    height: 50,
    width: 5,
    alignSelf: 'center',
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 50
  }
})

export default FrontFinance
