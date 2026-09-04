/**
 * True when `url` should be opened in the external browser / native app rather
 * than loaded inside the SDK WebView. Scheme and host are matched exactly to
 * prevent lookalike attacks (e.g. https://app.binance.com.evil.com must NOT
 * match https://app.binance.com). When an allowlisted origin pins a path, the
 * URL path must equal it or be nested under it on a segment boundary, so
 * /authorize/CoinbaseEvil does not match /authorize/Coinbase. Paths containing
 * `.`/`..` segments (literal or percent-encoded) are rejected against a pinned
 * origin so a dot-segment can't escape the pin after normalization (e.g.
 * /authorize/Coinbase/../CoinbaseEvil or the %2e%2e-encoded equivalent).
 */
export declare const isExternallyOpenedOrigin: (url: string) => boolean;
