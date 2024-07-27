import React from 'react';
import type { ReactNode } from 'react';
import { SafeAreaView, StatusBar, View } from 'react-native';
import { useSDKStyles } from './SDKContainer.styled';
import { DARK_THEME_COLOR_TOP, LIGHT_THEME_COLOR_TOP, DARK_THEME_COLOR_BOTTOM, LIGHT_THEME_COLOR_BOTTOM } from '../constant';

type Props = {
  children: ReactNode
  isDarkTheme: boolean
}

export const SDKContainer = ({ children, isDarkTheme }: Props) => {
  const { statusBarStyle } = useSDKStyles(isDarkTheme);
  const topColor = isDarkTheme ? DARK_THEME_COLOR_TOP : LIGHT_THEME_COLOR_TOP;
  const bottomColor = isDarkTheme ? DARK_THEME_COLOR_BOTTOM : LIGHT_THEME_COLOR_BOTTOM;

  return (
    <View style={{ flex: 1 }} testID={'link-connect-component'}>
      <SafeAreaView style={{ flex: 0, backgroundColor: topColor }} />
      <SafeAreaView style={{ flex: 1, backgroundColor: bottomColor }}>
        <StatusBar backgroundColor={statusBarStyle.backgroundColor} />
        <View style={{ flex: 1 }}>
          {children}
        </View>
      </SafeAreaView>
      <SafeAreaView style={{ flex: 0, backgroundColor: bottomColor }} />
    </View>
  );
};