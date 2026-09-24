import { Image, TouchableOpacity, View } from 'react-native';
import { WebView } from 'react-native-webview';
import React, { useEffect, useMemo, useState } from 'react';

import { SDKContainer } from './SDKContainer';
import { SDKViewContainer } from './SDKViewContainer';

import type { LinkConnectBackupConfiguration } from '../';
import { useBackupCallbacks } from '../hooks/useBackupCallbacks';
import { useWebViewRecovery } from '../hooks/useWebViewRecovery';
import { sdkSpecs } from '../utils/sdkConfig';
import { extractOrigin, toInjectableJson } from '../utils';
import {
  BACKUP_CONFIG_MESSAGE_TYPE,
  DARK_THEME_COLOR_BOTTOM,
  DEFAULT_BACKUP_WIDGET_ORIGIN,
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
  // Render-process-death recovery, shared with LinkConnect. The reset key must
  // change whenever the loaded URL does so a new session gets a fresh auto-reload
  // guard; linkUrl derives from widgetOrigin + theme + language, so key on those
  // (they come from props, before useBackupCallbacks, which needs
  // deliverConfig → webViewRef — so we can't key on linkUrl itself).
  const recoveryResetKey = `${props.widgetOrigin ?? ''}|${
    props.settings?.theme ?? ''
  }|${props.settings?.language ?? ''}`;
  const { webViewRef, hasAutoReloaded, recoverFromRendererDeath } =
    useWebViewRecovery(recoveryResetKey);

  // Deliver the deposit config into the widget once it signals `loaded`,
  // mirroring the web SDK's post-on-loaded handshake. The widget's bridge
  // requires a typed envelope ({ type: 'meshBackupConfig', payload }) and
  // silently drops any message without a `type`, so the bare config must be
  // wrapped. Serialised through toInjectableJson so config values cannot break
  // out of the injected script.
  //
  // We dispatch a synthetic MessageEvent rather than `window.postMessage(...)`:
  // inside a WKWebView, a self-`postMessage` from injected JS does not reliably
  // reach the page's own `message` listeners (unlike the cross-window
  // iframe.contentWindow.postMessage the web SDK uses). Dispatching the event
  // directly is delivered synchronously, and `origin` is set to the widget's
  // own origin so its handshake origin-pinning accepts it.
  //
  // The injected script guards on `window.location.origin` so the config (incl.
  // a possible JIT token) is delivered ONLY when the page really is the widget
  // origin — never into `about:blank` (opaque origin) or any other document that
  // happens to be current when the message fires. `injectJavaScript` targets
  // whatever page is loaded, so this in-page check is the binding, not the
  // navigation allow-list.
  const expectedWidgetOrigin = extractOrigin(
    props.widgetOrigin ?? DEFAULT_BACKUP_WIDGET_ORIGIN
  );
  const deliverConfig = () => {
    const literal = toInjectableJson({
      type: BACKUP_CONFIG_MESSAGE_TYPE,
      payload: props.backupConfig,
    });
    const originLiteral = JSON.stringify(expectedWidgetOrigin);
    webViewRef.current?.injectJavaScript(
      `if (window.location.origin === ${originLiteral}) {` +
        `window.dispatchEvent(new MessageEvent('message', ` +
        `{ data: JSON.parse(${literal}), origin: window.location.origin }));` +
        `} true;`
    );
  };

  const { linkUrl, darkTheme, handleMessage } = useBackupCallbacks(props, {
    onWidgetLoaded: deliverConfig,
  });

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
  // the allow-list alone cannot keep navigation contained. We therefore set the
  // allow-list to `['*']` so every URL reaches the handler and enforce exact-
  // origin containment there. There is deliberately NO opt-out: on the widget's
  // `loaded` message this flow injects the config (incl. a possible JIT bearer
  // token) into whatever page is loaded, so it must never load a non-widget
  // origin.
  const widgetOrigin = extractOrigin(linkUrl);

  // Fail closed unless widgetOrigin is a bare http(s) origin — scheme + host +
  // optional port, and nothing else. extractOrigin passes a non-`scheme://host`
  // value through unchanged, so without this guard a `data:`/custom-scheme
  // origin could satisfy the exact-equality handler below and receive the
  // injected config (incl. a JIT bearer token). The strict host character set
  // also rejects userinfo: `https://widget.example@attacker.example` would
  // otherwise load attacker.example (the real host after `@`) while passing an
  // exact-string check. HTTPS is expected in production; http is allowed for
  // local widget development.
  const isValidWidgetOrigin = /^https?:\/\/[a-z0-9._-]+(:\d+)?$/i.test(
    widgetOrigin
  );

  useEffect(() => {
    if (!isValidWidgetOrigin) {
      props.onExit?.(
        'Invalid widgetOrigin: the backup widget origin must be an absolute http(s) URL'
      );
    }
  }, [isValidWidgetOrigin]);

  if (!isValidWidgetOrigin) {
    // Never mount the WebView, or deliver config, to a non-http(s) origin.
    return null;
  }

  return (
    <SDKWrapperComponent isDarkTheme={isDark}>
      {/* Deposit-only: the widget owns its own in-funnel navigation, so there is
          no native NavBar. The always-present close (✕) below is the single
          exit affordance back to the host. */}
      {initialLoading && <LoadingComponentWebview darkTheme={isDark} />}
      {!props.hideCloseButton && (
        <TouchableOpacity
          testID={'backup-close-button'}
          accessibilityRole={'button'}
          accessibilityLabel={'Close'}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          onPress={() => props.onExit?.()}
          style={{
            position: 'absolute',
            top: 12,
            right: 12,
            zIndex: 20,
            padding: 10,
          }}
        >
          <Image
            source={
              isDark
                ? require('../assets/cross-1-small-dark.png')
                : require('../assets/cross-1-small-light.png')
            }
            style={{ width: 20, height: 20 }}
          />
        </TouchableOpacity>
      )}
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
        // Deposit-only: no OAuth/wallet hand-offs, so force same-frame
        // navigation. Otherwise a target="_blank"/window.open would take the
        // multiple-windows popup path and bypass onShouldStartLoadWithRequest
        // (and the origin containment below) entirely.
        setSupportMultipleWindows={false}
        // Only the widget's own origin may load (see whitelist note above);
        // `about:blank` is allowed because the WebView uses it internally. Any
        // other URL — a different origin or a custom scheme — is blocked and is
        // NOT handed off externally. Origins are compared exactly: a prefix
        // check would admit https://widget.example.attacker.com and the
        // https://widget.example@attacker.example userinfo trick.
        onShouldStartLoadWithRequest={(req) =>
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
