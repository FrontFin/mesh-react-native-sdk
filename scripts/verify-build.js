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

if (!fs.existsSync(`${buildFolder}/assets`)) {
  console.error('Assets folder does not exist ❌');
  process.exit(1);
}

const assetFiles = fs.readdirSync(`${buildFolder}/assets`);

const requiredAssetFiles = ['ic_back', 'ic_close'];
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

const buildFiles = ['index.js', 'index.d.ts', 'LICENSE.md', 'README.md', 'tsconfig.json', 'package.json'];

buildFiles.map((file) => {
  const filePath = `${buildFolder}/${file}`;
  if (!fs.existsSync(filePath)) {
    console.error(`Missing ${file} file ❌`);
    process.exit(1);
  }
});

const hooksFiles = [
  'useSDKCallbacks.js',
  'useSDKCallbacks.d.ts',
]

hooksFiles.map((file) => {
  const filePath = `${buildFolder}/hooks/${file}`;
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
];

componentsFiles.map((file) => {
  const filePath = `${buildFolder}/components/${file}`;
  if (!fs.existsSync(filePath)) {
    console.error(`Missing components/${file} file ❌`);
    process.exit(1);
  }
});

const types = [
  'index.js',
  'index.d.ts',
];

types.map((file) => {
  const filePath = `${buildFolder}/types/${file}`;
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
];

utils.map((file) => {
  const filePath = `${buildFolder}/utils/${file}`;
  if (!fs.existsSync(filePath)) {
    console.error(`Missing utils/${file} file ❌`);
    process.exit(1);
  }
});

console.log('Build verified ✅');

process.exit(0);
