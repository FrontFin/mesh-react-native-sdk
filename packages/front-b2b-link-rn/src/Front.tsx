import React, { useEffect, useState } from "react";
import {
  SafeAreaView,
  StatusBar,
  StyleSheet,
  useColorScheme,
  View,
} from "react-native";
import { WebView, WebViewMessageEvent } from "react-native-webview";
import { AccessTokenPayload } from "./Types";
import { WebViewNativeEvent } from "react-native-webview/lib/WebViewTypes";

const FrontFinance = (props: {
  url: string;
  onReceive?: (payload: AccessTokenPayload) => void;
  onError?: (err: string) => void;
  onClose?: () => void;
}) => {
  const isDarkMode = useColorScheme?.() === "dark";

  const backgroundStyle = {
    backgroundColor: isDarkMode ? "#000000" : "#ffffff",
  };
  const [iframeLink, setIframeLink] = useState<string | null>(null);
  const [payload, setPayload] = useState<AccessTokenPayload | null>(null);
  const [showWebView, setShowWebView] = useState(false);

  useEffect(() => {
    if (props.url.length) {
      setIframeLink(props.url);
      setShowWebView(true);
    } else {
      props.onError && props?.onError("Invalid iframeUrl");
    }

    return () => {
      setIframeLink(null);
      setShowWebView(false);
    };
  }, [props]);

  const handleNavState = (event: WebViewNativeEvent) => {
    console.log("Nav", event);
  };

  const handleMessage = (event: WebViewMessageEvent) => {
    const { type, payload } = JSON.parse(event.nativeEvent.data);
    if (
      type === "close" ||
      type === "done" ||
      type === "delayedAuthentication"
    ) {
      setShowWebView(false);
    }
    if (type === "showClose") {
      props.onClose && props?.onClose();
    }
    if (type === "brokerageAccountAccessToken") {
      setPayload(payload);
      props.onReceive && props?.onReceive(payload);
      setShowWebView(false);
    }
  };

  const INJECTED_JAVASCRIPT = `
    window.addEventListener('message', (event) => {
      if (event?.data?.type === 'brokerageAccountAccessToken') {
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: event.data.type,
          payload: event.data.payload
        }))
      }
      if (event?.data?.type === 'delayedAuthentication') {
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: event.data.type,
          payload: event.data.payload
        }))
      }
      if (event?.data?.type === 'close') {
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: event.data.type,
        }))
      }
      if (event?.data?.type === 'showClose') {
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: event.data.type,
        }))
      }
      if (event?.type === 'done') {
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: event.data.type,
        }))
      }
    })
  `;

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <StatusBar
        barStyle={isDarkMode ? "light-content" : "dark-content"}
        backgroundColor={backgroundStyle.backgroundColor}
      />

      <View style={styles.container}>
        {showWebView && iframeLink && (
          <WebView
            source={{ uri: iframeLink ? iframeLink : "" }}
            onMessage={handleMessage}
            javaScriptEnabled={true}
            injectedJavaScript={INJECTED_JAVASCRIPT}
            onNavigationStateChange={handleNavState}
          />
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
  },
  webView: {
    backgroundColor: "red",
    flex: 1,
    position: "absolute",
  },
  noText: {
    fontSize: 20,
  },
  button: {
    marginTop: 50,
    padding: 10,
    backgroundColor: "black",
  },
  btnText: {
    fontSize: 15,
    color: "white",
  },
});

export default FrontFinance;
