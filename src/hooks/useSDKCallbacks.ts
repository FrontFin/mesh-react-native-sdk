import { useEffect, useState } from 'react';
import { Alert, Appearance } from 'react-native';
import { WebViewMessageEvent } from 'react-native-webview';
import { WebViewNativeEvent } from 'react-native-webview/lib/WebViewTypes';

import {
  decode64,
  isValidUrl,
  addURLParam,
  extractThemeFromToken,
} from '../utils';
import {
  AccessTokenPayload,
  DelayedAuthPayload,
  LinkConfiguration,
  LinkPayload,
  TransferFinishedPayload,
  isLinkEventTypeKey,
  mappedLinkEvents,
} from '../';

const useSDKCallbacks = (props: LinkConfiguration) => {
  const [linkUrl, setLinkUrl] = useState<string | null>(null);
  const [showWebView, setShowWebView] = useState(false);
  const [showNativeNavbar, setShowNativeNavbar] = useState(false);
  const [deviceColorScheme, setDeviceColorScheme] = useState(
    Appearance.getColorScheme()
  );
  const [effectiveTheme, setEffectiveTheme] = useState<string>();
  const [isDarkTheme, setIsDarkTheme] = useState<boolean>();

  useEffect(() => {
    try {
      if (props.linkToken) {
        let decodedUrl = decode64(props.linkToken);

        if (!isValidUrl(decodedUrl)) {
          throw new Error('Invalid link token provided');
        }

        // Add the `theme` to the URL as a `th` query parameter
        const settingsTheme = props.settings?.theme;
        if (settingsTheme) {
          decodedUrl = addURLParam(decodedUrl, 'th', settingsTheme);
        }

        // Add the `language` to the URL as a `lng` query parameter
        const settingsLanguage = props.settings?.language;
        if (settingsLanguage) {
          decodedUrl = addURLParam(decodedUrl, 'lng', settingsLanguage);
        }

        // Add the `displayFiatCurrency` to the URL as a `fiatCur` query parameter
        const settingsFiatCurrency = props.settings?.displayFiatCurrency;
        if (settingsFiatCurrency) {
          decodedUrl = addURLParam(decodedUrl, 'fiatCur', settingsFiatCurrency);
        }

        // Determine the effective theme to apply based on the settings and URL, and save to state
        // The settings theme takes precedence over the URL theme,
        // and if neither is provided, the effective theme will be undefined
        setEffectiveTheme(settingsTheme ?? extractThemeFromToken(decodedUrl));

        // Save the decoded URL to state to load in the WebView
        setLinkUrl(decodedUrl);
        setShowWebView(true);
      }
      // eslint-disable-next-line
    } catch (err: any) {
      props.onExit?.(
        err?.message || 'An error occurred during connection establishment'
      );
    }

    return () => {
      setLinkUrl(null);
      setShowWebView(false);
    };
  }, [
    props.linkToken,
    props.onExit,
    props.settings?.language,
    props.settings?.theme,
  ]);

  // Listen for changes in the device's colour scheme and save to state
  // so that it can be applied if the effective theme is 'system'
  useEffect(() => {
    const colorSchemeWatcher = Appearance.addChangeListener(
      ({ colorScheme }) => {
        setDeviceColorScheme(colorScheme);
      }
    );
    return () => {
      // Clean up the listener on unmount
      colorSchemeWatcher.remove();
    };
  }, []);

  // Listen for changes in the device's colour scheme and effective theme
  // to update the darkTheme state accordingly
  useEffect(() => {
    if (effectiveTheme === 'system') {
      setIsDarkTheme(deviceColorScheme === 'dark');
    } else {
      setIsDarkTheme(effectiveTheme === 'dark');
    }
  }, [deviceColorScheme, effectiveTheme]);

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
    darkTheme: isDarkTheme,
    handleMessage,
    handleNavState,
    showCloseAlert,
  };
};

export { useSDKCallbacks };
