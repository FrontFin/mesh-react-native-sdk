import React from 'react';
import { render } from '@testing-library/react-native';

const mockedUseColorScheme = jest.fn();

jest.mock('react-native/Libraries/Utilities/useColorScheme', () => {
  return {
    default: mockedUseColorScheme,
  };
});

import { SDKViewContainer } from '../components/SDKViewContainer';

describe('SDKViewContainer', () => {
  mockedUseColorScheme.mockReturnValue('light');

  test('renders correctly', () => {
    const component = render(<SDKViewContainer>SDKViewContainer Content</SDKViewContainer>);
    const { getByTestId } = component;

    expect(getByTestId('link-connect-component')).toBeTruthy();

    const snapshot = component.toJSON();
    expect(snapshot).toMatchSnapshot();
  });
});
