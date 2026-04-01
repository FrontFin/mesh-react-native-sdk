#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

try {
  const packageJSONExample = fs.readFileSync(
    path.join(__dirname, '../package.json'),
    'utf8',
  );

  // change '@meshconnect/react-native-link-sdk' in dependencies to local path for dist folder
  const packageJSONExampleParsed = JSON.parse(packageJSONExample);
  packageJSONExampleParsed.dependencies['@meshconnect/react-native-link-sdk'] =
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
