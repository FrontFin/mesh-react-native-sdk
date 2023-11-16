import { renderHook, act } from '@testing-library/react-native';
import { Alert } from 'react-native';
import { useSDKCallbacks } from '../hooks/useSDKCallbacks';
import { WebViewMessageEvent } from 'react-native-webview';
import { WebViewNativeEvent } from 'react-native-webview/lib/WebViewTypes';

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
});
