import { View } from 'react-native';
import { WebView } from 'react-native-webview';
import React, { useMemo, useRef, useState } from 'react';

import { NavBar } from './NavBar';
import { SDKContainer } from './SDKContainer';
import { SDKViewContainer } from './SDKViewContainer';

import type { LinkConfiguration } from '../';
import { useSDKCallbacks } from '../hooks/useSDKCallbacks';
import { sdkSpecs } from '../utils/sdkConfig';
import { DARK_THEME_COLOR_BOTTOM, LIGHT_THEME_COLOR_BOTTOM } from '../constant';

export const LinkConnect = (props: LinkConfiguration) => {
  const {
    showNativeNavbar,
    showWebView,
    linkUrl,
    darkTheme,
    handleMessage,
    handleNavState,
    showCloseAlert,
  } = useSDKCallbacks(props);
  const webViewRef = useRef<WebView>(null);
  const goBack = () => webViewRef?.current?.goBack();

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
        window.transferDestinationTokens='${JSON.stringify(
          props.settings.transferDestinationTokens || {}
        )}';
      `;
    }

    return sdkTypeScript;
  }, [props.settings]);

  const SDKWrapperComponent = props.renderViewContainer
    ? SDKViewContainer
    : SDKContainer;

  const LoadingComponentWebview = () => {
    return (
      <View style={{
        position: 'absolute',
        zIndex: 10,
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: darkTheme ? DARK_THEME_COLOR_BOTTOM : LIGHT_THEME_COLOR_BOTTOM
      }}/>
    );
  };

  const [initialLoading, setInitialLoading] = useState(true);

  if (darkTheme === undefined) {
    return null
  }
  
  return (
    <SDKWrapperComponent isDarkTheme={darkTheme}>
      {showNativeNavbar && (
        <NavBar goBack={goBack} showCloseAlert={showCloseAlert} isDarkTheme={darkTheme} />
      )}
      {initialLoading && <LoadingComponentWebview />}
      {showWebView && linkUrl && (
        <WebView
          bounces={false}
          style={{ backgroundColor: darkTheme ? DARK_THEME_COLOR_BOTTOM : LIGHT_THEME_COLOR_BOTTOM }}
          testID={'webview'} ref={webViewRef}
          source={{ uri: linkUrl }}
          cacheMode={'LOAD_NO_CACHE'}
          onMessage={handleMessage}
          onLoadEnd={() => {
            setInitialLoading(false);
          }}
          startInLoadingState={true}
          javaScriptEnabled={true}
          injectedJavaScript={injectedScript}
          onNavigationStateChange={handleNavState}
        />
      )}
    </SDKWrapperComponent>
  );
};
