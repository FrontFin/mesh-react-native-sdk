import React, { useRef } from 'react';
import { WebView } from 'react-native-webview';

import NavBar from './NavBar';
import SDKContainer from './SDKContainer';

import { LinkConnectProps } from '../';
import { useSDKCallbacks } from '../hooks/useSDKCallbacks';
import { sdkSpecs } from '../utils/sdkConfig';

const LinkConnect = (props: LinkConnectProps) => {
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
    if(window.parent){
      window.parent.meshSdkPlatform='${sdkSpecs.platform}';
      window.parent.meshSdkVersion='${sdkSpecs.version}';
    }
  `;

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
          injectedJavaScript={sdkTypeScript}
          onNavigationStateChange={handleNavState}
        />
      )}
    </SDKContainer>
  );
};

export default LinkConnect;
