import { useEffect, useState } from 'react';
import { Alert } from 'react-native';
import { WebViewMessageEvent } from 'react-native-webview';
import { WebViewNativeEvent } from 'react-native-webview/lib/WebViewTypes';

import { decode64, isValidUrl } from '../utils';
import { LinkConnectProps } from '../';

const useSDKCallbacks = (props: LinkConnectProps) => {
  const [linkUrl, setLinkUrl] = useState<string | null>(null);
  const [showWebView, setShowWebView] = useState(false);
  const [showNativeNavbar, setShowNativeNavbar] = useState(false);

  useEffect(() => {
    try {
      if (props.linkToken) {
        const decodedUrl = decode64(props.linkToken);

        if (!isValidUrl(decodedUrl)) {
          throw new Error('Invalid link token provided');
        }

        setLinkUrl(decodedUrl);
        setShowWebView(true);
      }
      // eslint-disable-next-line
    } catch (err: any) {
      props.onExit?.(err?.message || 'An error occurred during connection establishment');
    }

    return () => {
      setLinkUrl(null);
      setShowWebView(false);
    };
  }, [props.linkToken, props.onExit]);

  const showCloseAlert = () =>
    Alert.alert(
      'Are you sure you want to exit?',
      'Your progress will be lost.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        { text: 'Exit', onPress: () => props.onExit?.() },
      ],
    );

  const handleMessage = (event: WebViewMessageEvent) => {
    const { type, payload } = JSON.parse(event.nativeEvent.data);

    if (type === 'close' || type === 'done' || type === 'exit') {
      props.onExit?.();
      return;
    }

    if (type === 'showClose') {
      showCloseAlert();
      return;
    }

    if (type === 'showNativeNavbar') {
      return setShowNativeNavbar(payload);
    }

    if (type === 'brokerageAccountAccessToken') {
      return props.onBrokerConnected?.({ accessToken: payload });
    }

    if (type === 'delayedAuthentication') {
      return props.onBrokerConnected?.({ delayedAuth: payload });
    }

    if (type === 'transferFinished') {
      return props.onTransferFinished?.(payload);
    }

    props.onEvent?.(type, payload);
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
    handleMessage,
    handleNavState,
    showCloseAlert,
  };
};

export {
  useSDKCallbacks,
};
