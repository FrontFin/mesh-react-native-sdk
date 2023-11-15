#!/usr/bin/env node

/* eslint-disable @typescript-eslint/no-var-requires */
const fs = require('fs');
const path = require('path');
const child = require('child_process');

// check if webview is installed in node_modules, if not install it
const webviewLibPath = path.join(__dirname, '../node_modules/react-native-webview');
const webviewModulePath = path.join(__dirname, '../react-native-webview');

if (!fs.existsSync(webviewLibPath) && !fs.existsSync(webviewModulePath)) {
  try {
    console.log('react-native-webview is not installed, installing it...');
    child.execSync('yarn add react-native-webview',
      { cwd: path.join(__dirname, '..') });
    console.log('react-native-webview installed successfully');
  } catch (error) {
    console.error('Error while installing react-native-webview', error);
    process.exit(1);
  }
}
