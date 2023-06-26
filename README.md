# Front Finance React Native SDK

## Install

Install with [npm](https://www.npmjs.com/):

```sh
$ npm install --save @front-finance/frontfinance-rn-sdk @front-finance/api
```

Install with [yarn](https://www.yarnpkg.com/):

```sh
$ yarn add @front-finance/frontfinance-rn-sdk @front-finance/api
```

Download the @front-finance from [GitHub](https://github.com/FrontFin).

## Usage

1. Generating Connection to Front Finance api. To open authentication link you need to call Front Api method which takes your personal client id and client secret for a successful connection.

2. Next Part is you need to call [api/v1/cataloglink](https://dashboard.getfront.com/docs/api-reference#get-/api/v1/cataloglink) this will need your unique user id (A unique Id representing the end user. Typically this will be a user Id from the client application. Personally identifiable information, such as an email address or phone number, should not be used.). So It will return a personal catalog link which you can pass to the
   Front-Finance-rn-sdk component.

3. Front-Finance-rn-sdk component is a react component which will take a url and return account details against your selected broker account for e.g. RobinHood etc...

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

## FAQ's

1. Where should i get the auth keys
[client ID and keys](https://dashboard.getfront.com/company/keys)

## Note

### You may need to install react-native-webview: "11.26.0"

## License

**MIT**
