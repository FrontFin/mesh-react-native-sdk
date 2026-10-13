/* eslint-disable */
import { act, renderHook } from '@testing-library/react-native';

import { useBackupTier } from '../hooks/useBackupTier';
import { TIER1_READY_TIMEOUT_MS, TIER2_READY_TIMEOUT_MS } from '../constant';

const setup = (over: Partial<Parameters<typeof useBackupTier>[0]> = {}) => {
  const onFallback = jest.fn();
  const onTier2Unavailable = jest.fn();
  const utils = renderHook(() =>
    useBackupTier({ enabled: true, onFallback, onTier2Unavailable, ...over })
  );
  return { ...utils, onFallback, onTier2Unavailable };
};

describe('useBackupTier (Tier-1 → Tier-2 cascade)', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it('cascades on the ready-handshake timeout and stays in Tier 2 (monotonic + single-shot)', () => {
    const { result, onFallback } = setup();
    expect(result.current.tier).toBe('tier1');

    act(() => {
      jest.advanceTimersByTime(TIER1_READY_TIMEOUT_MS);
    });
    expect(result.current.tier).toBe('tier2');
    expect(onFallback).toHaveBeenCalledTimes(1);
    expect(onFallback).toHaveBeenCalledWith('readyTimeout');

    // A later trigger neither re-fires the fallback nor flaps back to Tier 1.
    act(() => result.current.reportLoadError('tier2'));
    expect(onFallback).toHaveBeenCalledTimes(1);
    expect(result.current.tier).toBe('tier2');
  });

  it('cascades immediately on a Tier-1 load error, without waiting out the timeout', () => {
    const { result, onFallback } = setup();
    act(() => result.current.reportLoadError('tier1'));
    expect(onFallback).toHaveBeenCalledWith('loadError');
    expect(result.current.tier).toBe('tier2');
  });

  it('ignores a load error once Tier 1 is ready (no cascade mid-session)', () => {
    const { result, onFallback } = setup();
    act(() => {
      result.current.markReady('tier1');
    });
    act(() => {
      jest.advanceTimersByTime(TIER1_READY_TIMEOUT_MS * 2);
    });
    act(() => result.current.reportLoadError('tier1'));
    expect(onFallback).not.toHaveBeenCalled();
    expect(result.current.tier).toBe('tier1');
  });

  it('fails closed if the bundled Tier-2 assets never become ready', () => {
    const { result, onTier2Unavailable } = setup();
    act(() => result.current.reportLoadError('tier1')); // → Tier 2
    expect(onTier2Unavailable).not.toHaveBeenCalled();
    act(() => {
      jest.advanceTimersByTime(TIER2_READY_TIMEOUT_MS);
    });
    expect(onTier2Unavailable).toHaveBeenCalledTimes(1);
  });

  it('fails closed at most once even if a Tier-2 load error and the timeout both fire', () => {
    const { result, onTier2Unavailable } = setup();
    act(() => result.current.reportLoadError('tier1')); // → Tier 2
    // A load error on the bundled document fails closed immediately…
    act(() => result.current.reportLoadError('tier2'));
    expect(onTier2Unavailable).toHaveBeenCalledTimes(1);
    // …and the (now cleared) safety timeout must not exit the host a second time.
    act(() => {
      jest.advanceTimersByTime(TIER2_READY_TIMEOUT_MS * 2);
    });
    expect(onTier2Unavailable).toHaveBeenCalledTimes(1);
  });

  it('does not fail closed when Tier 2 becomes ready in time', () => {
    const { result, onTier2Unavailable } = setup();
    act(() => result.current.reportLoadError('tier1')); // → Tier 2
    act(() => {
      result.current.markReady('tier2');
    });
    act(() => {
      jest.advanceTimersByTime(TIER2_READY_TIMEOUT_MS * 2);
    });
    expect(onTier2Unavailable).not.toHaveBeenCalled();
  });

  it('ignores a stale Tier-1 ready after the cascade (keeps the Tier-2 fail-closed net armed)', () => {
    const { result, onTier2Unavailable } = setup();
    act(() => result.current.reportLoadError('tier1')); // → Tier 2
    // A queued Tier-1 `loaded` lands after the cascade. It must NOT mark ready or
    // cancel the Tier-2 safety timer.
    let accepted = true;
    act(() => {
      accepted = result.current.markReady('tier1');
    });
    expect(accepted).toBe(false);
    // Tier 2 never handshakes → the (still-armed) safety net fails closed.
    act(() => {
      jest.advanceTimersByTime(TIER2_READY_TIMEOUT_MS);
    });
    expect(onTier2Unavailable).toHaveBeenCalledTimes(1);
  });

  it('ignores a stale Tier-1 error after the cascade (not read as a Tier-2 failure)', () => {
    const { result, onTier2Unavailable } = setup();
    act(() => result.current.reportLoadError('tier1')); // → Tier 2
    // A second, queued Tier-1 error lands after the cascade. It must NOT be read
    // as a Tier-2 failure (which would fail closed and exit the host).
    act(() => result.current.reportLoadError('tier1'));
    expect(onTier2Unavailable).not.toHaveBeenCalled();
    // Tier 2 then handshakes normally — no fail-closed exit.
    act(() => {
      result.current.markReady('tier2');
    });
    act(() => {
      jest.advanceTimersByTime(TIER2_READY_TIMEOUT_MS * 2);
    });
    expect(onTier2Unavailable).not.toHaveBeenCalled();
  });

  it('does not arm the timeout while disabled', () => {
    const { onFallback } = setup({ enabled: false });
    act(() => {
      jest.advanceTimersByTime(TIER1_READY_TIMEOUT_MS * 3);
    });
    expect(onFallback).not.toHaveBeenCalled();
  });

  describe('restartHandshake (same-tier reload after ready)', () => {
    const readyInTier1 = () => {
      const utils = setup();
      act(() => {
        utils.result.current.markReady('tier1');
      });
      return utils;
    };

    it.each([
      ['a load error', 'loadError'],
      ['no `loaded` within the timeout', 'readyTimeout'],
    ] as const)('Tier 1: a reload that fails with %s still cascades', (_, reason) => {
      const { result, onFallback } = readyInTier1();
      // Before the restart a Tier-1 error after ready is ignored (mid-session blip).
      act(() => result.current.reportLoadError('tier1'));
      expect(onFallback).not.toHaveBeenCalled();

      act(() => result.current.restartHandshake());
      act(() => {
        if (reason === 'loadError') result.current.reportLoadError('tier1');
        else jest.advanceTimersByTime(TIER1_READY_TIMEOUT_MS);
      });
      expect(onFallback).toHaveBeenCalledWith(reason);
      expect(result.current.tier).toBe('tier2');
    });

    it('Tier 1: a reload that handshakes in time does not cascade', () => {
      const { result, onFallback } = readyInTier1();
      act(() => result.current.restartHandshake());
      act(() => {
        result.current.markReady('tier1');
        jest.advanceTimersByTime(TIER1_READY_TIMEOUT_MS * 2);
      });
      expect(onFallback).not.toHaveBeenCalled();
      expect(result.current.tier).toBe('tier1');
    });

    it('Tier 2: a reload that never handshakes fails closed; Tier 1 is never re-entered', () => {
      const { result, onFallback, onTier2Unavailable } = setup();
      act(() => result.current.reportLoadError('tier1')); // cascade
      act(() => {
        result.current.markReady('tier2');
      });
      act(() => result.current.restartHandshake());
      act(() => {
        jest.advanceTimersByTime(TIER2_READY_TIMEOUT_MS);
      });
      expect(onTier2Unavailable).toHaveBeenCalledTimes(1);
      expect(onFallback).toHaveBeenCalledTimes(1);
      expect(result.current.tier).toBe('tier2');
    });

    it('is a no-op while disabled or after failing closed', () => {
      const disabled = setup({ enabled: false });
      act(() => disabled.result.current.restartHandshake());
      act(() => {
        jest.advanceTimersByTime(TIER1_READY_TIMEOUT_MS * 2);
      });
      expect(disabled.onFallback).not.toHaveBeenCalled();

      const { result, onTier2Unavailable } = setup();
      act(() => result.current.reportLoadError('tier1'));
      act(() => {
        jest.advanceTimersByTime(TIER2_READY_TIMEOUT_MS); // fails closed once
      });
      act(() => result.current.restartHandshake());
      act(() => {
        jest.advanceTimersByTime(TIER2_READY_TIMEOUT_MS);
      });
      expect(onTier2Unavailable).toHaveBeenCalledTimes(1);
    });
  });
});
