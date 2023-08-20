import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';

jest.mock('react-native-webview', () => {
  const { View } = require('react-native');
  return {
    WebView: View,
  };
});

import { FrontFinance } from "../index";

// Mock callback functions
const mockOnError = jest.fn();
const mockOnClose = jest.fn();
const mockOnBrokerConnected = jest.fn();
const mockOnTransferFinished = jest.fn();

describe('FrontFinance Component', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly', () => {
    const tree = render(<FrontFinance url={''} />).toJSON();
    expect(tree).toMatchSnapshot();
  });

  it('renders correctly when URL is provided', () => {
    const tree = render(<FrontFinance url={'http://example.com'} />).toJSON();
    expect(tree).toMatchSnapshot();
  });

  it('handles onError callback for invalid URL', () => {
    const { getByTestId } = render(
      <FrontFinance url={''} onError={mockOnError} />
    );

    expect(mockOnError).toHaveBeenCalledWith('Invalid iframeUrl');
  });
});
