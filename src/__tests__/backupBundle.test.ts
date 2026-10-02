import { OFFLINE_WIDGET_HTML, getBundledOfflineWidget } from '../backup-bundle';

describe('Tier-2 backup bundle', () => {
  it('exposes the self-contained offline widget HTML', () => {
    const { html } = getBundledOfflineWidget();
    expect(html).toBe(OFFLINE_WIDGET_HTML);
    expect(html.toLowerCase()).toContain('<!doctype html>');
  });

  it('is self-contained — no external http(s) asset references', () => {
    // The catalog snapshot + top-N logos are inlined at the widget's build time,
    // so Tier 2 makes no Mesh-owned network call. Guards against a regression that
    // reintroduces a remote script/style/logo URL.
    expect(OFFLINE_WIDGET_HTML).not.toMatch(/(src|href)\s*=\s*["']https?:/i);
  });

  it('speaks the SDK message bridge the host drives (loaded handshake + config)', () => {
    // The widget posts to the native bridge and consumes the meshBackupConfig
    // envelope the SDK delivers — the same contract as Tier 1.
    expect(OFFLINE_WIDGET_HTML).toContain('ReactNativeWebView');
    expect(OFFLINE_WIDGET_HTML).toContain('meshBackupConfig');
  });
});
