import React from 'react';
import type { ReactNode } from 'react';
import { View } from 'react-native';
import { getThemeColor } from '../utils/theme';

type Props = {
  children: ReactNode
  isDarkTheme?: boolean
  backgroundColor?: string
};

export const SDKViewContainer = ({ children, isDarkTheme, backgroundColor }: Props) => {
  return (
    <View style={{ flex: 1, backgroundColor: backgroundColor ?? getThemeColor(isDarkTheme ?? false) }} testID={'link-connect-view-component'}>
      {children}
    </View>
  );
};
