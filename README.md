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

### Getting connection link

The connection link for brokerage connection should be obtained from the [Get catalog link](https://docs.getfront.com/reference/get_api-v1-cataloglink) endpoint. Request must be performed from the server side because it requires the client secret. You will get the response in the following format:

```json
{
  "content": {
    "url": "https://web.getfront.com/broker-connect?auth_code={authCode}",
    "iFrameUrl": "https://web.getfront.com/b2b-iframe/{clientId}/broker-connect?auth_code={authCode}"
  },
  "status": "ok",
  "message": ""
}
```

You should use `url` from this response to run the `FrontFinance` component.

### Using the `FrontFinance` component

```tsx
import {
  FrontFinance,
  FrontPayload,
  TransferFinishedPayload
} from '@front-finance/frontfinance-rn-sdk';

// ...

<FrontFinance
  url={url}
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
```

ℹ️ See full source code examples at [examples/](https://github.com/FrontFin/front-b2b-link-rn/tree/main/examples).

#### `FrontFinance` component arguments

| key                  | type                                         | description                                                                  |
|----------------------|----------------------------------------------|------------------------------------------------------------------------------|
| `url`                | `string`                                     | Connection link                                                              |
| `onBrokerConnected`  | `(payload: FrontPayload) => void`            | Callback called when users connects their accounts                           |
| `onTransferFinished` | `(payload: TransferFinishedPayload) => void` | Callback called when a crypto transfer is executed                           |
| `onError`            | `(err: string) => void)                      | Called if connection not happened. Returns an error message                  |
| `onClose`            | `() => void`                                 | Called at the end of the connection, or when user closed the connection page |


#### Using tokens

You can use broker tokens to perform requests to get current balance, assets and execute transactions. Full API reference can be found [here](https://docs.getfront.com/reference).

#### Typescript support

Typescript definitions for `@front-finance/frontfinance-rn-sdk` are built into the npm package.
