import React, { ReactNode } from 'react';
import { SafeAreaView, StatusBar } from 'react-native';
import { isDarkMode, statusBarStyle } from './SDKContainer.styled';

type Props = {
  children: ReactNode
}

const SDKContainer = ({ children }: Props) => {
  return (
    <SafeAreaView style={{ flex: 1 }} testID={'link-connect-component'}>
      <StatusBar
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
        backgroundColor={statusBarStyle.backgroundColor}
      />
      {children}
    </SafeAreaView>
  );
}

export default SDKContainer;
