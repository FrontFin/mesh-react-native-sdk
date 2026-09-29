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
    act(() => result.current.reportLoadError());
    expect(onFallback).toHaveBeenCalledTimes(1);
    expect(result.current.tier).toBe('tier2');
  });

  it('cascades immediately on a Tier-1 load error, without waiting out the timeout', () => {
    const { result, onFallback } = setup();
    act(() => result.current.reportLoadError());
    expect(onFallback).toHaveBeenCalledWith('loadError');
    expect(result.current.tier).toBe('tier2');
  });

  it('ignores a load error once Tier 1 is ready (no cascade mid-session)', () => {
    const { result, onFallback } = setup();
    act(() => result.current.markReady());
    act(() => {
      jest.advanceTimersByTime(TIER1_READY_TIMEOUT_MS * 2);
    });
    act(() => result.current.reportLoadError());
    expect(onFallback).not.toHaveBeenCalled();
    expect(result.current.tier).toBe('tier1');
  });

  it('fails closed if the bundled Tier-2 assets never become ready', () => {
    const { result, onTier2Unavailable } = setup();
    act(() => result.current.reportLoadError()); // → Tier 2
    expect(onTier2Unavailable).not.toHaveBeenCalled();
    act(() => {
      jest.advanceTimersByTime(TIER2_READY_TIMEOUT_MS);
    });
    expect(onTier2Unavailable).toHaveBeenCalledTimes(1);
  });

  it('fails closed at most once even if a Tier-2 load error and the timeout both fire', () => {
    const { result, onTier2Unavailable } = setup();
    act(() => result.current.reportLoadError()); // → Tier 2
    // A load error on the bundled document fails closed immediately…
    act(() => result.current.reportLoadError());
    expect(onTier2Unavailable).toHaveBeenCalledTimes(1);
    // …and the (now cleared) safety timeout must not exit the host a second time.
    act(() => {
      jest.advanceTimersByTime(TIER2_READY_TIMEOUT_MS * 2);
    });
    expect(onTier2Unavailable).toHaveBeenCalledTimes(1);
  });

  it('does not fail closed when Tier 2 becomes ready in time', () => {
    const { result, onTier2Unavailable } = setup();
    act(() => result.current.reportLoadError()); // → Tier 2
    act(() => result.current.markReady());
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
});
