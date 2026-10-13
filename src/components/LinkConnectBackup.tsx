import { Image, TouchableOpacity, View } from 'react-native';
import { WebView } from 'react-native-webview';
import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';

import { SDKContainer } from './SDKContainer';
import { SDKViewContainer } from './SDKViewContainer';

import type {
  LinkConnectBackupConfiguration,
  MeshBackupJitStatusResult,
} from '../types';
import { useBackupCallbacks } from '../hooks/useBackupCallbacks';
import { useWebViewRecovery } from '../hooks/useWebViewRecovery';
import { useBackupTier } from '../hooks/useBackupTier';
import type { BackupTierFallbackReason } from '../hooks/useBackupTier';
import { sdkSpecs } from '../utils/sdkConfig';
import { extractOrigin, toInjectableJson } from '../utils';
import { OFFLINE_WIDGET_HTML, withWidgetTheme } from '../backup-bundle';
import {
  BACKUP_CONFIG_MESSAGE_TYPE,
  BACKUP_JIT_RESPONSE_MESSAGE_TYPE,
  DARK_THEME_COLOR_BOTTOM,
  DEFAULT_BACKUP_WIDGET_ORIGIN,
  LIGHT_THEME_COLOR_BOTTOM,
} from '../constant';

/** Best-effort message from an unknown thrown value, for JIT failure reporting. */
const errorMessage = (e: unknown): string =>
  e instanceof Error ? e.message : typeof e === 'string' ? e : 'JIT callback failed';

/**
 * Identity of one mounted WebView document. Created once per mount (a render
 * that React abandons never mounts, so its token is simply discarded) and
 * compared by reference, so it is never reused — not even when the host cycles
 * settings A → B → A, where the second A is a fresh mount with a fresh token.
 */
type DocumentToken = { readonly source: string };

/**
 * Mount boundary for one WebView document. Keyed by the document source, so a
 * source change (tier transition, origin/theme/language change, recovery
 * reload) remounts it with a new token. The token becomes the active document
 * in the commit phase (layout effect), never during render, so an interrupted
 * or abandoned concurrent render cannot invalidate the committed document.
 */
const DocumentScope = ({
  source,
  onActivate,
  children,
}: {
  source: string;
  onActivate: (token: DocumentToken) => void;
  children: (token: DocumentToken) => React.ReactElement;
}) => {
  const [token] = useState<DocumentToken>(() => ({ source }));
  useLayoutEffect(() => {
    onActivate(token);
    // Activate once per mount; onActivate only writes the parent's refs/state.
  }, [token]);
  return children(token);
};

const LoadingComponentWebview = ({ darkTheme }: { darkTheme: boolean }) => {
  return (
    <View
      style={{
        position: 'absolute',
        zIndex: 10,
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: darkTheme
          ? DARK_THEME_COLOR_BOTTOM
          : LIGHT_THEME_COLOR_BOTTOM,
      }}
    />
  );
};

/**
 * Deposit-only backup entry point, used when the primary Mesh API is
 * unavailable. It loads the standalone backup widget from its own origin and
 * hydrates it with a {@link LinkConnectBackupConfiguration.backupConfig} over
 * the WebView message bridge — there is no link token, and no core Mesh API
 * call is made. This is a sibling of `LinkConnect`, kept entirely separate so
 * the primary (money) path is never altered by backup changes.
 *
 * Two-tier redundancy (design §5H), behind this same `backupConfig` init — there
 * is no new entry point:
 * - **Tier 1**: the widget loads from the independent backup origin.
 * - **Tier 2**: if that origin is unreachable (a hard WebView load error, or the
 *   widget never completes its ready handshake within `TIER1_READY_TIMEOUT_MS`),
 *   the SDK cascades to the widget + catalog snapshot BUNDLED in this package —
 *   zero Mesh-owned network dependency. The client's JIT callbacks run in the
 *   host app and are identical in both tiers. The cascade is monotonic and
 *   single-shot.
 */
export const LinkConnectBackup = (props: LinkConnectBackupConfiguration) => {
  const expectedWidgetOrigin = extractOrigin(
    props.widgetOrigin ?? DEFAULT_BACKUP_WIDGET_ORIGIN
  );

  // Fail closed unless the widget origin is a bare http(s) origin — scheme +
  // host + optional port, and nothing else. extractOrigin passes a
  // non-`scheme://host` value through unchanged, so without this guard a
  // `data:`/custom-scheme origin could satisfy the exact-equality nav handler
  // below and receive the injected config. The strict host character set also
  // rejects userinfo: `https://widget.example@attacker.example` would otherwise
  // load attacker.example (the real host after `@`) while passing an exact-string
  // check. HTTPS is expected in production; http is allowed for local widget
  // development. (This validates the Tier-1 origin; Tier 2 loads bundled HTML.)
  // Computed up front so it can gate the cascade timers too — an invalid origin
  // mounts no WebView, so no tier timer must run.
  const isValidWidgetOrigin = /^https?:\/\/[a-z0-9._-]+(:\d+)?$/i.test(
    expectedWidgetOrigin
  );

  const [initialLoading, setInitialLoading] = useState(true);

  // Tier-1 → Tier-2 cascade state machine (design §5H). The transition emits a
  // single analytics event so the real fire rate can be measured; if the bundled
  // Tier-2 assets somehow never become ready, fail closed (never a blank QR).
  // Disabled for an invalid origin: that path mounts no WebView (returns null
  // below), so the timers must not fire a spurious fallback/exit.
  const { tier, markReady, reportLoadError, restartHandshake } = useBackupTier({
    enabled: isValidWidgetOrigin,
    onFallback: (reason: BackupTierFallbackReason) => {
      // A fresh remote-origin session begins in Tier 2's bundled surface — reset
      // the initial-loading overlay so it covers the swap.
      setInitialLoading(true);
      props.onEvent?.({
        type: 'backupTierChanged',
        payload: { from: 'tier1', to: 'tier2', reason },
      });
    },
    onTier2Unavailable: () => {
      props.onExit?.('Backup deposit flow is unavailable');
    },
  });
  const isTier2 = tier === 'tier2';

  // Render-process-death recovery, shared with LinkConnect. The reset key must
  // change whenever the loaded surface does so a new session gets a fresh
  // auto-reload guard; the surface changes with widgetOrigin + theme + language
  // (Tier 1) and on the Tier-1 → Tier-2 transition, so key on those.
  const recoveryResetKey = `${props.widgetOrigin ?? ''}|${
    props.settings?.theme ?? ''
  }|${props.settings?.language ?? ''}|${tier}`;
  // Bumped on every recovery reload. It is part of `documentSource` (below) but NOT
  // of `recoveryResetKey`: the reload is a new document — remounted, with its
  // own handlers, so events still queued by the dying one are dropped, and its
  // handshake restarts like any same-tier reload — while the once-only
  // auto-reload guard is kept (resetting it could reload a crashing page forever).
  const [recoveryGeneration, setRecoveryGeneration] = useState(0);
  const { webViewRef, recoverFromRendererDeath: recoverWebView } =
    useWebViewRecovery(recoveryResetKey, () => {
      setReadyToken(null);
      setRecoveryGeneration((generation) => generation + 1);
    });
  // The document (see `DocumentScope`) whose widget has completed its ready
  // handshake. Once the current document's widget is up it draws its own close
  // (✕) in the same corner, so the native one is shown only until then
  // (spinner, a hanging Tier 1, Tier 2 mounting, or a reload after the host
  // changes origin/theme/language) — otherwise the two overlap as a double ✕.
  const [readyToken, setReadyToken] = useState<DocumentToken | null>(null);
  // The committed (mounted) document, set in the commit phase by DocumentScope:
  // a ref for event handlers, and state so the native close re-renders.
  const activeTokenRef = useRef<DocumentToken | null>(null);
  const [activeToken, setActiveToken] = useState<DocumentToken | null>(null);
  // Runs in the new document's layout effect (commit phase), before any of its
  // native events can be handled.
  const activateDocument = (token: DocumentToken) => {
    const previous = activeTokenRef.current;
    if (previous === token) return; // re-activation (e.g. dev double effects)
    activeTokenRef.current = token;
    setActiveToken(token);
    // A same-tier replacement (host changed origin/theme/language, or a
    // renderer-death recovery) starts the ready handshake over, so a failed or
    // silent reload still falls back / fails closed. Done HERE rather than in a
    // passive effect: the new document (an inline Tier-2 page especially) can
    // send `loaded` before a passive effect runs, and resetting after that
    // would make a healthy document fall back. A tier change is the cascade
    // itself, which arms its own timer.
    if (previous && tierOf(previous) === tierOf(token)) restartHandshake();
  };
  // The document whose renderer died, until a recovery reload replaces it
  // (the reload — and its new document — may wait for the next foreground).
  const deadTokenRef = useRef<DocumentToken | null>(null);
  const tierOf = (token: DocumentToken) => token.source.split('|')[0];
  // Whether events from `token`'s document may still act on the flow.
  const isLiveDocument = (token: DocumentToken | null) =>
    token !== null &&
    token === activeTokenRef.current &&
    token !== deadTokenRef.current;
  // A dead renderer leaves a blank surface: invalidate it at once, so nothing it
  // queued (close, loaded, JIT, errors) is acted on even while the reload waits
  // for the foreground, and bring the native close back. The reload — now or on
  // return to foreground — remounts and restarts the handshake.
  const recoverFromRendererDeath = (token: DocumentToken) => {
    deadTokenRef.current = token;
    setReadyToken(null);
    recoverWebView();
  };

  // Deliver the deposit config into the widget once it signals `loaded`,
  // mirroring the web SDK's post-on-loaded handshake. The widget's bridge
  // requires a typed envelope ({ type: 'meshBackupConfig', payload }) and
  // silently drops any message without a `type`, so the bare config must be
  // wrapped. Serialised through toInjectableJson so config values cannot break
  // out of the injected script.
  //
  // We dispatch a synthetic MessageEvent rather than `window.postMessage(...)`:
  // inside a WKWebView, a self-`postMessage` from injected JS does not reliably
  // reach the page's own `message` listeners (unlike the cross-window
  // iframe.contentWindow.postMessage the web SDK uses). Dispatching the event
  // directly is delivered synchronously, and `origin` is set to the widget's
  // own origin so its handshake origin-pinning accepts it.
  //
  // Delivery is scoped to the intended document per tier:
  // - Tier 1: guard on `window.location.origin` — deliver ONLY when the page is
  //   really the widget origin, never `about:blank` or any other document (the
  //   remote origin could, in principle, serve something unexpected).
  // - Tier 2: the surface is our own bundled HTML loaded via `source={{ html }}`,
  //   and WebView navigation is contained (nothing else can load), so the page
  //   that just sent `loaded` is definitionally our widget — deliver
  //   unconditionally. (The inline document's origin is opaque/local, so an
  //   origin guard would never match, and gating on an injected flag would add a
  //   hang risk if that injection were ever skipped.)
  // Dispatch a typed bridge message ({ type, payload }) into the widget's own
  // `message` listeners. Shared by config delivery and the JIT RPC responses.
  const dispatchToWidget = (data: unknown) => {
    const literal = toInjectableJson(data);
    const dispatch =
      `window.dispatchEvent(new MessageEvent('message', ` +
      `{ data: JSON.parse(${literal}), origin: window.location.origin }));`;
    const script = isTier2
      ? `${dispatch} true;`
      : `if (window.location.origin === ${JSON.stringify(
          expectedWidgetOrigin
        )}) {${dispatch}} true;`;
    webViewRef.current?.injectJavaScript(script);
  };

  const deliverConfig = () => {
    dispatchToWidget({
      type: BACKUP_CONFIG_MESSAGE_TYPE,
      payload: props.backupConfig,
    });
  };

  // Handle a `meshBackupJitRequest` from the widget: run the host's JIT callback
  // for the requested (symbol, networkId) and post a `meshBackupJitResponse`
  // back, correlated by callId (OR-452 / client spec §5–§6). The callbacks run
  // here in the host app against the client's own backend — no token or endpoint
  // ever enters the widget. The request payload is untrusted, so it is validated
  // before any callback runs.
  const handleJitRequest = (payload: unknown) => {
    if (typeof payload !== 'object' || payload === null) {
      return;
    }
    const { callId, method, symbol, networkId } = payload as Record<
      string,
      unknown
    >;
    if (
      typeof callId !== 'string' ||
      typeof symbol !== 'string' ||
      typeof networkId !== 'string' ||
      (method !== 'addressInit' && method !== 'statusPoll')
    ) {
      return;
    }

    // The document that asked. The host callbacks are async: if that document is
    // replaced (reload, tier change, renderer death) before they settle, the
    // reply must not be injected into its successor — a new widget numbers its
    // calls afresh, so a late reply could resolve an unrelated request with an
    // address for a different pair. Dropped replies are re-requested by the
    // current document's own poll loop.
    // (onMessage only dispatches requests from the live document, so this is it.)
    const requestToken = activeTokenRef.current;
    const respond = (
      ok: boolean,
      result?: MeshBackupJitStatusResult,
      error?: string
    ) => {
      if (!isLiveDocument(requestToken)) {
        return;
      }
      dispatchToWidget({
        type: BACKUP_JIT_RESPONSE_MESSAGE_TYPE,
        payload: { callId, ok, ...(result ? { result } : {}), ...(error ? { error } : {}) },
      });
    };

    // Defense-in-depth before crossing into the client's backend: only resolve a
    // (symbol, networkId) the client actually declared as an ADDRESS-LESS JIT
    // destination in backupConfig. Never run the host callback for an arbitrary
    // pair, or one that already carries a static address (which needs no JIT).
    const isJitDestination = props.backupConfig.destinations.some(
      (d) => d.symbol === symbol && d.networkId === networkId && !d.address
    );
    if (!isJitDestination) {
      respond(false, undefined, 'not an address-less JIT destination in backupConfig');
      return;
    }

    if (method === 'addressInit') {
      // Fail closed, symmetric with statusPoll: a declared address-less JIT
      // destination with no onAddressInit handler is a misconfiguration. Never
      // ack ok:true — that would let the widget start polling for an address
      // whose generation was never kicked off.
      const onAddressInit = props.onAddressInit;
      if (!onAddressInit) {
        respond(false, undefined, 'no onAddressInit handler provided');
        return;
      }
      // Fire-and-forget kick-off: the return value is ignored; a throw/reject is
      // a generation failure.
      Promise.resolve()
        .then(() => onAddressInit(symbol, networkId))
        .then(() => respond(true))
        .catch((e: unknown) => respond(false, undefined, errorMessage(e)));
      return;
    }

    // statusPoll
    const onStatusPoll = props.onStatusPoll;
    if (!onStatusPoll) {
      respond(false, undefined, 'no onStatusPoll handler provided');
      return;
    }
    Promise.resolve()
      .then(() => onStatusPoll(symbol, networkId))
      .then((result) => respond(true, result))
      .catch((e: unknown) => respond(false, undefined, errorMessage(e)));
  };

  const { linkUrl, widgetTheme, darkTheme, handleMessage } = useBackupCallbacks(props, {
    onWidgetLoaded: () => {
      // The widget's `loaded` message IS the ready handshake — it cancels the
      // pending tier timeout for the surface that emitted it. Messages from a
      // torn-down document never get here (onMessage drops them, see the
      // WebView below); markReady(tier) re-checks the tier as well.
      if (markReady(tier)) {
        setReadyToken(activeTokenRef.current);
        deliverConfig();
      }
    },
    onJitRequest: handleJitRequest,
  });

  // What the WebView is showing: Tier 1 loads the widget URL (origin + theme +
  // language); Tier 2 loads the bundled HTML, which only changes with the theme
  // (origin/language don't reload it). Each renderer-death recovery reload is a
  // new document too (`recoveryGeneration`). The tier is the first `|` segment.
  // It keys DocumentScope, so any change remounts with a fresh DocumentToken.
  const documentSource = `${
    isTier2 ? `tier2|${widgetTheme}` : `tier1|${linkUrl}`
  }|r${recoveryGeneration}`;
  const widgetReady = readyToken !== null && readyToken === activeToken;
  const injectedScript = useMemo(
    () => `
    window.meshSdkPlatform='${sdkSpecs.platform}';
    window.meshSdkVersion='${sdkSpecs.version}';
  `,
    []
  );

  const SDKWrapperComponent = props.renderViewContainer
    ? SDKViewContainer
    : SDKContainer;

  const isDark = !!darkTheme;

  // Tier 2 has no URL to carry ?theme=, so the theme goes on the HTML itself.
  const offlineHtml = useMemo(
    () => withWidgetTheme(OFFLINE_WIDGET_HTML, widgetTheme),
    [widgetTheme]
  );

  // The backup widget is a single-origin static SPA and, being deposit-only, has
  // no OAuth/wallet hand-offs — nothing should ever leave it. react-native-webview
  // runs its origin allow-list BEFORE onShouldStartLoadWithRequest and hands any
  // non-matching URL (including custom schemes) straight to Linking.openURL, so
  // the allow-list alone cannot keep navigation contained. We therefore set the
  // allow-list to `['*']` so every URL reaches the handler and enforce exact-
  // origin containment there. There is deliberately NO opt-out: on the widget's
  // `loaded` message this flow injects the config into whatever page is loaded,
  // so it must never load a non-widget origin. In Tier 2 the surface is our own
  // bundled HTML (loaded via `source={{ html }}`) and makes no network calls, so
  // only `about:blank` (used internally by the WebView for the inline document)
  // is admitted and every http(s) navigation is blocked. `linkUrl` carries the
  // configured origin's path+query, but containment is checked against the
  // origin only, which is `expectedWidgetOrigin` (validated above).
  const widgetOrigin = expectedWidgetOrigin;

  useEffect(() => {
    if (!isValidWidgetOrigin) {
      props.onExit?.(
        'Invalid widgetOrigin: the backup widget origin must be an absolute http(s) URL'
      );
    }
  }, [isValidWidgetOrigin]);

  if (!isValidWidgetOrigin) {
    // Never mount the WebView, or deliver config, to a non-http(s) origin.
    return null;
  }

  return (
    <SDKWrapperComponent isDarkTheme={isDark}>
      {/* Deposit-only: the widget owns its own in-funnel navigation, so there is
          no native NavBar. The native close (✕) below is the exit affordance
          until the widget is ready; after that the widget's own ✕ (which exits
          through the same onExit) takes over. */}
      {initialLoading && <LoadingComponentWebview darkTheme={isDark} />}
      {!props.hideCloseButton && !widgetReady && (
        <TouchableOpacity
          testID={'backup-close-button'}
          accessibilityRole={'button'}
          accessibilityLabel={'Close'}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          onPress={() => props.onExit?.()}
          style={{
            position: 'absolute',
            top: 12,
            right: 12,
            zIndex: 20,
            padding: 10,
          }}
        >
          <Image
            source={
              isDark
                ? require('../assets/cross-1-small-dark.png')
                : require('../assets/cross-1-small-light.png')
            }
            style={{ width: 20, height: 20 }}
          />
        </TouchableOpacity>
      )}
      <DocumentScope
        // Remount per document — on the tier transition, a same-tier reload
        // (origin/theme/language change) and a recovery reload — so the old
        // source is torn down and the new document mounts fresh with its own
        // handshake, handlers and DocumentToken (letting stale events be ignored).
        key={documentSource}
        source={documentSource}
        onActivate={activateDocument}
      >
        {(token) => (
      <WebView
        bounces={false}
        style={{
          backgroundColor: isDark
            ? DARK_THEME_COLOR_BOTTOM
            : LIGHT_THEME_COLOR_BOTTOM,
        }}
        testID={'webview'}
        ref={webViewRef}
        // Tier 1 loads the widget from its origin; Tier 2 loads the bundled
        // offline widget from an inline HTML string (no network).
        source={isTier2 ? { html: offlineHtml } : { uri: linkUrl }}
        cacheMode={'LOAD_DEFAULT'}
        // Each document is its own WebView instance, so a torn-down one — the
        // Tier-1 surface after the cascade, or the previous document after a
        // reload — can still deliver queued messages. Drop them all (loaded,
        // close, JIT requests, transfer events…) before any host callback runs:
        // only the live document speaks for the flow.
        onMessage={(event) => {
          if (isLiveDocument(token)) handleMessage(event);
        }}
        onLoadEnd={() => {
          setInitialLoading(false);
        }}
        startInLoadingState={true}
        javaScriptEnabled={true}
        injectedJavaScript={injectedScript}
        originWhitelist={['*']}
        // Deposit-only: no OAuth/wallet hand-offs, so force same-frame
        // navigation. Otherwise a target="_blank"/window.open would take the
        // multiple-windows popup path and bypass onShouldStartLoadWithRequest
        // (and the origin containment below) entirely.
        setSupportMultipleWindows={false}
        // Only the widget's own origin may load (see whitelist note above);
        // `about:blank` is allowed because the WebView uses it internally (and
        // as the base document for the Tier-2 inline HTML). Any other URL — a
        // different origin or a custom scheme — is blocked and is NOT handed off
        // externally. Origins are compared exactly: a prefix check would admit
        // https://widget.example.attacker.com and the
        // https://widget.example@attacker.example userinfo trick.
        onShouldStartLoadWithRequest={(req) =>
          req.url === 'about:blank' ||
          extractOrigin(req.url) === widgetOrigin
        }
        domStorageEnabled={true}
        onError={({ nativeEvent }) => {
          // A stale error from a torn-down document is not this flow's failure:
          // report nothing to the host and don't cascade.
          if (!isLiveDocument(token)) return;
          props.onEvent?.({
            type: 'webViewLoadFailed',
            payload: {
              url: nativeEvent.url,
              errorCode: nativeEvent.code,
              errorDescription: nativeEvent.description,
            },
          });
          // A hard load failure on the backup origin cascades to Tier 2
          // immediately (design §5H) — do not reload the unreachable origin.
          reportLoadError(tier);
        }}
        onHttpError={({ nativeEvent }) => {
          if (!isLiveDocument(token)) return;
          props.onEvent?.({
            type: 'webViewLoadFailed',
            payload: {
              url: nativeEvent.url,
              errorCode: nativeEvent.statusCode,
            },
          });
          // A 4xx/5xx on the document itself means the origin served an error
          // page rather than the widget — treat it as a hard load error and
          // cascade to Tier 2.
          if (nativeEvent.statusCode >= 400) {
            reportLoadError(tier);
          }
        }}
        // Renderer death is reported per WebView instance: a queued callback from
        // a torn-down document must not reload the current (healthy) one or
        // bring back the native close, so it is gated like the rest.
        onContentProcessDidTerminate={() => {
          if (isLiveDocument(token)) recoverFromRendererDeath(token);
        }}
        onRenderProcessGone={() => {
          if (isLiveDocument(token)) recoverFromRendererDeath(token);
        }}
      />
        )}
      </DocumentScope>
    </SDKWrapperComponent>
  );
};
