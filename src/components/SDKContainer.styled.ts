/* istanbul ignore file */
import { StyleSheet, useColorScheme } from 'react-native';

const navBarStyles = StyleSheet.create({
  navBarContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: 64,
    paddingTop: 12,
    paddingStart: 6,
    paddingEnd: 8,
  },
  navBarImgContainer: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navBarImgButton: {
    width: 24,
    height: 24,
    resizeMode: 'contain',
  },
  navBarLogo: {
    height: 18,
    resizeMode: 'contain',
  },
});

export const useSDKStyles = () => {
  const isDarkMode = (typeof useColorScheme === 'function') ? useColorScheme() === 'dark' : false;

  const statusBarStyle = {
    backgroundColor: isDarkMode ? '#000000' : '#ffffff',
  };

  return { isDarkMode, statusBarStyle, navBarStyles };
}
