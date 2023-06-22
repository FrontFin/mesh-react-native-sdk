# Front Finance React Native SDK

## Install

Install with [npm](https://www.npmjs.com/):

```sh
$ npm install --save @front-finance/frontfinance-rn-sdk
```

**yarn**
```sh
$ yarn add @front-finance/frontfinance-rn-sdk
```
## Usage

```js
import {FrontFinance} from '@front-finance/frontfinance-rn-sdk';

export const App = () => {
    return(
        <>
          <FrontFinance
            client_id={your_client_id}
            client_secret={your_client_secret}
            userId={your_unique_userId}
            onReceive={(payload) => {
                console.log(payload)
            }}
            onError={(err) => console.log(err)}
           />
        </>
    )
}

```

## Note
### You may need to install react-native-webview: "11.26.0"

## License

**MIT**