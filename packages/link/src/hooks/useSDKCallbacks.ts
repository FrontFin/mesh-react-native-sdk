import { useEffect, useState } from 'react'
import { Alert, Appearance } from 'react-native'
import { WebViewMessageEvent } from 'react-native-webview'
import { WebViewNativeEvent } from 'react-native-webview/lib/WebViewTypes'

import {
  decode64,
  isValidUrl,
  urlSearchParams,
  decodeLinkStyle
} from '../utils'
import {
  AccessTokenPayload,
  DelayedAuthPayload,
  LinkConfiguration,
  LinkPayload,
  TransferFinishedPayload,
  isLinkEventTypeKey,
  mappedLinkEvents
} from '../'

const useSDKCallbacks = (props: LinkConfiguration) => {
  const [linkUrl, setLinkUrl] = useState<string | null>(null)
  const [showWebView, setShowWebView] = useState(false)
  const [showNativeNavbar, setShowNativeNavbar] = useState(false)
  const [linkColorScheme, setLinkColorScheme] = useState<string | undefined>(
    undefined
  )
  const [darkTheme, setDarkTheme] = useState<boolean | undefined>(undefined)

  useEffect(() => {
    try {
      if (props.linkToken) {
        const decodedUrl = decode64(props.linkToken)

        if (!isValidUrl(decodedUrl)) {
          throw new Error('Invalid link token provided')
        }

        const queryParams = urlSearchParams(decodedUrl)
        const styleParam = queryParams['link_style']
        const style = decodeLinkStyle(styleParam)

        if (style?.th === 'system') {
          const colorScheme = Appearance.getColorScheme()
          setLinkColorScheme(style?.th)
          setDarkTheme(colorScheme === 'dark')
        } else {
          setDarkTheme(style?.th === 'dark')
        }

        setLinkUrl(decodedUrl)
        setShowWebView(true)
      }
      // eslint-disable-next-line
    } catch (err: any) {
      props.onExit?.(
        err?.message || 'An error occurred during connection establishment'
      )
    }

    return () => {
      setLinkUrl(null)
      setShowWebView(false)
    }
  }, [props.linkToken, props.onExit])

  useEffect(() => {
    const colorSchemeWatcher = Appearance.addChangeListener(
      ({ colorScheme }) => {
        if (linkColorScheme === 'system') {
          setDarkTheme(colorScheme === 'dark')
        }
      }
    )

    return () => {
      colorSchemeWatcher.remove()
    }
  }, [linkColorScheme])

  // istanbul ignore next
  const showCloseAlert = () =>
    Alert.alert(
      'Are you sure you want to exit?',
      'Your progress will be lost.',
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Exit',
          onPress: () => {
            props.onExit?.()
          }
        }
      ]
    )

  // istanbul ignore next
  const handleMessage = (event: WebViewMessageEvent) => {
    const nativeEventData = JSON.parse(event.nativeEvent.data)
    const { type, payload } = nativeEventData

    const eventType = mappedLinkEvents[type] || type

    switch (type) {
      case 'close':
      case 'done':
      case 'exit': {
        props.onExit?.(payload)
        break
      }

      case 'showClose': {
        showCloseAlert()
        break
      }

      case 'showNativeNavbar': {
        setShowNativeNavbar(payload)
        break
      }

      case 'brokerageAccountAccessToken': {
        const payloadData: LinkPayload = {
          accessToken: payload as AccessTokenPayload
        }
        props?.onEvent?.({
          type: eventType,
          payload: payloadData
        })
        props?.onIntegrationConnected?.(payloadData)
        break
      }

      case 'delayedAuthentication': {
        const payloadData: LinkPayload = {
          delayedAuth: payload as DelayedAuthPayload
        }
        props?.onEvent?.({
          type: eventType,
          payload: payloadData
        })
        props?.onIntegrationConnected?.(payloadData)
        break
      }

      case 'transferFinished': {
        const payloadData = payload as TransferFinishedPayload

        props?.onEvent?.({
          type: eventType,
          payload: payloadData
        })
        props?.onTransferFinished?.(payloadData)
        break
      }

      case 'loaded': {
        props?.onEvent?.({ type: eventType })
        break
      }

      default: {
        if (isLinkEventTypeKey(type)) {
          props?.onEvent?.(nativeEventData)
        }
        break
      }
    }
  }

  const handleNavState = (event: WebViewNativeEvent) => {
    if (event.url.endsWith('/broker-connect/catalog')) {
      setShowNativeNavbar(false)
    }
  }

  return {
    linkUrl,
    showWebView,
    showNativeNavbar,
    darkTheme,
    handleMessage,
    handleNavState,
    showCloseAlert
  }
}

export { useSDKCallbacks }
