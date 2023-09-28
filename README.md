# Front Finance React Native SDK

### Install

With `npm`:

```
npm install --save @front-finance/frontfinance-rn-sdk
```

With `yarn`:

```
yarn add @front-finance/frontfinance-rn-sdk
```

💡 This package requires `react-native-webview` to be installed in your project. Although it is listed as direct dependency, some times it is not installed automatically (This is a known [npm issue](https://stackoverflow.com/questions/18401606/npm-doesnt-install-module-dependencies)). You should install it manually via following command in this case:
```bash
npm install --save react-native-webview@11.26.0

# or with yarn
yarn add react-native-webview@11.26.0
```


### Getting connection link

The connection link for brokerage connection should be obtained from the [Get link token](https://docs.meshconnect.com/reference/post_api-v1-linktoken) endpoint. Request must be performed from the server side because it requires the client secret. You will get the response in the following format:

You should use `url` from this response to run the `FrontFinance` component.

### Using the `FrontFinance` component

```tsx
import React from 'react';
import {
  FrontFinance,
  FrontPayload,
  TransferFinishedPayload,
  TransferFinishedSuccessPayload,
  TransferFinishedErrorPayload
} from '@front-finance/frontfinance-rn-sdk';

export const App = () => {
  return (
    <FrontFinance
      url={"YOUR_LINK_URL"}
      onBrokerConnected={(payload: FrontPayload) => {
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
      onClose={() => {
        // use close event
      }}
      onError={(err: string) => {
        // use error message
      }}
    />
  )
}

export default App;
```

ℹ️ See full source code examples at [examples/](https://github.com/FrontFin/front-b2b-link-rn/tree/main/examples).

#### `FrontFinance` component arguments

| key                  | type                                         | description                                                                  |
|----------------------|----------------------------------------------|------------------------------------------------------------------------------|
| `url`                | `string`                                     | Connection link                                                              |
| `onBrokerConnected`  | `(payload: FrontPayload) => void`            | Callback called when users connects their accounts                           |
| `onTransferFinished` | `(payload: TransferFinishedPayload) => void` | Callback called when a crypto transfer is executed                           |
| `onError`            | `(err: string) => void)`                     | Called if connection not happened. Returns an error message                  |
| `onClose`            | `() => void`                                 | Called at the end of the connection, or when user closed the connection page |


#### Using tokens

You can use broker tokens to perform requests to get current balance, assets and execute transactions. Full API reference can be found [here](https://docs.getfront.com/reference).

#### Typescript support

Typescript definitions for `@front-finance/frontfinance-rn-sdk` are built into the npm package.
