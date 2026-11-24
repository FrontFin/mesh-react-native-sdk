import React from 'react';
import { render } from '@testing-library/react-native';

const mockedUseColorScheme = jest.fn();

jest.mock('react-native/Libraries/Utilities/useColorScheme', () => {
  return {
    default: mockedUseColorScheme,
  };
});

import { SDKViewContainer } from '../components/SDKViewContainer';
import { View } from 'react-native';

describe('SDKViewContainer', () => {
  mockedUseColorScheme.mockReturnValue('light');

  test('renders correctly', () => {
    const component = render(<SDKViewContainer>SDKViewContainer Content</SDKViewContainer>);
    const { getByTestId } = component;

    expect(getByTestId('link-connect-view-component')).toBeTruthy();

    const snapshot = component.toJSON();
    expect(snapshot).toMatchSnapshot();
  });



  test('renders child component correctly', () => {
    const component = render(<SDKViewContainer><View testID={"child-element"}>Test</View></SDKViewContainer>);
    const { getByTestId } = component;

    expect(getByTestId('link-connect-view-component')).toBeTruthy();
    expect(getByTestId('child-element')).toBeTruthy();
  });

  test("uses the page's own color when given, otherwise the fallback for the theme", () => {
    const given = render(<SDKViewContainer isDarkTheme backgroundColor="#445566">x</SDKViewContainer>);
    expect(given.getByTestId('link-connect-view-component').props.style.backgroundColor).toBe('#445566');

    const fallback = render(<SDKViewContainer isDarkTheme>x</SDKViewContainer>);
    expect(fallback.getByTestId('link-connect-view-component').props.style.backgroundColor).toBe('#1C1C1C');
  });
});
