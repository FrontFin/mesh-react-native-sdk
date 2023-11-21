/* eslint-disable */
import React from 'react';
import { render } from '@testing-library/react-native';
import LinkConnect from '../components/LinkConnect';

jest.mock('react-native-webview', () => {
  const { View } = require('react-native');
  return {
    WebView: View,
  };
});

// Mock callback functions
const mockOnExit = jest.fn();
const SAMPLE_LINK_TOKEN = 'aHR0cHM6Ly93ZWIuZ2V0ZnJvbnQuY29tL2IyYi1pZnJhbWUvdGVzdC1hY2NvdW50LXJhbmRvbS9icm9rZXItY29ubmVjdC9jYXRhbG9nMQ==';

describe('LinkConnect Component', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly when linkToken and accessTokens and transferDestinationTokens are provided', () => {
    render(<LinkConnect linkToken={SAMPLE_LINK_TOKEN} settings={{
      accessTokens: [
        {
          accountId: '1234567890',
          accountName: 'Test Account',
          accessToken: '1234567890',
          brokerType: 'test',
          brokerName: 'Test Broker',
        },
      ],
      transferDestinationTokens: [
        {
          accountId: '1234567890',
          accountName: 'Test Account',
          accessToken: '1234567890',
          brokerType: 'test',
          brokerName: 'Test Broker',
        },
      ],
    }} />);
  });

  it('renders correctly when linkToken is provided', () => {
    const tree = render(<LinkConnect linkToken={SAMPLE_LINK_TOKEN} />).toJSON();
    expect(tree).toMatchSnapshot();
  });

  it('handles onError callback for invalid linkToken', () => {
    render(<LinkConnect linkToken={'invalid=='} onExit={mockOnExit} />);

    expect(mockOnExit).toHaveBeenCalledWith('Invalid link token provided');
  });
});
