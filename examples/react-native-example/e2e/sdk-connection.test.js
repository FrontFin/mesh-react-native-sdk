/* eslint-disable no-undef */

// The CDC-lookalike backup demo (OR-453) mints link tokens from a backend rather
// than taking a pasted token, so these checks cover the home screen the presenter
// starts from: the deposit CTA and the outage toggle, with no error/reports until
// a flow runs. Driving a full connect needs the mock backend + a device, so that
// is exercised by the scripted walkthrough (CDC-DEMO.md), not here.
describe('React Native SDK Example — home screen', () => {
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
    await expect(element(by.id('example-app-connect-btn'))).toBeVisible();
  });

  it('Should show the simulate-outage toggle', async () => {
    await expect(element(by.id('example-app-outage-toggle'))).toBeVisible();
    await expect(element(by.id('example-app-outage-switch'))).toBeVisible();
  });

  it('Should not display reports or errors before a deposit is attempted', async () => {
    await expect(
      element(by.id('example-app-reports-container')),
    ).not.toBeVisible();
    await expect(element(by.id('example-app-error'))).not.toBeVisible();
    await expect(element(by.id('front-finance-component'))).not.toBeVisible();
  });
});
