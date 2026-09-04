import { useEffect, useRef, useState } from 'react';
import { Alert, Appearance } from 'react-native';
import { decode64, isValidUrl, addURLParam, extractThemeFromToken, resolveLanguage, } from '../utils';
import { sdkSpecs } from '../utils/sdkConfig';
import { isLinkEventTypeKey, mappedLinkEvents, } from '../';
const useSDKCallbacks = (props) => {
    var _a, _b, _c;
    const [linkUrl, setLinkUrl] = useState(null);
    const [showWebView, setShowWebView] = useState(false);
    const [showNativeNavbar, setShowNativeNavbar] = useState(false);
    const [darkTheme, setDarkTheme] = useState();
    const isOAuthInProgress = useRef(false);
    useEffect(() => {
        var _a, _b, _c, _d;
        try {
            if (props.linkToken) {
                let decodedUrl = decode64(props.linkToken);
                if (!isValidUrl(decodedUrl)) {
                    throw new Error('Invalid link token provided');
                }
                // Add the `theme` to the URL as a `th` query parameter
                const settingsTheme = (_a = props.settings) === null || _a === void 0 ? void 0 : _a.theme;
                if (settingsTheme) {
                    decodedUrl = addURLParam(decodedUrl, 'th', settingsTheme);
                }
                // Add the `language` to the URL as a `lng` query parameter.
                // `'system'` resolves to the device locale (see resolveLanguage).
                const settingsLanguage = resolveLanguage((_b = props.settings) === null || _b === void 0 ? void 0 : _b.language);
                if (settingsLanguage) {
                    decodedUrl = addURLParam(decodedUrl, 'lng', settingsLanguage);
                }
                // Add the `displayFiatCurrency` to the URL as a `fiatCur` query parameter
                const settingsFiatCurrency = (_c = props.settings) === null || _c === void 0 ? void 0 : _c.displayFiatCurrency;
                if (settingsFiatCurrency) {
                    decodedUrl = addURLParam(decodedUrl, 'fiatCur', settingsFiatCurrency);
                }
                // The settings theme takes precedence over the URL theme,
                // and if neither is provided, the effective theme will be undefined
                const theme = settingsTheme !== null && settingsTheme !== void 0 ? settingsTheme : extractThemeFromToken(decodedUrl);
                if (theme === 'system') {
                    setDarkTheme(Appearance.getColorScheme() === 'dark');
                }
                else {
                    setDarkTheme(theme === 'dark');
                }
                if (!/[?&]platform=/.test(decodedUrl)) {
                    decodedUrl = addURLParam(decodedUrl, 'platform', sdkSpecs.platform);
                }
                // Save the decoded URL to state to load in the WebView
                setLinkUrl(decodedUrl);
                setShowWebView(true);
            }
            // eslint-disable-next-line
        }
        catch (err) {
            (_d = props.onExit) === null || _d === void 0 ? void 0 : _d.call(props, (err === null || err === void 0 ? void 0 : err.message) || 'An error occurred during connection establishment');
        }
        return () => {
            setLinkUrl(null);
            setShowWebView(false);
            isOAuthInProgress.current = false;
        };
    }, [
        props.linkToken,
        props.onExit,
        (_a = props.settings) === null || _a === void 0 ? void 0 : _a.language,
        (_b = props.settings) === null || _b === void 0 ? void 0 : _b.theme,
        (_c = props.settings) === null || _c === void 0 ? void 0 : _c.displayFiatCurrency,
    ]);
    // istanbul ignore next
    const showCloseAlert = () => Alert.alert('Are you sure you want to exit?', 'Your progress will be lost.', [
        {
            text: 'Cancel',
            style: 'cancel',
        },
        {
            text: 'Exit',
            onPress: () => {
                var _a;
                (_a = props.onExit) === null || _a === void 0 ? void 0 : _a.call(props);
            },
        },
    ]);
    // istanbul ignore next
    const handleMessage = (event) => {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j;
        const nativeEventData = JSON.parse(event.nativeEvent.data);
        const { type, payload } = nativeEventData;
        const eventType = mappedLinkEvents[type] || type;
        switch (type) {
            case 'close':
            case 'done':
            case 'exit': {
                isOAuthInProgress.current = false;
                (_a = props.onExit) === null || _a === void 0 ? void 0 : _a.call(props, payload);
                break;
            }
            case 'showClose': {
                showCloseAlert();
                break;
            }
            case 'showNativeNavbar': {
                setShowNativeNavbar(payload);
                break;
            }
            case 'brokerageAccountAccessToken': {
                isOAuthInProgress.current = false;
                const payloadData = {
                    accessToken: payload,
                };
                (_b = props === null || props === void 0 ? void 0 : props.onEvent) === null || _b === void 0 ? void 0 : _b.call(props, {
                    type: eventType,
                    payload: payloadData,
                });
                (_c = props === null || props === void 0 ? void 0 : props.onIntegrationConnected) === null || _c === void 0 ? void 0 : _c.call(props, payloadData);
                break;
            }
            case 'delayedAuthentication': {
                isOAuthInProgress.current = false;
                const payloadData = {
                    delayedAuth: payload,
                };
                (_d = props === null || props === void 0 ? void 0 : props.onEvent) === null || _d === void 0 ? void 0 : _d.call(props, {
                    type: eventType,
                    payload: payloadData,
                });
                (_e = props === null || props === void 0 ? void 0 : props.onIntegrationConnected) === null || _e === void 0 ? void 0 : _e.call(props, payloadData);
                break;
            }
            case 'transferFinished': {
                const payloadData = payload;
                (_f = props === null || props === void 0 ? void 0 : props.onEvent) === null || _f === void 0 ? void 0 : _f.call(props, {
                    type: eventType,
                    payload: payloadData,
                });
                (_g = props === null || props === void 0 ? void 0 : props.onTransferFinished) === null || _g === void 0 ? void 0 : _g.call(props, payloadData);
                break;
            }
            case 'loaded': {
                (_h = props === null || props === void 0 ? void 0 : props.onEvent) === null || _h === void 0 ? void 0 : _h.call(props, { type: eventType });
                break;
            }
            default: {
                if (type === 'integrationOAuthStarted') {
                    isOAuthInProgress.current = true;
                }
                if (isLinkEventTypeKey(type)) {
                    (_j = props === null || props === void 0 ? void 0 : props.onEvent) === null || _j === void 0 ? void 0 : _j.call(props, nativeEventData);
                }
                break;
            }
        }
    };
    const handleNavState = (event) => {
        if (event.url.endsWith('/broker-connect/catalog')) {
            setShowNativeNavbar(false);
        }
    };
    return {
        linkUrl,
        showWebView,
        showNativeNavbar,
        darkTheme,
        isOAuthInProgress, // MutableRefObject<boolean> — read .current in callbacks
        handleMessage,
        handleNavState,
        showCloseAlert,
    };
};
export { useSDKCallbacks };
