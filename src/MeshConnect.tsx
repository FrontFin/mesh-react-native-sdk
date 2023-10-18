import React, { useEffect, useState, useRef, useMemo } from 'react';
import {
  SafeAreaView,
  StatusBar,
  useColorScheme,
  Alert,
  View,
  StyleSheet,
  TouchableOpacity,
  Image,
} from 'react-native';
import { WebView, WebViewMessageEvent } from 'react-native-webview';
import { WebViewNativeEvent } from 'react-native-webview/lib/WebViewTypes';
import { LinkPayload, TransferFinishedPayload } from './types';
import { decode64, isValidUrl } from './utils';

const MeshConnect = ({
                        url, // @deprecated use linkToken instead
                        linkToken,
                        onBrokerConnected,
                        onTransferFinished,
                        onError,
                        onClose,
                      }: {
  url?: string; // @deprecated use linkToken instead
  linkToken?: string;
  onBrokerConnected?: (payload: LinkPayload) => void;
  onTransferFinished?: (payload: TransferFinishedPayload) => void;
  onError?: (err: string) => void;
  onClose?: () => void;
}) => {
  const isDarkMode = useColorScheme?.() === 'dark';

  const backgroundStyle = {
    backgroundColor: isDarkMode ? '#000000' : '#ffffff',
  };
  const [linkUrl, setLinkUrl] = useState<string | null>(null);
  const [catalogUrl, setCatalogUrl] = useState<string | null>(null);
  const [showWebView, setShowWebView] = useState(false);
  const [showNativeNavbar, setShowNativeNavbar] = useState(false);
  const webViewRef = useRef<WebView>(null);

  useEffect(() => {
    try {
      if (url) {
        if (!isValidUrl(url)) {
          throw new Error('Invalid catalog link provided');
        }

        setCatalogUrl(url);
        setShowWebView(true);
      }
      // eslint-disable-next-line
    } catch (err: any) {
      onError?.(err?.message || 'An error occurred during connection establishment');
    }

    return () => {
      setLinkUrl(null);
      setShowWebView(false);
    };
  }, [url, onError]);

  useEffect(() => {
    try {
      if (linkToken) {
        const decodedUrl = decode64(linkToken);

        if (!isValidUrl(decodedUrl)) {
          throw new Error('Invalid link token provided');
        }

        setCatalogUrl(decodedUrl);
        setShowWebView(true);
      }
      // eslint-disable-next-line
    } catch (err: any) {
      onError?.(err?.message || 'An error occurred during connection establishment');
    }

    return () => {
      setLinkUrl(null);
      setShowWebView(false);
    };
  }, [linkToken, onError]);

  const handleNavState = (event: WebViewNativeEvent) => {
    if (event.url.endsWith('/broker-connect/catalog')) {
      setShowNativeNavbar(false);
    }
  };

  const handleMessage = (event: WebViewMessageEvent) => {
    const { type, payload } = JSON.parse(event.nativeEvent.data);

    if (type === 'close' || type === 'done') {
      onClose?.();
    }

    if (type === 'showClose') {
      showCloseAlert();
    }

    if (type === 'showNativeNavbar') {
      setShowNativeNavbar(payload);
    }

    if (type === 'brokerageAccountAccessToken') {
      onBrokerConnected?.({ accessToken: payload });
    }

    if (type === 'delayedAuthentication') {
      onBrokerConnected?.({ delayedAuth: payload });
    }

    if (type === 'transferFinished') {
      onTransferFinished?.(payload);
    }
  };

  const goBack = () => webViewRef?.current?.goBack();

  const showCloseAlert = () =>
    Alert.alert(
      'Are you sure you want to exit?',
      'Your progress will be lost.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        { text: 'Exit', onPress: () => onClose?.() },
      ],
    );

  const composedUri = useMemo(() => {
    if (linkUrl) {
      return linkUrl;
    }
    if (catalogUrl) {
      return catalogUrl;
    }
    return null;
  }, [linkUrl, catalogUrl]);

  return (
    <SafeAreaView style={{ flex: 1 }} testID={'mesh-finance-component'}>
      <StatusBar
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
        backgroundColor={backgroundStyle.backgroundColor}
      />
      {showNativeNavbar && (
        <View testID={'native-navbar'} style={styles.navBarContainer}>
          <TouchableOpacity
            testID={'nav-back-button'}
            onPress={goBack} style={styles.navBarImgContainer}>
            <Image
              source={require('./assets/ic_back.png')}
              style={styles.navBarImgButton}
            />
          </TouchableOpacity>

          <Image
            source={require('./assets/mesh_logo.png')}
            style={styles.navBarLogo}
          />

          <TouchableOpacity
            onPress={showCloseAlert}
            style={styles.navBarImgContainer}
            testID={'close-button'}
          >
            <Image
              source={require('./assets/ic_close.png')}
              style={styles.navBarImgButton}
            />
          </TouchableOpacity>
        </View>
      )}
      {showWebView && composedUri && (
        <WebView
          testID={'webview'}
          ref={webViewRef}
          source={{ uri: composedUri }}
          onMessage={handleMessage}
          javaScriptEnabled={true}
          onNavigationStateChange={handleNavState}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  navBarContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: 64,
    paddingTop: 12,
    paddingStart: 6,
    paddingEnd: 8,
  },
  navBarImgContainer: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navBarImgButton: {
    width: 24,
    height: 24,
    resizeMode: 'contain',
  },
  navBarLogo: {
    height: 18,
    resizeMode: 'contain',
  },
});

export default MeshConnect;
