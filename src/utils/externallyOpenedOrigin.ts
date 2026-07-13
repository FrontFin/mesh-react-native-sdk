import { EXTERNALLY_OPENED_ORIGINS } from '../constant';

interface UrlParts {
  scheme: string;
  host: string;
  path: string;
}

// Parse scheme, host and path without relying on the URL global, which is only
// partially implemented on some React Native runtimes. Userinfo and port are
// stripped so the host compares cleanly (and lookalikes can't sneak in via
// userinfo, e.g. https://app.binance.com@evil.com resolves to host evil.com).
const parseUrlParts = (url: string): UrlParts | null => {
  const match = /^([a-z][a-z0-9+.-]*):\/\/([^/?#]+)([^?#]*)/i.exec(url);
  if (!match) {
    return null;
  }

  const authority = match[2]
    .replace(/^[^@]*@/, '') // drop userinfo
    .replace(/:\d+$/, ''); // drop port

  return {
    scheme: match[1].toLowerCase(),
    host: authority.toLowerCase(),
    path: match[3] || '',
  };
};

/**
 * True when `url` should be opened in the external browser / native app rather
 * than loaded inside the SDK WebView. Scheme and host are matched exactly to
 * prevent lookalike attacks (e.g. https://app.binance.com.evil.com must NOT
 * match https://app.binance.com). When an allowlisted origin pins a path, the
 * URL path must equal it or be nested under it on a segment boundary, so
 * /authorize/CoinbaseEvil does not match /authorize/Coinbase.
 */
export const isExternallyOpenedOrigin = (url: string): boolean => {
  const target = parseUrlParts(url);
  if (!target) {
    return false;
  }

  return EXTERNALLY_OPENED_ORIGINS.some((origin) => {
    const allowed = parseUrlParts(origin);
    if (!allowed) {
      return false;
    }

    if (target.scheme !== allowed.scheme || target.host !== allowed.host) {
      return false;
    }

    if (allowed.path && allowed.path !== '/') {
      const base = allowed.path.endsWith('/')
        ? allowed.path
        : `${allowed.path}/`;
      if (target.path !== allowed.path && !target.path.startsWith(base)) {
        return false;
      }
    }

    return true;
  });
};
