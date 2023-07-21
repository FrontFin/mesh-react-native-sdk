import Config from 'react-native-config'

export const clientId = Config.REACT_APP_CLIENT_ID
// added only for example, please do not add your secrects to the frontend code
export const clientSecret = Config.REACT_APP_CLIENT_SECRET
export const frontApiUrl = Config.REACT_APP_FRONT_API_URL
export const test_data = {
  ToAddresses: [
    {
      NetworkId: 'e3c7fdd8-b1fc-4e51-85ae-bb276e075611',
      Symbol: 'ETH',
      Address: '0x9Bf6207f8A3f4278E0C989527015deFe10e5D7c6'
    },
    {
      NetworkId: 'e3c7fdd8-b1fc-4e51-85ae-bb276e075611',
      Symbol: 'USDC',
      Address: '0x9Bf6207f8A3f4278E0C989527015deFe10e5D7c6'
    },
    {
      NetworkId: '7436e9d0-ba42-4d2b-b4c0-8e4e606b2c12',
      Symbol: 'USDC',
      Address: '0x9Bf6207f8A3f4278E0C989527015deFe10e5D7c6'
    },
    {
      networkId: '7436e9d0-ba42-4d2b-b4c0-8e4e606b2c12',
      symbol: 'MATIC',
      address: '0x9Bf6207f8A3f4278E0C989527015deFe10e5D7c6'
    }
  ]
}
