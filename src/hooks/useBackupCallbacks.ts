import { useEffect, useMemo, useState } from 'react';
import { Alert, Appearance } from 'react-native';
import { WebViewMessageEvent } from 'react-native-webview';

import { buildBackupWidgetUrl, resolveLanguage } from '../utils';
import { sdkSpecs } from '../utils/sdkConfig';
import { DEFAULT_BACKUP_WIDGET_ORIGIN } from '../constant';
import {
  AccessTokenPayload,
  DelayedAuthPayload,
  LinkConnectBackupConfiguration,
  LinkPayload,
  TransferFinishedPayload,
  isLinkEventTypeKey,
  mappedLinkEvents,
} from '../';

interface BackupCallbackOptions {
  /**
   * Invoked on the widget's `loaded` message so the caller can push the
   * `MeshBackupConfig` into the WebView (the widget hydrates from it). Mirrors
   * the web SDK, which posts the session on `loaded`.
   */
  onWidgetLoaded: () => void;
}

/**
 * Backup analog of {@link useSDKCallbacks}. Derives the widget URL from the
 * origin + display hints (there is no link token to decode), resolves the
 * native loading theme, and maps widget messages onto the host callbacks. It
 * deliberately shares no code with the primary link-token path.
 */
const useBackupCallbacks = (
  props: LinkConnectBackupConfiguration,
  { onWidgetLoaded }: BackupCallbackOptions
) => {
  const [showNativeNavbar, setShowNativeNavbar] = useState(false);
  const [darkTheme, setDarkTheme] = useState<boolean>();

  const widgetOrigin = props.widgetOrigin || DEFAULT_BACKUP_WIDGET_ORIGIN;
  const settingsTheme = props.settings?.theme;
  const language = resolveLanguage(props.settings?.language);

  const linkUrl = useMemo(
    () =>
      buildBackupWidgetUrl(widgetOrigin, {
        platform: sdkSpecs.platform,
        sdkVersion: sdkSpecs.version,
        // `'system'` is resolved natively (below) into the loading background;
        // don't put the literal `'system'` on the URL as a theme hint.
        theme: settingsTheme === 'system' ? undefined : settingsTheme,
        language,
      }),
    [widgetOrigin, settingsTheme, language]
  );

  // Unlike the primary path there is no token-embedded theme; default to
  // following the device when the host does not set one, so the flow always
  // renders (the primary path can defer rendering until a token supplies it).
  useEffect(() => {
    if (settingsTheme === undefined || settingsTheme === 'system') {
      setDarkTheme(Appearance.getColorScheme() === 'dark');
    } else {
      setDarkTheme(settingsTheme === 'dark');
    }
  }, [settingsTheme]);

  // istanbul ignore next
  const showCloseAlert = () =>
    Alert.alert('Are you sure you want to exit?', 'Your progress will be lost.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Exit', onPress: () => props.onExit?.() },
    ]);

  const handleMessage = (event: WebViewMessageEvent) => {
    let nativeEventData;
    try {
      nativeEventData = JSON.parse(event.nativeEvent.data);
    } catch {
      // A malformed message from the widget must not throw inside onMessage.
      return;
    }
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

      case 'loaded': {
        // Push the deposit config into the widget, then surface the event.
        onWidgetLoaded();
        props?.onEvent?.({ type: eventType });
        break;
      }

      case 'transferFinished': {
        const payloadData = payload as TransferFinishedPayload;
        props?.onEvent?.({ type: eventType, payload: payloadData });
        props?.onTransferFinished?.(payloadData);
        break;
      }

      // Deposit-only backup does not connect accounts, but the integration
      // callbacks stay wired so the host contract matches the primary path.
      case 'brokerageAccountAccessToken': {
        const payloadData: LinkPayload = {
          accessToken: payload as AccessTokenPayload,
        };
        props?.onEvent?.({ type: eventType, payload: payloadData });
        props?.onIntegrationConnected?.(payloadData);
        break;
      }

      case 'delayedAuthentication': {
        const payloadData: LinkPayload = {
          delayedAuth: payload as DelayedAuthPayload,
        };
        props?.onEvent?.({ type: eventType, payload: payloadData });
        props?.onIntegrationConnected?.(payloadData);
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

  return {
    linkUrl,
    showNativeNavbar,
    darkTheme,
    handleMessage,
    showCloseAlert,
  };
};

export { useBackupCallbacks };
