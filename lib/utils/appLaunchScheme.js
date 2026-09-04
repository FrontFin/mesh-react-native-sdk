// Schemes that must never be handed to the OS from web content. `javascript:`
// and `data:` execute in whatever context receives them; `file:` and `content:`
// reach local storage; `intent:` lets a crafted URL address an arbitrary
// component with arbitrary extras; `about:` is inert but meaningless to launch.
const BLOCKED_SCHEMES = new Set([
    'javascript',
    'data',
    'file',
    'content',
    'intent',
    'android-app',
    'about',
    'blob',
]);
const SCHEME_PATTERN = /^([a-z][a-z0-9+.-]*):/i;
const WHITESPACE_PATTERN = /\s/;
/**
 * True when `url` should be launched as an app deep link — a wallet's custom
 * scheme such as `dfw://` or `metamask://`.
 *
 * Why the SDK has to launch these itself: react-native-webview asks
 * `Linking.canOpenURL` before any of our own handlers see a URL outside
 * `originWhitelist`, and on Android 11+ that call is package-visibility filtered
 * — it answers `false` for every scheme the *integrator's* manifest does not
 * name in `<queries>`, and the URL is then dropped with only a console warning.
 * `Linking.openURL` has no such restriction: it issues `startActivity` with a
 * view intent, which resolves whenever the wallet is installed. So the scheme is
 * launched directly rather than probed first.
 *
 * `http(s)` is excluded: those load in the WebView, or are routed by
 * `isExternallyOpenedOrigin` when they belong to an origin that must leave it.
 *
 * Matched strictly, with no normalising: the caller launches the URL exactly as
 * given, so anything accepted here must be launchable as-is. A URL carrying raw
 * whitespace is rejected rather than accepted and then handed to `openURL`,
 * which fails on it — a valid URL percent-encodes whitespace, and a WebView
 * navigation target is already normalised, so this only rejects input that was
 * malformed to begin with.
 */
export const isAppLaunchScheme = (url) => {
    if (!url || WHITESPACE_PATTERN.test(url)) {
        return false;
    }
    const match = SCHEME_PATTERN.exec(url);
    if (!match) {
        return false;
    }
    const scheme = match[1].toLowerCase();
    if (scheme === 'http' || scheme === 'https') {
        return false;
    }
    return !BLOCKED_SCHEMES.has(scheme);
};
