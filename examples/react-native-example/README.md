# Mesh Connect React Native Example App

ℹ️︎ If you had old changes in `node_modules` (previous version of the library) folder, please remove it and install dependencies again.

💡If you want to get continues changes from the sdk, you can use the following command have a continues build.

```bash
  # run in a separate terminal/tab
  # make sure you are in the root of the project
  yarn build:watch
  # after running this command switch back to the example app and proceed with the steps below
```

##### npm
1. install dependencies
   `npm install`
2. For iOS only
   `npx pod-install`
3. Run the example
   `npm run start`

##### yarn

1. install dependencies
   `yarn install`
2. For iOS only
   `npx pod-install`
3. Run the example
   `yarn start`

This will bring the metro build terminal. Now you can run `Android` and `iOS` applications by pressing `a` and `i` for Android/iOS respectivily.

#### Getting connection link

The connection link should be obtained from the [Get Catalog link endpoint](https://docs.meshconnect.com/api-reference/managed-account-authentication/get-link-token-with-parameters). Use `linkToken` value from the response.
