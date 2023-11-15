import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import NavBar from '../components/NavBar';

describe('NavBar', () => {
  test('renders correctly', () => {
    const component = render(<NavBar goBack={() => {
      // do nothing
    }} showCloseAlert={() => {
      // do nothing
    }} />);

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
    }} />);

    fireEvent.press(getByTestId('nav-back-button'));

    expect(goBackMock).toHaveBeenCalledTimes(1);
  });

  test('calls showCloseAlert when the close button is pressed', () => {
    const showCloseAlertMock = jest.fn();
    const { getByTestId } = render(<NavBar goBack={() => {
    }} showCloseAlert={showCloseAlertMock} />);

    fireEvent.press(getByTestId('close-button'));

    expect(showCloseAlertMock).toHaveBeenCalledTimes(1);
  });
});
