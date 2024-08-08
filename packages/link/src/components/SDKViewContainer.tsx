import type { ReactNode } from 'react';
import { View } from 'react-native';
import { DARK_THEME_COLOR_BOTTOM, LIGHT_THEME_COLOR_BOTTOM } from '../constant';

type Props = {
  children: ReactNode
  isDarkTheme?: boolean
};

export const SDKViewContainer = ({ children, isDarkTheme }: Props) => {
  return (
    <View style={{ flex: 1, backgroundColor: isDarkTheme ? DARK_THEME_COLOR_BOTTOM : LIGHT_THEME_COLOR_BOTTOM }} testID={'link-connect-view-component'}>
      {children}
    </View>
  );
};
