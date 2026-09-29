import { useEffect, useRef } from 'react';
import { AppState } from 'react-native';
import type { AppStateStatus } from 'react-native';
import type { WebView } from 'react-native-webview';

/**
 * Shared render-process-death recovery for the SDK's WebViews. A dead renderer
 * (e.g. Android reclaiming memory while the app is backgrounded during an
 * external hand-off) would otherwise leave the flow stuck on a blank WebView;
 * this recovers it. Generic WebView plumbing — no Mesh-API coupling — so both
 * the primary (`LinkConnect`) and backup (`LinkConnectBackup`) paths use it.
 *
 * `resetKey` (the loaded URL) resets the once-only auto-reload guard whenever the
 * WebView navigates to a new session.
 *
 * Returns the `webViewRef` to attach, the `hasAutoReloaded` guard (read/set by
 * the caller's onError/onHttpError handlers), and `recoverFromRendererDeath` for
 * the onRenderProcessGone / onContentProcessDidTerminate handlers.
 */
export function useWebViewRecovery(resetKey: unknown) {
  const webViewRef = useRef<WebView>(null);
  const hasAutoReloaded = useRef(false);
  // Set when the WebView render process dies (e.g. Android reclaims memory while
  // the app is backgrounded). Used to recover the dead WebView on foreground.
  const rendererGone = useRef(false);

  useEffect(() => {
    hasAutoReloaded.current = false;
  }, [resetKey]);

  // Recover a dead WebView on foreground return. If the render process was
  // killed while backgrounded, reload once when the user comes back so the flow
  // isn't stuck on a blank WebView with the in-progress session silently lost.
  // Only clear the flag once a reload can actually run (ref mounted), so a
  // not-yet-mounted WebView on the first foreground tick doesn't drop recovery.
  useEffect(() => {
    const handler = (state: AppStateStatus) => {
      if (state === 'active' && rendererGone.current && webViewRef.current) {
        rendererGone.current = false;
        webViewRef.current.reload();
      }
    };
    const sub = AppState.addEventListener('change', handler);
    // RN >=0.65 returns a subscription with remove(); older RN (the peer dep
    // allows >=0.60) returns void and needs the static removeEventListener.
    return () => {
      if (typeof sub?.remove === 'function') {
        sub.remove();
      } else {
        (
          AppState as unknown as {
            removeEventListener?: (
              type: 'change',
              h: (state: AppStateStatus) => void
            ) => void;
          }
        ).removeEventListener?.('change', handler);
      }
    };
  }, []);

  // Foregrounded: reload now. Backgrounded: a reload issued now may not take, so
  // flag it and let the AppState 'active' listener recover on return. We do not
  // flag after a foreground reload, so an unrelated later foreground does not
  // fire a spurious reload that would restart the session.
  const recoverFromRendererDeath = () => {
    if (AppState.currentState === 'active') {
      if (!hasAutoReloaded.current) {
        hasAutoReloaded.current = true;
        webViewRef.current?.reload();
      }
    } else {
      rendererGone.current = true;
    }
  };

  return { webViewRef, hasAutoReloaded, recoverFromRendererDeath };
}
