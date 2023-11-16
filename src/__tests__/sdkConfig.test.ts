import { sdkSpecs } from '../utils/sdkConfig';

const sdkType = sdkSpecs

describe('SDK Specs', () => {
  test('should return the correct SDK type', () => {
    const packageJSONContent = JSON.parse(
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      require('fs').readFileSync('package.json', 'utf8')
    );

    expect(sdkType).toEqual({
      platform: 'reactNative',
      version: packageJSONContent.version
    });
  })
})
