/* eslint-disable */
import React from 'react';
import { Alert, Appearance, AppState } from 'react-native';
import { act, fireEvent, render, waitFor } from '@testing-library/react-native';
import { LinkConnectBackup } from '../components/LinkConnectBackup';
import {
  DARK_THEME_COLOR_BOTTOM,
  DEFAULT_BACKUP_WIDGET_ORIGIN,
} from '../constant';
import type { MeshBackupConfig } from '../types';

const mockedUseColorScheme = jest.fn();
jest.mock('react-native/Libraries/Utilities/useColorScheme', () => ({
  default: mockedUseColorScheme,
}));

// var avoids TDZ — the closure inside forwardRef reads these after module init
var mockReload = jest.fn();
var mockInject = jest.fn();

jest.mock('react-native-webview', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    WebView: React.forwardRef((props: any, ref: any) => {
      React.useImperativeHandle(ref, () => ({
        reload: mockReload,
        injectJavaScript: mockInject,
        goBack: jest.fn(),
      }));
      return React.createElement(View, props);
    }),
  };
});

const CONFIG: MeshBackupConfig = {
  clientId: '26C2621E-2C09-4CCC-DCF7-08DE90525AA1',
  userId: 'end-user-123',
  destinations: [{ networkId: 'net-guid', symbol: 'USDC' }],
  preselectedSymbol: 'USDC',
  // Optional correlation id — the delivery test asserts the whole config
  // (including this) reaches the widget unchanged.
  transactionId: 'txn-abc-123',
};

const loaded = (webview: any) =>
  webview.props.onMessage({
    nativeEvent: { data: JSON.stringify({ type: 'loaded' }) },
  });

describe('LinkConnectBackup', () => {
  beforeEach(() => {
    mockReload.mockClear();
    mockInject.mockClear();
    (AppState as any).currentState = 'active';
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('loads the default backup widget origin with SDK hints, not a link token', async () => {
    const { getByTestId } = render(<LinkConnectBackup backupConfig={CONFIG} />);
    await waitFor(() => {
      const uri = getByTestId('webview').props.source.uri;
      expect(uri.startsWith(DEFAULT_BACKUP_WIDGET_ORIGIN)).toBe(true);
      expect(uri).toContain('platform=reactNative');
      // No deposit config leaks onto the URL.
      expect(uri).not.toContain('USDC');
      expect(uri).not.toContain('end-user-123');
    });
  });

  it('honours a custom widgetOrigin, including one that carries a path', async () => {
    const { getByTestId } = render(
      <LinkConnectBackup backupConfig={CONFIG} widgetOrigin="https://staging.example/widget/" />
    );
    await waitFor(() => {
      // The path is preserved on the load URL (trailing slash normalised).
      expect(
        getByTestId('webview').props.source.uri.startsWith('https://staging.example/widget?')
      ).toBe(true);
    });
  });

  it('contains navigation to the widget origin and blocks everything else without external hand-off', async () => {
    // Every origin reaches the handler (whitelist ['*']); containment is
    // enforced there, so a blocked URL is not opened via Linking either. Uses a
    // path-bearing origin to pin the M2 regression (origin, not path, gates).
    const { getByTestId } = render(
      <LinkConnectBackup backupConfig={CONFIG} widgetOrigin="https://staging.example/widget" />
    );
    await waitFor(() => {
      const webview = getByTestId('webview');
      expect(webview.props.injectedJavaScript).toContain('meshSdkPlatform');
      expect(webview.props.injectedJavaScript).toContain('meshSdkVersion');
      expect(webview.props.originWhitelist).toEqual(['*']);
      // Popups forced same-frame so they can't bypass the origin check.
      expect(webview.props.setSupportMultipleWindows).toBe(false);
      const allow = webview.props.onShouldStartLoadWithRequest;
      expect(allow({ url: 'https://staging.example/widget/network' })).toBe(true);
      expect(allow({ url: 'about:blank' })).toBe(true);
      expect(allow({ url: 'https://evil.example' })).toBe(false);
      expect(allow({ url: 'metamask://wc' })).toBe(false);
      // Exact-origin check, not a prefix — these bypass shapes must be blocked.
      expect(
        allow({ url: 'https://staging.example.attacker.com/steal' })
      ).toBe(false);
      expect(
        allow({ url: 'https://staging.example@attacker.example/steal' })
      ).toBe(false);
    });
  });

  it('relaxes containment only when the host opts out via disableDomainWhiteList', async () => {
    const { getByTestId } = render(
      <LinkConnectBackup
        backupConfig={CONFIG}
        widgetOrigin="https://staging.example"
        disableDomainWhiteList
      />
    );
    await waitFor(() => {
      const webview = getByTestId('webview');
      // Whitelist stays ['*'] so the handler always runs (never Linking.openURL).
      expect(webview.props.originWhitelist).toEqual(['*']);
      const allow = webview.props.onShouldStartLoadWithRequest;
      expect(allow({ url: 'https://anywhere.example' })).toBe(true);
      expect(allow({ url: 'metamask://wc' })).toBe(true);
    });
  });

  it('delivers the deposit config over the bridge on the widget loaded event', async () => {
    const onEvent = jest.fn();
    const { getByTestId } = render(
      <LinkConnectBackup backupConfig={CONFIG} onEvent={onEvent} />
    );
    await waitFor(() => {
      loaded(getByTestId('webview'));
      expect(mockInject).toHaveBeenCalledTimes(1);
      const script: string = mockInject.mock.calls[0][0];
      // Delivered as a synthetic MessageEvent (a self-postMessage does not
      // reliably reach the page's own listeners inside a WKWebView), with the
      // widget's own origin so its handshake origin-pinning accepts it.
      expect(script).toContain("dispatchEvent(new MessageEvent('message'");
      expect(script).toContain('origin: window.location.origin');
      // The embedded literal must reconstruct the exact config.
      const literal = script.slice(
        script.indexOf('JSON.parse(') + 'JSON.parse('.length,
        script.lastIndexOf('),')
      );
      // The widget's bridge requires the { type, payload } envelope — a bare
      // config object is silently dropped.
      expect(JSON.parse(JSON.parse(literal))).toEqual({
        type: 'meshBackupConfig',
        payload: CONFIG,
      });
      expect(onEvent).toHaveBeenCalledWith({ type: 'pageLoaded' });
    });
  });

  it('routes transferFinished to onTransferFinished and onEvent', async () => {
    const onTransferFinished = jest.fn();
    const onEvent = jest.fn();
    const payload = {
      status: 'success',
      txId: 't1',
      fromAddress: 'a',
      toAddress: 'b',
      symbol: 'USDC',
      amount: 5,
      networkId: 'net-guid',
    };
    const { getByTestId } = render(
      <LinkConnectBackup
        backupConfig={CONFIG}
        onTransferFinished={onTransferFinished}
        onEvent={onEvent}
      />
    );
    await waitFor(() => {
      getByTestId('webview').props.onMessage({
        nativeEvent: { data: JSON.stringify({ type: 'transferFinished', payload }) },
      });
      expect(onTransferFinished).toHaveBeenCalledWith(payload);
      expect(onEvent).toHaveBeenCalledWith({ type: 'transferCompleted', payload });
    });
  });

  it.each(['close', 'done', 'exit'])('routes %s to onExit', async (type) => {
    const onExit = jest.fn();
    const { getByTestId } = render(
      <LinkConnectBackup backupConfig={CONFIG} onExit={onExit} />
    );
    await waitFor(() => {
      getByTestId('webview').props.onMessage({
        nativeEvent: { data: JSON.stringify({ type, payload: 'done-reason' }) },
      });
      expect(onExit).toHaveBeenCalledWith('done-reason');
    });
  });

  it('emits webViewLoadFailed and auto-reloads on onError', async () => {
    const onEvent = jest.fn();
    const { getByTestId } = render(
      <LinkConnectBackup backupConfig={CONFIG} onEvent={onEvent} />
    );
    await waitFor(() => {
      getByTestId('webview').props.onError({
        nativeEvent: { url: 'https://staging.example', code: -1009, description: 'offline' },
      });
      expect(onEvent).toHaveBeenCalledWith({
        type: 'webViewLoadFailed',
        payload: { url: 'https://staging.example', errorCode: -1009, errorDescription: 'offline' },
      });
      expect(mockReload).toHaveBeenCalledTimes(1);
    });
  });

  it('auto-reloads on onHttpError 5xx but not 4xx', async () => {
    const { getByTestId, rerender } = render(<LinkConnectBackup backupConfig={CONFIG} />);
    await waitFor(() => {
      getByTestId('webview').props.onHttpError({
        nativeEvent: { url: 'https://staging.example', statusCode: 404 },
      });
      expect(mockReload).not.toHaveBeenCalled();
    });
    // New instance so the once-only reload guard is fresh.
    rerender(<LinkConnectBackup backupConfig={CONFIG} widgetOrigin="https://other.example" />);
    await waitFor(() => {
      getByTestId('webview').props.onHttpError({
        nativeEvent: { url: 'https://other.example', statusCode: 503 },
      });
      expect(mockReload).toHaveBeenCalledTimes(1);
    });
  });

  it('shows the exit confirmation alert on showClose', async () => {
    const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    const { getByTestId } = render(<LinkConnectBackup backupConfig={CONFIG} />);
    await waitFor(() => {
      getByTestId('webview').props.onMessage({
        nativeEvent: { data: JSON.stringify({ type: 'showClose' }) },
      });
      expect(alert).toHaveBeenCalledTimes(1);
    });
  });

  it('toggles the native navbar on showNativeNavbar', async () => {
    const { getByTestId, queryByTestId } = render(
      <LinkConnectBackup backupConfig={CONFIG} />
    );
    await waitFor(() => getByTestId('webview'));
    expect(queryByTestId('native-navbar')).toBeNull();
    act(() => {
      getByTestId('webview').props.onMessage({
        nativeEvent: { data: JSON.stringify({ type: 'showNativeNavbar', payload: true }) },
      });
    });
    await waitFor(() => expect(queryByTestId('native-navbar')).not.toBeNull());
  });

  it.each([
    ['brokerageAccountAccessToken', 'accessToken'],
    ['delayedAuthentication', 'delayedAuth'],
  ])('routes %s to onIntegrationConnected (host contract parity)', async (type, key) => {
    const onIntegrationConnected = jest.fn();
    const payload = { brokerType: 'test', brokerName: 'Test' };
    const { getByTestId } = render(
      <LinkConnectBackup
        backupConfig={CONFIG}
        onIntegrationConnected={onIntegrationConnected}
      />
    );
    await waitFor(() => {
      getByTestId('webview').props.onMessage({
        nativeEvent: { data: JSON.stringify({ type, payload }) },
      });
      expect(onIntegrationConnected).toHaveBeenCalledWith({ [key]: payload });
    });
  });

  it('forwards a known deposit event and ignores an unknown type', async () => {
    const onEvent = jest.fn();
    const { getByTestId } = render(
      <LinkConnectBackup backupConfig={CONFIG} onEvent={onEvent} />
    );
    await waitFor(() => {
      const webview = getByTestId('webview');
      const known = { type: 'transferAssetSelected', payload: { symbol: 'USDC' } };
      webview.props.onMessage({ nativeEvent: { data: JSON.stringify(known) } });
      expect(onEvent).toHaveBeenCalledWith(known);

      onEvent.mockClear();
      webview.props.onMessage({
        nativeEvent: { data: JSON.stringify({ type: 'notARealEvent' }) },
      });
      expect(onEvent).not.toHaveBeenCalled();
    });
  });

  it('resolves system theme natively without putting th=system on the URL', async () => {
    jest.spyOn(Appearance, 'getColorScheme').mockReturnValue('dark');
    const { getByTestId } = render(
      <LinkConnectBackup backupConfig={CONFIG} settings={{ theme: 'system' }} />
    );
    await waitFor(() => {
      const webview = getByTestId('webview');
      expect(webview.props.source.uri).not.toContain('th=');
      // System resolved to the device scheme for the native background.
      expect(webview.props.style.backgroundColor).toBe(DARK_THEME_COLOR_BOTTOM);
    });
  });

  it('applies an explicit dark theme to the WebView background', async () => {
    jest.spyOn(Appearance, 'getColorScheme').mockReturnValue('light');
    const { getByTestId } = render(
      <LinkConnectBackup backupConfig={CONFIG} settings={{ theme: 'dark' }} />
    );
    await waitFor(() => {
      expect(getByTestId('webview').props.style.backgroundColor).toBe(
        DARK_THEME_COLOR_BOTTOM
      );
    });
  });

  it.each([
    ['data:text/html,hi'], // non-http scheme
    ['javascript:alert(1)'], // executable scheme
    ['https://widget.example@attacker.example'], // userinfo → real host is attacker.example
  ])(
    'fails closed on an unsafe widgetOrigin (%s): exits and mounts no WebView',
    async (widgetOrigin) => {
      const onExit = jest.fn();
      const {queryByTestId} = render(
        <LinkConnectBackup
          backupConfig={CONFIG}
          widgetOrigin={widgetOrigin}
          onExit={onExit}
        />,
      );
      await waitFor(() => expect(onExit).toHaveBeenCalled());
      expect(onExit).toHaveBeenCalledWith(
        expect.stringContaining('Invalid widgetOrigin'),
      );
      expect(queryByTestId('webview')).toBeNull();
    },
  );

  it('re-enables the auto-reload retry after a settings change (recovery reset key)', async () => {
    const {getByTestId, rerender} = render(
      <LinkConnectBackup backupConfig={CONFIG} settings={{theme: 'light'}} />,
    );
    await waitFor(() => {
      getByTestId('webview').props.onError({
        nativeEvent: {url: 'x', code: -1, description: ''},
      });
    });
    expect(mockReload).toHaveBeenCalledTimes(1);
    // Changing theme changes linkUrl, so the guard must reset and the new URL's
    // first error retries again (keyed on theme, not just widgetOrigin).
    rerender(<LinkConnectBackup backupConfig={CONFIG} settings={{theme: 'dark'}} />);
    await waitFor(() => {
      getByTestId('webview').props.onError({
        nativeEvent: {url: 'x', code: -1, description: ''},
      });
    });
    expect(mockReload).toHaveBeenCalledTimes(2);
  });

  it('shows a native close button wired to onExit, hidden when opted out', async () => {
    const onExit = jest.fn();
    const {getByTestId, queryByTestId, rerender} = render(
      <LinkConnectBackup backupConfig={CONFIG} onExit={onExit} />,
    );
    await waitFor(() => getByTestId('backup-close-button'));
    fireEvent.press(getByTestId('backup-close-button'));
    expect(onExit).toHaveBeenCalledTimes(1);

    rerender(
      <LinkConnectBackup backupConfig={CONFIG} onExit={onExit} hideCloseButton />,
    );
    await waitFor(() =>
      expect(queryByTestId('backup-close-button')).toBeNull(),
    );
  });

  it('recovers a dead renderer while foregrounded (renderer-death recovery)', async () => {
    const { getByTestId } = render(<LinkConnectBackup backupConfig={CONFIG} />);
    await waitFor(() => {
      getByTestId('webview').props.onRenderProcessGone();
      expect(mockReload).toHaveBeenCalledTimes(1);
    });
  });

  it('defers recovery to foreground return when the renderer dies backgrounded', async () => {
    let appStateCb: ((s: string) => void) | undefined;
    jest.spyOn(AppState, 'addEventListener').mockImplementation((event: any, cb: any) => {
      if (event === 'change') appStateCb = cb;
      return { remove: jest.fn() } as any;
    });
    const { getByTestId } = render(<LinkConnectBackup backupConfig={CONFIG} />);
    await waitFor(() => getByTestId('webview'));

    (AppState as any).currentState = 'background';
    getByTestId('webview').props.onContentProcessDidTerminate();
    expect(mockReload).toHaveBeenCalledTimes(0);

    (AppState as any).currentState = 'active';
    appStateCb?.('active');
    expect(mockReload).toHaveBeenCalledTimes(1);
    // Flag cleared: a later foreground does nothing.
    appStateCb?.('active');
    expect(mockReload).toHaveBeenCalledTimes(1);
  });
});
