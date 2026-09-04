import { AppState, Linking, View } from 'react-native';
import { WebView } from 'react-native-webview';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { NavBar } from './NavBar';
import { SDKContainer } from './SDKContainer';
import { SDKViewContainer } from './SDKViewContainer';
import { useSDKCallbacks } from '../hooks/useSDKCallbacks';
import { sdkSpecs } from '../utils/sdkConfig';
import { isAppLaunchScheme, isExternallyOpenedOrigin } from '../utils';
import { DARK_THEME_COLOR_BOTTOM, LIGHT_THEME_COLOR_BOTTOM, WHITELISTED_ORIGINS, } from '../constant';
/**
 * Hand a URL to the OS — the external browser for https, the wallet app for a
 * custom scheme.
 *
 * `openURL` is deliberate: it issues a view intent via `startActivity`, so unlike
 * `canOpenURL` it is not subject to Android 11+ package-visibility filtering and
 * resolves whenever the target app is installed. A rejection is unlikely for
 * these URLs, but is caught so a failed open cannot surface as an unhandled
 * promise rejection. Warn in dev only, to avoid noise in integrators'
 * production builds.
 */
const openExternally = (url) => {
    void Linking.openURL(url).catch((err) => {
        if (__DEV__) {
            console.warn('Failed to open external URL', url, err);
        }
    });
};
const LoadingComponentWebview = ({ darkTheme }) => {
    return (<View style={{
            position: 'absolute',
            zIndex: 10,
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: darkTheme
                ? DARK_THEME_COLOR_BOTTOM
                : LIGHT_THEME_COLOR_BOTTOM,
        }}/>);
};
export const LinkConnect = (props) => {
    const { showNativeNavbar, showWebView, linkUrl, darkTheme, isOAuthInProgress, handleMessage, handleNavState, showCloseAlert, } = useSDKCallbacks(props);
    const webViewRef = useRef(null);
    const hasAutoReloaded = useRef(false);
    // Set when the WebView render process dies (e.g. Android reclaims memory
    // while the app is backgrounded during an external OAuth hand-off). Used to
    // recover the dead WebView when the app returns to the foreground.
    const rendererGone = useRef(false);
    const goBack = () => { var _a; return (_a = webViewRef === null || webViewRef === void 0 ? void 0 : webViewRef.current) === null || _a === void 0 ? void 0 : _a.goBack(); };
    useEffect(() => {
        hasAutoReloaded.current = false;
    }, [linkUrl]);
    // Recover a dead WebView on foreground return. If the render process was
    // killed while backgrounded (memory pressure during an external OAuth trip),
    // reload once when the user comes back so the flow isn't stuck on a blank
    // WebView with the in-progress session silently lost. Only clear the flag
    // once a reload can actually run (ref mounted), so a not-yet-mounted WebView
    // on the first foreground tick doesn't drop the recovery.
    useEffect(() => {
        const handler = (state) => {
            if (state === 'active' && rendererGone.current && webViewRef.current) {
                rendererGone.current = false;
                webViewRef.current.reload();
            }
        };
        const sub = AppState.addEventListener('change', handler);
        // RN >=0.65 returns a subscription with remove(); older RN (the peer dep
        // allows >=0.60) returns void and needs the static removeEventListener.
        return () => {
            var _a, _b;
            if (typeof (sub === null || sub === void 0 ? void 0 : sub.remove) === 'function') {
                sub.remove();
            }
            else {
                (_b = (_a = AppState).removeEventListener) === null || _b === void 0 ? void 0 : _b.call(_a, 'change', handler);
            }
        };
    }, []);
    // A dead render process can't complete an OAuth (the old isOAuthInProgress
    // guard just stranded the flow on a blank WebView), so recover regardless.
    // Foregrounded: reload now. Backgrounded: a reload issued now may not take,
    // so flag it and let the AppState 'active' listener recover on return. We do
    // not flag after a foreground reload, so an unrelated later foreground does
    // not fire a spurious reload that would restart the session.
    const recoverFromRendererDeath = () => {
        var _a;
        if (AppState.currentState === 'active') {
            if (!hasAutoReloaded.current) {
                hasAutoReloaded.current = true;
                (_a = webViewRef.current) === null || _a === void 0 ? void 0 : _a.reload();
            }
        }
        else {
            rendererGone.current = true;
        }
    };
    const injectedScript = useMemo(() => {
        let sdkTypeScript = `
    window.meshSdkPlatform='${sdkSpecs.platform}';
    window.meshSdkVersion='${sdkSpecs.version}';
  `;
        if (props.settings) {
            sdkTypeScript += `
        window.accessTokens='${JSON.stringify(props.settings.accessTokens || {})}';
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
    return (<SDKWrapperComponent isDarkTheme={darkTheme}>
      {showNativeNavbar && (<NavBar goBack={goBack} showCloseAlert={showCloseAlert} isDarkTheme={darkTheme}/>)}
      {initialLoading && <LoadingComponentWebview darkTheme={darkTheme}/>}
      {showWebView && linkUrl && (<WebView bounces={false} style={{
                backgroundColor: darkTheme
                    ? DARK_THEME_COLOR_BOTTOM
                    : LIGHT_THEME_COLOR_BOTTOM,
            }} testID={'webview'} ref={webViewRef} source={{ uri: linkUrl }} cacheMode={'LOAD_DEFAULT'} onMessage={handleMessage} onLoadEnd={() => {
                setInitialLoading(false);
            }} startInLoadingState={true} javaScriptEnabled={true} injectedJavaScript={injectedScript} {...whiteListProps} onNavigationStateChange={handleNavState} 
        // Android popup routing. PRG-3107 set this false so Binance app auth
        // reached a handler the SDK controls; at the time onOpenWindow did not
        // exist, so onShouldStartLoadWithRequest was the only one. It is back to
        // the library default because false has a side effect: an Android
        // `target="_blank"` click becomes a same-frame navigation, and
        // react-native-webview's own wrapper reaches that before our handler,
        // gating every non-whitelisted URL behind `Linking.canOpenURL` — which
        // is package-visibility filtered on Android 11+ and answers false for
        // any scheme the integrator's manifest does not name in `<queries>`.
        // Wallet deep links were dropped with only a console warning (ONC-447).
        // With multiple windows enabled those clicks arrive at onOpenWindow,
        // which opens both https handoffs and wallet schemes — so PRG-3107's
        // Binance behaviour holds, via the sibling handler.
        setSupportMultipleWindows={true} 
        // iOS blocks a gestureless window.open (e.g. link-v2's Coinbase
        // deposit handoff fires it after an async fetch, outside the tap).
        // Without this, WebKit never calls the popup delegate, so
        // onOpenWindow below never fires and the deposit dead-ends.
        javaScriptCanOpenWindowsAutomatically={true} onShouldStartLoadWithRequest={(req) => {
                if (isExternallyOpenedOrigin(req.url) || isAppLaunchScheme(req.url)) {
                    openExternally(req.url);
                    return false;
                }
                return req.url.startsWith('http');
            }} onOpenWindow={({ nativeEvent }) => {
                // Every `target="_blank"` / window.open target lands here: link-v2's
                // OAuth and on-ramp handoffs (https) and its wallet deep links
                // (custom scheme). Both must leave the WebView; anything that could
                // execute or read local state is rejected by isAppLaunchScheme.
                const { targetUrl } = nativeEvent;
                if ((targetUrl === null || targetUrl === void 0 ? void 0 : targetUrl.startsWith('https://')) || isAppLaunchScheme(targetUrl)) {
                    openExternally(targetUrl);
                }
            }} domStorageEnabled={true} onError={({ nativeEvent }) => {
                var _a, _b;
                (_a = props.onEvent) === null || _a === void 0 ? void 0 : _a.call(props, {
                    type: 'webViewLoadFailed',
                    payload: {
                        url: nativeEvent.url,
                        errorCode: nativeEvent.code,
                        errorDescription: nativeEvent.description,
                    },
                });
                if (!isOAuthInProgress.current && !hasAutoReloaded.current) {
                    hasAutoReloaded.current = true;
                    (_b = webViewRef.current) === null || _b === void 0 ? void 0 : _b.reload();
                }
            }} onHttpError={({ nativeEvent }) => {
                var _a, _b;
                (_a = props.onEvent) === null || _a === void 0 ? void 0 : _a.call(props, {
                    type: 'webViewLoadFailed',
                    payload: {
                        url: nativeEvent.url,
                        errorCode: nativeEvent.statusCode,
                    },
                });
                if (nativeEvent.statusCode >= 500 &&
                    !isOAuthInProgress.current &&
                    !hasAutoReloaded.current) {
                    hasAutoReloaded.current = true;
                    (_b = webViewRef.current) === null || _b === void 0 ? void 0 : _b.reload();
                }
            }} onContentProcessDidTerminate={recoverFromRendererDeath} onRenderProcessGone={recoverFromRendererDeath}/>)}
    </SDKWrapperComponent>);
};
