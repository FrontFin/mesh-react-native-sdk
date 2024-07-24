import React, { useMemo, useRef } from 'react';
import { WebView } from 'react-native-webview';

import { NavBar } from './NavBar';
import { SDKContainer } from './SDKContainer';
import { SDKViewContainer } from './SDKViewContainer';

import type { LinkConfiguration } from '../';
import { useSDKCallbacks } from '../hooks/useSDKCallbacks';
import { sdkSpecs } from '../utils/sdkConfig';

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

  return (
    <SDKWrapperComponent>
      {showNativeNavbar && (
        <NavBar goBack={goBack} showCloseAlert={showCloseAlert} />
      )}
      {showWebView && linkUrl && (
        <WebView
          style={{ backgroundColor: darkTheme ? '#0e0e0d' : '#fbfbfb' }}
          testID={'webview'}
          ref={webViewRef}
          source={{ uri: linkUrl }}
          cacheMode={'LOAD_NO_CACHE'}
          onMessage={handleMessage}
          javaScriptEnabled={true}
          injectedJavaScript={injectedScript}
          onNavigationStateChange={handleNavState}
        />
      )}
    </SDKWrapperComponent>
  );
};
