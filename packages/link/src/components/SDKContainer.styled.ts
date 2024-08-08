/* istanbul ignore file */
import { StyleSheet } from 'react-native';
import { LIGHT_THEME_COLOR_TOP, DARK_THEME_COLOR_TOP } from '../constant';

const createNavBarStyles = (backgroundColor: string) => StyleSheet.create({
  navBarContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: 64,
    paddingTop: 12,
    paddingStart: 6,
    paddingEnd: 8,
    backgroundColor, // Dynamic background color
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

export const useSDKStyles = (isDarkTheme: boolean) => {
const backgroundColor = isDarkTheme ? DARK_THEME_COLOR_TOP : LIGHT_THEME_COLOR_TOP;

  const statusBarStyle = {
    backgroundColor: isDarkTheme ? DARK_THEME_COLOR_TOP : LIGHT_THEME_COLOR_TOP,
  };

  const navBarStyles = createNavBarStyles(backgroundColor);

  return { statusBarStyle, navBarStyles };
}
