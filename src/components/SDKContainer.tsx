import React from 'react';
import type { ReactNode } from 'react';
import { SafeAreaView, StatusBar, View } from 'react-native';
import { useSDKStyles } from './SDKContainer.styled';

type Props = {
  children: ReactNode
  isDarkTheme: boolean
  backgroundColor?: string
}

export const SDKContainer = ({ children, isDarkTheme, backgroundColor: color }: Props) => {
  const { statusBarStyle } = useSDKStyles(isDarkTheme, color);
  const backgroundColor = statusBarStyle.backgroundColor;

  return (
    <View style={{ flex: 1 }} testID={'link-connect-component'}>
      <SafeAreaView style={{ flex: 0, backgroundColor }} />
      <SafeAreaView style={{ flex: 1, backgroundColor }}>
        <StatusBar
          backgroundColor={statusBarStyle.backgroundColor}
          barStyle={statusBarStyle.barStyle}
        />
        <View style={{ flex: 1 }}>
          {children}
        </View>
      </SafeAreaView>
      <SafeAreaView style={{ flex: 0, backgroundColor }} />
    </View>
  );
};