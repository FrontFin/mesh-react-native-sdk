# Mesh Connect React Native SDK
React Native library for integrating with Mesh Connect.

[![Quality Gate Status](https://sonarqube.getfront.com/api/project_badges/measure?project=FrontFin_mesh-react-native-sdk_AYtDIH_UIVHuUYros6Ac&metric=alert_status&token=sqb_b86a73cc697768102ea42befa131cc75292d194c)](https://sonarqube.getfront.com/dashboard?id=FrontFin_mesh-react-native-sdk_AYtDIH_UIVHuUYros6Ac)
[![Coverage](https://sonarqube.getfront.com/api/project_badges/measure?project=FrontFin_mesh-react-native-sdk_AYtDIH_UIVHuUYros6Ac&metric=coverage&token=sqb_b86a73cc697768102ea42befa131cc75292d194c)](https://sonarqube.getfront.com/dashboard?id=FrontFin_mesh-react-native-sdk_AYtDIH_UIVHuUYros6Ac)
[![Maintainability Rating](https://sonarqube.getfront.com/api/project_badges/measure?project=FrontFin_mesh-react-native-sdk_AYtDIH_UIVHuUYros6Ac&metric=sqale_rating&token=sqb_b86a73cc697768102ea42befa131cc75292d194c)](https://sonarqube.getfront.com/dashboard?id=FrontFin_mesh-react-native-sdk_AYtDIH_UIVHuUYros6Ac)
[![Reliability Rating](https://sonarqube.getfront.com/api/project_badges/measure?project=FrontFin_mesh-react-native-sdk_AYtDIH_UIVHuUYros6Ac&metric=reliability_rating&token=sqb_b86a73cc697768102ea42befa131cc75292d194c)](https://sonarqube.getfront.com/dashboard?id=FrontFin_mesh-react-native-sdk_AYtDIH_UIVHuUYros6Ac)
[![Security Rating](https://sonarqube.getfront.com/api/project_badges/measure?project=FrontFin_mesh-react-native-sdk_AYtDIH_UIVHuUYros6Ac&metric=security_rating&token=sqb_b86a73cc697768102ea42befa131cc75292d194c)](https://sonarqube.getfront.com/dashboard?id=FrontFin_mesh-react-native-sdk_AYtDIH_UIVHuUYros6Ac)

## Installation

With `npm`:

```
npm install --save @meshconnect/react-native-link-sdk
```

With `yarn`:

```
yarn add @meshconnect/react-native-link-sdk
```

💡 This package requires `react-native-webview` to be installed in your project. Some times it is not installed automatically (This is a known [npm issue](https://stackoverflow.com/questions/18401606/npm-doesnt-install-module-dependencies)). You should install it manually via following command in this case:
```bash
npm install --save react-native-webview

# or with yarn
yarn add react-native-webview
```

### Get Link token
Link token should be obtained from the POST /api/v1/linktoken endpoint. 
API reference for this request is available here. The request must be performed from the server side because it requires the client's secret. 
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
  TransferFinishedPayload,
  TransferFinishedSuccessPayload,
  TransferFinishedErrorPayload
} from '@meshconnect/react-native-link-sdk';

export const App = () => {
  return (
    <LinkConnect
      linkToken={"YOUR_LINKTOKEN"}
      onBrokerConnected={(payload: LinkPayload) => {
        // use broker account data
      }}
      onTransferFinished={(payload: TransferFinishedPayload) => {
        if (payload.status === 'success') {
          const successPayload = payload as TransferFinishedSuccessPayload
          // use transfer finished data
        } else {
          const errorPayload = payload as TransferFinishedErrorPayload
          // handle transfer error
        }
      }}
      onExit={(err?: string) => {
        // use error message
      }}
    />
  )
}

export default App;
```

ℹ️ See full source code examples at [examples/](https://github.com/FrontFin/mesh-react-native-sdk/tree/main/examples).

#### `LinkConnect` component arguments

| key                  | type                                            | Required/Optional                         | description                                                                   |
|----------------------|-------------------------------------------------|-------------------------------------------|-------------------------------------------------------------------------------|
| `linkToken`          | `string`                                        | required                                  | link token                                                                    |
| `onBrokerConnected`  | `(payload: LinkPayload) => void`               | optional                                  | Callback called when users connects their accounts                            |
| `onTransferFinished` | `(payload: TransferFinishedPayload) => void`    | optional                                  | Callback called when a crypto transfer is executed                            |
| `onExit`             | `(err: string) => void)`                        | optional                                  | Called if connection not happened. Returns an error message                   |


#### Typescript support
Typescript definitions for `@meshconnect/react-native-link-sdk` are built into the npm package.
