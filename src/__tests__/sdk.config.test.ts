import { sdkSpecs } from '../utils/sdk.config';

const sdkType = sdkSpecs

describe('SDK Specs', () => {
  let SDKVersion = '1.3.5';

  beforeAll(() => {
    const packageJSONContent = JSON.parse(
      require('fs').readFileSync('package.json', 'utf8')
    );
    SDKVersion = packageJSONContent.version;
  })

  test('should return the correct SDK type', () => {
    expect(sdkType).toBe(`RNSDK@${SDKVersion}`);
  })
})
