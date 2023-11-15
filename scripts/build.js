#!/usr/bin/env node
// eslint-disable-next-line @typescript-eslint/no-var-requires
const fs = require('fs');

const rawData = fs.readFileSync('package.json', 'utf8');
const packageModel = JSON.parse(rawData);

delete packageModel.scripts;
delete packageModel.devDependencies;
delete packageModel.husky;
delete packageModel.publishConfig;
delete packageModel.packageManager;
delete packageModel.prettier;

fs.writeFileSync('dist/package.json', JSON.stringify(packageModel, null, 2));
console.log('package.json.dist was copied to ./dist folder');

fs.copyFileSync('LICENSE.md', 'dist/LICENSE.md');
console.log('LICENSE.md was copied to dist/LICENSE.md');

fs.copyFileSync('README.md', 'dist/README.md');
console.log('README.md was copied to dist/README.md');

fs.copyFileSync('tsconfig.json', 'dist/tsconfig.json');
console.log('tsconfig.json was copied to dist/tsconfig.json');

fs.cpSync('src/assets', 'dist/assets', { recursive: true });
console.log('assets were copied to dist/assets');

if (fs.existsSync('dist/src')) {
// move all files and folders from dist/src to dist
  fs.cpSync('dist/src', 'dist', { recursive: true });
  console.log('src files were copied to dist');

  fs.rmdirSync('dist/src', { recursive: true });
  console.log('src folder was removed from dist');
}
