import { useEffect, useRef, useState } from 'react';
import { Alert, Appearance } from 'react-native';
import { WebViewMessageEvent } from 'react-native-webview';
import { WebViewNativeEvent } from 'react-native-webview/lib/WebViewTypes';

import {
  decode64,
  isValidUrl,
  buildLinkUrl,
  buildPageUrl,
  LinkUrl,
} from '../utils';
import {
  AccessTokenPayload,
  DelayedAuthPayload,
  LinkConnectTokenConfiguration,
  LinkPayload,
  TransferFinishedPayload,
  isLinkEventTypeKey,
  mappedLinkEvents,
} from '../';

const useSDKCallbacks = (props: LinkConnectTokenConfiguration) => {
  const [link, setLink] = useState<LinkUrl | null>(null);
  const [showWebView, setShowWebView] = useState(false);
  const [showNativeNavbar, setShowNativeNavbar] = useState(false);
  // Read once per Link page, like the page itself: Link doesn't follow a device switch
  // mid-session. Re-read only when the URL inputs change (the WebView remounts then
  // anyway), so a rerun from a new onExit can't change the URL or the native colors.
  const appearanceSnapshot = useRef<{ pageKey: string; isDark: boolean }>();
  const isOAuthInProgress = useRef(false);

  useEffect(() => {
    try {
      if (props.linkToken) {
        const decodedUrl = decode64(props.linkToken);

        if (!isValidUrl(decodedUrl)) {
          throw new Error('Invalid link token provided');
        }

        // The page URL, not the raw settings: settings that leave the URL as is keep the page.
        const pageKey = buildPageUrl(decodedUrl, props.settings);
        if (appearanceSnapshot.current?.pageKey !== pageKey) {
          appearanceSnapshot.current = {
            pageKey,
            isDark: Appearance.getColorScheme() === 'dark',
          };
        }

        // Save the URL and its theme to state to load in the WebView
        setLink(
          buildLinkUrl(
            decodedUrl,
            props.settings,
            appearanceSnapshot.current.isDark
          )
        );
        setShowWebView(true);
      }
      // eslint-disable-next-line
    } catch (err: any) {
      props.onExit?.(
        err?.message || 'An error occurred during connection establishment'
      );
    }

    return () => {
      setLink(null);
      setShowWebView(false);
      isOAuthInProgress.current = false;
    };
  }, [
    props.linkToken,
    props.onExit,
    props.settings?.language,
    props.settings?.theme,
    props.settings?.displayFiatCurrency,
  ]);

  const linkUrl = link?.url ?? null;
  const darkTheme = link?.isDarkTheme;
  const backgroundColor = link?.backgroundColor;

  // istanbul ignore next
  const showCloseAlert = () =>
    Alert.alert(
      'Are you sure you want to exit?',
      'Your progress will be lost.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Exit',
          onPress: () => {
            props.onExit?.();
          },
        },
      ]
    );

  // istanbul ignore next
  const handleMessage = (event: WebViewMessageEvent) => {
    const nativeEventData = JSON.parse(event.nativeEvent.data);
    const { type, payload } = nativeEventData;

    const eventType = mappedLinkEvents[type] || type;

    switch (type) {
      case 'close':
      case 'done':
      case 'exit': {
        isOAuthInProgress.current = false;
        props.onExit?.(payload);
        break;
      }

      case 'showClose': {
        showCloseAlert();
        break;
      }

      case 'showNativeNavbar': {
        setShowNativeNavbar(payload);
        break;
      }

      case 'brokerageAccountAccessToken': {
        isOAuthInProgress.current = false;
        const payloadData: LinkPayload = {
          accessToken: payload as AccessTokenPayload,
        };
        props?.onEvent?.({
          type: eventType,
          payload: payloadData,
        });
        props?.onIntegrationConnected?.(payloadData);
        break;
      }

      case 'delayedAuthentication': {
        isOAuthInProgress.current = false;
        const payloadData: LinkPayload = {
          delayedAuth: payload as DelayedAuthPayload,
        };
        props?.onEvent?.({
          type: eventType,
          payload: payloadData,
        });
        props?.onIntegrationConnected?.(payloadData);
        break;
      }

      case 'transferFinished': {
        const payloadData = payload as TransferFinishedPayload;

        props?.onEvent?.({
          type: eventType,
          payload: payloadData,
        });
        props?.onTransferFinished?.(payloadData);
        break;
      }

      case 'loaded': {
        props?.onEvent?.({ type: eventType });
        break;
      }

      default: {
        if (type === 'integrationOAuthStarted') {
          isOAuthInProgress.current = true;
        }
        if (isLinkEventTypeKey(type)) {
          props?.onEvent?.(nativeEventData);
        }
        break;
      }
    }
  };

  const handleNavState = (event: WebViewNativeEvent) => {
    if (event.url.endsWith('/broker-connect/catalog')) {
      setShowNativeNavbar(false);
    }
  };

  return {
    linkUrl,
    showWebView,
    showNativeNavbar,
    darkTheme,
    backgroundColor,
    isOAuthInProgress, // MutableRefObject<boolean> — read .current in callbacks
    handleMessage,
    handleNavState,
    showCloseAlert,
  };
};

export { useSDKCallbacks };
