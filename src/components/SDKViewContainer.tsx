import React from 'react';
import type { ReactNode } from 'react';
import { View } from 'react-native';

type Props = {
  children: ReactNode
}

export const SDKViewContainer = ({ children }: Props) => {
  return (
    <View style={{ flex: 1 }} testID={'link-connect-component'}>
      {children}
    </View>
  );
};
