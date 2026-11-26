import React from 'react';
import { Image } from 'react-native';
import { render, fireEvent } from '@testing-library/react-native';
import { NavBar } from '../components/NavBar';

const mockedUseColorScheme = jest.fn();

jest.mock('react-native/Libraries/Utilities/useColorScheme', () => {
  return {
    default: mockedUseColorScheme,
  };
});

describe('NavBar', () => {
  test('renders correctly', () => {
    const component = render(<NavBar goBack={() => void 0} showCloseAlert={() => void 0} />);

    const { getByTestId } = component;

    expect(getByTestId('native-navbar')).toBeTruthy();
    expect(getByTestId('nav-back-button')).toBeTruthy();
    expect(getByTestId('close-button')).toBeTruthy();

    const snapshot = component.toJSON();
    expect(snapshot).toMatchSnapshot();
  });

  test('calls goBack when the back button is pressed', () => {
    const goBackMock = jest.fn();
    const { getByTestId } = render(<NavBar goBack={goBackMock} showCloseAlert={() => {
      void 0
    }} />);

    fireEvent.press(getByTestId('nav-back-button'));

    expect(goBackMock).toHaveBeenCalledTimes(1);
  });

  test('calls showCloseAlert when the close button is pressed', () => {
    const showCloseAlertMock = jest.fn();
    const { getByTestId } = render(<NavBar goBack={() => {
      void 0
    }} showCloseAlert={showCloseAlertMock} />);

    fireEvent.press(getByTestId('close-button'));

    expect(showCloseAlertMock).toHaveBeenCalledTimes(1);
  });

  test("uses the page's own color when given", () => {
    const { getByTestId } = render(
      <NavBar goBack={jest.fn()} showCloseAlert={jest.fn()} isDarkTheme backgroundColor="#445566" />
    );
    expect(getByTestId('native-navbar').props.style.backgroundColor).toBe('#445566');
  });

  test('picks the icons from the page color, not the theme', () => {
    const cases = [
      { isDarkTheme: true, color: '#FFFFFF', icons: 'light' },
      { isDarkTheme: false, color: '#000000', icons: 'dark' },
      { isDarkTheme: true, color: '#445566', icons: 'dark' },
    ];
    for (const { isDarkTheme, color, icons } of cases) {
      const { UNSAFE_getAllByType, unmount } = render(
        <NavBar goBack={jest.fn()} showCloseAlert={jest.fn()} isDarkTheme={isDarkTheme} backgroundColor={color} />
      );
      const uris = UNSAFE_getAllByType(Image).map((image) => image.props.source.testUri);
      expect(uris).toEqual([
        `../../../src/assets/chevron-left-${icons}.png`,
        `../../../src/assets/cross-1-small-${icons}.png`,
      ]);
      unmount();
    }
  });
});
