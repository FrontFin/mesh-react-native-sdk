#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import child from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url); // get the resolved path to the file
const __dirname = path.dirname(__filename); // get the name of the directory that the file is in

const RN_EXAMPLE_PATH_STR = '../../../examples/react-native-example/package.json';

try {
  const packageJSONExample = fs.readFileSync(
      path.join(__dirname, RN_EXAMPLE_PATH_STR),
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
        path.join(__dirname, RN_EXAMPLE_PATH_STR),
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
    child.execSync('git add package.json', { cwd: path.join(__dirname, RN_EXAMPLE_PATH_STR) });
  } else {
    console.log('Example package version is in sync with SDK package version');
  }
  process.exit(0);
} catch (error) {
  console.error('Error while updating example package version', error);
  process.exit(1);
}
