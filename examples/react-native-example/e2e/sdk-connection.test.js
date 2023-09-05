/* eslint-disable no-undef */
const catalogLinkConfig = require('./config.json');

const catalogLink = catalogLinkConfig.catalogLink;
console.log('catalogLink', catalogLink);

describe('React Native SDK Integration', () => {
  beforeAll(async () => {
    await device.launchApp({
      newInstance: true,
      launchArgs: {
        DTXEnableVerboseSyncSystem: 'YES',
        DTXEnableVerboseSyncResources: 'YES',
      },
    });
  });

  beforeEach(async () => {
    await device.reloadReactNative();
  });

  it('Should boot up the application', async () => {
    await expect(element(by.id('example-app-link-container'))).toBeVisible();
  });

  it('Should not display the SDK connection and stats if URL is not set', async () => {
    await expect(
      element(by.id('example-app-reports-container')),
    ).not.toBeVisible();
    await expect(element(by.id('example-app-error'))).not.toBeVisible();
    await expect(element(by.id('front-finance-component'))).not.toBeVisible();
  });

  it('Should not load SDK if no URL is provided', async () => {
    await element(by.id('example-app-link-input')).clearText();
    await element(by.id('example-app-connect-btn')).tap();
    await expect(element(by.id('front-finance-component'))).not.toBeVisible();
  });

  it('Should be able to load the SDK', async () => {
    await element(by.id('example-app-link-input')).typeText(catalogLink);
    await element(by.id('example-app-connect-btn')).tap();
    await expect(element(by.id('example-app-error'))).not.toBeVisible();
    // simulate the SDK loading time
    // await waitFor(element(by.id('front-finance-component')))
    //   .toBeVisible()
    //   .withTimeout(10000);
    // TODO: add flows to test the SDK
  });
});
