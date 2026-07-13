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
          onShouldStartLoadWithRequest={(req) => {
            if (isExternallyOpenedOrigin(req.url)) {
              // These origins are https and are handled by the browser, so a
              // rejection is unlikely; catch + warn anyway so a failed open
              // can't surface as an unhandled promise rejection.
              void Linking.openURL(req.url).catch((err) => {
                console.warn('Failed to open external URL', req.url, err);
              });
              return false;
            }
            return req.url.startsWith('http');
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
