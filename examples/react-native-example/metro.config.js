const path = require('path');
const {getDefaultConfig, mergeConfig} = require('@react-native/metro-config');

// The SDK is linked from ../../dist (see package.json). That path lives outside
// this example's project root, so Metro must be told to watch it; otherwise
// `@meshconnect/react-native-link-sdk` resolves through the symlink but its
// files can't be read. The SDK's own deps still resolve from this app's
// node_modules.
const sdkDist = path.resolve(__dirname, '../../dist');

/**
 * Metro configuration
 * https://reactnative.dev/docs/metro
 *
 * @type {import('metro-config').MetroConfig}
 */
const config = {
  watchFolders: [sdkDist],
  resolver: {
    nodeModulesPaths: [path.resolve(__dirname, 'node_modules')],
  },
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);
