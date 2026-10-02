import { useEffect, useRef, useState } from 'react';

import { TIER1_READY_TIMEOUT_MS, TIER2_READY_TIMEOUT_MS } from '../constant';

/** Which redundancy tier the backup flow is currently serving (design §5H). */
export type BackupTier = 'tier1' | 'tier2';

/**
 * Why Tier 1 was abandoned. `loadError` = a hard WebView load/HTTP failure on
 * the backup-origin document; `readyTimeout` = the widget did not complete its
 * ready handshake within {@link TIER1_READY_TIMEOUT_MS}.
 */
export type BackupTierFallbackReason = 'loadError' | 'readyTimeout';

interface UseBackupTierArgs {
  /**
   * Whether the cascade is active. Pass `false` while the config is invalid /
   * the WebView is not mounted so no spurious timer fires (fail-closed exit is
   * handled by the caller in that case).
   */
  enabled: boolean;
  /**
   * Called exactly once, on the Tier-1 → Tier-2 transition, so the caller can
   * emit the {@link BackupTierChanged} analytics event.
   */
  onFallback: (reason: BackupTierFallbackReason) => void;
  /**
   * Called if Tier 2 itself never becomes ready — the bundled assets are local
   * so this should be unreachable, but it is the fail-closed safety net that
   * surfaces an error instead of a blank screen (design §5A/§5H).
   */
  onTier2Unavailable: () => void;
}

export interface BackupTierController {
  /** The tier to render right now. */
  tier: BackupTier;
  /**
   * Call when the widget completes its ready handshake (its `loaded` message),
   * passing the tier of the surface that emitted it. Returns `true` if the ready
   * applied to the current tier, `false` if it was a stale event from a
   * torn-down surface (e.g. a queued Tier-1 `loaded` arriving after the cascade)
   * — the caller skips config delivery in that case.
   */
  markReady: (forTier: BackupTier) => boolean;
  /**
   * Call on a hard load/HTTP error on the current surface, passing the tier of
   * the surface that emitted it. In Tier 1 (before ready) this cascades to Tier
   * 2; in Tier 2 it fails closed. After Tier 1 is ready it is ignored here (a
   * mid-session blip must not discard the funnel; renderer-death recovery is
   * handled separately). An event stamped with a tier other than the live one is
   * a stale event from a torn-down surface and is ignored.
   */
  reportLoadError: (forTier: BackupTier) => void;
}

/**
 * Tier-1 → Tier-2 cascade state machine for the backup deposit flow (design §5H).
 *
 * The flow initializes in Tier 1 (widget loaded from the independent backup
 * origin). If the origin is unreachable — a hard load error, or the widget never
 * completes its ready handshake within {@link TIER1_READY_TIMEOUT_MS} — the SDK
 * falls back to the bundled Tier-2 assets and re-injects the same config. The
 * cascade is **monotonic and single-shot**: Tier 1 is attempted once per session
 * and, once in Tier 2, the flow stays there (no flap back). If Tier 2 itself
 * never becomes ready, the caller fails closed rather than showing a blank QR.
 */
export function useBackupTier({
  enabled,
  onFallback,
  onTier2Unavailable,
}: UseBackupTierArgs): BackupTierController {
  const [tier, setTier] = useState<BackupTier>('tier1');

  // Refs mirror state so the timer/error callbacks (which capture the closure at
  // schedule time) always see the live value.
  const tierRef = useRef<BackupTier>('tier1');
  const readyRef = useRef(false);
  // Single-shot latch: once we leave Tier 1 it can never be re-entered, and a
  // second trigger of any kind is a no-op.
  const cascadedRef = useRef(false);
  // Fail-closed latch: Tier 2 can be reported unavailable by both a load error
  // and the safety timeout, but the host must only be exited once.
  const failedClosedRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Keep the latest callbacks without re-arming the timer on every render.
  const onFallbackRef = useRef(onFallback);
  const onTier2UnavailableRef = useRef(onTier2Unavailable);
  onFallbackRef.current = onFallback;
  onTier2UnavailableRef.current = onTier2Unavailable;

  const clearTimer = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  const failClosed = () => {
    if (failedClosedRef.current) return;
    failedClosedRef.current = true;
    clearTimer();
    onTier2UnavailableRef.current();
  };

  const cascadeToTier2 = (reason: BackupTierFallbackReason) => {
    // Monotonic + single-shot: only ever from a not-yet-ready Tier 1.
    if (cascadedRef.current || tierRef.current !== 'tier1' || readyRef.current) {
      return;
    }
    cascadedRef.current = true;
    clearTimer();
    tierRef.current = 'tier2';
    readyRef.current = false;
    setTier('tier2');
    onFallbackRef.current(reason);

    // Fail-closed safety net: the bundled assets are local, so Tier 2 should
    // become ready almost instantly; if it does not, surface an error.
    timerRef.current = setTimeout(() => {
      timerRef.current = null;
      if (!readyRef.current) {
        failClosed();
      }
    }, TIER2_READY_TIMEOUT_MS);
  };

  // Arm the Tier-1 ready-handshake timeout once, from navigation start (mount).
  // A cross-origin/served-but-broken origin that never handshakes is caught here
  // even when no native load-error fires.
  useEffect(() => {
    if (!enabled) return;
    if (readyRef.current || cascadedRef.current) return;
    timerRef.current = setTimeout(() => {
      timerRef.current = null;
      cascadeToTier2('readyTimeout');
    }, TIER1_READY_TIMEOUT_MS);
    return clearTimer;
    // Deps are intentionally just [enabled]: arm the Tier-1 timeout exactly once
    // for the session. The cascade is single-shot, so re-arming when a callback
    // identity changes would be wrong (the callback refs above stay current).
  }, [enabled]);

  const markReady = (forTier: BackupTier): boolean => {
    // The WebView is keyed by tier, so a Tier-1 surface torn down by the cascade
    // can still deliver a queued `loaded`. Ignoring it is critical: accepting it
    // would set readyRef and clear the Tier-2 fail-closed timer, stranding a
    // never-ready Tier-2 surface on a blank screen with no safety net.
    if (forTier !== tierRef.current) return false;
    readyRef.current = true;
    // Whichever tier just handshook is healthy — cancel its pending timer.
    clearTimer();
    return true;
  };

  const reportLoadError = (forTier: BackupTier) => {
    // A stale error from the torn-down Tier-1 surface must not be read as a
    // Tier-2 failure (which would fail closed and exit the host prematurely).
    if (forTier !== tierRef.current) return;
    if (tierRef.current === 'tier1') {
      // Immediate cascade — do not wait out the ready timeout (design §5H).
      cascadeToTier2('loadError');
    } else if (!readyRef.current) {
      // Tier 2 (local assets) failing to load is effectively impossible; if it
      // happens, fail closed rather than reload into the same failure.
      failClosed();
    }
  };

  return { tier, markReady, reportLoadError };
}
