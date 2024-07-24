import React from 'react';
import type { ReactNode } from 'react';
import { SafeAreaView, StatusBar } from 'react-native';
import { useSDKStyles } from './SDKContainer.styled';
import { DARK_THEME_COLOR, LIGHT_THEME_COLOR } from '../constant';

type Props = {
  children: ReactNode
  isDarkTheme?: boolean
}

export const SDKContainer = ({ children, isDarkTheme }: Props) => {
  const { statusBarStyle } = useSDKStyles();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: isDarkTheme ? DARK_THEME_COLOR : LIGHT_THEME_COLOR }}
                  testID={'link-connect-component'}>
      <StatusBar backgroundColor={statusBarStyle.backgroundColor} />
      {children}
    </SafeAreaView>
  );
};

