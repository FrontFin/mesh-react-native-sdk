import React from 'react';
import type { ReactNode } from 'react';
import { SafeAreaView, StatusBar, View } from 'react-native';
import { useSDKStyles } from './SDKContainer.styled';
import { getThemeColors } from '../utils/theme';

type Props = {
  children: ReactNode
  isDarkTheme: boolean
  isMfs?: boolean
}

export const SDKContainer = ({ children, isDarkTheme, isMfs }: Props) => {
  const { statusBarStyle } = useSDKStyles(isDarkTheme, isMfs);
  const { top: topColor, bottom: bottomColor } = getThemeColors(isDarkTheme, isMfs);

  return (
    <View style={{ flex: 1 }} testID={'link-connect-component'}>
      <SafeAreaView style={{ flex: 0, backgroundColor: topColor }} />
      <SafeAreaView style={{ flex: 1, backgroundColor: bottomColor }}>
        <StatusBar
          backgroundColor={statusBarStyle.backgroundColor}
          barStyle={statusBarStyle.barStyle}
        />
        <View style={{ flex: 1 }}>
          {children}
        </View>
      </SafeAreaView>
      <SafeAreaView style={{ flex: 0, backgroundColor: bottomColor }} />
    </View>
  );
};