/* eslint-disable */
import React from 'react';
import { Alert, Appearance, AppState } from 'react-native';
import { act, fireEvent, render, waitFor } from '@testing-library/react-native';
import { LinkConnectBackup } from '../components/LinkConnectBackup';
import {
  DARK_THEME_COLOR_BOTTOM,
  DEFAULT_BACKUP_WIDGET_ORIGIN,
  TIER1_READY_TIMEOUT_MS,
  TIER2_READY_TIMEOUT_MS,
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
    // Restore real timers before RTL's auto-cleanup unmounts (a fake-timer
    // cleanup can hang); describe-level afterEach runs before the global one.
    jest.useRealTimers();
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
      // Same origin, equivalent forms (case, default port) are accepted.
      expect(allow({ url: 'https://STAGING.example/x' })).toBe(true);
      expect(allow({ url: 'https://staging.example:443/x' })).toBe(true);
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
      // Origin-bound: the config is only dispatched when the current page is the
      // widget origin — never about:blank or any other loaded document.
      expect(script).toContain(
        `if (window.location.origin === "${DEFAULT_BACKUP_WIDGET_ORIGIN}")`
      );
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

  // ---- JIT via SDK callbacks (OR-452 / client spec §5–§6) -------------------

  const jitRequest = (webview: any, method: string) =>
    webview.props.onMessage({
      nativeEvent: {
        data: JSON.stringify({
          type: 'meshBackupJitRequest',
          payload: { callId: 'call-1', method, symbol: 'USDC', networkId: 'net-guid' },
        }),
      },
    });

  const lastInjectedMessage = () => {
    const script: string = mockInject.mock.calls[mockInject.mock.calls.length - 1][0];
    const literal = script.slice(
      script.indexOf('JSON.parse(') + 'JSON.parse('.length,
      script.lastIndexOf('),')
    );
    return JSON.parse(JSON.parse(literal));
  };

  it('runs onAddressInit for a JIT addressInit request and acks over the bridge', async () => {
    const onAddressInit = jest.fn().mockResolvedValue(undefined);
    const { getByTestId } = render(
      <LinkConnectBackup backupConfig={CONFIG} onAddressInit={onAddressInit} />
    );
    await waitFor(() => getByTestId('webview'));
    mockInject.mockClear();
    await act(async () => {
      jitRequest(getByTestId('webview'), 'addressInit');
    });
    expect(onAddressInit).toHaveBeenCalledWith('USDC', 'net-guid');
    await waitFor(() => expect(mockInject).toHaveBeenCalled());
    expect(lastInjectedMessage()).toEqual({
      type: 'meshBackupJitResponse',
      payload: { callId: 'call-1', ok: true },
    });
  });

  it('replies ok:false when an addressInit arrives with no onAddressInit handler (fail closed)', async () => {
    // A declared address-less JIT destination with no onAddressInit is a
    // misconfiguration — it must be rejected, not acked ok:true (which would let
    // the widget start polling for an address whose generation never began).
    const { getByTestId } = render(<LinkConnectBackup backupConfig={CONFIG} />);
    await waitFor(() => getByTestId('webview'));
    mockInject.mockClear();
    await act(async () => {
      jitRequest(getByTestId('webview'), 'addressInit');
    });
    await waitFor(() => expect(mockInject).toHaveBeenCalled());
    const msg = lastInjectedMessage();
    expect(msg.payload.callId).toBe('call-1');
    expect(msg.payload.ok).toBe(false);
    expect(typeof msg.payload.error).toBe('string');
  });

  it('resolves a JIT statusPoll via onStatusPoll and posts the result back', async () => {
    const onStatusPoll = jest
      .fn()
      .mockResolvedValue({ status: 'ready', address: '0xabc', addressTag: 'memo-1' });
    const { getByTestId } = render(
      <LinkConnectBackup backupConfig={CONFIG} onStatusPoll={onStatusPoll} />
    );
    await waitFor(() => getByTestId('webview'));
    mockInject.mockClear();
    await act(async () => {
      jitRequest(getByTestId('webview'), 'statusPoll');
    });
    expect(onStatusPoll).toHaveBeenCalledWith('USDC', 'net-guid');
    await waitFor(() => expect(mockInject).toHaveBeenCalled());
    expect(lastInjectedMessage()).toEqual({
      type: 'meshBackupJitResponse',
      payload: {
        callId: 'call-1',
        ok: true,
        result: { status: 'ready', address: '0xabc', addressTag: 'memo-1' },
      },
    });
  });

  it('replies ok:false when a statusPoll arrives with no onStatusPoll handler', async () => {
    const { getByTestId } = render(<LinkConnectBackup backupConfig={CONFIG} />);
    await waitFor(() => getByTestId('webview'));
    mockInject.mockClear();
    await act(async () => {
      jitRequest(getByTestId('webview'), 'statusPoll');
    });
    await waitFor(() => expect(mockInject).toHaveBeenCalled());
    const msg = lastInjectedMessage();
    expect(msg.payload.callId).toBe('call-1');
    expect(msg.payload.ok).toBe(false);
    expect(typeof msg.payload.error).toBe('string');
  });

  it('replies ok:false when onStatusPoll rejects (fail closed)', async () => {
    const onStatusPoll = jest.fn().mockRejectedValue(new Error('backend down'));
    const { getByTestId } = render(
      <LinkConnectBackup backupConfig={CONFIG} onStatusPoll={onStatusPoll} />
    );
    await waitFor(() => getByTestId('webview'));
    mockInject.mockClear();
    await act(async () => {
      jitRequest(getByTestId('webview'), 'statusPoll');
    });
    await waitFor(() => expect(mockInject).toHaveBeenCalled());
    expect(lastInjectedMessage()).toEqual({
      type: 'meshBackupJitResponse',
      payload: { callId: 'call-1', ok: false, error: 'backend down' },
    });
  });

  it('ignores a malformed JIT request (no callback run, nothing posted)', async () => {
    const onStatusPoll = jest.fn();
    const { getByTestId } = render(
      <LinkConnectBackup backupConfig={CONFIG} onStatusPoll={onStatusPoll} />
    );
    await waitFor(() => getByTestId('webview'));
    mockInject.mockClear();
    await act(async () => {
      getByTestId('webview').props.onMessage({
        nativeEvent: {
          data: JSON.stringify({
            type: 'meshBackupJitRequest',
            payload: { callId: 'call-1', symbol: 'USDC' }, // no method / networkId
          }),
        },
      });
    });
    expect(onStatusPoll).not.toHaveBeenCalled();
    expect(mockInject).not.toHaveBeenCalled();
  });

  it('rejects a JIT request for a pair not declared address-less in backupConfig', async () => {
    const onStatusPoll = jest
      .fn()
      .mockResolvedValue({ status: 'ready', address: '0xabc' });
    const { getByTestId } = render(
      <LinkConnectBackup backupConfig={CONFIG} onStatusPoll={onStatusPoll} />
    );
    await waitFor(() => getByTestId('webview'));
    mockInject.mockClear();
    await act(async () => {
      getByTestId('webview').props.onMessage({
        nativeEvent: {
          data: JSON.stringify({
            type: 'meshBackupJitRequest',
            // Not a destination in CONFIG (CONFIG only has address-less USDC/net-guid).
            payload: { callId: 'c9', method: 'statusPoll', symbol: 'ETH', networkId: 'other-net' },
          }),
        },
      });
    });
    expect(onStatusPoll).not.toHaveBeenCalled();
    await waitFor(() => expect(mockInject).toHaveBeenCalled());
    expect(lastInjectedMessage().payload).toMatchObject({ callId: 'c9', ok: false });
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

  it('emits webViewLoadFailed and cascades to Tier 2 on a hard onError (never reloads the unreachable origin)', async () => {
    const onEvent = jest.fn();
    const { getByTestId } = render(
      <LinkConnectBackup backupConfig={CONFIG} onEvent={onEvent} />
    );
    await waitFor(() => getByTestId('webview'));
    act(() => {
      getByTestId('webview').props.onError({
        nativeEvent: {
          url: DEFAULT_BACKUP_WIDGET_ORIGIN,
          code: -1009,
          description: 'offline',
        },
      });
    });
    expect(onEvent).toHaveBeenCalledWith({
      type: 'webViewLoadFailed',
      payload: {
        url: DEFAULT_BACKUP_WIDGET_ORIGIN,
        errorCode: -1009,
        errorDescription: 'offline',
      },
    });
    // A hard load error on the backup origin cascades to the bundled Tier-2
    // widget immediately — the unreachable origin is not reloaded.
    expect(onEvent).toHaveBeenCalledWith({
      type: 'backupTierChanged',
      payload: { from: 'tier1', to: 'tier2', reason: 'loadError' },
    });
    expect(mockReload).not.toHaveBeenCalled();
    const source = getByTestId('webview').props.source;
    expect(typeof source.html).toBe('string');
    expect(source.uri).toBeUndefined();
  });

  it.each([404, 503])(
    'cascades to Tier 2 on a document %s (served-but-broken origin), not a reload',
    async (statusCode) => {
      const onEvent = jest.fn();
      const { getByTestId } = render(
        <LinkConnectBackup backupConfig={CONFIG} onEvent={onEvent} />
      );
      await waitFor(() => getByTestId('webview'));
      act(() => {
        getByTestId('webview').props.onHttpError({
          nativeEvent: { url: DEFAULT_BACKUP_WIDGET_ORIGIN, statusCode },
        });
      });
      expect(onEvent).toHaveBeenCalledWith({
        type: 'backupTierChanged',
        payload: { from: 'tier1', to: 'tier2', reason: 'loadError' },
      });
      expect(mockReload).not.toHaveBeenCalled();
    }
  );

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

  it('renders no native NavBar — the ✕ close is the single exit control', async () => {
    const { getByTestId, queryByTestId } = render(
      <LinkConnectBackup backupConfig={CONFIG} />
    );
    await waitFor(() => getByTestId('webview'));
    // Even if the widget sends showNativeNavbar, no NavBar appears: the
    // deposit-only flow has one native close control (the ✕ button), so there
    // are never duplicate close controls.
    act(() => {
      getByTestId('webview').props.onMessage({
        nativeEvent: { data: JSON.stringify({ type: 'showNativeNavbar', payload: true }) },
      });
    });
    await waitFor(() => getByTestId('webview'));
    expect(queryByTestId('native-navbar')).toBeNull();
    expect(getByTestId('backup-close-button')).toBeTruthy();
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

  it('resolves system theme to the device scheme on ?theme= (never theme=system)', async () => {
    jest.spyOn(Appearance, 'getColorScheme').mockReturnValue('dark');
    const { getByTestId } = render(
      <LinkConnectBackup backupConfig={CONFIG} settings={{ theme: 'system' }} />
    );
    await waitFor(() => {
      const webview = getByTestId('webview');
      // System resolves to the device scheme — passed to the widget as theme=dark.
      expect(webview.props.source.uri).toContain('theme=dark');
      expect(webview.props.source.uri).not.toContain('theme=system');
      expect(webview.props.style.backgroundColor).toBe(DARK_THEME_COLOR_BOTTOM);
    });
  });

  it.each([
    ['dark', 'theme=dark'],
    ['light', 'theme=light'],
  ])('passes an explicit %s theme through to ?%s', async (theme, expected) => {
    const { getByTestId } = render(
      <LinkConnectBackup backupConfig={CONFIG} settings={{ theme: theme as 'dark' | 'light' }} />
    );
    await waitFor(() => {
      expect(getByTestId('webview').props.source.uri).toContain(expected);
    });
  });

  it.each([
    ['dark', 'light'],
    ['light', 'dark'],
  ] as const)(
    'Tier 2 renders the host %s theme even on a %s device (no URL to carry ?theme=)',
    async (theme, device) => {
      jest.spyOn(Appearance, 'getColorScheme').mockReturnValue(device);
      const { getByTestId } = render(
        <LinkConnectBackup
          backupConfig={CONFIG}
          settings={{ theme }}
          widgetOrigin="https://backup-widget.invalid"
        />
      );
      await waitFor(() => getByTestId('webview'));
      act(() => {
        getByTestId('webview').props.onError({
          nativeEvent: { url: 'https://backup-widget.invalid', code: -1003, description: 'dns' },
        });
      });
      const { html } = getByTestId('webview').props.source;
      expect(html).toContain(`<html data-theme="${theme}"`);
    }
  );

  it('derives theme from device appearance when the host sets no theme', async () => {
    jest.spyOn(Appearance, 'getColorScheme').mockReturnValue('light');
    const { getByTestId } = render(<LinkConnectBackup backupConfig={CONFIG} />);
    await waitFor(() => {
      expect(getByTestId('webview').props.source.uri).toContain('theme=light');
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
    [''], // explicit empty string must fail closed, not fall back to the default
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

  it('resets the once-only renderer-death reload guard on a settings change (recovery reset key)', async () => {
    const {getByTestId, rerender} = render(
      <LinkConnectBackup backupConfig={CONFIG} settings={{theme: 'light'}} />,
    );
    await waitFor(() => getByTestId('webview'));
    // First renderer death reloads once; a second in the same session does not.
    act(() => getByTestId('webview').props.onRenderProcessGone());
    act(() => getByTestId('webview').props.onRenderProcessGone());
    expect(mockReload).toHaveBeenCalledTimes(1);
    // Changing theme changes the reset key (keyed on theme + tier), so the guard
    // resets and the next renderer death reloads again.
    rerender(<LinkConnectBackup backupConfig={CONFIG} settings={{theme: 'dark'}} />);
    await waitFor(() => getByTestId('webview'));
    act(() => getByTestId('webview').props.onRenderProcessGone());
    expect(mockReload).toHaveBeenCalledTimes(2);
  });

  it('ignores a non-object message (JSON null / primitive) without throwing', async () => {
    const onEvent = jest.fn();
    const onExit = jest.fn();
    const {getByTestId} = render(
      <LinkConnectBackup backupConfig={CONFIG} onEvent={onEvent} onExit={onExit} />,
    );
    await waitFor(() => {
      const webview = getByTestId('webview');
      expect(() => {
        webview.props.onMessage({nativeEvent: {data: 'null'}});
        webview.props.onMessage({nativeEvent: {data: '42'}});
        webview.props.onMessage({nativeEvent: {data: '"a string"'}});
      }).not.toThrow();
      expect(onEvent).not.toHaveBeenCalled();
      expect(onExit).not.toHaveBeenCalled();
    });
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

  it('shows the native close only until the widget is ready (no double ✕)', async () => {
    const { getByTestId, queryByTestId } = render(
      <LinkConnectBackup backupConfig={CONFIG} />
    );
    // Before the widget handshakes (spinner / hanging Tier 1) the native ✕ is
    // the only way out.
    await waitFor(() => getByTestId('backup-close-button'));

    // Once ready, the widget draws its own ✕ in the same corner.
    act(() => loaded(getByTestId('webview')));
    await waitFor(() => expect(queryByTestId('backup-close-button')).toBeNull());

    // A dead renderer reloads blank: the native ✕ comes back until it's ready again.
    act(() => getByTestId('webview').props.onRenderProcessGone());
    await waitFor(() => getByTestId('backup-close-button'));
    act(() => loaded(getByTestId('webview')));
    await waitFor(() => expect(queryByTestId('backup-close-button')).toBeNull());
  });

  it('brings the native close back when origin/theme/language reloads the widget', async () => {
    const { getByTestId, queryByTestId, rerender } = render(
      <LinkConnectBackup backupConfig={CONFIG} settings={{ theme: 'light' }} />
    );
    await waitFor(() => getByTestId('webview'));
    act(() => loaded(getByTestId('webview')));
    await waitFor(() => expect(queryByTestId('backup-close-button')).toBeNull());

    // Same tier, new surface: the replacement widget hasn't handshaken yet.
    rerender(<LinkConnectBackup backupConfig={CONFIG} settings={{ theme: 'dark' }} />);
    await waitFor(() => getByTestId('backup-close-button'));
    act(() => loaded(getByTestId('webview')));
    await waitFor(() => expect(queryByTestId('backup-close-button')).toBeNull());
  });

  it('brings the native close back for the Tier-2 surface until it is ready', async () => {
    const { getByTestId, queryByTestId } = render(
      <LinkConnectBackup backupConfig={CONFIG} />
    );
    await waitFor(() => getByTestId('webview'));
    act(() => {
      getByTestId('webview').props.onError({
        nativeEvent: { url: DEFAULT_BACKUP_WIDGET_ORIGIN, code: -1009, description: 'offline' },
      });
    });
    // Cascaded to Tier 2, which hasn't handshaken yet.
    await waitFor(() => expect(typeof getByTestId('webview').props.source.html).toBe('string'));
    expect(getByTestId('backup-close-button')).toBeTruthy();
    act(() => loaded(getByTestId('webview')));
    await waitFor(() => expect(queryByTestId('backup-close-button')).toBeNull());
  });

  it('falls back to Tier 2 when a same-tier reload after ready fails to load', async () => {
    const onEvent = jest.fn();
    const { getByTestId, rerender } = render(
      <LinkConnectBackup backupConfig={CONFIG} settings={{ theme: 'light' }} onEvent={onEvent} />
    );
    await waitFor(() => getByTestId('webview'));
    act(() => loaded(getByTestId('webview')));

    // Host changes the theme → Tier 1 reloads the widget; that reload fails.
    rerender(<LinkConnectBackup backupConfig={CONFIG} settings={{ theme: 'dark' }} onEvent={onEvent} />);
    await waitFor(() => expect(getByTestId('webview').props.source.uri).toContain('theme=dark'));
    act(() => {
      getByTestId('webview').props.onError({
        nativeEvent: { url: DEFAULT_BACKUP_WIDGET_ORIGIN, code: -1009, description: 'offline' },
      });
    });
    expect(onEvent).toHaveBeenCalledWith({
      type: 'backupTierChanged',
      payload: { from: 'tier1', to: 'tier2', reason: 'loadError' },
    });
    await waitFor(() => expect(typeof getByTestId('webview').props.source.html).toBe('string'));
  });

  it('ignores a stale loaded/error from the previous document after a same-tier reload', async () => {
    const onEvent = jest.fn();
    const { getByTestId, rerender } = render(
      <LinkConnectBackup backupConfig={CONFIG} settings={{ theme: 'light' }} onEvent={onEvent} />
    );
    await waitFor(() => getByTestId('webview'));
    act(() => loaded(getByTestId('webview')));
    // Handlers of the light-theme document (its WebView unmounts on the reload).
    const { onMessage: previousOnMessage, onError: previousOnError } =
      getByTestId('webview').props;

    rerender(<LinkConnectBackup backupConfig={CONFIG} settings={{ theme: 'dark' }} onEvent={onEvent} />);
    await waitFor(() => expect(getByTestId('webview').props.source.uri).toContain('theme=dark'));

    // A queued `loaded` from the old document must not mark the new one ready…
    act(() => {
      previousOnMessage({ nativeEvent: { data: JSON.stringify({ type: 'loaded' }) } });
    });
    expect(getByTestId('backup-close-button')).toBeTruthy();
    // …and a stale error from it must not be read as the new document failing.
    act(() => {
      previousOnError({
        nativeEvent: { url: DEFAULT_BACKUP_WIDGET_ORIGIN, code: -1009, description: 'offline' },
      });
    });
    expect(onEvent).not.toHaveBeenCalledWith(expect.objectContaining({ type: 'backupTierChanged' }));

    // The new document failing still cascades (its handshake was not cancelled).
    act(() => {
      getByTestId('webview').props.onError({
        nativeEvent: { url: DEFAULT_BACKUP_WIDGET_ORIGIN, code: -1009, description: 'offline' },
      });
    });
    expect(onEvent).toHaveBeenCalledWith({
      type: 'backupTierChanged',
      payload: { from: 'tier1', to: 'tier2', reason: 'loadError' },
    });
  });

  describe('Tier 2 after ready', () => {
    // Timer behaviour of a restarted handshake is covered in useBackupTier tests;
    // here the load-error path (immediate, no timers) proves the wiring: after a
    // restart a Tier-2 error fails closed, without one it is ignored.
    const offline = {
      nativeEvent: { url: 'about:blank', code: -1, description: 'load failed' },
    };
    const readyTier2 = async (onExit: jest.Mock) => {
      const utils = render(
        <LinkConnectBackup backupConfig={CONFIG} settings={{ theme: 'light' }} onExit={onExit} />
      );
      await waitFor(() => utils.getByTestId('webview'));
      act(() => {
        utils.getByTestId('webview').props.onError({
          nativeEvent: { url: DEFAULT_BACKUP_WIDGET_ORIGIN, code: -1009, description: 'offline' },
        });
      });
      await waitFor(() =>
        expect(typeof utils.getByTestId('webview').props.source.html).toBe('string')
      );
      act(() => loaded(utils.getByTestId('webview')));
      await waitFor(() => expect(utils.queryByTestId('backup-close-button')).toBeNull());
      return utils;
    };

    it('a language change does not reload the bundled widget, so nothing restarts', async () => {
      const onExit = jest.fn();
      const { rerender, getByTestId, queryByTestId } = await readyTier2(onExit);
      const html = getByTestId('webview').props.source.html;
      rerender(
        <LinkConnectBackup
          backupConfig={CONFIG}
          settings={{ theme: 'light', language: 'en' }}
          onExit={onExit}
        />
      );
      expect(getByTestId('webview').props.source.html).toBe(html);
      expect(queryByTestId('backup-close-button')).toBeNull();
      // Still the same ready document: a stray error is ignored, no exit.
      act(() => getByTestId('webview').props.onError(offline));
      expect(onExit).not.toHaveBeenCalled();
    });

    it('a theme change reloads it: the native close returns and a failed reload fails closed', async () => {
      const onExit = jest.fn();
      const { rerender, getByTestId } = await readyTier2(onExit);
      rerender(<LinkConnectBackup backupConfig={CONFIG} settings={{ theme: 'dark' }} onExit={onExit} />);
      expect(getByTestId('webview').props.source.html).toContain('data-theme="dark"');
      await waitFor(() => getByTestId('backup-close-button'));
      act(() => getByTestId('webview').props.onError(offline));
      expect(onExit).toHaveBeenCalledWith('Backup deposit flow is unavailable');
    });
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

  // ---- Tier-2 super-redundancy cascade (OR-474 / design §5H) ----------------

  it('starts on Tier 1 (remote origin) and cascades to the bundled widget only after the ready timeout', () => {
    jest.useFakeTimers();
    const onEvent = jest.fn();
    const { getByTestId, unmount } = render(
      <LinkConnectBackup backupConfig={CONFIG} onEvent={onEvent} />
    );
    try {
      // Before the timeout: Tier 1, loading from the backup origin.
      expect(
        getByTestId('webview').props.source.uri.startsWith(
          DEFAULT_BACKUP_WIDGET_ORIGIN
        )
      ).toBe(true);
      expect(onEvent).not.toHaveBeenCalledWith(
        expect.objectContaining({ type: 'backupTierChanged' })
      );

      act(() => {
        jest.advanceTimersByTime(TIER1_READY_TIMEOUT_MS);
      });

      expect(onEvent).toHaveBeenCalledWith({
        type: 'backupTierChanged',
        payload: { from: 'tier1', to: 'tier2', reason: 'readyTimeout' },
      });
      const source = getByTestId('webview').props.source;
      expect(typeof source.html).toBe('string');
      expect(source.uri).toBeUndefined();
    } finally {
      unmount();
      jest.clearAllTimers();
      jest.useRealTimers();
    }
  }, 15000);

  it('stays on Tier 1 when the widget completes its ready handshake before the timeout', () => {
    jest.useFakeTimers();
    const onEvent = jest.fn();
    const { getByTestId, unmount } = render(
      <LinkConnectBackup backupConfig={CONFIG} onEvent={onEvent} />
    );
    try {
      // Ready handshake cancels the pending Tier-1 timeout (no state update, so
      // no act wrapper needed — markReady only clears the timer ref).
      loaded(getByTestId('webview'));
      act(() => {
        jest.advanceTimersByTime(TIER1_READY_TIMEOUT_MS * 2);
      });
      expect(onEvent).not.toHaveBeenCalledWith(
        expect.objectContaining({ type: 'backupTierChanged' })
      );
      expect(
        getByTestId('webview').props.source.uri.startsWith(
          DEFAULT_BACKUP_WIDGET_ORIGIN
        )
      ).toBe(true);
    } finally {
      unmount();
      jest.clearAllTimers();
      jest.useRealTimers();
    }
  }, 15000);

  it('in Tier 2, delivers config unconditionally (no origin guard) and injects nothing before content', () => {
    jest.useFakeTimers();
    const { getByTestId, unmount } = render(
      <LinkConnectBackup backupConfig={CONFIG} />
    );
    try {
      act(() => {
        jest.advanceTimersByTime(TIER1_READY_TIMEOUT_MS);
      });
      const webview = getByTestId('webview');
      // The bundled widget is Tier-2-aware at build time and inlines its own
      // snapshot, so the SDK injects nothing before content.
      expect(webview.props.injectedJavaScriptBeforeContentLoaded).toBeUndefined();

      // Config delivery on the Tier-2 handshake is unconditional — the inline
      // document is definitionally our widget. `loaded` is a sync handler with no
      // state update, so it needs no act wrapper.
      mockInject.mockClear();
      loaded(webview);
      const script: string = mockInject.mock.calls[0][0];
      expect(script).toContain("dispatchEvent(new MessageEvent('message'");
      // No Tier-1 origin pin in Tier 2 (the inline doc's origin is opaque).
      expect(script).not.toContain('window.location.origin ===');
      // The config still reaches the widget as the same typed envelope.
      const literal = script.slice(
        script.indexOf('JSON.parse(') + 'JSON.parse('.length,
        script.lastIndexOf('),')
      );
      expect(JSON.parse(JSON.parse(literal))).toEqual({
        type: 'meshBackupConfig',
        payload: CONFIG,
      });
    } finally {
      unmount();
      jest.clearAllTimers();
      jest.useRealTimers();
    }
  }, 15000);

  it('fails closed (onExit) if the bundled Tier-2 assets never become ready', () => {
    jest.useFakeTimers();
    const onExit = jest.fn();
    const { getByTestId, unmount } = render(
      <LinkConnectBackup backupConfig={CONFIG} onExit={onExit} />
    );
    try {
      act(() => {
        jest.advanceTimersByTime(TIER1_READY_TIMEOUT_MS);
      });
      expect(getByTestId('webview').props.source.html).toBeDefined();
      // Tier 2 never handshakes — surface an error, never a blank QR.
      act(() => {
        jest.advanceTimersByTime(TIER2_READY_TIMEOUT_MS);
      });
      expect(onExit).toHaveBeenCalledWith('Backup deposit flow is unavailable');
    } finally {
      unmount();
      jest.clearAllTimers();
      jest.useRealTimers();
    }
  }, 15000);

  it('runs no cascade timers for an invalid widgetOrigin (no spurious fallback or exit)', () => {
    jest.useFakeTimers();
    const onEvent = jest.fn();
    const onExit = jest.fn();
    const { queryByTestId, unmount } = render(
      <LinkConnectBackup
        backupConfig={CONFIG}
        widgetOrigin="data:text/html,hi"
        onEvent={onEvent}
        onExit={onExit}
      />
    );
    try {
      // Immediate fail-closed exit, and no WebView is mounted.
      expect(queryByTestId('webview')).toBeNull();
      expect(onExit).toHaveBeenCalledWith(
        expect.stringContaining('Invalid widgetOrigin')
      );
      onExit.mockClear();
      // The cascade is disabled, so advancing past both tier timeouts must not
      // fire a spurious backupTierChanged or the generic Tier-2-unavailable exit.
      act(() => {
        jest.advanceTimersByTime(
          TIER1_READY_TIMEOUT_MS + TIER2_READY_TIMEOUT_MS + 100
        );
      });
      expect(onEvent).not.toHaveBeenCalledWith(
        expect.objectContaining({ type: 'backupTierChanged' })
      );
      expect(onExit).not.toHaveBeenCalled();
    } finally {
      unmount();
      jest.clearAllTimers();
      jest.useRealTimers();
    }
  }, 15000);
});
