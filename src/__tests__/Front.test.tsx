/* eslint-disable */
import React from 'react';
import { render } from '@testing-library/react-native';

import { FrontFinance } from '../index';

jest.mock('react-native-webview', () => {
  const { View } = require('react-native');
  return {
    WebView: View,
  };
});

// Mock callback functions
const mockOnError = jest.fn();

describe('FrontFinance Component', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly', () => {
    const tree = render(<FrontFinance url={''} />).toJSON();
    expect(tree).toMatchSnapshot();
  });

  it('renders correctly when URL is provided', () => {
    const tree = render(<FrontFinance url={'https://example.com'} />).toJSON();
    expect(tree).toMatchSnapshot();
  });

  it('handles onError callback for invalid URL', () => {
    render(<FrontFinance url={''} linkToken={'invalid=='} onError={mockOnError} />);

    expect(mockOnError).toHaveBeenCalledWith('Invalid link token provided');
  });
});
