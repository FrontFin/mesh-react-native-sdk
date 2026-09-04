import { WebViewMessageEvent } from 'react-native-webview';
import { WebViewNativeEvent } from 'react-native-webview/lib/WebViewTypes';
import { LinkConfiguration } from '../';
declare const useSDKCallbacks: (props: LinkConfiguration) => {
    linkUrl: string | null;
    showWebView: boolean;
    showNativeNavbar: boolean;
    darkTheme: boolean | undefined;
    isOAuthInProgress: import("react").MutableRefObject<boolean>;
    handleMessage: (event: WebViewMessageEvent) => void;
    handleNavState: (event: WebViewNativeEvent) => void;
    showCloseAlert: () => void;
};
export { useSDKCallbacks };
