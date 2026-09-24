import { AppState, View } from 'react-native';
import type { AppStateStatus } from 'react-native';
import { WebView } from 'react-native-webview';
import React, { useEffect, useMemo, useRef, useState } from 'react';

import { NavBar } from './NavBar';
import { SDKContainer } from './SDKContainer';
import { SDKViewContainer } from './SDKViewContainer';

import type { LinkConnectBackupConfiguration } from '../';
import { useBackupCallbacks } from '../hooks/useBackupCallbacks';
import { sdkSpecs } from '../utils/sdkConfig';
import { extractOrigin, toInjectableJson } from '../utils';
import {
  BACKUP_CONFIG_MESSAGE_TYPE,
  DARK_THEME_COLOR_BOTTOM,
  LIGHT_THEME_COLOR_BOTTOM,
} from '../constant';

const LoadingComponentWebview = ({ darkTheme }: { darkTheme: boolean }) => {
  return (
    <View
      style={{
        position: 'absolute',
        zIndex: 10,
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: darkTheme
          ? DARK_THEME_COLOR_BOTTOM
          : LIGHT_THEME_COLOR_BOTTOM,
      }}
    />
  );
};

/**
 * Deposit-only backup entry point, used when the primary Mesh API is
 * unavailable. It loads the standalone backup widget from its own origin and
 * hydrates it with a {@link LinkConnectBackupConfiguration.backupConfig} over
 * the WebView message bridge — there is no link token, and no core Mesh API
 * call is made. This is a sibling of `LinkConnect`, kept entirely separate so
 * the primary (money) path is never altered by backup changes.
 */
export const LinkConnectBackup = (props: LinkConnectBackupConfiguration) => {
  const webViewRef = useRef<WebView>(null);
  const hasAutoReloaded = useRef(false);
  // Set when the WebView render process dies (e.g. Android reclaims memory
  // while the app is backgrounded). Used to recover on return to foreground.
  const rendererGone = useRef(false);

  // Deliver the deposit config into the widget once it signals `loaded`,
  // mirroring the web SDK's post-on-loaded handshake. The widget's bridge
  // requires a typed envelope ({ type: 'meshBackupConfig', payload }) and
  // silently drops any message without a `type`, so the bare config must be
  // wrapped. Serialised through toInjectableJson so config values cannot break
  // out of the injected script.
  const deliverConfig = () => {
    const literal = toInjectableJson({
      type: BACKUP_CONFIG_MESSAGE_TYPE,
      payload: props.backupConfig,
    });
    webViewRef.current?.injectJavaScript(
      `window.postMessage(JSON.parse(${literal}), '*'); true;`
    );
  };

  const { linkUrl, showNativeNavbar, darkTheme, handleMessage, showCloseAlert } =
    useBackupCallbacks(props, { onWidgetLoaded: deliverConfig });

  const goBack = () => webViewRef?.current?.goBack();

  useEffect(() => {
    hasAutoReloaded.current = false;
  }, [linkUrl]);

  // Recover a dead WebView on foreground return. If the render process was
  // killed while backgrounded, reload once when the user comes back so the flow
  // isn't stuck on a blank WebView. Only clear the flag once a reload can
  // actually run (ref mounted).
  useEffect(() => {
    const handler = (state: AppStateStatus) => {
      if (state === 'active' && rendererGone.current && webViewRef.current) {
        rendererGone.current = false;
        webViewRef.current.reload();
      }
    };
    const sub = AppState.addEventListener('change', handler);
    // RN >=0.65 returns a subscription with remove(); older RN (the peer dep
    // allows >=0.60) returns void and needs the static removeEventListener.
    return () => {
      if (typeof sub?.remove === 'function') {
        sub.remove();
      } else {
        (
          AppState as unknown as {
            removeEventListener?: (
              type: 'change',
              h: (state: AppStateStatus) => void
            ) => void;
          }
        ).removeEventListener?.('change', handler);
      }
    };
  }, []);

  // Foregrounded: reload now. Backgrounded: a reload issued now may not take,
  // so flag it and let the AppState 'active' listener recover on return. We do
  // not flag after a foreground reload, so an unrelated later foreground does
  // not fire a spurious reload.
  const recoverFromRendererDeath = () => {
    if (AppState.currentState === 'active') {
      if (!hasAutoReloaded.current) {
        hasAutoReloaded.current = true;
        webViewRef.current?.reload();
      }
    } else {
      rendererGone.current = true;
    }
  };

  const injectedScript = useMemo(
    () => `
    window.meshSdkPlatform='${sdkSpecs.platform}';
    window.meshSdkVersion='${sdkSpecs.version}';
  `,
    []
  );

  const SDKWrapperComponent = props.renderViewContainer
    ? SDKViewContainer
    : SDKContainer;

  const [initialLoading, setInitialLoading] = useState(true);

  const isDark = !!darkTheme;

  // The backup widget is a single-origin static SPA and, being deposit-only, has
  // no OAuth/wallet hand-offs — nothing should ever leave it. react-native-webview
  // runs its origin allow-list BEFORE onShouldStartLoadWithRequest and hands any
  // non-matching URL (including custom schemes) straight to Linking.openURL, so
  // the allow-list alone cannot keep navigation contained. We therefore always
  // set the allow-list to `['*']` so every URL reaches the handler, and enforce
  // containment there — otherwise `disableDomainWhiteList` would restore RN's
  // default http(s) allow-list and let a custom scheme bypass the handler into
  // Linking.openURL. `disableDomainWhiteList` instead relaxes the handler itself.
  const { disableDomainWhiteList = false } = props;
  const widgetOrigin = extractOrigin(linkUrl);

  return (
    <SDKWrapperComponent isDarkTheme={isDark}>
      {showNativeNavbar && (
        <NavBar
          goBack={goBack}
          showCloseAlert={showCloseAlert}
          isDarkTheme={isDark}
        />
      )}
      {initialLoading && <LoadingComponentWebview darkTheme={isDark} />}
      <WebView
        bounces={false}
        style={{
          backgroundColor: isDark
            ? DARK_THEME_COLOR_BOTTOM
            : LIGHT_THEME_COLOR_BOTTOM,
        }}
        testID={'webview'}
        ref={webViewRef}
        source={{ uri: linkUrl }}
        cacheMode={'LOAD_DEFAULT'}
        onMessage={handleMessage}
        onLoadEnd={() => {
          setInitialLoading(false);
        }}
        startInLoadingState={true}
        javaScriptEnabled={true}
        injectedJavaScript={injectedScript}
        originWhitelist={['*']}
        // Only the widget's own origin may load (see whitelist note above);
        // `about:blank` is allowed because the WebView uses it internally. Any
        // other URL — a different origin or a custom scheme — is blocked and is
        // NOT handed off externally, unless the host opts out via
        // disableDomainWhiteList. Origins are compared exactly: a prefix check
        // would admit https://widget.example.attacker.com and the
        // https://widget.example@attacker.example userinfo trick.
        onShouldStartLoadWithRequest={(req) =>
          disableDomainWhiteList ||
          req.url === 'about:blank' ||
          extractOrigin(req.url) === widgetOrigin
        }
        domStorageEnabled={true}
        onError={({ nativeEvent }) => {
          props.onEvent?.({
            type: 'webViewLoadFailed',
            payload: {
              url: nativeEvent.url,
              errorCode: nativeEvent.code,
              errorDescription: nativeEvent.description,
            },
          });
          if (!hasAutoReloaded.current) {
            hasAutoReloaded.current = true;
            webViewRef.current?.reload();
          }
        }}
        onHttpError={({ nativeEvent }) => {
          props.onEvent?.({
            type: 'webViewLoadFailed',
            payload: {
              url: nativeEvent.url,
              errorCode: nativeEvent.statusCode,
            },
          });
          if (nativeEvent.statusCode >= 500 && !hasAutoReloaded.current) {
            hasAutoReloaded.current = true;
            webViewRef.current?.reload();
          }
        }}
        onContentProcessDidTerminate={recoverFromRendererDeath}
        onRenderProcessGone={recoverFromRendererDeath}
      />
    </SDKWrapperComponent>
  );
};
