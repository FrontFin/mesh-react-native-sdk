import { useSDKStyles } from './SDKContainer.styled';
import { Image, TouchableOpacity, View } from 'react-native';

type NavBarProps = {
  goBack: () => void;
  showCloseAlert: () => void;
}

export const NavBar = ({goBack, showCloseAlert}: NavBarProps) => {
  const {navBarStyles: styles} = useSDKStyles();

  return (
    <View testID={'native-navbar'} style={styles.navBarContainer}>
      <TouchableOpacity
        testID={'nav-back-button'}
        onPress={goBack} style={styles.navBarImgContainer}>
        <Image
          source={require('../assets/ic_back.png')}
          style={styles.navBarImgButton}
        />
      </TouchableOpacity>

      <TouchableOpacity
        onPress={showCloseAlert}
        style={styles.navBarImgContainer}
        testID={'close-button'}
      >
        <Image
          source={require('../assets/ic_close.png')}
          style={styles.navBarImgButton}
        />
      </TouchableOpacity>
    </View>
  );
}
