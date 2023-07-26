import React, { useEffect, useState } from 'react'
import { SafeAreaView, StatusBar, useColorScheme, Alert } from 'react-native'
import { WebView, WebViewMessageEvent } from 'react-native-webview'
import { FrontPayload } from './Types'
import { WebViewNativeEvent } from 'react-native-webview/lib/WebViewTypes'

const FrontFinance = (props: {
  url: string
  onBrokerConnected?: (payload: FrontPayload) => void
  onError?: (err: string) => void
  onClose?: () => void
}) => {
  const isDarkMode = useColorScheme?.() === 'dark'

  const backgroundStyle = {
    backgroundColor: isDarkMode ? '#000000' : '#ffffff'
  }
  const [iframeLink, setIframeLink] = useState<string | null>(null)
  const [showWebView, setShowWebView] = useState(false)

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

    if (type === 'close' || type === 'done') {
      props.onClose?.()
    }

    if (type === 'showClose') {
      showCloseAlert()
    }

    if (type === 'brokerageAccountAccessToken') {
      props.onBrokerConnected?.({ accessToken: payload })
    }

    if (type === 'delayedAuthentication') {
      props.onBrokerConnected?.({ delayedAuth: payload })
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
      {showWebView && iframeLink && (
        <WebView
          source={{ uri: iframeLink ? iframeLink : '' }}
          onMessage={handleMessage}
          javaScriptEnabled={true}
          onNavigationStateChange={handleNavState}
        />
      )}
    </SafeAreaView>
  )
}

export default FrontFinance
