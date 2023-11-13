import packageJson from '../../package.json';

const packageVersion = packageJson.version;
const packageName = 'RNSDK';

export const sdkSpecs = `${packageName}@${packageVersion}`;
