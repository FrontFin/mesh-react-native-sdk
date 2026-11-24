/* istanbul ignore file */
import { StyleSheet } from 'react-native';
import { getThemeColor } from '../utils/theme';

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

// `color` is the page's own color from the token; without it, the fallback for the theme.
export const useSDKStyles = (isDarkTheme: boolean, color?: string) => {
  const backgroundColor = color ?? getThemeColor(isDarkTheme);

  const statusBarStyle = {
    backgroundColor,
    barStyle: isDarkTheme ? 'light-content' : 'dark-content',
  } as const;

  const navBarStyles = createNavBarStyles(backgroundColor);

  return { statusBarStyle, navBarStyles };
}
