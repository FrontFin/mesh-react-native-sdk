import React, { useRef } from 'react';
import { WebView } from 'react-native-webview';

import NavBar from './NavBar';
import SDKContainer from './SDKContainer';

import { LinkConnectProps } from '../';
import { useSDKCallbacks } from '../hooks/useSDKCallbacks';

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
          onNavigationStateChange={handleNavState}
        />
      )}
    </SDKContainer>
  );
};

export default LinkConnect;
