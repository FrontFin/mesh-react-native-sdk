#!/usr/bin/env node
import fs from 'fs'

const rawData = fs.readFileSync('package.json', 'utf8');
const packageModel = JSON.parse(rawData);

delete packageModel.scripts;
delete packageModel.publishConfig;
delete packageModel.packageManager;
delete packageModel.prettier;
delete packageModel.release;
delete packageModel.plugins;

packageModel.exports = './index.js'
packageModel.module = './index.js'
packageModel.main = './index.js'
packageModel.types = './index.d.ts'

fs.writeFileSync('dist/package.json', JSON.stringify(packageModel, null, 2));
console.log('package.json.dist was copied to ./dist folder');

fs.copyFileSync('LICENSE.md', 'dist/LICENSE.md');
console.log('LICENSE.md was copied to dist/LICENSE.md');

fs.copyFileSync('README.md', 'dist/README.md');
console.log('README.md was copied to dist/README.md');

fs.cpSync('src/assets', 'dist/assets', { recursive: true });
console.log('assets were copied to dist/assets');

fs.copyFileSync('.npmignore', 'dist/.npmignore');
console.log('.npmignore was copied to dist/.npmignore');

fs.copyFileSync('.npmrc', 'dist/.npmrc');
console.log('.npmrc was copied to dist/.npmrc');

// remove the test folder
fs.rmSync('dist/__tests__', { recursive: true });
console.log('test folder was removed from dist');
