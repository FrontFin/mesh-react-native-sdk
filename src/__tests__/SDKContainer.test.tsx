import React from 'react';
import { render } from '@testing-library/react-native';

import { mockedUseColorScheme } from './__mocks__/useColorScheme';

import SDKContainer from '../components/SDKContainer';

describe('SDKContainer', () => {
  mockedUseColorScheme.mockReturnValue('light');

  test('renders correctly', () => {
    const component = render(<SDKContainer>Test Content</SDKContainer>);
    const { getByTestId } = component;

    expect(getByTestId('link-connect-component')).toBeTruthy();

    const snapshot = component.toJSON();
    expect(snapshot).toMatchSnapshot();

  });
});
