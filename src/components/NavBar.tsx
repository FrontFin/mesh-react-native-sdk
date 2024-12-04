import React from 'react';
import { useSDKStyles } from './SDKContainer.styled';
import { Image, TouchableOpacity, View } from 'react-native';

type NavBarProps = {
  goBack: () => void;
  showCloseAlert: () => void;
  isDarkTheme: boolean
}

export const NavBar = ({goBack, showCloseAlert, isDarkTheme}: NavBarProps) => {
  const {navBarStyles: styles} = useSDKStyles(isDarkTheme || false);

  return (
    <View testID={'native-navbar'} style={styles.navBarContainer}>
      <TouchableOpacity
        testID={'nav-back-button'}
        onPress={goBack} style={styles.navBarImgContainer}>
        <Image
          source={isDarkTheme 
            ? require('../assets/chevron-left-dark.png') 
            : require('../assets/chevron-left-light.png')}
          style={styles.navBarImgButton}
        />
      </TouchableOpacity>

      <TouchableOpacity
        onPress={showCloseAlert}
        style={styles.navBarImgContainer}
        testID={'close-button'}
      >
        <Image
          source={isDarkTheme 
            ? require('../assets/cross-1-small-dark.png') 
            : require('../assets/cross-1-small-light.png')}
          style={styles.navBarImgButton}
        />
      </TouchableOpacity>
    </View>
  );
}
