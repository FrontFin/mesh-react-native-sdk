const path = require('path');
const {getDefaultConfig, mergeConfig} = require('@react-native/metro-config');

/**
 * Metro configuration
 * https://reactnative.dev/docs/metro
 *
 * watchFolders – tell Metro to monitor ../dist so that files under
 * dist/lib/ can be read and transformed even though they live outside
 * the default project root (example/).
 *
 * resolver.nodeModulesPaths – restrict module resolution to a single
 * node_modules tree so that react / react-native always resolve to the
 * copy installed in example/node_modules, preventing duplicate-React
 * errors caused by the root node_modules/ copy.
 *
 * @type {import('@react-native/metro-config').MetroConfig}
 */

const distDir = path.resolve(__dirname, '..', 'dist');
const nodeModules = path.resolve(__dirname, 'node_modules');

const config = {
  watchFolders: [distDir],

  resolver: {
    nodeModulesPaths: [nodeModules],
  },
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);
