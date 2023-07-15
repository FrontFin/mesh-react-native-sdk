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

For Expo-CLI run

```sh
$ npx expo start
```

For react-native cli run

ios only:

```sh
$ pod install
```

then run ios

```sh
npx react-native run-ios
```

for android

```sh
npx react-native run-android
```

Download the @front-finance from [GitHub](https://github.com/FrontFin).

## Usage

1. Generating Connection to Front Finance api. To open authentication link you need to call Front Api post method which calls b2bCatalog, which takes your personal client id and client secret for a successful connection and calls [api/v1/cataloglink](https://dashboard.getfront.com/docs/api-reference#get-/api/v1/cataloglink) this will need your unique user id (A unique Id representing the end user. Typically this will be a user Id from the client application. Personally identifiable information, such as an email address or phone number, should not be used.). So It will return a personal catalog link which you can pass to the Front-Finance-rn-sdk component.

2. Front-Finance-rn-sdk component is a react component which will take a url and return account details against your selected broker account for e.g. RobinHood etc...

```js
import React, { useEffect, useState } from "react";
import { FrontFinance, b2bCatalog } from "@front-finance/frontfinance-rn-sdk";
import axios from 'axios'

export const App = () => {
  const [url, setUrl] = useState();

  useEffect(() => {
    const getUrl = async () => {
      try {
        const response = await axios.post(
          `https://front-b2b-api-test.azurewebsites.net/api/v1/cataloglink?userId=${user_id}&enableTransfers=true`,
          data, //you can provide your account addresses
          {
            headers: {
              "X-Client-Id": client_id,
              "X-Client-Secret": client_secret,
              "Content-Type": "application/json",
            },
          }
        );
        setURL(response.data.content.url);
      } catch (error) {
        throw error;
      }
    };
  }, []);

  return (
    <>
      <FrontFinance
        url={url}
        onReceive={(payload) => {
          console.log(payload);
        }}
        onError={(err) => console.log(err)}
      />
    </>
  );
};

export default App;
```

## FAQ's

1. Where should i get the auth keys
   [client ID and keys](https://dashboard.getfront.com/company/keys)

## Note

### You may need to install react-native-webview: "11.26.0"

## License

**MIT**
