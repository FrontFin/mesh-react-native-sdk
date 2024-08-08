/**
 * Metro configuration for React Native
 * https://github.com/facebook/react-native
 *
 * @format
 */

import {getDefaultConfig, mergeConfig} from '@react-native/metro-config';
import {resolve} from 'path';

const defaultConfig = getDefaultConfig(__dirname);

const {
  resolver: {sourceExts, assetExts},
} = getDefaultConfig(__dirname);

const config = {
  transformer: {
    getTransformOptions: async () => ({
      transform: {
        experimentalImportSupport: false,
        inlineRequires: true,
      },
    }),
    babelTransformerPath: require.resolve('react-native-svg-transformer'),
  },
  resolver: {
    extraNodeModules: {
      '@meshconnect/react-native-link-sdk': resolve(
        __dirname,
        '../../packages/link',
      ),
    },
    assetExts: assetExts.filter(ext => ext !== 'svg'),
    sourceExts: [...sourceExts, 'svg'],
  },
  watchFolders: [
    resolve(__dirname, '../../packages/link'),
    ...defaultConfig.watchFolders,
  ],
};

export default mergeConfig(defaultConfig, config);
