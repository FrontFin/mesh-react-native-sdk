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
  LinkTheme,
  TransferFinishedPayload,
  isLinkEventTypeKey,
  mappedLinkEvents,
} from '../';

/**
 * Resolve the host theme to the `'dark' | 'light'` the backup widget expects on
 * its `?theme=` param. An explicit `'dark'`/`'light'` from the host wins;
 * `'system'` or an unset theme falls back to the device appearance (read once,
 * at build time — a WebView's own prefers-color-scheme would follow the device,
 * not the host app, which is exactly what this passes through).
 */
const resolveWidgetTheme = (theme: LinkTheme | undefined): 'dark' | 'light' => {
  if (theme === 'dark' || theme === 'light') {
    return theme;
  }
  return Appearance.getColorScheme() === 'dark' ? 'dark' : 'light';
};

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

  // Nullish (not `||`) so only an omitted widgetOrigin picks the default: an
  // explicit empty string flows through and fails the origin validation
  // (fail-closed) instead of silently loading the default origin.
  const widgetOrigin = props.widgetOrigin ?? DEFAULT_BACKUP_WIDGET_ORIGIN;
  const settingsTheme = props.settings?.theme;
  const language = resolveLanguage(props.settings?.language);

  const linkUrl = useMemo(
    () =>
      buildBackupWidgetUrl(widgetOrigin, {
        platform: sdkSpecs.platform,
        sdkVersion: sdkSpecs.version,
        // Always a resolved 'dark'/'light' — the widget matches the host theme
        // via ?theme= rather than the device's prefers-color-scheme. Resolved
        // inside the memo so it's read once per URL, not re-read on every render
        // (no Appearance listener — a mid-session device toggle must not reload
        // the WebView and reset the funnel).
        theme: resolveWidgetTheme(settingsTheme),
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
    // JSON.parse also accepts primitives (e.g. `null`, a number), which would
    // throw on destructuring — the widget's messages are untrusted, so ignore
    // anything that isn't a non-null object.
    if (typeof nativeEventData !== 'object' || nativeEventData === null) {
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
