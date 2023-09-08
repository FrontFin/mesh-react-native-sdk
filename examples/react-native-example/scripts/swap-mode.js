#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

try {
  const packageJSONExample = fs.readFileSync(
    path.join(__dirname, '../package.json'),
    'utf8',
  );

  // change '@front-finance/frontfinance-rn-sdk' in dependencies to local path for dist folder
  const packageJSONExampleParsed = JSON.parse(packageJSONExample);
  packageJSONExampleParsed.dependencies['@front-finance/frontfinance-rn-sdk'] =
    '../../dist';

  fs.writeFileSync(
    path.join(__dirname, '../package.json'),
    JSON.stringify(packageJSONExampleParsed, null, 2),
  );
  console.log('Example package.json was updated');
  process.exit(0);
} catch (error) {
  console.error('Error while updating example package.json', error);
  process.exit(1);
}
