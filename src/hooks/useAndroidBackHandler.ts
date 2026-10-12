import { useEffect, useRef } from 'react';
import { BackHandler } from 'react-native';
import type { WebViewNavigation } from 'react-native-webview';

/**
 * Android hardware back / back gesture for the SDK's WebViews, matching the
 * Android SDK: step back in the WebView's history, or exit when there is
 * nothing to go back to. Only listens while `enabled` (the WebView is shown).
 *
 * Returns a handler to call from the WebView's `onNavigationStateChange`.
 */
export function useAndroidBackHandler(
  enabled: boolean,
  goBack: () => void,
  onExit: () => void
) {
  const canGoBack = useRef(false);
  const goBackRef = useRef(goBack);
  const onExitRef = useRef(onExit);
  goBackRef.current = goBack;
  onExitRef.current = onExit;

  useEffect(() => {
    if (!enabled) {
      return;
    }
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      if (canGoBack.current) {
        goBackRef.current();
      } else {
        onExitRef.current();
      }
      return true;
    });
    return () => subscription.remove();
  }, [enabled]);

  return (navState: WebViewNavigation) => {
    canGoBack.current = navState.canGoBack;
  };
}
