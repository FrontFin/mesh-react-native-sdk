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
    expect(statusBar.props.backgroundColor).toBe('#1C1C1C');
  });

  test('uses dark status bar content on light theme', () => {
    const { UNSAFE_getByType } = render(
      <SDKContainer isDarkTheme={false}>Test Content</SDKContainer>
    );
    const statusBar = UNSAFE_getByType(StatusBar);
    expect(statusBar.props.barStyle).toBe('dark-content');
    expect(statusBar.props.backgroundColor).toBe('#F9F9F9');
  });

  test("uses the page's own color for the status bar when given", () => {
    const { UNSAFE_getByType } = render(
      <SDKContainer isDarkTheme={true} backgroundColor="#445566">Test Content</SDKContainer>
    );
    expect(UNSAFE_getByType(StatusBar).props.backgroundColor).toBe('#445566');
  });

  test('picks the status bar content from the page color, not the theme', () => {
    const cases = [
      { isDarkTheme: true, color: '#FFFFFF', barStyle: 'dark-content' },
      { isDarkTheme: false, color: '#000000', barStyle: 'light-content' },
      { isDarkTheme: true, color: '#445566', barStyle: 'light-content' },
      { isDarkTheme: false, color: '#DDEEFF', barStyle: 'dark-content' },
      // Bright but saturated: black reads better than white (9.6:1 against 2.2:1)
      { isDarkTheme: true, color: '#00CC00', barStyle: 'dark-content' },
    ];
    for (const { isDarkTheme, color, barStyle } of cases) {
      const { UNSAFE_getByType, unmount } = render(
        <SDKContainer isDarkTheme={isDarkTheme} backgroundColor={color}>Test Content</SDKContainer>
      );
      expect(UNSAFE_getByType(StatusBar).props.barStyle).toBe(barStyle);
      unmount();
    }
  });
});
