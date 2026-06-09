/* eslint-disable */
import React from 'react';
import { Linking } from 'react-native';
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

  it('does not reload on onContentProcessDidTerminate when OAuth is in progress', async () => {
    const { getByTestId } = render(<LinkConnect linkToken={SAMPLE_LINK_TOKEN} />);
    await waitFor(() => {
      const webview = getByTestId('webview');
      webview.props.onMessage({
        nativeEvent: { data: JSON.stringify({ type: 'integrationOAuthStarted' }) },
      });
      webview.props.onContentProcessDidTerminate();
      expect(mockReload).not.toHaveBeenCalled();
    });
  });

  it('triggers reload on onRenderProcessGone when not OAuth in progress', async () => {
    const { getByTestId } = render(<LinkConnect linkToken={SAMPLE_LINK_TOKEN} />);
    await waitFor(() => {
      getByTestId('webview').props.onRenderProcessGone();
      expect(mockReload).toHaveBeenCalledTimes(1);
    });
  });

  it('does not reload on onRenderProcessGone when OAuth is in progress', async () => {
    const { getByTestId } = render(<LinkConnect linkToken={SAMPLE_LINK_TOKEN} />);
    await waitFor(() => {
      const webview = getByTestId('webview');
      webview.props.onMessage({
        nativeEvent: { data: JSON.stringify({ type: 'integrationOAuthStarted' }) },
      });
      webview.props.onRenderProcessGone();
      expect(mockReload).not.toHaveBeenCalled();
    });
  });
});
