# Mesh Connect React Native SDK

React Native library for integrating with Mesh Connect.

[![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=FrontFin_mesh-react-native-sdk&metric=alert_status)](https://sonarcloud.io/project/overview?id=FrontFin_mesh-react-native-sdk)
[![Coverage](https://sonarcloud.io/api/project_badges/measure?project=FrontFin_mesh-react-native-sdk&metric=coverage)](https://sonarcloud.io/project/overview?id=FrontFin_mesh-react-native-sdk)
[![Maintainability Rating](https://sonarcloud.io/api/project_badges/measure?project=FrontFin_mesh-react-native-sdk&metric=sqale_rating)](https://sonarcloud.io/project/overview?id=FrontFin_mesh-react-native-sdk)
[![Reliability Rating](https://sonarcloud.io/api/project_badges/measure?project=FrontFin_mesh-react-native-sdk&metric=reliability_rating)](https://sonarcloud.io/project/overview?id=FrontFin_mesh-react-native-sdk)
[![Security Rating](https://sonarcloud.io/api/project_badges/measure?project=FrontFin_mesh-react-native-sdk&metric=security_rating)](https://sonarcloud.io/project/overview?id=FrontFin_mesh-react-native-sdk)

## Installation

With `npm`:

```
npm install --save @meshconnect/react-native-link-sdk
```

With `yarn`:

```
yarn add @meshconnect/react-native-link-sdk
```

💡 This package requires `react-native-webview` to be installed in your project.

With `npm`:

```
npm install --save react-native-webview
```

With `yarn`:

```
yarn add react-native-webview
```

### Get Link token

Link token should be obtained from the POST /api/v1/linktoken endpoint.
API reference for this request is available [here](https://docs.meshconnect.com/reference/post_api-v1-linktoken). The request must be performed from the server side because it requires the client's secret.
You will get the response in the following format:

```json
{
  "content": {
    "linkToken": "{linkToken}"
  },
  "status": "ok",
  "message": ""
}
```

## Launch Link

```tsx
import React from 'react';
import {
  LinkConnect,
  LinkPayload,
  LinkSettings,
  LinkEventType,
  IntegrationAccessToken,
  TransferFinishedPayload,
  TransferFinishedSuccessPayload,
  TransferFinishedErrorPayload,
} from '@meshconnect/react-native-link-sdk';

const accessTokens: IntegrationAccessToken = [
  /* Your access tokens */
];

const linkSettings: LinkSettings = {
  accessTokens,
  language: 'en',
  displayFiatCurrency: 'USD',
  theme: 'system',
};

export const App = () => {
  return (
    <LinkConnect
      linkToken={'YOUR_LINKTOKEN'}
      settings={linkSettings}
      onIntegrationConnected={(payload: LinkPayload) => {
        // use broker account data
      }}
      onTransferFinished={(payload: TransferFinishedPayload) => {
        if (payload.status === 'success') {
          const successPayload = payload as TransferFinishedSuccessPayload;
          // use transfer finished data
        } else {
          const errorPayload = payload as TransferFinishedErrorPayload;
          // handle transfer error
        }
      }}
      onEvent={(event: LinkEventType) => {
        console.log(event);
      }}
      onExit={(err?: string) => {
        // use error message
      }}
    />
  );
};

export default App;
```

ℹ️ See full source code examples on [App.tsx](https://github.com/FrontFin/mesh-react-native-sdk/blob/main/examples/react-native-example/App.tsx).

#### `LinkConnect` component arguments

| key                      | type                                         | Required/Optional | description                                                 |
| ------------------------ | -------------------------------------------- | ----------------- | ----------------------------------------------------------- |
| `linkToken`              | `string`                                     | required          | Link token                                                  |
| `settings`               | `LinkSettings`                               | optional          | Settings object                                             |
| `disableDomainWhiteList` | `boolean`                                    | optional          | Disable origin whitelisting[1]                              |
| `onIntegrationConnected` | `(payload: LinkPayload) => void`             | optional          | Callback called when users connects their accounts          |
| `onTransferFinished`     | `(payload: TransferFinishedPayload) => void` | optional          | Callback called when a crypto transfer is executed          |
| `onExit`                 | `(err: string) => void)`                     | optional          | Called if connection not happened. Returns an error message |
| `onEvent`                | `(event: LinkEventType) => void`             | optional          | Callback called when an event is triggered                  |

The `LinkSettings` option allows to configure the Link behaviour:

- `language` - Link UI language.
- `displayFiatCurrency` - a preferred display fiat currency
- `theme` - Link UI colour theme. Accepts: 'light', 'dark', 'system'.
- `accessTokens` - an array of `IntegrationAccessToken` objects that is used as an origin for crypto transfer flow.
- `disableDomainWhiteList` - a boolean flag that allows to disable origin whitelisting. By default, the origin is whitelisted, with the following domains set:
  - `*.meshconnect.com`
  - `*.getfront.com`
  - `*.walletconnect.com`
  - `*.walletconnect.org`
  - `*.walletlink.org`
  - `*.coinbase.com`
  - `*.okx.com`
  - `*.gemini.com`
  - `*.coinbase.com`
  - `*.hcaptcha.com`
  - `*.robinhood.com`
  - `*.google.com`
  - `https://meshconnect.com`
  - `https://getfront.com`
  - `https://walletconnect.com`
  - `https://walletconnect.org`
  - `https://walletlink.org`
  - `https://coinbase.com`
  - `https://okx.com`
  - `https://gemini.com`
  - `https://coinbase.com`
  - `https://hcaptcha.com`
  - `https://robinhood.com`
  - `https://google.com`
  - `https://front-web-platform-dev`
  - `https://front-b2b-api-test.azurewebsites.net`
  - `https://web.getfront.com`
  - `https://web.meshconnect.com`
  - `https://applink.robinhood.com`
  - `https://m.stripe.network`
  - `https://js.stripe.com`
  - `https://app.usercentrics.eu`
  - `robinhood://`

## V1 -> V2 migration guide

In Mesh Connect React Native SDK v2, `url` prop is removed from `LinkConnect` component. You should use `linkToken` prop instead of `url` prop.
`orError` and `onClose` props are combined with `onExit` callback with an optional error message argument.

Following are the renamed props:

- `onBrokerConnected` -> `onIntegrationConnected`
- `FrontPayload` -> `LinkPayload`

The component `FrontFinance` is renamed to `LinkConnect`.

#### Typescript support

Typescript definitions for `@meshconnect/react-native-link-sdk` are built into the npm package.

## Adding URL Schemes to Info.plist

To enable our SDK to interact with specific apps, please add the following URL schemes to your Info.plist file:

1. Open your Info.plist file: This file is located in the ios directory of your React Native project.
2. Add the following XML snippet within the `<dict>` tags (example for adding trust, robinhood, and metamask):
   ```
   <key>LSApplicationQueriesSchemes</key>
    <array>
        <string>trust</string>
        <string>robinhood</string>
        <string>metamask</string>
    </array>
   ```
   This configuration allows our SDK to query and interact with the specified apps, ensuring seamless integration and functionality.
