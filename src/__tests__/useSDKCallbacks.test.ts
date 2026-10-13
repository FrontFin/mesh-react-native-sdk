import { renderHook, act } from '@testing-library/react-native';
import { Alert, Appearance } from 'react-native';
import { useSDKCallbacks } from '../hooks/useSDKCallbacks';
import { WebViewMessageEvent } from 'react-native-webview';
import { WebViewNativeEvent } from 'react-native-webview/lib/WebViewTypes';

/** Base64 of `https://link.meshconnect.com` — `decode64(linkToken)` yields that URL. */
const TOKEN_BASE_ONLY = 'aHR0cHM6Ly9saW5rLm1lc2hjb25uZWN0LmNvbQ==';

/**
 * Base64 of `https://link.meshconnect.com?link_style=eyJ0aCI6ImRhcmsifQ==`
 * (link_style is base64 of `{"th":"dark"}`).
 */
const TOKEN_URL_THEME_DARK =
  'aHR0cHM6Ly9saW5rLm1lc2hjb25uZWN0LmNvbT9saW5rX3N0eWxlPWV5SjBhQ0k2SW1SaGNtc2lmUT09';

const mockedUseColorScheme = jest.fn();

jest.mock('react-native/Libraries/Utilities/useColorScheme', () => {
  return {
    default: mockedUseColorScheme,
  };
});

jest.mock('../utils/language', () => ({
  ...jest.requireActual('../utils/language'),
  resolveLanguage: jest.fn(),
}));

// eslint-disable-next-line @typescript-eslint/no-var-requires
const mockedResolveLanguage = require('../utils/language')
  .resolveLanguage as jest.Mock;

describe('useSDKCallbacks', () => {
  const mockProps = {
    linkToken: 'c29tZVZhbGlkTGlua1Rva2Vu',
    onExit: jest.fn(),
    onIntegrationConnected: jest.fn(),
    onTransferFinished: jest.fn(),
  };

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('sets up and cleans up correctly', () => {
    const { result, unmount } = renderHook(() => useSDKCallbacks(mockProps));

    act(() => {
      unmount();
    });

    expect(result.current.linkUrl).toBeNull();
    expect(result.current.showWebView).toBe(false);
  });

  test('handles messages correctly', () => {
    jest.spyOn(Alert, 'alert');
    const { result } = renderHook(() => useSDKCallbacks(mockProps));

    const mockMessageEvent = {
      nativeEvent: {
        data: JSON.stringify({ type: 'showClose' }),
      },
    } as WebViewMessageEvent;

    act(() => {
      result.current.handleMessage(mockMessageEvent);
    });

    expect(Alert.alert).toHaveBeenCalledWith(
      'Are you sure you want to exit?',
      'Your progress will be lost.',
      expect.any(Array)
    );
  });

  test('handles nav state correctly', () => {
    const { result } = renderHook(() => useSDKCallbacks(mockProps));

    const mockNavStateEvent = {
      url: 'some/broker-connect/catalog',
    } as WebViewNativeEvent;

    act(() => {
      result.current.handleNavState(mockNavStateEvent);
    });

    expect(result.current.showNativeNavbar).toBe(false);
  });

  test('isOAuthInProgress is false initially', () => {
    const { result } = renderHook(() => useSDKCallbacks(mockProps));
    expect(result.current.isOAuthInProgress.current).toBe(false);
  });

  test('isOAuthInProgress becomes true on integrationOAuthStarted', () => {
    const { result } = renderHook(() => useSDKCallbacks(mockProps));

    act(() => {
      result.current.handleMessage({
        nativeEvent: { data: JSON.stringify({ type: 'integrationOAuthStarted' }) },
      } as WebViewMessageEvent);
    });

    expect(result.current.isOAuthInProgress.current).toBe(true);
  });

  test('isOAuthInProgress resets to false on exit', () => {
    const { result } = renderHook(() => useSDKCallbacks(mockProps));

    act(() => {
      result.current.handleMessage({
        nativeEvent: { data: JSON.stringify({ type: 'integrationOAuthStarted' }) },
      } as WebViewMessageEvent);
    });

    act(() => {
      result.current.handleMessage({
        nativeEvent: { data: JSON.stringify({ type: 'exit' }) },
      } as WebViewMessageEvent);
    });

    expect(result.current.isOAuthInProgress.current).toBe(false);
  });

  test('isOAuthInProgress resets to false on close and done', () => {
    const { result } = renderHook(() => useSDKCallbacks(mockProps));

    for (const type of ['close', 'done'] as const) {
      act(() => {
        result.current.handleMessage({
          nativeEvent: { data: JSON.stringify({ type: 'integrationOAuthStarted' }) },
        } as WebViewMessageEvent);
      });

      act(() => {
        result.current.handleMessage({
          nativeEvent: { data: JSON.stringify({ type }) },
        } as WebViewMessageEvent);
      });

      expect(result.current.isOAuthInProgress.current).toBe(false);
    }
  });

  test('isOAuthInProgress resets to false on brokerageAccountAccessToken', () => {
    const { result } = renderHook(() => useSDKCallbacks(mockProps));

    act(() => {
      result.current.handleMessage({
        nativeEvent: { data: JSON.stringify({ type: 'integrationOAuthStarted' }) },
      } as WebViewMessageEvent);
    });

    act(() => {
      result.current.handleMessage({
        nativeEvent: {
          data: JSON.stringify({
            type: 'brokerageAccountAccessToken',
            payload: {
              accountTokens: [],
              brokerBrandInfo: {},
              brokerType: 'test',
              brokerName: 'Test',
            },
          }),
        },
      } as WebViewMessageEvent);
    });

    expect(result.current.isOAuthInProgress.current).toBe(false);
  });

  test('isOAuthInProgress resets to false on delayedAuthentication', () => {
    const { result } = renderHook(() => useSDKCallbacks(mockProps));

    act(() => {
      result.current.handleMessage({
        nativeEvent: { data: JSON.stringify({ type: 'integrationOAuthStarted' }) },
      } as WebViewMessageEvent);
    });

    act(() => {
      result.current.handleMessage({
        nativeEvent: {
          data: JSON.stringify({
            type: 'delayedAuthentication',
            payload: {
              brokerType: 'test',
              refreshToken: 'token123',
              brokerName: 'Test',
              brokerBrandInfo: {},
            },
          }),
        },
      } as WebViewMessageEvent);
    });

    expect(result.current.isOAuthInProgress.current).toBe(false);
  });

  test('isOAuthInProgress resets to false when linkToken changes', () => {
    const { result, rerender } = renderHook(
      (props) => useSDKCallbacks(props),
      { initialProps: mockProps }
    );

    act(() => {
      result.current.handleMessage({
        nativeEvent: { data: JSON.stringify({ type: 'integrationOAuthStarted' }) },
      } as WebViewMessageEvent);
    });

    expect(result.current.isOAuthInProgress.current).toBe(true);

    act(() => {
      rerender({ ...mockProps, linkToken: TOKEN_BASE_ONLY });
    });

    expect(result.current.isOAuthInProgress.current).toBe(false);
  });
});

describe('useSDKCallbacks: withdrawalRequested', () => {
  const onEvent = jest.fn();
  const onExit = jest.fn();
  const onTransferFinished = jest.fn();
  const props = {
    linkToken: TOKEN_BASE_ONLY,
    onEvent,
    onExit,
    onTransferFinished,
  };

  const send = (
    handleMessage: (event: WebViewMessageEvent) => void,
    message: object
  ) =>
    act(() => {
      handleMessage({
        nativeEvent: { data: JSON.stringify(message) },
      } as WebViewMessageEvent);
    });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test.each(['pending', 'success'])(
    'forwards status "%s" to onEvent unrenamed',
    (status) => {
      const { result } = renderHook(() => useSDKCallbacks(props));
      const message = {
        type: 'withdrawalRequested',
        payload: { transferId: 'transfer-1', status },
      };

      send(result.current.handleMessage, message);

      expect(onEvent).toHaveBeenCalledTimes(1);
      expect(onEvent).toHaveBeenCalledWith(message);
      expect(onTransferFinished).not.toHaveBeenCalled();
    }
  );

  test('passes an unknown status through unchanged', () => {
    const { result } = renderHook(() => useSDKCallbacks(props));
    const message = {
      type: 'withdrawalRequested',
      payload: { transferId: 'transfer-1', status: 'failed' },
    };

    send(result.current.handleMessage, message);

    expect(onEvent).toHaveBeenCalledWith(message);
  });

  test('calls onEvent before onExit when Link closes after it', () => {
    const { result } = renderHook(() => useSDKCallbacks(props));

    send(result.current.handleMessage, {
      type: 'withdrawalRequested',
      payload: { transferId: 'transfer-1', status: 'pending' },
    });
    send(result.current.handleMessage, { type: 'close' });

    expect(onEvent).toHaveBeenCalledTimes(1);
    expect(onExit).toHaveBeenCalledTimes(1);
    expect(onEvent.mock.invocationCallOrder[0]).toBeLessThan(
      onExit.mock.invocationCallOrder[0]
    );
  });

  test('keeps renaming transferFinished and calling onTransferFinished', () => {
    const { result } = renderHook(() => useSDKCallbacks(props));
    const payload = {
      status: 'success',
      txId: 'tx-1',
      fromAddress: 'from',
      toAddress: 'to',
      symbol: 'ETH',
      amount: 1,
      networkId: 'network-1',
    };

    send(result.current.handleMessage, { type: 'transferFinished', payload });

    expect(onEvent).toHaveBeenCalledWith({
      type: 'transferCompleted',
      payload,
    });
    expect(onTransferFinished).toHaveBeenCalledWith(payload);
  });

  test('still drops an unknown event type', () => {
    const { result } = renderHook(() => useSDKCallbacks(props));

    send(result.current.handleMessage, { type: 'somethingNew', payload: {} });

    expect(onEvent).not.toHaveBeenCalled();
  });
});

describe('useSDKCallbacks – theme behaviour', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('darkTheme is true and th=dark appended to URL when settings.theme is "dark"', () => {
    const { result } = renderHook(() =>
      useSDKCallbacks({ linkToken: TOKEN_BASE_ONLY, settings: { theme: 'dark' } })
    );

    expect(result.current.darkTheme).toBe(true);
    expect(result.current.linkUrl).toContain('th=dark');
  });

  test('darkTheme is false and th=light appended to URL when settings.theme is "light"', () => {
    const { result } = renderHook(() =>
      useSDKCallbacks({ linkToken: TOKEN_BASE_ONLY, settings: { theme: 'light' } })
    );

    expect(result.current.darkTheme).toBe(false);
    expect(result.current.linkUrl).toContain('th=light');
  });

  test('darkTheme follows device scheme and th=system in URL when settings.theme is "system" on a dark device', () => {
    jest.spyOn(Appearance, 'getColorScheme').mockReturnValue('dark');

    const { result } = renderHook(() =>
      useSDKCallbacks({ linkToken: TOKEN_BASE_ONLY, settings: { theme: 'system' } })
    );

    expect(result.current.darkTheme).toBe(true);
    expect(result.current.linkUrl).toContain('th=system');
  });

  test('darkTheme follows device scheme and th=system in URL when settings.theme is "system" on a light device', () => {
    jest.spyOn(Appearance, 'getColorScheme').mockReturnValue('light');

    const { result } = renderHook(() =>
      useSDKCallbacks({ linkToken: TOKEN_BASE_ONLY, settings: { theme: 'system' } })
    );

    expect(result.current.darkTheme).toBe(false);
    expect(result.current.linkUrl).toContain('th=system');
  });

  test('settings.theme overrides dark theme encoded in the link token', () => {
    // Token URL has dark theme in link_style, but settings override to light
    const { result } = renderHook(() =>
      useSDKCallbacks({
        linkToken: TOKEN_URL_THEME_DARK,
        settings: { theme: 'light' },
      })
    );

    expect(result.current.darkTheme).toBe(false);
    expect(result.current.linkUrl).toContain('th=light');
  });

  test('falls back to link_style theme in the token when no settings.theme is set', () => {
    const { result } = renderHook(() =>
      useSDKCallbacks({ linkToken: TOKEN_URL_THEME_DARK })
    );

    expect(result.current.darkTheme).toBe(true);
    // No settings override – th param must NOT be appended a second time
    expect(result.current.linkUrl).not.toMatch(/th=dark.*th=dark/);
  });

  test('darkTheme is false when no theme is set anywhere', () => {
    const { result } = renderHook(() =>
      useSDKCallbacks({ linkToken: TOKEN_BASE_ONLY })
    );

    // No theme in token and no settings.theme → darkTheme defaults to false
    expect(result.current.darkTheme).toBe(false);
    expect(result.current.linkUrl).not.toContain('th=');
  });
});

describe('useSDKCallbacks: language behaviour', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test('appends the resolved language tag as lng', () => {
    mockedResolveLanguage.mockReturnValue('en');

    const { result } = renderHook(() =>
      useSDKCallbacks({ linkToken: TOKEN_BASE_ONLY, settings: { language: 'en' } })
    );

    expect(mockedResolveLanguage).toHaveBeenCalledWith('en');
    expect(result.current.linkUrl).toContain('lng=en');
  });

  test('passes the resolved system locale as lng, never the literal "system"', () => {
    mockedResolveLanguage.mockReturnValue('fr-FR');

    const { result } = renderHook(() =>
      useSDKCallbacks({
        linkToken: TOKEN_BASE_ONLY,
        settings: { language: 'system' },
      })
    );

    expect(mockedResolveLanguage).toHaveBeenCalledWith('system');
    expect(result.current.linkUrl).toContain('lng=fr-FR');
    expect(result.current.linkUrl).not.toContain('lng=system');
  });

  test('does not append lng when the language resolves to undefined', () => {
    mockedResolveLanguage.mockReturnValue(undefined);

    const { result } = renderHook(() =>
      useSDKCallbacks({ linkToken: TOKEN_BASE_ONLY })
    );

    expect(result.current.linkUrl).not.toContain('lng=');
  });
});
