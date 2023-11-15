import packageJson from '../../package.json';

const version = packageJson.version;
const platform = 'reactNative';

export const sdkSpecs = {
  platform,
  version,
};
