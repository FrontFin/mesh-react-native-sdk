#!/usr/bin/env node
// eslint-disable-next-line @typescript-eslint/no-var-requires
const fs = require('fs');

const rawData = fs.readFileSync('package.json', 'utf8');
const packageModel = JSON.parse(rawData);

delete packageModel.scripts;
delete packageModel.husky;
delete packageModel.publishConfig;
delete packageModel.packageManager;
delete packageModel.prettier;
delete packageModel.release;
delete packageModel.plugins;

packageModel.main = 'lib/index.js';
packageModel.typings = 'lib/index.d.ts';
packageModel.module = 'lib/index.js';

fs.writeFileSync('dist/package.json', JSON.stringify(packageModel, null, 2));
console.log('package.json.dist was copied to ./dist folder');

fs.copyFileSync('LICENSE.md', 'dist/LICENSE.md');
console.log('LICENSE.md was copied to dist/LICENSE.md');

fs.copyFileSync('README.md', 'dist/README.md');
console.log('README.md was copied to dist/README.md');

fs.copyFileSync('tsconfig.json', 'dist/tsconfig.json');
console.log('tsconfig.json was copied to dist/tsconfig.json');

if (!fs.existsSync('dist/lib')) {
  fs.mkdirSync('dist/lib');
}

fs.cpSync('src/assets', 'dist/lib/assets', { recursive: true });
console.log('assets were copied to dist/lib/assets');

// move all files and folders from dist/src to dist/lib
fs.cpSync('dist/src', 'dist/lib', { recursive: true });
console.log('src files were copied to lib folder');

fs.rmdirSync('dist/src', { recursive: true });
console.log('src folder was removed from dist');

fs.copyFileSync('.npmignore', 'dist/.npmignore');
console.log('.npmignore was copied to dist/.npmignore');

fs.copyFileSync('.npmrc', 'dist/.npmrc');
