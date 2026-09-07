import { renderHook, act } from '@testing-library/react-native';
import { useSDKCallbacks } from '../hooks/useSDKCallbacks';
import { WHITELISTED_ORIGINS } from '../constant';
import { isExternallyOpenedOrigin } from '../utils';
import type { WebViewMessageEvent } from 'react-native-webview';

/**
 * Cross-SDK MFS parity suite.
 *
 * The same numbered cases (P1.x, P2.x, ...) exist in every mobile SDK, so
 * "parity" is something that can be pointed at rather than asserted. Keep the
 * case ids and the fixtures below identical across repos; when one SDK's
 * behaviour has to differ, keep the case and document why in its body rather
 * than deleting it.
 *
 * The contract being pinned:
 *   P1  a link token is base64 of a URL, so the token alone decides which Link
 *       loads. v1, v2 and MFS all arrive through this one path.
 *   P2  the origin allowlist must accept both meshconnect and meshpay, and must
 *       still reject lookalikes.
 *   P3  Link v3 emits only four legacy events, one of which (`close`) carries no
 *       payload at all.
 *   P4  the v1/v2 payload shapes must keep working throughout the migration.
 */

// ---------------------------------------------------------------------------
// Shared fixtures. Keep byte-identical across SDKs.
// ---------------------------------------------------------------------------

const tokenFor = (url: string) => Buffer.from(url, 'utf-8').toString('base64');

const V1_URL = 'https://web.meshconnect.com/broker-connect/catalog';
const V2_URL = 'https://link.meshconnect.com/?clientId=abc&auth_code=xyz';
const MFS_URL = 'https://link.meshpay.com/?token=ory_ac_abc123';

/**
 * Link v3 `brokerageAccountAccessToken`. The connection-id architecture keeps
 * real tokens server-side, so accessToken/accountId/tokenId all carry the
 * connectionId and there is no refreshToken or expiresInSeconds.
 */
const V3_BROKER_TOKENS = {
  type: 'brokerageAccountAccessToken',
  payload: {
    accountTokens: [
      {
        account: { accountId: 'conn_123', accountName: 'Coinbase' },
        accessToken: 'conn_123',
        tokenId: 'conn_123',
      },
    ],
    brokerBrandInfo: {
      logoLightUrl: 'https://cdn/l.png',
      logoDarkUrl: 'https://cdn/d.png',
    },
    brokerType: 'coinbase',
    brokerName: 'Coinbase',
  },
};

/** Link v1/v2 shape: a real access token and the older brand fields. */
const LEGACY_BROKER_TOKENS = {
  type: 'brokerageAccountAccessToken',
  payload: {
    accountTokens: [
      {
        account: { accountId: 'acc_1', accountName: 'Coinbase' },
        accessToken: 'real-access-token',
        refreshToken: 'real-refresh-token',
        tokenId: 'tok_1',
      },
    ],
    brokerBrandInfo: {
      brokerLogo: 'https://cdn/logo.png',
      brokerPrimaryColor: '#0052FF',
    },
    expiresInSeconds: 3600,
    brokerType: 'coinbase',
    brokerName: 'Coinbase',
  },
};

/** Link v3 `transferFinished`: success-only and v1-shaped. */
const V3_TRANSFER_FINISHED = {
  type: 'transferFinished',
  payload: {
    status: 'success',
    txId: 'tx_1',
    transferId: 'tx_1',
    fromAddress: '0xfrom',
    toAddress: '0xto',
    symbol: 'USDC',
    amount: 10.5,
    networkId: 'base',
    networkName: 'base',
  },
};

/** Link v2 `transferFinished`, error branch. v3 has no error variant. */
const LEGACY_TRANSFER_FINISHED_ERROR = {
  type: 'transferFinished',
  payload: { status: 'error', errorMessage: 'insufficient funds' },
};

const messageEvent = (body: unknown) =>
  ({
    nativeEvent: { data: JSON.stringify(body) },
  }) as WebViewMessageEvent;

jest.mock('../utils/language', () => ({
  ...jest.requireActual('../utils/language'),
  resolveLanguage: jest.fn(() => 'en'),
}));

describe('P1 token resolution: the token decides which Link loads', () => {
  const urlFor = (url: string) => {
    const { result } = renderHook(() =>
      useSDKCallbacks({ linkToken: tokenFor(url) })
    );
    return result.current.linkUrl ?? '';
  };

  it('P1.1 a v1 token resolves to the v1 host', () => {
    expect(urlFor(V1_URL)).toContain('web.meshconnect.com');
  });

  it('P1.2 a v2 token resolves to the v2 host', () => {
    expect(urlFor(V2_URL)).toContain('link.meshconnect.com');
  });

  it('P1.3 an MFS token resolves to the MFS host, session token intact', () => {
    const url = urlFor(MFS_URL);
    expect(url).toContain('link.meshpay.com');
    expect(url).toContain('token=ory_ac_abc123');
  });

  it('P1.4 SDK params are appended without dropping token params', () => {
    const url = urlFor(V2_URL);
    expect(url).toContain('platform=');
    // The token's own params survive.
    expect(url).toContain('clientId=abc');
    expect(url).toContain('auth_code=xyz');
  });

  it('P1.5 a malformed token reports an error instead of loading', () => {
    const onExit = jest.fn();
    const { result } = renderHook(() =>
      useSDKCallbacks({ linkToken: 'not-base64!!', onExit })
    );
    expect(result.current.linkUrl).toBeNull();
    expect(onExit).toHaveBeenCalled();
  });
});

describe('P2 origin allowlist accepts both platforms', () => {
  // RN hands WHITELISTED_ORIGINS to react-native-webview's `originWhitelist`
  // prop, so the matching itself lives in the WebView. What this SDK owns is
  // the list, which is what these cases pin.
  it('P2.1 meshconnect hosts are listed', () => {
    expect(WHITELISTED_ORIGINS).toContain('*.meshconnect.com');
  });

  it('P2.2 meshpay (MFS) hosts are listed', () => {
    expect(WHITELISTED_ORIGINS).toContain('*.meshpay.com');
  });

  it('P2.3 the list carries no bare-suffix meshpay entry', () => {
    // A literal `https://meshpay.com` entry would be prefix-matched by the
    // WebView with no boundary, so `https://meshpay.com.evil.com` would pass.
    expect(WHITELISTED_ORIGINS).not.toContain('https://meshpay.com');
  });

  it('P2.4 unrelated hosts are not listed', () => {
    expect(WHITELISTED_ORIGINS).not.toContain('*.example.com');
  });

  // KNOWN GAP, pre-existing and unrelated to MFS. `originWhitelist` entries are
  // compiled by react-native-webview into `^`-anchored regexes with no end
  // anchor, so a literal entry such as `https://meshconnect.com` also matches
  // `https://meshconnect.com.evil.com`. Documented rather than asserted as
  // desired behaviour; the fix belongs in its own PR off main.
  it('P2.5 allowlist boundary gaps (known, tracked separately)', () => {
    expect(WHITELISTED_ORIGINS).toContain('https://meshconnect.com');
    expect(WHITELISTED_ORIGINS).toContain('https://google.com');
  });
});

describe('P3 Link v3 emits only four legacy events', () => {
  const setup = () => {
    const props = {
      linkToken: tokenFor(MFS_URL),
      onExit: jest.fn(),
      onIntegrationConnected: jest.fn(),
      onTransferFinished: jest.fn(),
      onEvent: jest.fn(),
    };
    const { result } = renderHook(() => useSDKCallbacks(props));
    return { props, result };
  };

  it('P3.1 loaded is accepted without throwing', () => {
    const { result } = setup();
    expect(() =>
      act(() => result.current.handleMessage(messageEvent({ type: 'loaded' })))
    ).not.toThrow();
  });

  it('P3.2 close arrives with NO payload and must still exit', () => {
    // v1/v2 always attach an event summary; v3 sends `{type: 'close'}` alone.
    const { props, result } = setup();
    act(() => result.current.handleMessage(messageEvent({ type: 'close' })));
    expect(props.onExit).toHaveBeenCalled();
  });

  it('P3.3 brokerageAccountAccessToken carries the connectionId', () => {
    const { props, result } = setup();
    act(() => result.current.handleMessage(messageEvent(V3_BROKER_TOKENS)));
    expect(props.onIntegrationConnected).toHaveBeenCalled();
    // PARITY NOTE: RN wraps the payload in a LinkPayload envelope
    // (`{ accessToken: ... }`), where Flutter hands the payload over directly.
    // Same data, different public shape. Worth aligning, but out of scope here.
    const payload = props.onIntegrationConnected.mock.calls[0][0].accessToken;
    const token = payload.accountTokens[0];
    // The contract change: this is a connection handle, not a token.
    expect(token.accessToken).toBe('conn_123');
    expect(token.refreshToken).toBeUndefined();
    expect(payload.expiresInSeconds).toBeUndefined();
  });

  it('P3.4 transferFinished parses the v3 success-only shape', () => {
    const { props, result } = setup();
    act(() => result.current.handleMessage(messageEvent(V3_TRANSFER_FINISHED)));
    expect(props.onTransferFinished).toHaveBeenCalled();
    expect(props.onTransferFinished.mock.calls[0][0].status).toBe('success');
  });
});

describe('P4 v1/v2 payloads keep working during the migration', () => {
  const setup = () => {
    const props = {
      linkToken: tokenFor(V2_URL),
      onExit: jest.fn(),
      onIntegrationConnected: jest.fn(),
      onTransferFinished: jest.fn(),
    };
    const { result } = renderHook(() => useSDKCallbacks(props));
    return { props, result };
  };

  it('P4.1 close with a payload still exits', () => {
    const { props, result } = setup();
    act(() =>
      result.current.handleMessage(
        messageEvent({ type: 'close', payload: { page: 'catalog' } })
      )
    );
    expect(props.onExit).toHaveBeenCalled();
  });

  it('P4.2 legacy brokerageAccountAccessToken still parses', () => {
    const { props, result } = setup();
    act(() => result.current.handleMessage(messageEvent(LEGACY_BROKER_TOKENS)));
    // Same LinkPayload envelope as P3.3.
    const payload = props.onIntegrationConnected.mock.calls[0][0].accessToken;
    expect(payload.accountTokens[0].accessToken).toBe('real-access-token');
    expect(payload.accountTokens[0].refreshToken).toBe('real-refresh-token');
    expect(payload.expiresInSeconds).toBe(3600);
  });

  it('P4.3 the v2 transferFinished error branch still parses', () => {
    // v3 has no error variant, so this asserts the v2 path is untouched.
    const { props, result } = setup();
    act(() =>
      result.current.handleMessage(messageEvent(LEGACY_TRANSFER_FINISHED_ERROR))
    );
    expect(props.onTransferFinished).toHaveBeenCalled();
    expect(props.onTransferFinished.mock.calls[0][0].status).toBe('error');
  });
});

describe('P5 wallet deep links open externally', () => {
  it('P5.1 externally-opened origins are recognised', () => {
    expect(isExternallyOpenedOrigin('https://link.trustwallet.com/x')).toBe(
      true
    );
  });

  it('P5.2 lookalikes of them are rejected', () => {
    expect(
      isExternallyOpenedOrigin('https://link.trustwallet.com.evil.com/x')
    ).toBe(false);
  });
});
