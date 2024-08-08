import { forwardRef, useImperativeHandle } from 'react'
import { View } from 'react-native'

export const refFunctions = {
  reload: jest.fn(),
  onMessage: jest.fn(),
  onNavigationStateChange: jest.fn()
}

export const WebView = forwardRef((_props, ref) => {
  useImperativeHandle(ref, () => refFunctions)
  return <View />
})
