import React from 'react';
import type { ReactNode } from 'react';
import { View } from 'react-native';
import { getThemeColors } from '../utils/theme';

type Props = {
  children: ReactNode
  isDarkTheme?: boolean
  isMfs?: boolean
};

export const SDKViewContainer = ({ children, isDarkTheme, isMfs }: Props) => {
  return (
    <View style={{ flex: 1, backgroundColor: getThemeColors(isDarkTheme ?? false, isMfs).bottom }} testID={'link-connect-view-component'}>
      {children}
    </View>
  );
};
