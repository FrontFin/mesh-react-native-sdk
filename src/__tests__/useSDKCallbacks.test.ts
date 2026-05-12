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

  test('hides native navbar on next navigation after markExternalNavigation is called', () => {
    const { result } = renderHook(() => useSDKCallbacks(mockProps));

    // Simulate WebView sending showNativeNavbar: true
    const showNavbarEvent = {
      nativeEvent: {
        data: JSON.stringify({ type: 'showNativeNavbar', payload: true }),
      },
    } as WebViewMessageEvent;

    act(() => {
      result.current.handleMessage(showNavbarEvent);
    });

    expect(result.current.showNativeNavbar).toBe(true);

    // Simulate external URL being opened (e.g. Coinbase OAuth)
    act(() => {
      result.current.markExternalNavigation();
    });

    // Simulate WebView navigating to the OAuth callback URL
    const callbackNavEvent = {
      url: 'https://sandbox.meshconnect.com/authorize/Coinbase/callback',
    } as WebViewNativeEvent;

    act(() => {
      result.current.handleNavState(callbackNavEvent);
    });

    expect(result.current.showNativeNavbar).toBe(false);
  });

  test('markExternalNavigation flag is cleared after one navigation — subsequent nav does not hide navbar', () => {
    const { result } = renderHook(() => useSDKCallbacks(mockProps));

    act(() => {
      result.current.markExternalNavigation();
    });

    // First navigation clears the flag and hides the navbar
    act(() => {
      result.current.handleNavState({
        url: 'https://sandbox.meshconnect.com/authorize/Coinbase/callback',
      } as WebViewNativeEvent);
    });

    // Simulate WebView re-enabling the native navbar
    act(() => {
      result.current.handleMessage({
        nativeEvent: {
          data: JSON.stringify({ type: 'showNativeNavbar', payload: true }),
        },
      } as WebViewMessageEvent);
    });

    expect(result.current.showNativeNavbar).toBe(true);

    // Second navigation — flag is already cleared, navbar should NOT be hidden
    act(() => {
      result.current.handleNavState({
        url: 'https://sandbox.meshconnect.com/some-other-page',
      } as WebViewNativeEvent);
    });

    expect(result.current.showNativeNavbar).toBe(true);
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
