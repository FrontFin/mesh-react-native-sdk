#!/usr/bin/env node
// eslint-disable-next-line @typescript-eslint/no-var-requires
const fs = require('fs');

// eslint-disable-next-line @typescript-eslint/no-var-requires
const buildFolder = require('path').resolve(__dirname, '../dist');

console.log('Verifying build folder... 🧐');

if (!fs.existsSync(buildFolder)) {
  console.error('Build folder does not exist ❌');
  process.exit(1);
}

console.log('Verifying build files... 🧐');

const assetFiles = fs.readdirSync(`${buildFolder}/lib/assets`);

const requiredAssetFiles = ['chevron-left-dark', 'chevron-left-light', 'cross-1-small-dark', 'cross-1-small-light'];
const requiredAssetFilesWithVariations = requiredAssetFiles.flatMap((file) => [
  `${file}.png`,
  `${file}@2x.png`,
  `${file}@3x.png`,
]);

const missingAssetFiles = requiredAssetFilesWithVariations.filter(
    (file) => !assetFiles.includes(file),
);

if (missingAssetFiles.length) {
  console.error('Missing asset files ❌');
  console.error(missingAssetFiles.join(', '));
  process.exit(1);
}

const buildFiles = ['LICENSE.md', 'README.md', 'tsconfig.json', 'package.json'];

buildFiles.forEach((file) => {
  const filePath = `${buildFolder}/${file}`;
  if (!fs.existsSync(filePath)) {
    console.error(`Missing ${file} file ❌`);
    process.exit(1);
  }
});

const mainFiles = ['index.js', 'index.d.ts'];

mainFiles.forEach((file) => {
  const filePath = `${buildFolder}/lib/${file}`;
  if (!fs.existsSync(filePath)) {
    console.error(`Missing lib/${file} file ❌`);
    process.exit(1);
  }
});

const hooksFiles = [
  'useSDKCallbacks.js',
  'useSDKCallbacks.d.ts',
]

hooksFiles.forEach((file) => {
  const filePath = `${buildFolder}/lib/hooks/${file}`;
  if (!fs.existsSync(filePath)) {
    console.error(`Missing hooks/${file} file ❌`);
    process.exit(1);
  }
});

const componentsFiles = [
  'LinkConnect.js',
  'LinkConnect.d.ts',
  'NavBar.js',
  'NavBar.d.ts',
  'SDKContainer.js',
  'SDKContainer.d.ts',
  'SDKContainer.styled.js',
  'SDKContainer.styled.d.ts',
  'SDKViewContainer.js',
  'SDKViewContainer.d.ts'
];

componentsFiles.forEach((file) => {
  const filePath = `${buildFolder}/lib/components/${file}`;
  if (!fs.existsSync(filePath)) {
    console.error(`Missing components/${file} file ❌`);
    process.exit(1);
  }
});

const types = [
  'index.js',
  'index.d.ts',
];

types.forEach((file) => {
  const filePath = `${buildFolder}/lib/types/${file}`;
  if (!fs.existsSync(filePath)) {
    console.error(`Missing types/${file} file ❌`);
    process.exit(1);
  }
});

const utils = [
  'index.js',
  'index.d.ts',
  'base64.js',
  'base64.d.ts',
  'isUrl.js',
  'isUrl.d.ts',
  'sdkConfig.js',
  'sdkConfig.d.ts'
];

utils.forEach((file) => {
  const filePath = `${buildFolder}/lib/utils/${file}`;
  if (!fs.existsSync(filePath)) {
    console.error(`Missing utils/${file} file ❌`);
    process.exit(1);
  }
});

console.log('Build verified ✅');

process.exit(0);
