import { Linking } from 'react-native';
import { createOnShouldStartLoadWithRequest } from 'react-native-webview/lib/WebViewShared';
import type { ShouldStartLoadRequestEvent } from 'react-native-webview/lib/WebViewTypes';
import { DEFAULT_BACKUP_WIDGET_ORIGIN, WHITELISTED_ORIGINS } from '../constant';

describe('DEFAULT_BACKUP_WIDGET_ORIGIN', () => {
  it('points at the live production backup widget, not the development placeholder', () => {
    expect(DEFAULT_BACKUP_WIDGET_ORIGIN).toBe('https://backup.meshconnect.com');
  });
});

describe('WHITELISTED_ORIGINS', () => {
  // Runs the URL through react-native-webview's own originWhitelist gate — the
  // one that hands non-matching URLs to Linking.openURL (Safari on iOS) before
  // the SDK's onShouldStartLoadWithRequest ever sees them.
  const loadsInWebView = (url: string): boolean => {
    const loadRequest = jest.fn();
    createOnShouldStartLoadWithRequest(
      loadRequest,
      WHITELISTED_ORIGINS
    )({
      nativeEvent: { url, lockIdentifier: 1 },
    } as unknown as ShouldStartLoadRequestEvent);
    return loadRequest.mock.calls[0][0];
  };

  beforeEach(() => {
    jest.spyOn(Linking, 'canOpenURL').mockResolvedValue(false);
    jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('keeps meshpay.com subdomains inside the WebView', () => {
    expect(loadsInWebView('https://pay.meshpay.com/checkout?id=1')).toBe(true);
    expect(Linking.canOpenURL).not.toHaveBeenCalled();
  });

  it('still hands lookalike domains to the OS', () => {
    expect(loadsInWebView('https://notmeshpay.com/')).toBe(false);
    expect(Linking.canOpenURL).toHaveBeenCalledWith('https://notmeshpay.com/');
  });
});
