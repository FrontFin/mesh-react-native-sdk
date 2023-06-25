# Front Finance React Native SDK

## Install

Install with [npm](https://www.npmjs.com/):

```sh
$ npm install --save @front-finance/frontfinance-rn-sdk @front-finance/api
```

**yarn**

```sh
$ yarn add @front-finance/frontfinance-rn-sdk @front-finance/api
```

## Usage

```js
import React, {useEffect} from 'react'
import {FrontFinance} from '@front-finance/frontfinance-rn-sdk';
import { FrontApi } from "@front-finance/api";

export const App = () => {

    const [url,setUrl] = useState()

    useEffect(() => {
        const api = new FrontApi({
      baseURL: "https://integration-api.getfront.com",
      headers: {
        "x-client-id": "your get front client_id",
        "x-client-secret": "your get front client_secret",
      },
    });
    // this request should be performed from the backend side
    const response = await api.managedAccountAuthentication.v1CataloglinkList({
      // callbackUrl: window.location.href // insert your callback URL here
      userId: "your unique user_id",
    });

    const data = response.data;
    setUrl(data.content.url)
    })

    return(
        <>
          <FrontFinance
            url={url}
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
