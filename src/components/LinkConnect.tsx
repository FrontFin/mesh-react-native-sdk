import React, { useMemo, useRef } from 'react';
import { WebView } from 'react-native-webview';

import NavBar from './NavBar';
import SDKContainer from './SDKContainer';

import { LinkConfiguration } from '../';
import { useSDKCallbacks } from '../hooks/useSDKCallbacks';
import { sdkSpecs } from '../utils/sdkConfig';

const LinkConnect = (props: LinkConfiguration) => {
  const {
    showNativeNavbar,
    showWebView,
    linkUrl,
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
        window.accessTokens='${JSON.stringify(props.settings.accessTokens || {})}';
        window.transferDestinationTokens='${JSON.stringify(props.settings.transferDestinationTokens || {})}';
      `;
    }

    return sdkTypeScript;
  }, [
    props.settings,
  ]);

  return (
    <SDKContainer>
      {showNativeNavbar && <NavBar goBack={goBack} showCloseAlert={showCloseAlert} />}
      {showWebView && linkUrl && (
        <WebView
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
    </SDKContainer>
  );
};

export default LinkConnect;
