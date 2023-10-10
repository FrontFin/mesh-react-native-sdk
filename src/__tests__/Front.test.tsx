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
const SAMPLE_CATALOG_URL = 'https://web.getfront.com:443/b2b-iframe/01xs1-test'
const SAMPLE_LINK_TOKEN = 'aHR0cHM6Ly93ZWIuZ2V0ZnJvbnQuY29tL2IyYi1pZnJhbWUvdGVzdC1hY2NvdW50LXJhbmRvbS9icm9rZXItY29ubmVjdC9jYXRhbG9nMQ=='
const SAMPLE_MESH_URL = 'https://web.meshconnect.com'

describe('FrontFinance Component', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly when URL is provided', () => {
    const tree = render(<FrontFinance url={SAMPLE_CATALOG_URL} />).toJSON();
    expect(tree).toMatchSnapshot();
  });

  it('handles onError callback for invalid URL', () => {
    render(<FrontFinance url={'invalid'} onError={mockOnError} />);

    expect(mockOnError).toHaveBeenCalledWith('Invalid catalog link provided');
  });

  it('renders sdk if valid catalogLink is provided', () => {
    render(<FrontFinance url={SAMPLE_CATALOG_URL} />);
  });

  it('handles onError callback for invalid link token', () => {
    render(<FrontFinance linkToken={'invalid=='} onError={mockOnError} />);

    expect(mockOnError).toHaveBeenCalledWith('Invalid link token provided');
  });

  it('renders sdk if valid catalog link is provided', () => {
    render(<FrontFinance linkToken={SAMPLE_LINK_TOKEN} />);
  });
});
