import React from 'react';
import type { ReactNode } from 'react';
import { SafeAreaView, StatusBar } from 'react-native';
import { useSDKStyles } from './SDKContainer.styled';

type Props = {
  children: ReactNode
}

export const SDKContainer = ({ children }: Props) => {
  const { statusBarStyle } = useSDKStyles();

  return (
    <SafeAreaView style={{ flex: 1 }} testID={'link-connect-component'}>
      <StatusBar backgroundColor={statusBarStyle.backgroundColor} />
      {children}
    </SafeAreaView>
  );
}

