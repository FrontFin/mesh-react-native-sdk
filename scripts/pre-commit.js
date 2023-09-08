#!/usr/bin/env node

/* eslint-disable @typescript-eslint/no-var-requires */
const fs = require('fs');
const path = require('path');
const child = require('child_process');

try {
  const packageJSONExample = fs.readFileSync(
      path.join(__dirname, '../examples/react-native-example/package.json'),
      'utf8',
  );
  const packageJSONSDK = fs.readFileSync(
      path.join(__dirname, '../package.json'),
      'utf8',
  );

  const sdkPackageVersion = JSON.parse(packageJSONSDK).version || '0.0.0';
  const packageVersion = JSON.parse(packageJSONExample).version || '0.0.0';

  if (packageVersion !== sdkPackageVersion) {
    console.log(
        'Example package version is not in sync with SDK package version',
    );
    console.log(`Example package version: ${packageVersion}`);
    console.log(`SDK package version: ${sdkPackageVersion}`);
    console.log('Updating example package version to SDK package version...');
    fs.writeFileSync(
        path.join(__dirname, '../examples/react-native-example/package.json'),
        JSON.stringify(
            {
              ...JSON.parse(packageJSONExample),
              version: sdkPackageVersion,
            },
            null,
            2,
        ),
    );

    // add modified files to git
    child.execSync('git add package.json', { cwd: path.join(__dirname, '../examples/react-native-example') });
  } else {
    console.log('Example package version is in sync with SDK package version');
  }
  process.exit(0);
} catch (error) {
  console.error('Error while updating example package version', error);
  process.exit(1);
}
