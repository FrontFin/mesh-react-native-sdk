import { Linking, View } from 'react-native';
import { WebView } from 'react-native-webview';
import React, { useEffect, useMemo, useRef, useState } from 'react';

import { NavBar } from './NavBar';
import { SDKContainer } from './SDKContainer';
import { SDKViewContainer } from './SDKViewContainer';

import type { LinkConfiguration } from '../';
import { useSDKCallbacks } from '../hooks/useSDKCallbacks';
import { sdkSpecs } from '../utils/sdkConfig';
import { isExternallyOpenedOrigin } from '../utils';
import {
  DARK_THEME_COLOR_BOTTOM,
  LIGHT_THEME_COLOR_BOTTOM,
  WHITELISTED_ORIGINS,
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
  const goBack = () => webViewRef?.current?.goBack();

  useEffect(() => {
    hasAutoReloaded.current = false;
  }, [linkUrl]);

  const injectedScript = useMemo(() => {
    let sdkTypeScript = `
    window.meshSdkPlatform='${sdkSpecs.platform}';
    window.meshSdkVersion='${sdkSpecs.version}';
  `;

    if (props.settings) {
      sdkTypeScript += `
        window.accessTokens='${JSON.stringify(
          props.settings.accessTokens || {}
        )}';
      `;
    }

    return sdkTypeScript;
  }, [props.settings]);

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
          onMessage={handleMessage}
          onLoadEnd={() => {
            setInitialLoading(false);
          }}
          startInLoadingState={true}
          javaScriptEnabled={true}
          injectedJavaScript={injectedScript}
          {...whiteListProps}
          onNavigationStateChange={handleNavState}
          setSupportMultipleWindows={false}
          // iOS blocks a gestureless window.open (e.g. link-v2's Coinbase
          // deposit handoff fires it after an async fetch, outside the tap).
          // Without this, WebKit never calls the popup delegate, so
          // onOpenWindow below never fires and the deposit dead-ends.
          javaScriptCanOpenWindowsAutomatically={true}
          onShouldStartLoadWithRequest={(req) => {
            if (isExternallyOpenedOrigin(req.url)) {
              // These origins open in the browser or a native app (e.g. the
              // Binance app via the bnc:// deep link), so a rejection is
              // unlikely; catch anyway so a failed open can't surface as an
              // unhandled promise rejection. Warn in dev only, to avoid noise
              // in integrators' production builds.
              void Linking.openURL(req.url).catch((err) => {
                if (__DEV__) {
                  console.warn('Failed to open external URL', req.url, err);
                }
              });
              return false;
            }
            return req.url.startsWith('http');
          }}
          onOpenWindow={({ nativeEvent }) => {
            // link-v2 hands off OAuth/onramp via window.open('_blank') on a
            // catalog tap. On iOS the WebView surfaces that here instead of
            // navigating, so without forwarding it the popup is dropped and the
            // flow dead-ends. Open it in the external browser, same
            // as the in-page "Re-open" fallback and the Android
            // onShouldStartLoadWithRequest path. Require https so a blank,
            // opaque, or non-https (javascript:/data:/custom-scheme) target is
            // ignored.
            const { targetUrl } = nativeEvent;
            if (targetUrl?.startsWith('https://')) {
              void Linking.openURL(targetUrl).catch((err) => {
                if (__DEV__) {
                  console.warn('Failed to open external URL', targetUrl, err);
                }
              });
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
          onContentProcessDidTerminate={() => {
            if (!isOAuthInProgress.current && !hasAutoReloaded.current) {
              hasAutoReloaded.current = true;
              webViewRef.current?.reload();
            }
          }}
          onRenderProcessGone={() => {
            if (!isOAuthInProgress.current && !hasAutoReloaded.current) {
              hasAutoReloaded.current = true;
              webViewRef.current?.reload();
            }
          }}
        />
      )}
    </SDKWrapperComponent>
  );
};
