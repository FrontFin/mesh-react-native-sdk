import { useEffect, useState } from 'react';
import { Alert, Appearance } from 'react-native';
import { WebViewMessageEvent } from 'react-native-webview';
import { WebViewNativeEvent } from 'react-native-webview/lib/WebViewTypes';

import {
  decode64,
  isValidUrl,
  urlSearchParams,
  decodeLinkStyle,
  addURLParam,
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
  const [linkColorScheme, setLinkColorScheme] = useState<string | undefined>(
    undefined
  );
  const [darkTheme, setDarkTheme] = useState<boolean | undefined>(undefined);

  useEffect(() => {
    try {
      if (props.linkToken) {
        let decodedUrl = decode64(props.linkToken);

        if (!isValidUrl(decodedUrl)) {
          throw new Error('Invalid link token provided');
        }

        const queryParams = urlSearchParams(decodedUrl);
        const styleParam = queryParams['link_style'];
        const style = decodeLinkStyle(styleParam);

        // settings.theme overrides the theme encoded in the link token
        const settingsTheme = props.settings?.theme;
        const effectiveTheme = settingsTheme ?? style?.th;

        if (effectiveTheme === 'system') {
          const colorScheme = Appearance.getColorScheme();
          setLinkColorScheme('system');
          setDarkTheme(colorScheme === 'dark');
        } else {
          setDarkTheme(effectiveTheme === 'dark');
        }

        // Append the resolved theme as a plain `th` query param so the
        // WebView renders with the correct theme (mirrors Android SDK behaviour).
        if (settingsTheme) {
          const resolvedTheme =
            settingsTheme === 'system'
              ? Appearance.getColorScheme() === 'dark'
                ? 'dark'
                : 'light'
              : settingsTheme;
          decodedUrl = addURLParam(decodedUrl, 'th', resolvedTheme);
        }

        if (props.settings?.language) {
          decodedUrl = addURLParam(decodedUrl, 'lng', props.settings?.language);
        }
        if (props.settings?.displayFiatCurrency) {
          decodedUrl = addURLParam(
            decodedUrl,
            'fiatCur',
            props.settings?.displayFiatCurrency
          );
        }

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
  }, [props.linkToken, props.onExit, props.settings?.language, props.settings?.theme]);

  useEffect(() => {
    const colorSchemeWatcher = Appearance.addChangeListener(
      ({ colorScheme }) => {
        if (linkColorScheme === 'system') {
          setDarkTheme(colorScheme === 'dark');
        }
      }
    );

    return () => {
      colorSchemeWatcher.remove();
    };
  }, [linkColorScheme]);

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
    darkTheme,
    handleMessage,
    handleNavState,
    showCloseAlert,
  };
};

export { useSDKCallbacks };
