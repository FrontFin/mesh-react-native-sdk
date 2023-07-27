# Front Finance React Native SDK

JS library for integrating with Front Finance.

### Install

With `npm`:

```
npm install --save @front-finance/frontfinance-rn-sdk
```

With `yarn`

```
yarn add @front-finance/frontfinance-rn-sdk
```

### Getting connection link

The connection link for brokerage connection should be obtained from the [Get catalog link](https://integration-api.getfront.com/apireference#tag/Managed-Account-Authentication/paths/~1api~1v1~1cataloglink/get) endpoint. Request must be performed from the server side because it requires the client secret. You will get the response in the following format:

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

You can use `iFrameUrl` from this response to run the `FrontFinance` component.

#### `FrontFinance` component usage

```tsx
import {
  FrontFinance,
  FrontPayload,
  TransferFinishedPayload
} from '@front-finance/frontfinance-rn-sdk'

// ...

<FrontFinance
  url={iFrameUrl}
  onBrokerConnected={(payload: FrontPayload) => {
    // use broker account data
  },
  onTransferFinished={(payload: TransferFinishedPayload) => {
    // use transfer finished data
  },
  onClose={() =>
    // use close event
  },
  onError={(err: string) =>
    // use error message
  }
/>
```

ℹ️ See full source code example at [example/App.tsx](../../example/App.tsx).

#### `FrontFinance` component arguments

| key                  | type                                                   | description                                                                          |
| -------------------- | ------------------------------------------------------ | ------------------------------------------------------------------------------------ |
| `url`                | `string`                                               | Connection link                                                                      |
| `onBrokerConnected`  | `(payload: FrontPayload) => void`                      | Callback called when users connects their accounts                                   |
| `onTransferFinished` | `(payload: TransferFinishedPayload) => void`           | Callback called when a crypto transfer is executed                                   |
| `onError`            | `(err: string) => void)                                | Called if connection not happened. Returns an error message                          |
| `onClose`            | `() => void`                                           | Called at the end of the connection, or when user closed the connection page         |

#### Using tokens

You can use broker tokens to perform requests to get current balance, assets and execute transactions. Full API reference can be found [here](https://integration-api.getfront.com/apireference).

## Typescript support

TypeScript definitions for `@front-finance/frontfinance-rn-sdk` are built into the npm package.
