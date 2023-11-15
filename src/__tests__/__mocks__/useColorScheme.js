// __mocks__/useColorScheme.js

import { useSyncExternalStore } from 'use-sync-external-store/shim';

export const mockedUseColorScheme = jest.fn();

export default function useColorScheme() {
  return mockedUseColorScheme();
}
