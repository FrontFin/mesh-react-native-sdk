/* eslint-disable */
import React from 'react';
import { AppState, Linking } from 'react-native';
import { render, waitFor } from '@testing-library/react-native';
import { LinkConnect } from '../components/LinkConnect';

const mockedUseColorScheme = jest.fn();

jest.mock('react-native/Libraries/Utilities/useColorScheme', () => {
  return {
    default: mockedUseColorScheme,
  };
});

// var avoids TDZ — the closure inside forwardRef reads this after module init
var mockReload = jest.fn();

jest.mock('react-native-webview', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    WebView: React.forwardRef((props: any, ref: any) => {
      React.useImperativeHandle(ref, () => ({ reload: mockReload }));
      return React.createElement(View, props);
    }),
  };
});

// Mock callback functions
const mockOnExit = jest.fn();
const SAMPLE_LINK_TOKEN =
  'aHR0cHM6Ly93ZWIuZ2V0ZnJvbnQuY29tL2IyYi1pZnJhbWUvdGVzdC1hY2NvdW50LXJhbmRvbS9icm9rZXItY29ubmVjdC9jYXRhbG9nMQ==';

describe('LinkConnect Component', () => {
  beforeEach(() => {
    mockReload.mockClear();
    jest.spyOn(Linking, 'openURL').mockResolvedValue(undefined);
    // Default to foreground; the backgrounded-recovery test overrides this.
    (AppState as any).currentState = 'active';
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('renders correctly when linkToken and accessTokens are provided', () => {
    render(
      <LinkConnect
        linkToken={SAMPLE_LINK_TOKEN}
        settings={{
          language: 'en',
          accessTokens: [
            {
              accountId: '1234567890',
              accountName: 'Test Account',
              accessToken: '1234567890',
              brokerType: 'test',
              brokerName: 'Test Broker',
            },
          ],
        }}
      />
    );
  });

  it('renders correctly when linkToken and displayFiatCurrency are provided', async () => {
    const { getByTestId } = render(
      <LinkConnect
        linkToken={SAMPLE_LINK_TOKEN}
        settings={{
          language: 'en',
          displayFiatCurrency: 'USD',
        }}
      />
    );
    await waitFor(() => {
      const webview = getByTestId('webview');
      expect(webview.props.source.uri).toContain('lng=en');
      expect(webview.props.source.uri).toContain('fiatCur=USD');
    });
  });

  it('renders correctly when linkToken is provided', () => {
    const tree = render(<LinkConnect linkToken={SAMPLE_LINK_TOKEN} />).toJSON();
    expect(tree).toMatchSnapshot();
  });

  it('handles onError callback for invalid linkToken', () => {
    render(<LinkConnect linkToken={'invalid=='} onExit={mockOnExit} />);
    expect(mockOnExit).toHaveBeenCalledWith('Invalid link token provided');
  });

  it('clears loading state on onLoadEnd', async () => {
    const { getByTestId } = render(<LinkConnect linkToken={SAMPLE_LINK_TOKEN} />);
    await waitFor(() => {
      getByTestId('webview').props.onLoadEnd();
    });
  });

  it('onShouldStartLoadWithRequest allows http URLs', async () => {
    const { getByTestId } = render(<LinkConnect linkToken={SAMPLE_LINK_TOKEN} />);
    await waitFor(() => {
      const result = getByTestId('webview').props.onShouldStartLoadWithRequest({
        url: 'https://web.meshconnect.com/broker-connect/catalog',
      });
      expect(result).toBe(true);
    });
  });

  it('onShouldStartLoadWithRequest opens external URLs via Linking and returns false', async () => {
    const { getByTestId } = render(<LinkConnect linkToken={SAMPLE_LINK_TOKEN} />);
    await waitFor(() => {
      const result = getByTestId('webview').props.onShouldStartLoadWithRequest({
        url: 'https://coinbase.com/oauth/authorize?client_id=test',
      });
      expect(Linking.openURL).toHaveBeenCalledWith(
        'https://coinbase.com/oauth/authorize?client_id=test'
      );
      expect(result).toBe(false);
    });
  });

  it('onShouldStartLoadWithRequest opens Binance app auth externally', async () => {
    const { getByTestId } = render(<LinkConnect linkToken={SAMPLE_LINK_TOKEN} />);
    await waitFor(() => {
      const result = getByTestId('webview').props.onShouldStartLoadWithRequest({
        url: 'https://app.binance.com/en/oauth/authorize?client_id=mesh',
      });
      expect(Linking.openURL).toHaveBeenCalledWith(
        'https://app.binance.com/en/oauth/authorize?client_id=mesh'
      );
      expect(result).toBe(false);
    });
  });

  it('onOpenWindow opens the popup target URL externally (OAuth handoff)', async () => {
    const { getByTestId } = render(<LinkConnect linkToken={SAMPLE_LINK_TOKEN} />);
    await waitFor(() => {
      getByTestId('webview').props.onOpenWindow({
        nativeEvent: {
          targetUrl: 'https://login.coinbase.com/oauth2/auth?client_id=mesh',
        },
      });
      expect(Linking.openURL).toHaveBeenCalledWith(
        'https://login.coinbase.com/oauth2/auth?client_id=mesh'
      );
    });
  });

  it('onOpenWindow ignores a non-http target (e.g. about:blank)', async () => {
    const { getByTestId } = render(<LinkConnect linkToken={SAMPLE_LINK_TOKEN} />);
    (Linking.openURL as jest.Mock).mockClear();
    await waitFor(() => {
      getByTestId('webview').props.onOpenWindow({
        nativeEvent: { targetUrl: 'about:blank' },
      });
      expect(Linking.openURL).not.toHaveBeenCalled();
    });
  });

  // PRG-3183 allowed https only here, which also excluded custom schemes — at the
  // time nothing needed one. Wallet deep links do (ONC-447), so the rule is now
  // https plus app schemes, minus anything that can execute or read local state.
  it('onOpenWindow ignores dangerous / insecure schemes', async () => {
    const { getByTestId } = render(<LinkConnect linkToken={SAMPLE_LINK_TOKEN} />);
    (Linking.openURL as jest.Mock).mockClear();
    await waitFor(() => {
      const webview = getByTestId('webview');
      [
        'javascript:alert(1)',
        'data:text/html,<script>alert(1)</script>',
        'file:///etc/passwd',
        'content://com.example.provider/secrets',
        'intent://scan/#Intent;scheme=zxing;end',
        'blob:https://example.com/uuid',
        'http://insecure.example.com',
        undefined,
        '',
      ].forEach((targetUrl) => {
        webview.props.onOpenWindow({ nativeEvent: { targetUrl } });
      });
      expect(Linking.openURL).not.toHaveBeenCalled();
    });
  });

  // ONC-447: the Android popup path for a wallet deep link. Dropping these is
  // what left "Open <wallet>" doing nothing in react-native hosts.
  it.each([
    'dfw://wc?uri=wc%3Atopic%402',
    'metamask://wc?uri=wc%3Atopic%402',
    'robinhood://wc?uri=wc%3Atopic%402',
  ])('onOpenWindow launches the wallet deep link %s', async (targetUrl) => {
    const { getByTestId } = render(<LinkConnect linkToken={SAMPLE_LINK_TOKEN} />);
    (Linking.openURL as jest.Mock).mockClear();
    await waitFor(() => {
      getByTestId('webview').props.onOpenWindow({ nativeEvent: { targetUrl } });
      expect(Linking.openURL).toHaveBeenCalledWith(targetUrl);
    });
  });

  // Same-frame twin of the above: reachable when the scheme is whitelisted, which
  // previously fell through to `startsWith('http')` and was dropped silently.
  it('onShouldStartLoadWithRequest launches a wallet deep link and returns false', async () => {
    const { getByTestId } = render(<LinkConnect linkToken={SAMPLE_LINK_TOKEN} />);
    (Linking.openURL as jest.Mock).mockClear();
    await waitFor(() => {
      const result = getByTestId('webview').props.onShouldStartLoadWithRequest({
        url: 'dfw://wc?uri=wc%3Atopic%402',
      });
      expect(Linking.openURL).toHaveBeenCalledWith('dfw://wc?uri=wc%3Atopic%402');
      expect(result).toBe(false);
    });
  });

  // PRG-3107 required Binance auth to reach a handler the SDK controls. With
  // multiple windows back at the library default, Android popups arrive here
  // instead of in onShouldStartLoadWithRequest — this pins that it still opens.
  it('onOpenWindow opens Binance app auth externally (PRG-3107 via the popup path)', async () => {
    const { getByTestId } = render(<LinkConnect linkToken={SAMPLE_LINK_TOKEN} />);
    (Linking.openURL as jest.Mock).mockClear();
    await waitFor(() => {
      getByTestId('webview').props.onOpenWindow({
        nativeEvent: {
          targetUrl: 'https://app.binance.com/en/oauth/authorize?client_id=mesh',
        },
      });
      expect(Linking.openURL).toHaveBeenCalledWith(
        'https://app.binance.com/en/oauth/authorize?client_id=mesh'
      );
    });
  });

  it('keeps Android popups routed to a handler the SDK controls', async () => {
    const { getByTestId } = render(<LinkConnect linkToken={SAMPLE_LINK_TOKEN} />);
    await waitFor(() => {
      const webview = getByTestId('webview');
      // false would make Android target="_blank" a same-frame navigation, which
      // react-native-webview gates behind Linking.canOpenURL before our handler.
      expect(webview.props.setSupportMultipleWindows).toBe(true);
      expect(typeof webview.props.onOpenWindow).toBe('function');
    });
  });

  it('onOpenWindow swallows a failed external open (no unhandled rejection)', async () => {
    (Linking.openURL as jest.Mock).mockRejectedValueOnce(new Error('no handler'));
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const { getByTestId } = render(<LinkConnect linkToken={SAMPLE_LINK_TOKEN} />);
    await waitFor(() => {
      getByTestId('webview').props.onOpenWindow({
        nativeEvent: { targetUrl: 'https://login.coinbase.com/oauth2/auth' },
      });
    });
    await waitFor(() => expect(warn).toHaveBeenCalled());
    warn.mockRestore();
  });

  it('emits webViewLoadFailed event on WebView onError', async () => {
    const mockOnEvent = jest.fn();
    const { getByTestId } = render(
      <LinkConnect linkToken={SAMPLE_LINK_TOKEN} onEvent={mockOnEvent} />
    );
    await waitFor(() => {
      getByTestId('webview').props.onError({
        nativeEvent: {
          url: 'https://web.meshconnect.com/chunk.js',
          code: -1009,
          description: 'The Internet connection appears to be offline.',
        },
      });
      expect(mockOnEvent).toHaveBeenCalledWith({
        type: 'webViewLoadFailed',
        payload: {
          url: 'https://web.meshconnect.com/chunk.js',
          errorCode: -1009,
          errorDescription: 'The Internet connection appears to be offline.',
        },
      });
    });
  });

  it('triggers auto-reload on onError when not OAuth in progress', async () => {
    const { getByTestId } = render(<LinkConnect linkToken={SAMPLE_LINK_TOKEN} />);
    await waitFor(() => {
      getByTestId('webview').props.onError({
        nativeEvent: { url: 'https://web.meshconnect.com/chunk.js', code: -1009, description: '' },
      });
      expect(mockReload).toHaveBeenCalledTimes(1);
    });
  });

  it('does not auto-reload on onError when OAuth is in progress', async () => {
    const { getByTestId } = render(<LinkConnect linkToken={SAMPLE_LINK_TOKEN} />);
    await waitFor(() => {
      const webview = getByTestId('webview');
      webview.props.onMessage({
        nativeEvent: { data: JSON.stringify({ type: 'integrationOAuthStarted' }) },
      });
      webview.props.onError({
        nativeEvent: { url: 'https://web.meshconnect.com/chunk.js', code: -1009, description: '' },
      });
      expect(mockReload).not.toHaveBeenCalled();
    });
  });

  it('emits webViewLoadFailed event on WebView onHttpError', async () => {
    const mockOnEvent = jest.fn();
    const { getByTestId } = render(
      <LinkConnect linkToken={SAMPLE_LINK_TOKEN} onEvent={mockOnEvent} />
    );
    await waitFor(() => {
      getByTestId('webview').props.onHttpError({
        nativeEvent: {
          url: 'https://web.meshconnect.com/oauth-status',
          statusCode: 503,
        },
      });
      expect(mockOnEvent).toHaveBeenCalledWith({
        type: 'webViewLoadFailed',
        payload: {
          url: 'https://web.meshconnect.com/oauth-status',
          errorCode: 503,
        },
      });
    });
  });

  it('triggers auto-reload on onHttpError for 5xx responses', async () => {
    const { getByTestId } = render(<LinkConnect linkToken={SAMPLE_LINK_TOKEN} />);
    await waitFor(() => {
      getByTestId('webview').props.onHttpError({
        nativeEvent: { url: 'https://web.meshconnect.com/', statusCode: 503 },
      });
      expect(mockReload).toHaveBeenCalledTimes(1);
    });
  });

  it('does not auto-reload on onHttpError for 4xx responses', async () => {
    const { getByTestId } = render(<LinkConnect linkToken={SAMPLE_LINK_TOKEN} />);
    await waitFor(() => {
      getByTestId('webview').props.onHttpError({
        nativeEvent: { url: 'https://web.meshconnect.com/', statusCode: 404 },
      });
      expect(mockReload).not.toHaveBeenCalled();
    });
  });

  it('triggers reload on onContentProcessDidTerminate when not OAuth in progress', async () => {
    const { getByTestId } = render(<LinkConnect linkToken={SAMPLE_LINK_TOKEN} />);
    await waitFor(() => {
      getByTestId('webview').props.onContentProcessDidTerminate();
      expect(mockReload).toHaveBeenCalledTimes(1);
    });
  });

  it('reloads on onContentProcessDidTerminate even during OAuth (dead renderer recovers)', async () => {
    const { getByTestId } = render(<LinkConnect linkToken={SAMPLE_LINK_TOKEN} />);
    await waitFor(() => {
      const webview = getByTestId('webview');
      webview.props.onMessage({
        nativeEvent: { data: JSON.stringify({ type: 'integrationOAuthStarted' }) },
      });
      // A dead render process can't finish an OAuth, so it must recover
      // regardless of isOAuthInProgress; the old behavior left a blank/stuck
      // WebView.
      webview.props.onContentProcessDidTerminate();
      expect(mockReload).toHaveBeenCalledTimes(1);
    });
  });

  it('triggers reload on onRenderProcessGone when not OAuth in progress', async () => {
    const { getByTestId } = render(<LinkConnect linkToken={SAMPLE_LINK_TOKEN} />);
    await waitFor(() => {
      getByTestId('webview').props.onRenderProcessGone();
      expect(mockReload).toHaveBeenCalledTimes(1);
    });
  });

  it('reloads on onRenderProcessGone even during OAuth (dead renderer recovers)', async () => {
    const { getByTestId } = render(<LinkConnect linkToken={SAMPLE_LINK_TOKEN} />);
    await waitFor(() => {
      const webview = getByTestId('webview');
      webview.props.onMessage({
        nativeEvent: { data: JSON.stringify({ type: 'integrationOAuthStarted' }) },
      });
      webview.props.onRenderProcessGone();
      expect(mockReload).toHaveBeenCalledTimes(1);
    });
  });

  it('recovers a dead WebView on foreground return after a backgrounded renderer death', async () => {
    let appStateCb: ((s: string) => void) | undefined;
    jest
      .spyOn(AppState, 'addEventListener')
      .mockImplementation((event: any, cb: any) => {
        if (event === 'change') appStateCb = cb;
        return { remove: jest.fn() } as any;
      });
    const { getByTestId } = render(<LinkConnect linkToken={SAMPLE_LINK_TOKEN} />);
    await waitFor(() => getByTestId('webview'));
    // Renderer dies while backgrounded: no immediate reload (it would not
    // take), just the rendererGone flag.
    (AppState as any).currentState = 'background';
    getByTestId('webview').props.onRenderProcessGone();
    expect(mockReload).toHaveBeenCalledTimes(0);
    // Coming back to the foreground recovers the dead WebView.
    (AppState as any).currentState = 'active';
    appStateCb?.('active');
    expect(mockReload).toHaveBeenCalledTimes(1);
    // Flag is cleared, so a later foreground does nothing.
    appStateCb?.('active');
    expect(mockReload).toHaveBeenCalledTimes(1);
  });
});
