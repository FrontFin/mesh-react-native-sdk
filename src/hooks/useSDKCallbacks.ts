import { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Appearance } from 'react-native';
import { WebViewMessageEvent } from 'react-native-webview';
import { WebViewNativeEvent } from 'react-native-webview/lib/WebViewTypes';

import {
  decode64,
  isValidUrl,
  addURLParam,
  removeURLParam,
  isDarkLinkTheme,
  isMfsLinkUrl,
  resolveLanguage,
} from '../utils';
import { sdkSpecs } from '../utils/sdkConfig';
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
  const [linkUrl, setLinkUrl] = useState<string | null>(null);
  const [showWebView, setShowWebView] = useState(false);
  const [showNativeNavbar, setShowNativeNavbar] = useState(false);
  // Read once per Link page, like the page itself: Link doesn't follow a device switch
  // mid-session. Re-read only when the URL inputs change (the WebView remounts then
  // anyway), so a rerun from a new onExit can't change the URL or the native colors.
  const [systemIsDark, setSystemIsDark] = useState(false);
  const appearanceSnapshot = useRef<{ pageKey: string; isDark: boolean }>();
  const isOAuthInProgress = useRef(false);

  useEffect(() => {
    try {
      if (props.linkToken) {
        let decodedUrl = decode64(props.linkToken);

        if (!isValidUrl(decodedUrl)) {
          throw new Error('Invalid link token provided');
        }

        // Resolved, so 'system' and the same device tag share a page.
        const settingsLanguage = resolveLanguage(props.settings?.language);
        const pageKey = [
          props.linkToken,
          props.settings?.theme,
          settingsLanguage,
          props.settings?.displayFiatCurrency,
        ].join('|');
        if (appearanceSnapshot.current?.pageKey !== pageKey) {
          appearanceSnapshot.current = {
            pageKey,
            isDark: Appearance.getColorScheme() === 'dark',
          };
        }
        const deviceIsDark = appearanceSnapshot.current.isDark;

        // The token can already carry a th (some backends add th=dark);
        // the app's theme replaces it. 'system' is sent as the device's light/dark.
        const settingsTheme = props.settings?.theme;
        if (settingsTheme) {
          const th =
            settingsTheme === 'system'
              ? deviceIsDark
                ? 'dark'
                : 'light'
              : settingsTheme;
          decodedUrl = addURLParam(removeURLParam(decodedUrl, 'th'), 'th', th);
        }

        // Add the `language` to the URL as a `lng` query parameter.
        // `'system'` resolves to the device locale (see resolveLanguage).
        if (settingsLanguage) {
          decodedUrl = addURLParam(decodedUrl, 'lng', settingsLanguage);
        }

        // Add the `displayFiatCurrency` to the URL as a `fiatCur` query parameter
        const settingsFiatCurrency = props.settings?.displayFiatCurrency;
        if (settingsFiatCurrency) {
          decodedUrl = addURLParam(decodedUrl, 'fiatCur', settingsFiatCurrency);
        }

        if (!/[?&]platform=/.test(decodedUrl)) {
          decodedUrl = addURLParam(decodedUrl, 'platform', sdkSpecs.platform);
        }

        // Save the decoded URL to state to load in the WebView
        setSystemIsDark(deviceIsDark);
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
      isOAuthInProgress.current = false;
    };
  }, [
    props.linkToken,
    props.onExit,
    props.settings?.language,
    props.settings?.theme,
    props.settings?.displayFiatCurrency,
  ]);

  const darkTheme = useMemo(
    () => (linkUrl ? isDarkLinkTheme(linkUrl, systemIsDark) : undefined),
    [linkUrl, systemIsDark]
  );
  const isMfs = useMemo(
    () => (linkUrl ? isMfsLinkUrl(linkUrl) : false),
    [linkUrl]
  );

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
    isMfs,
    isOAuthInProgress, // MutableRefObject<boolean> — read .current in callbacks
    handleMessage,
    handleNavState,
    showCloseAlert,
  };
};

export { useSDKCallbacks };
