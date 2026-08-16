import { AppState, Linking, View } from 'react-native';
import type { AppStateStatus } from 'react-native';
import { WebView, type WebViewMessageEvent } from 'react-native-webview';
import React, { useEffect, useMemo, useRef, useState } from 'react';

import { NavBar } from './NavBar';
import { SDKContainer } from './SDKContainer';
import { SDKViewContainer } from './SDKViewContainer';

import type { LinkConfiguration } from '../';
import { useSDKCallbacks } from '../hooks/useSDKCallbacks';
import { sdkSpecs } from '../utils/sdkConfig';
import { isAppLaunchScheme, isExternallyOpenedOrigin } from '../utils';
import {
  DARK_THEME_COLOR_BOTTOM,
  LIGHT_THEME_COLOR_BOTTOM,
  WHITELISTED_ORIGINS,
} from '../constant';

/**
 * Hand a URL to the OS — the external browser for https, the wallet app for a
 * custom scheme.
 *
 * `openURL` is deliberate: it issues a view intent via `startActivity`, so unlike
 * `canOpenURL` it is not subject to Android 11+ package-visibility filtering and
 * resolves whenever the target app is installed. A rejection is unlikely for
 * these URLs, but is caught so a failed open cannot surface as an unhandled
 * promise rejection. Warn in dev only, to avoid noise in integrators'
 * production builds.
 */
const openExternally = (url: string): void => {
  void Linking.openURL(url).catch((err) => {
    if (__DEV__) {
      console.warn('Failed to open external URL', url, err);
    }
  });
};

/**
 * Scheme + host (+ optional port) of a URL, lowercased, or null if it doesn't
 * parse. Hand-rolled because React Native's `URL` polyfill does not implement
 * `.origin` (it throws), so `new URL(x).origin` cannot be used here.
 */
const getOrigin = (url: string): string | null => {
  const match = /^([a-z][a-z0-9+.-]*:\/\/[^/?#]+)/i.exec(url);
  return match ? match[1].toLowerCase() : null;
};

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

export const LinkConnect = (props: LinkConfiguration) => {
  const {
    showNativeNavbar,
    showWebView,
    linkUrl,
    darkTheme,
    isOAuthInProgress,
    handleMessage,
    handleNavState,
    showCloseAlert,
  } = useSDKCallbacks(props);
  const webViewRef = useRef<WebView>(null);
  const hasAutoReloaded = useRef(false);
  // Set when the WebView render process dies (e.g. Android reclaims memory
  // while the app is backgrounded during an external OAuth hand-off). Used to
  // recover the dead WebView when the app returns to the foreground.
  const rendererGone = useRef(false);
  const goBack = () => webViewRef?.current?.goBack();

  useEffect(() => {
    hasAutoReloaded.current = false;
  }, [linkUrl]);

  // Recover a dead WebView on foreground return. If the render process was
  // killed while backgrounded (memory pressure during an external OAuth trip),
  // reload once when the user comes back so the flow isn't stuck on a blank
  // WebView with the in-progress session silently lost. Only clear the flag
  // once a reload can actually run (ref mounted), so a not-yet-mounted WebView
  // on the first foreground tick doesn't drop the recovery.
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

  // A dead render process can't complete an OAuth (the old isOAuthInProgress
  // guard just stranded the flow on a blank WebView), so recover regardless.
  // Foregrounded: reload now. Backgrounded: a reload issued now may not take,
  // so flag it and let the AppState 'active' listener recover on return. We do
  // not flag after a foreground reload, so an unrelated later foreground does
  // not fire a spurious reload that would restart the session.
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

  const injectedScript = useMemo(() => {
    let sdkTypeScript = `
    window.meshSdkPlatform='${sdkSpecs.platform}';
    window.meshSdkVersion='${sdkSpecs.version}';
  `;

    if (props.settings) {
      // Kept for backward-compat with older Link builds that read this global.
      // Current Link ingests tokens via the frontAccessTokens post below.
      // Double-encoded so a token field containing a quote cannot terminate the
      // string literal and break the whole injected script.
      const injectedAccessTokens = Array.isArray(props.settings.accessTokens)
        ? props.settings.accessTokens
        : [];
      sdkTypeScript += `
        window.accessTokens=${JSON.stringify(
          JSON.stringify(injectedAccessTokens)
        )};
      `;
    }

    return sdkTypeScript;
  }, [props.settings]);

  // Hand the Link web app any previously-connected accounts once it reports it
  // has loaded, mirroring the web SDK. Current Link ingests return-user tokens
  // only via this `frontAccessTokens` message (the `window.accessTokens` global
  // above is backward-compat only), so without this post React Native return
  // users never skip login. Post only to the origin we loaded from the link
  // token, and only when the sender is that same origin, so a page on a
  // different origin can neither trigger nor receive a token hand-off. Double-
  // encoded so token values cannot break out of the injected script.
  const postFrontAccessTokens = (senderUrl?: string) => {
    const raw = props.settings?.accessTokens;
    const tokens = Array.isArray(raw) ? raw : [];
    if (tokens.length === 0 || !linkUrl || !senderUrl) {
      return;
    }
    const linkOrigin = getOrigin(linkUrl);
    if (!linkOrigin || getOrigin(senderUrl) !== linkOrigin) {
      return;
    }
    const message = JSON.stringify({
      type: 'frontAccessTokens',
      payload: tokens,
    });
    webViewRef.current?.injectJavaScript(
      `window.postMessage(JSON.parse(${JSON.stringify(
        message
      )}), ${JSON.stringify(linkOrigin)}); true;`
    );
  };

  // When Link signals it has loaded, hand it the injected accessTokens, then
  // delegate to the normal SDK handler. The parse here only drives the `loaded`
  // check; `handleMessage` still processes every event as before, so delegation
  // behaviour is unchanged.
  const handleWebViewMessage = (event: WebViewMessageEvent) => {
    try {
      if (JSON.parse(event.nativeEvent.data)?.type === 'loaded') {
        postFrontAccessTokens(event.nativeEvent.url);
      }
    } catch {
      // Only our `loaded` detection; the SDK handler below owns the payload.
    }
    handleMessage(event);
  };

  const SDKWrapperComponent = props.renderViewContainer
    ? SDKViewContainer
    : SDKContainer;

  const [initialLoading, setInitialLoading] = useState(true);

  if (darkTheme === undefined) {
    return null;
  }

  // by default disableDomainWhiteList is false
  const { disableDomainWhiteList = false } = props;
  const whiteListProps = disableDomainWhiteList
    ? {}
    : { originWhitelist: WHITELISTED_ORIGINS };

  return (
    <SDKWrapperComponent isDarkTheme={darkTheme}>
      {showNativeNavbar && (
        <NavBar
          goBack={goBack}
          showCloseAlert={showCloseAlert}
          isDarkTheme={darkTheme}
        />
      )}
      {initialLoading && <LoadingComponentWebview darkTheme={darkTheme} />}
      {showWebView && linkUrl && (
        <WebView
          bounces={false}
          style={{
            backgroundColor: darkTheme
              ? DARK_THEME_COLOR_BOTTOM
              : LIGHT_THEME_COLOR_BOTTOM,
          }}
          testID={'webview'}
          ref={webViewRef}
          source={{ uri: linkUrl }}
          cacheMode={'LOAD_DEFAULT'}
          onMessage={handleWebViewMessage}
          onLoadEnd={() => {
            setInitialLoading(false);
          }}
          startInLoadingState={true}
          javaScriptEnabled={true}
          injectedJavaScript={injectedScript}
          {...whiteListProps}
          onNavigationStateChange={handleNavState}
          // Android popup routing. PRG-3107 set this false so Binance app auth
          // reached a handler the SDK controls; at the time onOpenWindow did not
          // exist, so onShouldStartLoadWithRequest was the only one. It is back to
          // the library default because false has a side effect: an Android
          // `target="_blank"` click becomes a same-frame navigation, and
          // react-native-webview's own wrapper reaches that before our handler,
          // gating every non-whitelisted URL behind `Linking.canOpenURL` — which
          // is package-visibility filtered on Android 11+ and answers false for
          // any scheme the integrator's manifest does not name in `<queries>`.
          // Wallet deep links were dropped with only a console warning (ONC-447).
          // With multiple windows enabled those clicks arrive at onOpenWindow,
          // which opens both https handoffs and wallet schemes — so PRG-3107's
          // Binance behaviour holds, via the sibling handler.
          setSupportMultipleWindows={true}
          // iOS blocks a gestureless window.open (e.g. link-v2's Coinbase
          // deposit handoff fires it after an async fetch, outside the tap).
          // Without this, WebKit never calls the popup delegate, so
          // onOpenWindow below never fires and the deposit dead-ends.
          javaScriptCanOpenWindowsAutomatically={true}
          onShouldStartLoadWithRequest={(req) => {
            if (isExternallyOpenedOrigin(req.url) || isAppLaunchScheme(req.url)) {
              openExternally(req.url);
              return false;
            }
            return req.url.startsWith('http');
          }}
          onOpenWindow={({ nativeEvent }) => {
            // Every `target="_blank"` / window.open target lands here: link-v2's
            // OAuth and on-ramp handoffs (https) and its wallet deep links
            // (custom scheme). Both must leave the WebView; anything that could
            // execute or read local state is rejected by isAppLaunchScheme.
            const { targetUrl } = nativeEvent;
            if (targetUrl?.startsWith('https://') || isAppLaunchScheme(targetUrl)) {
              openExternally(targetUrl);
            }
          }}
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
            if (!isOAuthInProgress.current && !hasAutoReloaded.current) {
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
            if (
              nativeEvent.statusCode >= 500 &&
              !isOAuthInProgress.current &&
              !hasAutoReloaded.current
            ) {
              hasAutoReloaded.current = true;
              webViewRef.current?.reload();
            }
          }}
          onContentProcessDidTerminate={recoverFromRendererDeath}
          onRenderProcessGone={recoverFromRendererDeath}
        />
      )}
    </SDKWrapperComponent>
  );
};
