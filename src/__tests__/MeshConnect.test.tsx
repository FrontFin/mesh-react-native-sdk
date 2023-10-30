/* eslint-disable */
import React from 'react';
import { render } from '@testing-library/react-native';
import { MeshConnect } from '../index';

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

describe('MeshConnect Component', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly when URL is provided', () => {
    const tree = render(<MeshConnect url={SAMPLE_CATALOG_URL} />).toJSON();
    expect(tree).toMatchSnapshot();
  });

  it('handles onError callback for invalid URL', () => {
    render(<MeshConnect url={'invalid'} onError={mockOnError} />);

    expect(mockOnError).toHaveBeenCalledWith('Invalid catalog link provided');
  });

  it('renders sdk if valid catalogLink is provided', () => {
    render(<MeshConnect url={SAMPLE_CATALOG_URL} />);
  });

  it('handles onError callback for invalid link token', () => {
    render(<MeshConnect linkToken={'invalid=='} onError={mockOnError} />);

    expect(mockOnError).toHaveBeenCalledWith('Invalid link token provided');
  });

  it('renders sdk if valid catalog link is provided', () => {
    render(<MeshConnect linkToken={SAMPLE_LINK_TOKEN} />);
  });
});
