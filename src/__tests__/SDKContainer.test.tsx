import React from 'react';
import { render } from '@testing-library/react-native';
import { StatusBar } from 'react-native';

const mockedUseColorScheme = jest.fn();

jest.mock('react-native/Libraries/Utilities/useColorScheme', () => {
  return {
    default: mockedUseColorScheme,
  };
});

import { SDKContainer } from '../components/SDKContainer';

describe('SDKContainer', () => {
  mockedUseColorScheme.mockReturnValue('light');

  test('renders correctly', () => {
    const component = render(<SDKContainer>Test Content</SDKContainer>);
    const { getByTestId } = component;

    expect(getByTestId('link-connect-component')).toBeTruthy();

    const snapshot = component.toJSON();
    expect(snapshot).toMatchSnapshot();
  });

  test('uses light status bar content on dark theme', () => {
    const { UNSAFE_getByType } = render(
      <SDKContainer isDarkTheme={true}>Test Content</SDKContainer>
    );
    const statusBar = UNSAFE_getByType(StatusBar);
    expect(statusBar.props.barStyle).toBe('light-content');
    expect(statusBar.props.backgroundColor).toBe('#1E1E24');
  });

  test('uses dark status bar content on light theme', () => {
    const { UNSAFE_getByType } = render(
      <SDKContainer isDarkTheme={false}>Test Content</SDKContainer>
    );
    const statusBar = UNSAFE_getByType(StatusBar);
    expect(statusBar.props.barStyle).toBe('dark-content');
    expect(statusBar.props.backgroundColor).toBe('#F3F4F5');
  });
});
