/* eslint-disable no-undef */
const catalogLink = process.env.catalogLink;
describe('React Native SDK Integration', () => {
  beforeAll(async () => {
    await device.launchApp();
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

  it.skip('Should be able to load the SDK', async () => {
    await element(by.id('example-app-link-input')).typeText(catalogLink);
    await element(by.id('example-app-connect-btn')).tap();
    await expect(element(by.id('example-app-error'))).not.toBeVisible();
    await waitFor(element(by.id('front-finance-component')))
      .toBeVisible()
      .withTimeout(10000);
  });

  it('Should not load SDK if no URL is provided', async () => {
    await element(by.id('example-app-link-input')).clearText();
    await element(by.id('example-app-connect-btn')).tap();
    await expect(element(by.id('front-finance-component'))).not.toBeVisible();
  });
});
