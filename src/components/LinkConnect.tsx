import React, { useMemo, useRef } from 'react';
import { WebView } from 'react-native-webview';

import NavBar from './NavBar';
import SDKContainer from './SDKContainer';

import { LinkOptions } from '../';
import { useSDKCallbacks } from '../hooks/useSDKCallbacks';
import { sdkSpecs } from '../utils/sdkConfig';

const LinkConnect = (props: LinkOptions) => {
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
  const sdkTypeScript = `
    window.meshSdkPlatform='${sdkSpecs.platform}';
    window.meshSdkVersion='${sdkSpecs.version}';
  `;

  const accessAndTransferTokensScript = useMemo(() => {
    let script = '';
    if (props.accessTokens && props.accessTokens.length) {
      script += `window.accessTokens='${JSON.stringify(props.accessTokens)}';`;
    }
    if (props.transferDestinationTokens && props.transferDestinationTokens.length) {
      script += `window.transferDestinationTokens='${JSON.stringify(
        props.transferDestinationTokens
      )}';`;
    }

    return script;
  }, [props.accessTokens, props.transferDestinationTokens]);

  const injectedScript = useMemo(() => {
    return `${sdkTypeScript}${accessAndTransferTokensScript}`;
  }, [
    sdkTypeScript,
    accessAndTransferTokensScript,
  ]);

  return (
    <SDKContainer>
      {showNativeNavbar && <NavBar goBack={goBack} showCloseAlert={showCloseAlert} />}
      {showWebView && linkUrl && (
        <WebView
          testID={'webview'}
          ref={webViewRef}
          source={{ uri: linkUrl }}
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
