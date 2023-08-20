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

console.log('Build folder exists ✅');

const files = fs.readdirSync(buildFolder);

console.log('Verifying build files... 🧐');

const requiredFiles = [
  'Front.d.ts',
  'Front.js',
  'index.js',
  'index.d.ts',
  'LICENSE.md',
  'package.json',
  'README.md',
  'types.d.ts',
];

const missingFiles = requiredFiles.filter((file) => !files.includes(file));

if (missingFiles.length) {
  console.error('Missing build files ❌');
  console.error(missingFiles.join(', '));
  process.exit(1);
}

console.log('All build files exist ✅');

console.log('Verifying asset files ... 🧐');

if (!fs.existsSync(`${buildFolder}/assets`)) {
  console.error('Assets folder does not exist ❌');
  process.exit(1);
}

const assetFiles = fs.readdirSync(`${buildFolder}/assets`);

const requiredAssetFiles = ['ic_back', 'ic_close', 'front_logo'];
const requiredAssetFilesWithVariations = requiredAssetFiles.flatMap((file) => [
  `${file}.png`,
  `${file}@2x.png`,
  `${file}@3x.png`,
]);

const missingAssetFiles = requiredAssetFilesWithVariations.filter(
  (file) => !assetFiles.includes(file)
);

if (missingAssetFiles.length) {
  console.error('Missing asset files ❌');
  console.error(missingAssetFiles.join(', '));
  process.exit(1);
}

console.log('All asset files exist ✅');

console.log('Build verified ✅');

process.exit(0);
