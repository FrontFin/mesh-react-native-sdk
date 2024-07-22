# Mesh Connect React Native Example App

ℹ️︎ If you had old changes in `node_modules` (previous version of the library) folder, please remove it and install dependencies again.

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

The connection link should be obtained from the [Get Catalog link endpoint](https://integration-api.getfront.com/apireference#tag/Managed-Account-Authentication/paths/~1api~1v1~1linktoken/post). Use `linkToken` value from the response.
