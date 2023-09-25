#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

try {
  const packageJSONExample = fs.readFileSync(
    path.join(__dirname, '../../../package.json'),
    'utf8',
  );

  let packageJSONExampleParsed = JSON.parse(packageJSONExample || '{}');

  packageJSONExampleParsed.main = 'src/index.ts';
  packageJSONExampleParsed.typings = 'src/types.ts';
  packageJSONExampleParsed.module = 'src/index.ts';

  fs.writeFileSync(
    path.join(__dirname, '../../../package.json'),
    JSON.stringify(packageJSONExampleParsed, null, 2),
  );
  console.log('package.json was updated');
  process.exit(0);
} catch (error) {
  console.error('Error while updating package.json', error);
  process.exit(1);
}
